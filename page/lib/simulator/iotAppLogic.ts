// ============================================================================
// iotAppLogic.ts — C++ Firmware Runtime & UI Renderer (1:1 Hardware Parity)
// ============================================================================
// Mirrors the exact architecture of M5StickC-Plus firmware:
// - JourneyEngine (Advent Calendar state, quadratic ease-in-out, Kraków finale)
// - ScreenRadar (912 land dots, 360-deg sweep beam, breadcrumbs, blip beacon, HUDs)
// - ScreenCockpit (Aerospace telemetry dashboard, Mach speed, gifts, cookies/milk)
//
// Matches firmware/src/main.cpp, screen_radar.cpp, and journey_engine.cpp 1:1.

import { M5CanvasSim } from "./M5CanvasSim";
import { LAND_DOTS } from "./landDots";
import { getDaySchedule } from "../advent-schedule";
import { computeSantaMetrics } from "../telemetry/santa-metrics";
import { renderCamScreen } from "./camScreen";
import {
  TFT_BLACK,
  TFT_WHITE,
  TFT_RED,
  TFT_GREEN,
  TFT_BLUE,
  TFT_YELLOW,
  COLOR_BG,
  COLOR_GRID,
  COLOR_LAND,
  COLOR_BREADCRUMB,
  COLOR_CITY_VISITED,
  COLOR_CITY_FUTURE,
  COLOR_RADAR_BEAM,
  COLOR_BEACON_PULSE,
  COLOR_BEACON_CORE,
  COLOR_HUD_BG,
  COLOR_TEXT_GREEN,
  COLOR_TEXT_GOLD,
  top_left,
  top_center,
  top_right,
} from "./M5Constants";

export interface ButtonEventState {
  wasPressedA: boolean;
  wasHoldA: boolean;
  wasPressedB: boolean;
  wasHoldB: boolean;
  wasPressedPWR: boolean;
}

export interface Waypoint {
  name: string;
  lon: number;
  lat: number;
  country?: string;
  continent?: string;
}

export interface TelemetryState {
  activeDay: number;
  currentCityIdx: number;
  safeIdx: number;
  targetCityIdx: number;
  isFlightPhase: boolean;
  isDay24Finale: boolean;
  santaLon: number;
  santaLat: number;
  santaScreenX: number;
  santaScreenY: number;
  nextCityName: string;
  etaSeconds: number;
  progressRatio: number;
  u: number;
}

export interface SimulatorAppState {
  bootTimeMs: number;
  activeScreen: 0 | 1 | 2; // 0: Radar (Screen 1), 1: Cockpit Dashboard (Screen 2), 2: Santa Cam (Screen 3)
  activeDay: number;   // Advent Day 1..24 (Defaults to Day 24 Grand Finale)
  simTime: number;     // Simulation clock in seconds
  soundEnabled: boolean;
  speedMultiplier: number;
  cities: Waypoint[];
  cityCount: number;
  lastAction: string;
}

const SCREEN_WIDTH = 240;
const SCREEN_HEIGHT = 135;
const RADAR_CENTER_X = 120;
const RADAR_CENTER_Y = 68;
export const SEC_PER_CITY = 24.0; // 12s transit flight + 12s rooftop stay = 24s total per city (1:1 with 1h flight + 1h stay)
export const FLIGHT_DURATION = 12.0; // 12s transit flight
export const LANDED_DURATION = 12.0; // 12s rooftop stay

/**
 * Loads the 12 stops for the active Advent Day from the master schedule.
 */
export function loadAdventDay(dayNum: number): Waypoint[] {
  const schedule = getDaySchedule(dayNum);
  return schedule.stops.map((s) => ({
    name: s.radarName,
    lon: s.lon,
    lat: s.lat,
    country: s.country,
    continent: s.continent,
  }));
}

export function setDay(state: SimulatorAppState, dayNum: number): void {
  const validDay = Math.max(1, Math.min(24, dayNum));
  state.activeDay = validDay;
  state.cities = loadAdventDay(validDay);
  state.cityCount = state.cities.length;
  state.simTime = FLIGHT_DURATION; // Start landed at Stop 1 (u = 12.0)
  state.lastAction = `DZIEN ${validDay}`;
}

export function setCityIndex(state: SimulatorAppState, cityIdx: number): void {
  if (state.cityCount === 0) return;
  const safe = ((cityIdx % state.cityCount) + state.cityCount) % state.cityCount;
  state.simTime = safe * SEC_PER_CITY + FLIGHT_DURATION; // Land immediately at city
  state.lastAction = `MIASTO: ${state.cities[safe]?.name}`;
}

export function setActiveScreen(state: SimulatorAppState, screen: 0 | 1 | 2): void {
  state.activeScreen = screen;
  state.lastAction = screen === 0 ? "EKRAN: RADAR" : screen === 1 ? "EKRAN: KOKPIT" : "EKRAN: KAMERA";
}

/**
 * Quadratic ease-in-out matching C++ JourneyEngine::easeInOut()
 */
function easeInOut(q: number): number {
  return q < 0.5 ? 2.0 * q * q : 1.0 - Math.pow(-2.0 * q + 2.0, 2.0) / 2.0;
}

/**
 * Exact coordinate projection matching C++ JourneyEngine::projectCoordinates()
 */
function projectCoordinates(lon: number, lat: number): [number, number] {
  const x = ((lon + 180.0) / 360.0) * SCREEN_WIDTH;
  const y = 12.0 + ((80.0 - lat) / 138.0) * 108.0;
  return [x, y];
}

/**
 * Computes telemetry state matching C++ JourneyEngine::getTelemetry()
 */
export function getTelemetry(state: SimulatorAppState): TelemetryState {
  const totalSimTime = state.cityCount * SEC_PER_CITY;
  const effectiveSimTime =
    state.simTime >= totalSimTime ? totalSimTime - 0.001 : Math.max(0, state.simTime);

  const cityIdx = Math.floor(effectiveSimTime / SEC_PER_CITY);
  const u = Math.max(0, effectiveSimTime - cityIdx * SEC_PER_CITY);

  const safeIdx = ((cityIdx % state.cityCount) + state.cityCount) % state.cityCount;
  const prevIdx = safeIdx > 0 ? safeIdx - 1 : 0;

  const isLastCity = safeIdx === state.cityCount - 1;
  const isDay24Finale =
    state.activeDay === 24 && isLastCity && (u >= FLIGHT_DURATION || state.simTime >= totalSimTime);

  const isFlight = !isDay24Finale && u < FLIGHT_DURATION;
  const p = isFlight ? easeInOut(u / FLIGHT_DURATION) : 1.0;

  const prevLon = state.cities[prevIdx]?.lon ?? 0;
  const prevLat = state.cities[prevIdx]?.lat ?? 0;
  const currLon = state.cities[safeIdx]?.lon ?? 0;
  const currLat = state.cities[safeIdx]?.lat ?? 0;

  const santaLon = prevLon + (currLon - prevLon) * p;
  const santaLat = prevLat + (currLat - prevLat) * p;

  const [santaScreenX, santaScreenY] = projectCoordinates(santaLon, santaLat);

  let nextCityName = "KRAKOW";
  let etaSeconds = 0;

  if (isDay24Finale) {
    nextCityName = state.cities[safeIdx]?.name ?? "KRAKOW";
    etaSeconds = 0;
  } else if (isFlight) {
    nextCityName = state.cities[safeIdx]?.name ?? "";
    etaSeconds = Math.ceil(FLIGHT_DURATION - u);
  } else {
    nextCityName = state.cities[safeIdx]?.name ?? "";
    etaSeconds = Math.ceil(SEC_PER_CITY - u);
  }

  const progressRatio = Math.min(1.0, state.simTime / totalSimTime);

  return {
    activeDay: state.activeDay,
    currentCityIdx: cityIdx,
    safeIdx,
    targetCityIdx: isFlight ? safeIdx : ((safeIdx + 1) % state.cityCount),
    isFlightPhase: isFlight,
    isDay24Finale,
    santaLon,
    santaLat,
    santaScreenX,
    santaScreenY,
    nextCityName,
    etaSeconds,
    progressRatio,
    u,
  };
}

/**
 * Initializes firmware state. Equivalent to Arduino setup() in main.cpp.
 */
export function setup(nowMs = 0): SimulatorAppState {
  const initialDay = 24; // Boots directly into Day 24 Grand Finale like hardware
  const cities = loadAdventDay(initialDay);

  return {
    bootTimeMs: nowMs,
    activeScreen: 0, // Starts on Screen 1: Aviation Radar
    activeDay: initialDay,
    simTime: FLIGHT_DURATION, // Start landed at first city (Stop 1)
    soundEnabled: true,
    speedMultiplier: 1.0,
    cities,
    cityCount: cities.length,
    lastAction: "BOOT OK (DZIEN 24)",
  };
}

/**
 * Advances simulation clock and processes physical button inputs
 * Matching firmware/src/main.cpp loop() exactly.
 */
export function update(
  state: SimulatorAppState,
  buttons: ButtonEventState,
  dtMs: number,
  nowMs: number
): void {
  void nowMs;
  const dtSec = Math.min(dtMs / 1000.0, 0.1);

  // 1. Advance simulation clock (JourneyEngine::update)
  if (state.cityCount > 0) {
    const totalSimTime = state.cityCount * SEC_PER_CITY;

    if (state.activeDay === 24) {
      // Day 24 Grand Finale Lock (AGENTS.md Section 5):
      // On arrival at Kraków (Stop 11 after 12s transit flight), Santa lands and permanently
      // locks in the celebration state (FINAŁ: KRAKOW 🎁), never prematurely wrapping back to the Pacific!
      const krakowArrivalTime = (state.cityCount - 1) * SEC_PER_CITY + FLIGHT_DURATION;
      state.simTime += dtSec * state.speedMultiplier;
      if (state.simTime >= krakowArrivalTime) {
        state.simTime = krakowArrivalTime;
      }
    } else {
      // Days 1..23: loop through all 12 stops continuously
      state.simTime += dtSec * state.speedMultiplier;
      if (totalSimTime > 0.0) {
        if (state.simTime >= totalSimTime || state.simTime < 0.0) {
          state.simTime = state.simTime % totalSimTime;
          if (state.simTime < 0.0) state.simTime += totalSimTime;
        }
      }
    }
  }

  // ==========================================================================
  // Unified Button Navigation (Variant 1 — 1:1 Hardware/Simulator Parity)
  // ==========================================================================

  // Button A (Front M5) Short Click: Toggle Screen (Radar -> Cockpit -> Kamera -> Radar)
  if (buttons.wasPressedA) {
    state.activeScreen = ((state.activeScreen + 1) % 3) as 0 | 1 | 2;
    state.lastAction =
      state.activeScreen === 0
        ? "EKRAN: RADAR"
        : state.activeScreen === 1
        ? "EKRAN: KOKPIT"
        : "EKRAN: KAMERA";
  }

  // Button A (Front M5) Long Hold (>0.6s): Jump to next Advent Day (1 -> 24 -> 1)
  if (buttons.wasHoldA) {
    state.activeDay = (state.activeDay % 24) + 1;
    state.cities = loadAdventDay(state.activeDay);
    state.cityCount = state.cities.length;
    state.simTime = FLIGHT_DURATION; // Start landed at first city of new day
    state.lastAction = `DZIEN ${state.activeDay}`;
  }

  // Button B (Top Side) Short Click: Jump to next city on current day (0 -> 11 -> 0)
  if (buttons.wasPressedB) {
    if (state.cityCount > 0) {
      const curIdx = Math.floor(state.simTime / SEC_PER_CITY);
      const nextIdx = (curIdx + 1) % state.cityCount;
      state.simTime = nextIdx * SEC_PER_CITY + FLIGHT_DURATION; // Land immediately at next city
      state.lastAction = `MIASTO: ${state.cities[nextIdx]?.name}`;
    }
  }

  // Button B (Top Side) Long Hold (>0.6s): Toggle Sound (Mute / Unmute)
  if (buttons.wasHoldB) {
    state.soundEnabled = !state.soundEnabled;
    state.lastAction = state.soundEnabled ? "DZWIEK: WL" : "DZWIEK: WYL";
  }

  // Button PWR (Side): Reset simulation to Day 24
  if (buttons.wasPressedPWR) {
    state.activeDay = 24;
    state.cities = loadAdventDay(24);
    state.cityCount = state.cities.length;
    state.simTime = 6.0;
    state.activeScreen = 0;
    state.lastAction = "RESET DO DNIA 24";
  }
}

/**
 * 1:1 Frame Dispatcher matching firmware/src/main.cpp loop() rendering
 */
export function render(
  canvas: M5CanvasSim,
  state: SimulatorAppState,
  nowMs: number
): void {
  const telemetry = getTelemetry(state);

  if (state.activeScreen === 0) {
    renderRadarScreen(canvas, state, telemetry, nowMs);
  } else if (state.activeScreen === 1) {
    renderCockpitScreen(canvas, state, telemetry, nowMs);
  } else {
    renderCamScreen(canvas, state, telemetry, nowMs);
  }
}

// ============================================================================
// SCREEN 1: Global Aviation Radar (firmware/src/ui/screen_radar.cpp 1:1)
// ============================================================================

function drawDottedLine(
  canvas: M5CanvasSim,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: number,
  spacing = 3.0
): void {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  if (dist < 1.0) return;
  const ux = dx / dist;
  const uy = dy / dist;
  for (let d = 0; d <= dist; d += spacing) {
    canvas.drawPixel(Math.floor(x0 + ux * d), Math.floor(y0 + uy * d), color);
  }
}

function renderRadarScreen(
  canvas: M5CanvasSim,
  state: SimulatorAppState,
  telemetry: TelemetryState,
  nowMs: number
): void {
  const blink = Math.floor(nowMs / 220) % 2 === 0;

  // 1. Clear with Deep CRT phosphor background
  canvas.fillScreen(COLOR_BG);

  // 2. Fixed Center Radar: Concentric Range Rings & Crosshairs
  canvas.drawCircle(RADAR_CENTER_X, RADAR_CENTER_Y, 32, COLOR_GRID);
  canvas.drawCircle(RADAR_CENTER_X, RADAR_CENTER_Y, 64, COLOR_GRID);
  canvas.drawCircle(RADAR_CENTER_X, RADAR_CENTER_Y, 96, COLOR_GRID);
  canvas.drawFastHLine(0, RADAR_CENTER_Y, SCREEN_WIDTH, COLOR_GRID);
  canvas.drawFastVLine(RADAR_CENTER_X, 12, 108, COLOR_GRID);

  // 3. Dot-Matrix Coastlines (912 World Land Dots matching land_dots.h)
  for (let i = 0; i < LAND_DOTS.length; i++) {
    const [dx, dy] = LAND_DOTS[i];
    canvas.fillRect(dx - 1, dy - 1, 2, 2, COLOR_LAND);
  }

  // 4. Fixed Center Rotating Radar Sweep Beam
  const beamAngle = (nowMs % 3200) * ((2.0 * Math.PI) / 3200.0);
  const beamLen = 110;
  const beamEndX = RADAR_CENTER_X + Math.floor(Math.cos(beamAngle) * beamLen);
  const beamEndY = RADAR_CENTER_Y + Math.floor(Math.sin(beamAngle) * beamLen);
  canvas.drawLine(RADAR_CENTER_X, RADAR_CENTER_Y, beamEndX, beamEndY, COLOR_RADAR_BEAM);

  // Secondary sweep trailing line
  const trailAngle = beamAngle - 0.08;
  const trailEndX = RADAR_CENTER_X + Math.floor(Math.cos(trailAngle) * (beamLen - 10));
  const trailEndY = RADAR_CENTER_Y + Math.floor(Math.sin(trailAngle) * (beamLen - 10));
  canvas.drawLine(RADAR_CENTER_X, RADAR_CENTER_Y, trailEndX, trailEndY, COLOR_GRID);

  // 5. Breadcrumb Trail following Santa across the world (Dotted)
  for (let i = 1; i <= telemetry.safeIdx; i++) {
    const prevCity = state.cities[i - 1];
    const currCity = state.cities[i];
    if (!prevCity || !currCity) continue;

    const [ax, ay] = projectCoordinates(prevCity.lon, prevCity.lat);
    let bx: number;
    let by: number;

    if (i < telemetry.safeIdx || !telemetry.isFlightPhase) {
      [bx, by] = projectCoordinates(currCity.lon, currCity.lat);
    } else {
      bx = telemetry.santaScreenX;
      by = telemetry.santaScreenY;
    }
    drawDottedLine(canvas, ax, ay, bx, by, COLOR_BREADCRUMB, 3.0);
  }

  // 6. City Waypoint Dots
  for (let i = 0; i < state.cityCount; i++) {
    const city = state.cities[i];
    if (!city) continue;
    const [wx, wy] = projectCoordinates(city.lon, city.lat);
    const ix = Math.floor(wx);
    const iy = Math.floor(wy);

    if (i === telemetry.targetCityIdx) {
      canvas.fillRect(ix - 1, iy - 1, 3, 3, blink ? TFT_WHITE : COLOR_CITY_VISITED);
    } else if (i < telemetry.safeIdx || (i === telemetry.safeIdx && !telemetry.isFlightPhase)) {
      canvas.fillRect(ix - 1, iy - 1, 3, 3, COLOR_CITY_VISITED);
    } else {
      canvas.drawPixel(ix, iy, COLOR_CITY_FUTURE);
    }
  }

  // 7. Santa Beacon: Red Flashing Blip + Expanding Ping Circle
  const pulseRadius = Math.floor(nowMs / 40) % 20;
  if (pulseRadius > 2) {
    canvas.drawCircle(
      Math.floor(telemetry.santaScreenX),
      Math.floor(telemetry.santaScreenY),
      pulseRadius,
      COLOR_BEACON_PULSE
    );
  }
  canvas.drawRect(
    Math.floor(telemetry.santaScreenX) - 3,
    Math.floor(telemetry.santaScreenY) - 3,
    7,
    7,
    0x4800 // COLOR_BEACON_GLOW
  );
  canvas.fillRect(
    Math.floor(telemetry.santaScreenX) - 1,
    Math.floor(telemetry.santaScreenY) - 1,
    3,
    3,
    blink ? COLOR_BEACON_CORE : TFT_WHITE
  );

  // 8. Top HUD Bar (y: 0..12)
  canvas.fillRect(0, 0, SCREEN_WIDTH, 12, COLOR_HUD_BG);
  canvas.drawFastHLine(0, 12, SCREEN_WIDTH, COLOR_GRID);
  canvas.setTextSize(1);

  // Left (x: 4, y: 2): BAT 98%
  canvas.setTextDatum(top_left);
  canvas.setTextColor(COLOR_TEXT_GREEN, COLOR_HUD_BG);
  canvas.drawString("BAT 98%", 4, 2);

  // Center (x: 120, y: 2): RADAR MIKOLAJA
  canvas.setTextDatum(top_center);
  canvas.setTextColor(COLOR_TEXT_GREEN, COLOR_HUD_BG);
  canvas.drawString("RADAR MIKOLAJA", RADAR_CENTER_X, 2);

  // Right (x: 236, y: 2): DZIEN <activeDay>
  canvas.setTextDatum(top_right);
  canvas.setTextColor(
    telemetry.activeDay === 24 ? COLOR_TEXT_GOLD : COLOR_TEXT_GREEN,
    COLOR_HUD_BG
  );
  canvas.drawString(`DZIEN ${telemetry.activeDay}`, SCREEN_WIDTH - 4, 2);

  // 9. Bottom HUD Bar (y: 121..135)
  canvas.fillRect(0, 121, SCREEN_WIDTH, 14, COLOR_HUD_BG);
  canvas.drawFastHLine(0, 120, SCREEN_WIDTH, COLOR_GRID);

  // Left (x: 4, y: 124): CEL: <CITY> or POSTOJ: <CITY> or FINAL: KRAKOW
  canvas.setTextDatum(top_left);
  if (telemetry.isDay24Finale) {
    canvas.setTextColor(COLOR_TEXT_GOLD, COLOR_HUD_BG);
    canvas.drawString(`FINAL: ${telemetry.nextCityName}`, 4, 124);
  } else if (telemetry.isFlightPhase) {
    canvas.setTextColor(COLOR_TEXT_GREEN, COLOR_HUD_BG);
    canvas.drawString(`CEL: ${telemetry.nextCityName}`, 4, 124);
  } else {
    canvas.setTextColor(COLOR_TEXT_GOLD, COLOR_HUD_BG);
    canvas.drawString(`POSTOJ: ${telemetry.nextCityName}`, 4, 124);
  }

  // Right (x: 236, y: 124): CZAS 0:<ETA> or WIGILIA!
  canvas.setTextDatum(top_right);
  canvas.setTextColor(COLOR_TEXT_GOLD, COLOR_HUD_BG);
  if (telemetry.isDay24Finale) {
    canvas.drawString("WIGILIA!", SCREEN_WIDTH - 4, 124);
  } else {
    const etaStr = `0:${String(telemetry.etaSeconds).padStart(2, "0")}`;
    canvas.drawString(`CZAS ${etaStr}`, SCREEN_WIDTH - 4, 124);
  }
}

// ============================================================================
// SCREEN 2: Cockpit Dashboard (Modern Glass Cockpit with 1:1 Hardware Parity)
// ============================================================================

function drawBatteryIcon(canvas: M5CanvasSim, x: number, y: number, color: number): void {
  canvas.drawRect(x, y + 1, 10, 6, color);
  canvas.fillRect(x + 10, y + 2, 2, 4, color);
  canvas.fillRect(x + 2, y + 2, 6, 4, color);
}

function drawMiniGiftIcon(canvas: M5CanvasSim, x: number, y: number): void {
  // Vibrant 8x8 Gift Box with bright red body & yellow ribbon
  const COLOR_RED = TFT_RED;
  const COLOR_GOLD = 0xffe0;
  canvas.fillRect(x + 2, y, 4, 2, COLOR_GOLD);     // Top ribbon bow
  canvas.fillRect(x, y + 2, 8, 6, COLOR_RED);      // Red package
  canvas.fillRect(x + 3, y + 2, 2, 6, COLOR_GOLD); // Vertical ribbon
  canvas.fillRect(x, y + 4, 8, 2, COLOR_GOLD);     // Horizontal ribbon
}

function drawMiniCookieIcon(canvas: M5CanvasSim, x: number, y: number): void {
  // Vibrant 8x8 Chocolate Chip Cookie: Golden-amber body with dark chocolate chips
  const COLOR_COOKIE_BASE = 0xfc80; // Bright golden baked amber (#f59e0b)
  const COLOR_COOKIE_EDGE = 0xc340; // Crispy cookie edge (#b45309)
  const COLOR_CHIP = 0x3940;        // Dark chocolate chip (#3b1802)

  // Cookie round body
  canvas.fillRect(x + 2, y, 4, 8, COLOR_COOKIE_BASE);
  canvas.fillRect(x, y + 2, 8, 4, COLOR_COOKIE_BASE);
  canvas.fillRect(x + 1, y + 1, 6, 6, COLOR_COOKIE_BASE);

  // Outer edge dots
  canvas.drawPixel(x + 1, y + 1, COLOR_COOKIE_EDGE);
  canvas.drawPixel(x + 6, y + 1, COLOR_COOKIE_EDGE);
  canvas.drawPixel(x + 1, y + 6, COLOR_COOKIE_EDGE);
  canvas.drawPixel(x + 6, y + 6, COLOR_COOKIE_EDGE);

  // High-contrast Chocolate Chips
  canvas.fillRect(x + 2, y + 2, 2, 2, COLOR_CHIP);
  canvas.fillRect(x + 5, y + 3, 2, 2, COLOR_CHIP);
  canvas.fillRect(x + 3, y + 5, 2, 2, COLOR_CHIP);
}

function drawMiniMilkIcon(canvas: M5CanvasSim, x: number, y: number): void {
  // Vibrant 7x9 Milk Bottle: Crisp white glass, sky-blue label, red cap
  const COLOR_CAP = TFT_RED;
  const COLOR_LABEL = 0x05ff; // Vivid sky blue label

  // Red cap
  canvas.fillRect(x + 2, y, 3, 2, COLOR_CAP);
  // Neck
  canvas.fillRect(x + 2, y + 2, 3, 1, TFT_WHITE);
  // White glass bottle body
  canvas.fillRect(x + 1, y + 3, 5, 6, TFT_WHITE);
  // Sky blue label band
  canvas.fillRect(x + 1, y + 5, 5, 2, COLOR_LABEL);
}

function drawSegmentedBar(
  canvas: M5CanvasSim,
  x: number,
  y: number,
  width: number,
  height: number,
  segments: number,
  activeSegs: number,
  activeColor: number,
  inactiveColor: number
): void {
  const gap = 1;
  const segWidth = Math.floor((width - (segments - 1) * gap) / segments);
  for (let i = 0; i < segments; i++) {
    const segX = x + i * (segWidth + gap);
    const color = i < activeSegs ? activeColor : inactiveColor;
    canvas.fillRect(segX, y, segWidth, height, color);
  }
}

function drawMultiColorBar(
  canvas: M5CanvasSim,
  x: number,
  y: number,
  width: number,
  height: number,
  segments: number,
  activeSegs: number,
  colors: number[],
  inactiveColor: number
): void {
  const gap = 1;
  const segWidth = Math.floor((width - (segments - 1) * gap) / segments);
  for (let i = 0; i < segments; i++) {
    const segX = x + i * (segWidth + gap);
    const color = i < activeSegs ? (colors[i] ?? colors[0] ?? TFT_WHITE) : inactiveColor;
    canvas.fillRect(segX, y, segWidth, height, color);
  }
}

function renderCockpitScreen(
  canvas: M5CanvasSim,
  state: SimulatorAppState,
  telemetry: TelemetryState,
  nowMs: number
): void {
  // Modern Aerospace Glass Cockpit Palette (RGB565)
  const COLOR_BG_DARK = 0x0000;         // Pitch black (#000000) for maximum OLED/IPS contrast
  const COLOR_BORDER = 0x2124;          // #20242c Subtle graphite titanium divider
  const COLOR_SEG_OFF = 0x18e3;         // #181c24 Inactive gauge segment
  const COLOR_LABEL = 0x94b2;           // #94a3b8 Modern aerospace cool slate label
  const COLOR_DIM = 0x4aa9;             // #475569 Muted standby value
  const COLOR_CYAN = 0x3dfa;            // #38bdf8 Cockpit section header cyan
  const COLOR_CYAN_BRIGHT = 0x07ff;     // #00f0ff Electric Ice Cyan
  const COLOR_AMBER_BRIGHT = 0xfde0;    // #fbbf24 High-visibility aviation amber
  const COLOR_EMERALD_NEON = 0x07e0;    // #00ff00 / #22c55e Vivid avionics green
  const COLOR_PANEL_BG = 0x0842;        // #0a101f Sleek dark avionics panel
  const COLOR_HEADER_BG = 0x0821;       // #080c14 Sleek dark avionics glass

  // Multi-color Mach gauge colors (Segments 0..3: Ice Cyan, 4..6: Amber, 7..9: Flame Coral/Red)
  const MACH_BAR_COLORS = [
    0x07ff, 0x07ff, 0x07ff, 0x07ff,
    0xfde0, 0xfde0, 0xfde0,
    0xfda0, 0xf800, 0xf800,
  ];

  // Calculate detailed telemetry metrics from santa-metrics.ts
  const totalSimTime = state.cityCount * SEC_PER_CITY;
  const effectiveSimTime =
    state.simTime >= totalSimTime ? totalSimTime - 0.001 : Math.max(0, state.simTime);
  const cityIdx = Math.floor(effectiveSimTime / SEC_PER_CITY);
  const u = Math.max(0, effectiveSimTime - cityIdx * SEC_PER_CITY);
  const nowSec = nowMs / 1000.0;

  const metrics = computeSantaMetrics(
    state.activeDay,
    telemetry.safeIdx,
    u,
    nowSec,
    telemetry.nextCityName,
    telemetry.isDay24Finale
  );

  const isFlight = metrics.flightPhase !== "DACH" && metrics.flightPhase !== "FINAL";
  const isFinale = metrics.flightPhase === "FINAL";

  // 1. Clear Screen with pitch black for modern glass cockpit (NO CRT scanlines)
  canvas.fillScreen(COLOR_BG_DARK);

  // 2. Top Header Bar (y: 0..13)
  canvas.fillRect(0, 0, SCREEN_WIDTH, 13, COLOR_HEADER_BG);
  canvas.drawFastHLine(0, 13, SCREEN_WIDTH, COLOR_BORDER);

  // Battery icon (4, 3) + "98%"
  drawBatteryIcon(canvas, 4, 3, COLOR_EMERALD_NEON);
  canvas.setTextSize(1);
  canvas.setTextDatum(top_left);
  canvas.setTextColor(TFT_WHITE, COLOR_HEADER_BG);
  canvas.drawString("98%", 18, 3);

  // System Title
  canvas.setTextDatum(top_center);
  canvas.setTextColor(COLOR_CYAN_BRIGHT, COLOR_HEADER_BG);
  canvas.drawString("KOKPIT MIKOLAJA", RADAR_CENTER_X, 3);

  // Active Advent Day
  canvas.setTextDatum(top_right);
  canvas.setTextColor(COLOR_AMBER_BRIGHT, COLOR_HEADER_BG);
  canvas.drawString(`DZIEN ${String(state.activeDay).padStart(2, "0")}`, SCREEN_WIDTH - 4, 3);

  // 3. Flight Dynamics & Gift Payload Box (y: 14..57)
  canvas.drawFastVLine(120, 14, 43, COLOR_BORDER);
  canvas.drawFastHLine(0, 57, SCREEN_WIDTH, COLOR_BORDER);

  // --- Left Column: Flight Dynamics (x: 4..116) ---
  canvas.setTextDatum(top_left);
  canvas.setTextColor(COLOR_CYAN, COLOR_BG_DARK);
  canvas.drawString("DYNAMIKA LOTU", 4, 16);

  canvas.setTextColor(COLOR_LABEL, COLOR_BG_DARK);
  canvas.drawString("PREDK.", 4, 26);
  canvas.drawString("PULAP", 4, 36);

  const speedColor = isFlight ? COLOR_AMBER_BRIGHT : COLOR_DIM;
  canvas.setTextColor(speedColor, COLOR_BG_DARK);
  canvas.drawString(metrics.machDisplay, 44, 26);

  canvas.setTextColor(COLOR_CYAN_BRIGHT, COLOR_BG_DARK);
  canvas.drawString(metrics.altitudeDisplay, 44, 36);

  // Multi-color 10-segment speed bar (Cyan -> Amber -> Red at Mach 4.8)
  const activeMachSegs = Math.min(10, Math.round((metrics.machSpeed / 5.0) * 10));
  drawMultiColorBar(canvas, 4, 46, 112, 7, 10, activeMachSegs, MACH_BAR_COLORS, COLOR_SEG_OFF);

  // --- Right Column: Gifts (x: 124..236) ---
  canvas.setTextDatum(top_left);
  canvas.setTextColor(COLOR_CYAN, COLOR_BG_DARK);
  canvas.drawString("PREZENTY", 124, 16);
  drawMiniGiftIcon(canvas, 226, 15);

  canvas.setTextColor(COLOR_LABEL, COLOR_BG_DARK);
  canvas.drawString("DOSTARCZONO:", 124, 26);
  canvas.setTextDatum(top_right);
  canvas.setTextColor(TFT_WHITE, COLOR_BG_DARK);
  canvas.drawString(metrics.giftsDeliveredDisplay, 236, 26);

  canvas.setTextDatum(top_left);
  canvas.setTextColor(COLOR_LABEL, COLOR_BG_DARK);
  canvas.drawString("ZRZUT:", 124, 36);
  const rateColor = metrics.giftRatePerSec > 0 ? COLOR_AMBER_BRIGHT : COLOR_DIM;
  canvas.setTextDatum(top_right);
  canvas.setTextColor(rateColor, COLOR_BG_DARK);
  canvas.drawString(metrics.giftRateDisplay, 236, 36);

  // 10-segment gift progress bar (Vivid Emerald Neon)
  const payloadSegs = Math.min(10, Math.max(1, Math.round(metrics.payloadPct / 10)));
  drawSegmentedBar(canvas, 124, 46, 112, 7, 10, payloadSegs, COLOR_EMERALD_NEON, COLOR_SEG_OFF);

  // 4. Sustenance Box: Paliwo Mikołaja (Cookies & Milk, y: 58..82)
  canvas.drawFastHLine(0, 82, SCREEN_WIDTH, COLOR_BORDER);
  canvas.setTextDatum(top_left);
  canvas.setTextColor(COLOR_CYAN, COLOR_BG_DARK);
  canvas.drawString("PALIWO MIKOLAJA", 4, 60);

  // Cookies (left side): Icon + Label + Value
  drawMiniCookieIcon(canvas, 4, 71);
  canvas.setTextColor(COLOR_LABEL, COLOR_BG_DARK);
  canvas.drawString("CIASTKA:", 15, 72);
  canvas.setTextColor(TFT_WHITE, COLOR_BG_DARK);
  canvas.drawString(metrics.cookiesEatenDisplay, 66, 72);

  // Milk (right side): Icon + Label + Value
  drawMiniMilkIcon(canvas, 124, 70);
  canvas.setTextColor(COLOR_LABEL, COLOR_BG_DARK);
  canvas.drawString("MLEKO:", 134, 72);
  canvas.setTextColor(TFT_WHITE, COLOR_BG_DARK);
  canvas.drawString(metrics.milkLitersDisplay, 174, 72);

  // 5. Mission Phase Tactical Status Box (y: 85..116)
  const boxBorderColor = isFinale
    ? (Math.sin(nowSec * 5) > 0 ? COLOR_AMBER_BRIGHT : TFT_RED)
    : isFlight
    ? COLOR_CYAN_BRIGHT
    : COLOR_EMERALD_NEON;

  canvas.fillRect(3, 85, 234, 31, COLOR_PANEL_BG);
  canvas.drawRect(3, 85, 234, 31, boxBorderColor);

  canvas.setTextDatum(top_left);
  canvas.setTextColor(COLOR_LABEL, COLOR_PANEL_BG);
  canvas.drawString("AKTUALNA FAZA MISJI:", 8, 89);

  canvas.setTextDatum(top_center);
  const titleColor = isFinale
    ? TFT_WHITE
    : isFlight
    ? COLOR_AMBER_BRIGHT
    : COLOR_EMERALD_NEON;
  canvas.setTextColor(titleColor, COLOR_PANEL_BG);
  canvas.drawString(metrics.stageTitle, RADAR_CENTER_X, 102);

  // 6. Bottom Navigation HUD Bar (y: 120..134)
  canvas.fillRect(0, 120, SCREEN_WIDTH, 15, COLOR_HEADER_BG);
  canvas.drawFastHLine(0, 119, SCREEN_WIDTH, COLOR_BORDER);

  canvas.setTextDatum(top_left);
  const prefixColor = isFinale ? COLOR_AMBER_BRIGHT : isFlight ? COLOR_CYAN_BRIGHT : COLOR_EMERALD_NEON;
  const prefixText = isFinale ? "FINAL: " : isFlight ? "CEL: " : "POSTOJ: ";
  canvas.setTextColor(prefixColor, COLOR_HEADER_BG);
  canvas.drawString(prefixText, 4, 123);

  const prefixWidth = prefixText.length * 6;
  canvas.setTextColor(TFT_WHITE, COLOR_HEADER_BG);
  canvas.drawString(metrics.targetCity, 4 + prefixWidth, 123);

  // ETA Countdown on right
  canvas.setTextDatum(top_right);
  canvas.setTextColor(COLOR_AMBER_BRIGHT, COLOR_HEADER_BG);
  if (isFinale && metrics.etaSeconds === 0) {
    canvas.drawString("WIGILIA!", SCREEN_WIDTH - 4, 123);
  } else {
    canvas.drawString(`CZAS 0:${String(metrics.etaSeconds).padStart(2, "0")}`, SCREEN_WIDTH - 4, 123);
  }
}
