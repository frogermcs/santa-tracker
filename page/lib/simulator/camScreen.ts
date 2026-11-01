// ============================================================================
// camScreen.ts — Side-View Santa Cam (Kamera Mikołaja — Screen 3 / SCREEN_CAM)
// ============================================================================
// 1:1 Specification for M5StickC-Plus SE (240x135 ST7789v2 IPS Display)
//
// Dynamic Sub-Phase Scenes:
// 1. Hyper-Warp (Flight 0-20%): Horizontal star streaks, sleigh vibration, red nose aura
// 2. Cruising Sky (Flight 20-80%): Sinusoidal bobbing, 2-frame reindeer gallop, parallax mountains & snow
// 3. Gliding Descent (Flight 80-100%): Sleigh pitches downward toward emerging snowy rooftops
// 4. City Rooftop Chimney Cruise (Landed 0-4s): Sleigh cruising above scrolling chimneys, parachuting gifts into chimneys
// 5. Big Santa Cookie Break (Landed 4-8s): Dedicated close-up scene of bigger size Santa eating cookies by the fireplace
// 6. Takeoff Climb (Landed 8-12s): Sleigh climbing above rooftops, Rudolph beacon strobe, preparing for warp
// 7. Kraków Finale Hold (Dec 24 Stop 12): Bazylika Mariacka spires silhouette, celebratory fireworks & banner
//
// Zero dynamic heap allocations in active frame render loop.
// ============================================================================

import { M5CanvasSim } from "./M5CanvasSim";
import {
  TFT_BLACK,
  TFT_WHITE,
  TFT_RED,
  top_left,
  top_center,
  top_right,
} from "./M5Constants";
import { computeSantaMetrics } from "../telemetry/santa-metrics";
import { TelemetryState, SimulatorAppState, SEC_PER_CITY } from "./iotAppLogic";

const SCREEN_WIDTH = 240;
const SCREEN_HEIGHT = 135;
const RADAR_CENTER_X = 120;

// Color Palette (RGB565 16-bit format)
const COLOR_BG_DARK = 0x0000;         // Pitch black (#000000)
const COLOR_SKY_MIDNIGHT = 0x0825;    // Deep polar night navy (#080c1a)
const COLOR_HEADER_BG = 0x0821;       // Avionics glass header (#080c14)
const COLOR_BORDER = 0x2124;          // Graphite titanium divider (#20242c)
const COLOR_CYAN_BRIGHT = 0x07ff;     // Electric ice cyan (#00f0ff)
const COLOR_AMBER_BRIGHT = 0xfde0;    // High-visibility aviation amber (#fbbf24)
const COLOR_EMERALD_NEON = 0x07e0;    // Vivid emerald (#00ff00)
const COLOR_GOLD = 0xffe0;            // Pure golden yellow (#ffff00)
const COLOR_SANTA_RED = 0xd800;       // Crimson Santa suit (#dc2626)
const COLOR_SANTA_FACE = 0xfde0;      // Peach face tone
const COLOR_SLEIGH_RUNNER = 0xfde0;   // Sleigh runner gold
const COLOR_SLEIGH_HULL = 0x8800;     // Mahogany crimson sleigh hull
const COLOR_REINDEER_BROWN = 0x92c2;  // Chestnut brown
const COLOR_REINDEER_DARK = 0x5180;   // Hooves and shadow brown
const COLOR_ANTLERS = 0xce55;         // Bone antlers
const COLOR_NOSE_RED = 0xf800;        // Rudolph nose bright red
const COLOR_NOSE_GLOW = 0xfc00;       // Rudolph nose strobe flare
const COLOR_ROOF_SLATE = 0x2128;      // Slate tile roof
const COLOR_SNOW = 0xffff;            // Crisp white snow
const COLOR_BRICK = 0x99a3;           // Brick red chimney
const COLOR_WARM_WINDOW = 0xffa0;     // Warm amber incandescent light
const COLOR_COOKIE_BASE = 0xfc80;     // Baked cookie amber
const COLOR_COOKIE_CHIP = 0x3940;     // Chocolate chip
const COLOR_MOUNTAIN_DARK = 0x0926;   // Mountain silhouette
const COLOR_MOUNTAIN_CAP = 0x7be0;    // Icy mountain peak
const COLOR_SPIRE = 0x18c5;           // Bazylika Mariacka silhouette navy
const COLOR_EARTH_ATMOS = 0x3dff;     // Glowing outer atmospheric cyan-white
const COLOR_EARTH_OCEAN = 0x08c8;     // Deep satellite oceanic navy (#081940)
const COLOR_EARTH_LAND = 0x1406;      // Nocturnal continent landmass dark olive/green (#142010)
const COLOR_EARTH_CLOUD = 0x9537;     // High stratospheric wispy clouds (#90a4b8)
const COLOR_CITY_LIGHT = 0xfe64;      // Twinkling nighttime city lights (#fbbf24)
const COLOR_PINE_NEEDLE = 0x13c3;     // Festive dark pine tree green (#107c18)

// ============================================================================
// Battery Indicator (HUD Header)
// ============================================================================

function drawBatteryIcon(canvas: M5CanvasSim, x: number, y: number, color: number): void {
  canvas.drawRect(x, y + 1, 10, 6, color);
  canvas.fillRect(x + 10, y + 2, 2, 4, color);
  canvas.fillRect(x + 2, y + 2, 6, 4, color);
}

// ============================================================================
// Pixel-Art Sleigh & Santa (24 × 14 px)
// ============================================================================

function drawSantaSleigh(canvas: M5CanvasSim, x: number, y: number): void {
  // Santa's Hat & Pom-pom
  canvas.fillRect(x + 5, y + 1, 3, 2, COLOR_SANTA_RED);
  canvas.drawPixel(x + 8, y + 1, COLOR_SNOW);
  canvas.fillRect(x + 4, y + 3, 5, 1, COLOR_SNOW);

  // Santa's Face & Beard
  canvas.fillRect(x + 4, y + 4, 3, 1, COLOR_SANTA_FACE);
  canvas.drawPixel(x + 5, y + 4, TFT_BLACK);
  canvas.fillRect(x + 4, y + 5, 4, 2, COLOR_SNOW);

  // Santa's Coat & Belt
  canvas.fillRect(x + 3, y + 6, 5, 3, COLOR_SANTA_RED);
  canvas.drawFastHLine(x + 3, y + 8, 5, TFT_BLACK);
  canvas.drawPixel(x + 5, y + 8, COLOR_GOLD);

  // Overflowing Gift Sack in Sleigh (Green parcel + yellow ribbon)
  canvas.fillRect(x + 8, y + 5, 4, 4, COLOR_EMERALD_NEON);
  canvas.drawFastVLine(x + 10, y + 5, 4, COLOR_GOLD);
  canvas.drawFastHLine(x + 8, y + 7, 4, COLOR_GOLD);

  // Sleigh Hull (Mahogany red with curved back)
  canvas.fillRect(x + 2, y + 9, 14, 2, COLOR_SLEIGH_HULL);
  canvas.fillRect(x + 1, y + 10, 16, 2, COLOR_SLEIGH_HULL);
  canvas.drawPixel(x, y + 9, COLOR_SLEIGH_RUNNER);

  // Sleigh Gold Runners (Struts & Curved Skis)
  canvas.drawFastHLine(x + 2, y + 13, 16, COLOR_SLEIGH_RUNNER);
  canvas.drawPixel(x + 18, y + 12, COLOR_SLEIGH_RUNNER);
  canvas.drawPixel(x + 19, y + 11, COLOR_SLEIGH_RUNNER);
  canvas.drawFastVLine(x + 4, y + 12, 1, COLOR_SLEIGH_RUNNER);
  canvas.drawFastVLine(x + 14, y + 12, 1, COLOR_SLEIGH_RUNNER);
}

// ============================================================================
// Supersonic Jet Thruster Exhaust Flames (Hyper-Warp Mode 1)
// ============================================================================

function drawSleighJetFlames(canvas: M5CanvasSim, sleighX: number, sleighY: number, nowMs: number): void {
  // 1. Primary Sleigh Hull Plasma Thruster (y + 10)
  const pulse1 = Math.floor(nowMs / 30) % 5;
  const flameLen1 = 8 + pulse1; // 8..12 px

  // Outer red exhaust tip
  canvas.drawFastHLine(sleighX - flameLen1, sleighY + 10, Math.max(1, Math.floor(flameLen1 * 0.4)), COLOR_NOSE_RED);
  // Warm amber flame body
  canvas.drawFastHLine(sleighX - Math.floor(flameLen1 * 0.7), sleighY + 10, Math.max(1, Math.floor(flameLen1 * 0.4)), COLOR_AMBER_BRIGHT);
  // White/cyan core plasma near nozzle
  canvas.drawFastHLine(sleighX - 3, sleighY + 10, 3, TFT_WHITE);

  // Upper & lower flame expansion
  const midLen = Math.floor(flameLen1 * 0.5);
  if (midLen > 1) {
    canvas.drawFastHLine(sleighX - midLen, sleighY + 9, midLen - 1, COLOR_AMBER_BRIGHT);
    canvas.drawFastHLine(sleighX - midLen, sleighY + 11, midLen - 1, COLOR_AMBER_BRIGHT);
  }

  // 2. Runner Skid Turbo Flame (y + 13)
  const pulse2 = Math.floor(nowMs / 45) % 4;
  const flameLen2 = 6 + pulse2; // 6..9 px
  canvas.drawFastHLine(sleighX - flameLen2, sleighY + 13, 3, COLOR_NOSE_RED);
  canvas.drawFastHLine(sleighX - Math.floor(flameLen2 * 0.7), sleighY + 13, 3, COLOR_AMBER_BRIGHT);
  canvas.drawFastHLine(sleighX - 2, sleighY + 13, 2, COLOR_CYAN_BRIGHT);

  // Mach diamond plasma spark
  const sparkY = sleighY + 10 + ((Math.floor(nowMs / 60) % 3) - 1);
  canvas.drawPixel(sleighX - flameLen1 - 3, sparkY, COLOR_GOLD);
}

// ============================================================================
// Pixel-Art Rudolph / Reindeer (18 × 15 px) with 2-Frame Gallop Animation
// ============================================================================

function drawReindeer(
  canvas: M5CanvasSim,
  x: number,
  y: number,
  legFrame: number,
  noseGlow: boolean
): void {
  // Antlers (Bone/Tan)
  canvas.drawPixel(x + 5, y, COLOR_ANTLERS);
  canvas.drawPixel(x + 7, y, COLOR_ANTLERS);
  canvas.drawPixel(x + 5, y + 1, COLOR_ANTLERS);
  canvas.drawPixel(x + 6, y + 1, COLOR_ANTLERS);
  canvas.drawPixel(x + 8, y + 1, COLOR_ANTLERS);

  // Head, Muzzle & Neck
  canvas.fillRect(x + 6, y + 2, 5, 3, COLOR_REINDEER_BROWN);
  canvas.drawPixel(x + 8, y + 2, TFT_BLACK);
  canvas.fillRect(x + 7, y + 4, 5, 2, COLOR_REINDEER_BROWN);

  // Golden Harness / Collar
  canvas.drawFastVLine(x + 6, y + 5, 2, COLOR_GOLD);

  // Rudolph's Glowing Red Nose (2x2 px, clean natural shape)
  canvas.fillRect(x + 12, y + 4, 2, 2, COLOR_NOSE_RED);
  if (noseGlow) {
    canvas.drawPixel(x + 13, y + 4, COLOR_NOSE_GLOW);
  }

  // Torso & Back
  canvas.fillRect(x + 2, y + 6, 8, 4, COLOR_REINDEER_BROWN);
  canvas.drawPixel(x + 1, y + 6, COLOR_SNOW);

  // Legs Animation: Frame 0 (Extended) vs Frame 1 (Gathered/Bent)
  if (legFrame === 0) {
    canvas.drawFastVLine(x + 2, y + 10, 3, COLOR_REINDEER_BROWN);
    canvas.drawPixel(x + 1, y + 13, COLOR_REINDEER_DARK);
    canvas.drawFastVLine(x + 8, y + 10, 3, COLOR_REINDEER_BROWN);
    canvas.drawPixel(x + 9, y + 13, COLOR_REINDEER_DARK);
  } else {
    canvas.drawFastVLine(x + 3, y + 10, 2, COLOR_REINDEER_BROWN);
    canvas.drawPixel(x + 4, y + 12, COLOR_REINDEER_DARK);
    canvas.drawFastVLine(x + 7, y + 10, 2, COLOR_REINDEER_BROWN);
    canvas.drawPixel(x + 6, y + 12, COLOR_REINDEER_DARK);
  }
}

// ============================================================================
// Golden Harness Reins
// ============================================================================

function drawReins(canvas: M5CanvasSim, sleighX: number, sleighY: number, deerX: number, deerY: number): void {
  const x0 = sleighX + 17;
  const y0 = sleighY + 8;
  const x1 = deerX + 6;
  const y1 = deerY + 5;
  const midX = Math.floor((x0 + x1) / 2);
  const midY = Math.floor((y0 + y1) / 2) + 1;

  canvas.drawLine(x0, y0, midX, midY, COLOR_GOLD);
  canvas.drawLine(midX, midY, x1, y1, COLOR_GOLD);
}

// ============================================================================
// Parachuting Gift Box (10 × 12 px)
// ============================================================================

function drawParachuteGift(canvas: M5CanvasSim, x: number, y: number): void {
  // Parachute Canopy Dome
  canvas.fillRect(x + 2, y, 6, 1, COLOR_SNOW);
  canvas.fillRect(x + 1, y + 1, 8, 2, COLOR_SNOW);
  canvas.drawPixel(x, y + 3, COLOR_SNOW);
  canvas.drawPixel(x + 9, y + 3, COLOR_SNOW);

  // Parachute Shroud Lines
  canvas.drawLine(x + 1, y + 3, x + 3, y + 6, COLOR_SNOW);
  canvas.drawLine(x + 8, y + 3, x + 6, y + 6, COLOR_SNOW);

  // Emerald Wrapped Gift Box
  canvas.fillRect(x + 2, y + 6, 6, 5, COLOR_EMERALD_NEON);
  // Gold Ribbon Cross
  canvas.drawFastVLine(x + 4, y + 6, 5, COLOR_GOLD);
  canvas.drawFastHLine(x + 2, y + 8, 6, COLOR_GOLD);
}

// ============================================================================
// Chimney-Targeted Gift Drop & Parachute Descent
// ============================================================================

function drawChimneyGiftDrop(
  canvas: M5CanvasSim,
  sleighY: number,
  chimCenterX: number,
  chimY: number
): boolean {
  const releaseX = 70; // Santa's gift sack is at x = 70
  const dropDist = 24; // Distance chimney scrolls while present falls (approx 0.86s at 28 px/s)

  if (chimCenterX > releaseX || chimCenterX < releaseX - Math.floor(dropDist * 1.35)) {
    return false;
  }

  const progress = (releaseX - chimCenterX) / dropDist;
  if (progress >= 0 && progress < 1.0) {
    // Parachute descent directly aligned with chimney opening with subtle sway
    const sway = Math.round(Math.sin(progress * Math.PI * 4) * 1.5);
    const gx = chimCenterX - 5 + sway;
    const startY = sleighY + 11;
    const targetY = chimY - 8; // Bottom of gift box enters chimney mouth
    const gy = Math.round(startY + progress * (targetY - startY));
    drawParachuteGift(canvas, gx, gy);
    return true;
  } else if (progress >= 1.0 && progress <= 1.35) {
    // Delivery hit sparkle bursting directly at the chimney mouth!
    const sparkX = chimCenterX;
    const sparkY = chimY - 1;
    canvas.drawPixel(sparkX, sparkY, COLOR_GOLD);
    canvas.drawPixel(sparkX + 2, sparkY - 2, COLOR_GOLD);
    canvas.drawPixel(sparkX - 2, sparkY - 2, COLOR_GOLD);
    canvas.drawPixel(sparkX, sparkY - 4, COLOR_GOLD);
    canvas.drawPixel(sparkX, sparkY - 2, TFT_WHITE);
    return true;
  }
  return false;
}

function drawDroppingGift(
  canvas: M5CanvasSim,
  sleighX: number,
  sleighY: number,
  dropProgress: number
): void {
  // Retained for backward compatibility
  const sway = Math.round(Math.sin(dropProgress * Math.PI * 3) * 2);
  const gx = Math.round(sleighX + 8 - dropProgress * 12 + sway);
  const gy = Math.round(sleighY + 12 + dropProgress * 38);
  if (gy < 72) {
    drawParachuteGift(canvas, gx, gy);
  }
}

// ============================================================================
// Scrolling City Skyline: Distinct Separate Buildings, Alleys & Chimneys
// ============================================================================

interface BuildingDef {
  x: number;
  w: number;
  roofY: number;
  wallColor: number;
  chimRelX: number;
  chimW: number;
  chimH: number;
  winRelX: number;
  winRelY: number;
  winW: number;
  winH: number;
  alleyType: number; // 0: Lamppost, 1: Pine tree
}

const BUILDINGS: readonly BuildingDef[] = [
  {
    x: 0,
    w: 46,
    roofY: 82,
    wallColor: COLOR_ROOF_SLATE,
    chimRelX: 32,
    chimW: 10,
    chimH: 12,
    winRelX: 8,
    winRelY: 14,
    winW: 12,
    winH: 12,
    alleyType: 0, // Lamppost
  },
  {
    x: 62,
    w: 44,
    roofY: 88,
    wallColor: 0x31a6, // Warm timber
    chimRelX: 6,
    chimW: 10,
    chimH: 11,
    winRelX: 20,
    winRelY: 12,
    winW: 14,
    winH: 10,
    alleyType: 1, // Pine tree
  },
  {
    x: 122,
    w: 48,
    roofY: 78,
    wallColor: 0x2148, // Deep stone slate
    chimRelX: 34,
    chimW: 10,
    chimH: 13,
    winRelX: 8,
    winRelY: 12,
    winW: 12,
    winH: 14,
    alleyType: 0, // Lamppost
  },
  {
    x: 184,
    w: 42,
    roofY: 84,
    wallColor: COLOR_ROOF_SLATE,
    chimRelX: 14,
    chimW: 10,
    chimH: 11,
    winRelX: 8,
    winRelY: 14,
    winW: 12,
    winH: 11,
    alleyType: 1, // Pine tree
  },
];

function drawScrollingRooftops(
  canvas: M5CanvasSim,
  nowSec: number,
  sleighY = 32,
  enableDrops = false
): void {
  const cycleW = 240;
  const scrollOffset = (((Math.floor(nowSec * 28) % cycleW) + cycleW) % cycleW);

  // 1. Street Ground Level Snow Blanket across bottom (y = 114..119)
  canvas.fillRect(0, 114, SCREEN_WIDTH, 2, 0x18c4); // Shadow under snow
  canvas.fillRect(0, 116, SCREEN_WIDTH, 4, COLOR_SNOW); // Fresh street snow

  // 2. Render 2 instances of the 240px cycle to smoothly cover viewport with wrapping
  for (let cycle = 0; cycle < 2; cycle++) {
    const cycleBaseX = cycle * cycleW - scrollOffset;

    for (let b = 0; b < BUILDINGS.length; b++) {
      const bldg = BUILDINGS[b];
      const bx = cycleBaseX + bldg.x;

      // Skip if building + alley is completely off-screen
      if (bx + bldg.w + 18 < 0 || bx > SCREEN_WIDTH) continue;

      // --- Draw Building Wall (Individual separate structure from roofY down to street y=114) ---
      const wallH = 114 - bldg.roofY;
      canvas.fillRect(bx, bldg.roofY, bldg.w, wallH, bldg.wallColor);

      // Building Outline / Edges (gives depth and clear visual separation between buildings)
      canvas.drawFastVLine(bx, bldg.roofY, wallH, TFT_BLACK);
      canvas.drawFastVLine(bx + bldg.w - 1, bldg.roofY, wallH, TFT_BLACK);

      // --- Snowy Roof Cap with Icicles ---
      canvas.fillRect(bx - 1, bldg.roofY - 2, bldg.w + 2, 3, COLOR_SNOW);
      canvas.drawFastVLine(bx + 8, bldg.roofY + 1, 3, COLOR_SNOW);
      canvas.drawFastVLine(bx + Math.floor(bldg.w * 0.6), bldg.roofY + 1, 2, COLOR_SNOW);

      // --- Brick Chimney with Smoke Puff & Gift Drop ---
      const chimX = bx + bldg.chimRelX;
      const chimY = bldg.roofY - bldg.chimH;
      const chimCenterX = chimX + Math.floor(bldg.chimW / 2);

      // Chimney body
      canvas.fillRect(chimX, chimY, bldg.chimW, bldg.chimH, COLOR_BRICK);
      canvas.drawFastHLine(chimX, chimY + Math.floor(bldg.chimH / 2), bldg.chimW, TFT_BLACK);
      // Chimney snow cap
      canvas.fillRect(chimX - 1, chimY - 2, bldg.chimW + 2, 3, COLOR_SNOW);

      // Check if gift is dropping directly into this chimney
      const isDropping = enableDrops
        ? drawChimneyGiftDrop(canvas, sleighY, chimCenterX, chimY)
        : false;

      // Chimney smoke puffs (drifting up when not actively receiving a gift)
      if (!isDropping) {
        const smokeOffset = Math.floor(nowSec * 14 + b * 6) % 18;
        const smokeY = chimY - 3 - smokeOffset;
        const smokeX = chimX + Math.floor(bldg.chimW / 2) - Math.floor(smokeOffset * 0.35);
        if (smokeY >= 20 && smokeY < chimY) {
          canvas.fillCircle(smokeX, smokeY, 2, COLOR_SNOW);
        }
      }

      // --- Cozy Glowing Window ---
      const winX = bx + bldg.winRelX;
      const winY = bldg.roofY + bldg.winRelY;
      canvas.fillRect(winX, winY, bldg.winW, bldg.winH, COLOR_WARM_WINDOW);
      canvas.drawRect(winX, winY, bldg.winW, bldg.winH, TFT_BLACK);
      // Window panes cross
      canvas.drawFastHLine(winX, winY + Math.floor(bldg.winH / 2), bldg.winW, TFT_BLACK);
      canvas.drawFastVLine(winX + Math.floor(bldg.winW / 2), winY, bldg.winH, TFT_BLACK);

      // --- Alley Elements (In the open space between this building and the next) ---
      const alleyX = bx + bldg.w;
      if (bldg.alleyType === 0) {
        // Victorian Street Lamppost
        const postX = alleyX + 7;
        canvas.drawFastVLine(postX, 96, 18, 0x4208); // Dark iron post
        canvas.fillRect(postX - 2, 93, 5, 4, COLOR_GOLD); // Glowing lantern
        canvas.drawPixel(postX, 92, 0x4208); // Finial top
        // Warm amber glow on ground snow
        canvas.fillRect(postX - 4, 114, 9, 2, COLOR_AMBER_BRIGHT);
      } else {
        // Snow-Dusted Evergreen Pine Tree
        const treeX = alleyX + 8;
        // Trunk
        canvas.fillRect(treeX - 1, 108, 3, 6, 0x4180);
        // Foliage triangles (bottom to top)
        canvas.fillRect(treeX - 5, 103, 11, 5, COLOR_PINE_NEEDLE);
        canvas.drawFastHLine(treeX - 4, 103, 9, COLOR_SNOW);
        canvas.fillRect(treeX - 3, 97, 7, 6, COLOR_PINE_NEEDLE);
        canvas.drawFastHLine(treeX - 2, 97, 5, COLOR_SNOW);
        canvas.fillRect(treeX - 1, 92, 3, 5, COLOR_PINE_NEEDLE);
        canvas.drawPixel(treeX, 91, COLOR_SNOW); // Snow star on top
      }
    }
  }
}

// ============================================================================
// Stationary Snowy Rooftop (For Kraków Grand Finale)
// ============================================================================

function drawStationarySnowyRooftop(canvas: M5CanvasSim, chimneySmokeY: number): void {
  canvas.fillRect(0, 88, SCREEN_WIDTH, 31, COLOR_ROOF_SLATE);

  canvas.fillRect(0, 85, SCREEN_WIDTH, 4, COLOR_SNOW);
  for (let x = 10; x < SCREEN_WIDTH; x += 18) {
    canvas.drawFastVLine(x, 89, 2, COLOR_SNOW);
  }

  canvas.fillRect(175, 72, 18, 16, COLOR_BRICK);
  canvas.drawFastHLine(175, 77, 18, TFT_BLACK);
  canvas.drawFastHLine(175, 82, 18, TFT_BLACK);
  canvas.drawFastVLine(183, 72, 5, TFT_BLACK);
  canvas.drawFastVLine(179, 77, 5, TFT_BLACK);
  canvas.drawFastVLine(187, 77, 5, TFT_BLACK);

  canvas.fillRect(173, 69, 22, 3, COLOR_SNOW);

  const smokeX1 = 184 + Math.floor(Math.sin(chimneySmokeY * 0.1) * 3);
  const smokeY1 = Math.floor(64 - (chimneySmokeY % 24));
  if (smokeY1 >= 25 && smokeY1 < 70) {
    canvas.fillCircle(smokeX1, smokeY1, 2, COLOR_SNOW);
  }

  canvas.fillRect(70, 94, 16, 14, COLOR_WARM_WINDOW);
  canvas.drawRect(70, 94, 16, 14, TFT_BLACK);
  canvas.drawFastHLine(70, 101, 16, TFT_BLACK);
  canvas.drawFastVLine(78, 94, 14, TFT_BLACK);
}

// ============================================================================
// Bazylika Mariacka (St. Mary's Basilica) Spires Silhouette for Kraków Finale
// ============================================================================

function drawKrakowBasilica(canvas: M5CanvasSim, x: number, baseY: number): void {
  // Left Higher Tower (Hejnalica, 81m)
  canvas.fillRect(x + 4, baseY - 36, 12, 36, COLOR_SPIRE);
  canvas.fillRect(x + 6, baseY - 46, 8, 10, COLOR_SPIRE);
  canvas.fillRect(x + 8, baseY - 54, 4, 8, COLOR_SPIRE);
  canvas.drawFastVLine(x + 9, baseY - 58, 4, COLOR_GOLD);
  canvas.drawPixel(x + 9, baseY - 59, COLOR_GOLD);

  canvas.drawFastVLine(x + 3, baseY - 42, 6, COLOR_SPIRE);
  canvas.drawFastVLine(x + 16, baseY - 42, 6, COLOR_SPIRE);

  canvas.fillRect(x + 8, baseY - 28, 4, 7, COLOR_WARM_WINDOW);
  canvas.drawPixel(x + 9, baseY - 29, COLOR_WARM_WINDOW);

  // Right Lower Tower (Renaissance Bell Tower, 69m)
  canvas.fillRect(x + 20, baseY - 30, 12, 30, COLOR_SPIRE);
  canvas.fillRect(x + 22, baseY - 38, 8, 8, COLOR_SPIRE);
  canvas.fillRect(x + 24, baseY - 44, 4, 6, COLOR_SPIRE);
  canvas.drawFastVLine(x + 25, baseY - 47, 3, COLOR_GOLD);

  canvas.fillRect(x + 24, baseY - 24, 4, 6, COLOR_WARM_WINDOW);
}

// ============================================================================
// Mode 5: JOLLY SANTA CLAUS EATING COOKIES (Dedicated Close-Up Scene)
// ============================================================================

function drawBigSantaCookieBreak(canvas: M5CanvasSim, nowSec: number, nowMs: number): void {
  // 1. Cozy Fireplace Atmosphere on Left (x = 6..64, y = 32..118, safely below description text)
  canvas.fillRect(4, 32, 60, 5, 0x6180);      // Dark wooden mantel shelf
  canvas.fillRect(6, 37, 56, 81, COLOR_BRICK);
  canvas.fillRect(14, 58, 40, 60, TFT_BLACK); // Hearth opening
  canvas.drawFastHLine(6, 58, 56, TFT_BLACK);

  // --- 1. Wooden Logs & Glowing Charcoal Embers at Hearth Floor (y = 112..118) ---
  // Glowing ember bed
  canvas.fillRect(18, 116, 32, 2, 0x4800);
  for (let ex = 20; ex <= 48; ex += 4) {
    const emberColor = ((Math.floor(nowSec * 8 + ex) % 3) === 0) ? COLOR_AMBER_BRIGHT : COLOR_SANTA_RED;
    canvas.drawPixel(ex, 116, emberColor);
    canvas.drawPixel(ex + 1, 117, 0x99a3);
  }

  // Cross Firewood Logs
  canvas.fillRect(18, 114, 32, 3, 0x4180); // Dark oak log
  canvas.drawFastHLine(20, 114, 28, 0x6200); // Bark highlight
  canvas.drawPixel(18, 115, 0x2940);
  canvas.drawPixel(49, 115, 0x2940);

  // Top angled support logs
  canvas.drawLine(22, 115, 34, 110, 0x51c0);
  canvas.drawLine(23, 115, 35, 110, 0x3140);
  canvas.drawLine(46, 115, 36, 110, 0x51c0);
  canvas.drawLine(45, 115, 35, 110, 0x3140);

  // --- 2. Dancing Fireplace Flame Tongues (Licking, Tapered, Organic Pixel Fire) ---
  const FLAME_TONGUES = [
    { baseCenterX: 28, tipH: 15, speed: 15.0, phase: 0.0, baseW: 5 },
    { baseCenterX: 34, tipH: 24, speed: 18.0, phase: 1.8, baseW: 7 }, // Main center tongue
    { baseCenterX: 40, tipH: 16, speed: 16.0, phase: 3.5, baseW: 5 },
  ];

  for (let i = 0; i < FLAME_TONGUES.length; i++) {
    const t = FLAME_TONGUES[i];
    const flickH = Math.round(t.tipH + Math.sin(nowSec * t.speed + t.phase) * 3);
    const topY = Math.max(68, 113 - flickH);
    const baseY = 113;

    for (let y = baseY; y >= topY; y--) {
      const prog = (baseY - y) / Math.max(1, baseY - topY); // 0 at base, 1 at tip
      const sway = Math.round(Math.sin(nowSec * (t.speed * 0.8) + y * 0.25 + t.phase) * (1.8 * prog));
      const fcx = t.baseCenterX + sway;
      const halfW = Math.max(0, Math.round(t.baseW * (1.0 - prog * 0.95)));

      // Outer crimson flame mantle
      canvas.drawFastHLine(fcx - halfW, y, halfW * 2 + 1, COLOR_SANTA_RED);

      // Warm amber / gold flame interior
      if (halfW >= 1 && prog < 0.85) {
        const midW = Math.max(0, halfW - 1);
        canvas.drawFastHLine(fcx - midW, y, midW * 2 + 1, COLOR_AMBER_BRIGHT);
      }

      // Hot golden-white core near base
      if (halfW >= 2 && prog < 0.55) {
        const coreW = Math.max(0, halfW - 2);
        canvas.drawFastHLine(fcx - coreW, y, coreW * 2 + 1, (y > 108) ? TFT_WHITE : COLOR_GOLD);
      }
    }

    // Flame tip flickering spark
    const tipSway = Math.round(Math.sin(nowSec * t.speed + t.phase) * 2);
    canvas.drawPixel(t.baseCenterX + tipSway, topY - 1, (i === 1) ? COLOR_GOLD : COLOR_AMBER_BRIGHT);
  }

  // --- 3. Rising Fireplace Sparks / Glowing Embers ---
  for (let s = 0; s < 4; s++) {
    const sSpeed = 18 + s * 4;
    const sOffset = Math.floor(nowSec * sSpeed + s * 7) % 35;
    const sy = 100 - sOffset;
    if (sy >= 62 && sy < 100) {
      const sx = 34 + Math.round(Math.sin(nowSec * 5 + s * 2 + sy * 0.15) * (4 + s));
      const sColor = (s % 2 === 0) ? COLOR_GOLD : COLOR_AMBER_BRIGHT;
      canvas.drawPixel(sx, sy, sColor);
    }
  }

  // 2. Right Side: Cozy Wooden Table with Glass of Milk (x = 170..236, y = 70..118)
  canvas.fillRect(170, 92, 66, 6, 0x8280);   // Tabletop
  canvas.fillRect(176, 98, 8, 20, 0x6180);   // Table leg
  canvas.fillRect(224, 98, 8, 20, 0x6180);

  // Tall Glass of Fresh Cold Milk
  canvas.fillRect(182, 68, 14, 24, TFT_WHITE);
  canvas.drawRect(181, 67, 16, 25, 0x9efb);  // Glass outline
  canvas.fillRect(183, 78, 12, 5, COLOR_CYAN_BRIGHT); // Label

  // Red & White Striped Straw
  for (let dy = 0; dy < 16; dy++) {
    const strawColor = (Math.floor(dy / 3) % 2 === 0) ? COLOR_SANTA_RED : TFT_WHITE;
    canvas.drawPixel(190 - Math.floor(dy * 0.25), 66 - dy, strawColor);
    canvas.drawPixel(191 - Math.floor(dy * 0.25), 66 - dy, strawColor);
  }

  // Plate with cookies
  canvas.fillRect(206, 88, 20, 4, TFT_WHITE);
  canvas.fillCircle(212, 85, 4, COLOR_COOKIE_BASE);
  canvas.drawPixel(212, 84, COLOR_COOKIE_CHIP);
  canvas.fillCircle(220, 85, 4, COLOR_COOKIE_BASE);
  canvas.drawPixel(220, 85, COLOR_COOKIE_CHIP);

  // 3. Centerpiece: JOLLY SANTA CLAUS EATING COOKIES (cx = 118, y = 35..118)
  const cx = 118; // Santa horizontal center

  // Santa's Body & Red Velvet Coat (y = 84..118)
  canvas.fillRect(cx - 28, 84, 56, 34, COLOR_SANTA_RED);
  // White fluffy fur trim down center coat
  canvas.fillRect(cx - 4, 84, 8, 34, COLOR_SNOW);
  // Gold Belt Buckle
  canvas.drawFastHLine(cx - 20, 114, 40, TFT_BLACK);
  canvas.drawRect(cx - 5, 111, 10, 7, COLOR_GOLD);

  // Big White Billowing Beard (y = 62..98)
  canvas.fillRect(cx - 20, 64, 40, 24, COLOR_SNOW);
  canvas.fillCircle(cx - 15, 82, 8, COLOR_SNOW);
  canvas.fillCircle(cx + 15, 82, 8, COLOR_SNOW);
  canvas.fillCircle(cx, 86, 10, COLOR_SNOW);
  canvas.drawFastHLine(cx - 12, 76, 24, 0xce79);
  canvas.drawFastHLine(cx - 8, 82, 16, 0xce79);

  // Face (Peach skin tone, y = 48..65)
  canvas.fillRect(cx - 16, 50, 32, 16, COLOR_SANTA_FACE);
  // Rosy Red Cheeks
  canvas.fillCircle(cx - 11, 58, 3, 0xfbe4);
  canvas.fillCircle(cx + 11, 58, 3, 0xfbe4);

  // Round Button Nose
  canvas.fillCircle(cx, 58, 3, 0xf9a0);

  // Happy Twinkling Eyes (^_^)
  canvas.drawFastHLine(cx - 10, 53, 5, TFT_BLACK);
  canvas.drawPixel(cx - 8, 52, TFT_BLACK);
  canvas.drawFastHLine(cx + 6, 53, 5, TFT_BLACK);
  canvas.drawPixel(cx + 8, 52, TFT_BLACK);

  // Bushy Eyebrows
  canvas.fillRect(cx - 11, 50, 6, 2, COLOR_SNOW);
  canvas.fillRect(cx + 5, 50, 6, 2, COLOR_SNOW);

  // Santa's Big Red Hat (y = 35..49, safely below top text)
  canvas.fillRect(cx - 18, 35, 36, 11, COLOR_SANTA_RED);
  canvas.fillRect(cx - 28, 39, 12, 8, COLOR_SANTA_RED);
  canvas.fillRect(cx - 34, 44, 8, 7, COLOR_SANTA_RED);
  canvas.fillCircle(cx - 36, 51, 5, COLOR_SNOW); // Pom-pom
  canvas.fillRect(cx - 20, 45, 40, 5, COLOR_SNOW); // Fur brim

  // Chewing Motion & Mouth
  const isChewing = (Math.floor(nowMs / 250) % 2) === 1;
  if (isChewing) {
    canvas.fillCircle(cx, 63, 3, 0x6000); // Open mouth eating
  } else {
    canvas.drawFastHLine(cx - 4, 63, 8, TFT_BLACK); // Satisfied smile
    canvas.drawPixel(cx - 5, 62, TFT_BLACK);
    canvas.drawPixel(cx + 4, 62, TFT_BLACK);
  }

  // Santa's Hand holding Chocolate Chip Cookie
  canvas.fillRect(cx + 14, 66, 12, 10, COLOR_SANTA_RED);
  canvas.fillRect(cx + 12, 64, 5, 14, COLOR_SNOW); // Fur cuff

  // Cookie in Hand (Diameter 14px)
  canvas.fillCircle(cx + 13, 62, 7, COLOR_COOKIE_BASE);
  canvas.drawPixel(cx + 11, 59, COLOR_COOKIE_CHIP);
  canvas.drawPixel(cx + 15, 60, COLOR_COOKIE_CHIP);
  canvas.drawPixel(cx + 12, 64, COLOR_COOKIE_CHIP);
  canvas.drawPixel(cx + 16, 65, COLOR_COOKIE_CHIP);
  canvas.drawPixel(cx + 13, 62, COLOR_COOKIE_CHIP);

  // Bite mark taken out of cookie
  canvas.fillCircle(cx + 8, 62, 3, COLOR_SANTA_FACE);

  // Floating Crumb Particles dropping from bite
  const crumbOffset = Math.floor((nowSec * 16) % 18);
  canvas.drawPixel(cx + 8, 66 + crumbOffset, COLOR_COOKIE_CHIP);
  canvas.drawPixel(cx + 10, 68 + (crumbOffset % 12), COLOR_COOKIE_BASE);

  // 4. Festive Speech Bubble (x = 162..214, y = 34..48, safely below description text)
  canvas.fillRect(162, 34, 52, 15, TFT_WHITE);
  canvas.drawRect(162, 34, 52, 15, TFT_BLACK);
  canvas.drawPixel(160, 43, TFT_WHITE);
  canvas.drawPixel(161, 43, TFT_WHITE);
  canvas.drawPixel(159, 44, TFT_BLACK);

  canvas.setTextDatum(top_center);
  canvas.setTextSize(1);
  canvas.setTextColor(TFT_BLACK, TFT_WHITE);
  canvas.drawString("MNIAM! *", 188, 38);

  // Festive floating heart / sparkle in gold
  const heartFloat = Math.sin(nowSec * 4.0);
  if (heartFloat > 0) {
    canvas.drawPixel(cx + 22, 42, COLOR_GOLD);
    canvas.drawPixel(cx + 21, 41, COLOR_GOLD);
    canvas.drawPixel(cx + 23, 41, COLOR_GOLD);
    canvas.drawPixel(cx + 22, 43, COLOR_GOLD);
  }
}

// ============================================================================
// Parallax Background: Starfield & Mountains
// ============================================================================

function drawParallaxStars(canvas: M5CanvasSim, nowSec: number): void {
  for (let i = 0; i < 24; i++) {
    const seedX = (i * 37 + 13) % 240;
    const seedY = 16 + ((i * 47) % 64);
    const starX = (seedX - Math.floor(nowSec * 5) + 480) % 240;
    const twinkle = Math.sin(nowSec * 4 + i) > 0.3;
    const color = twinkle ? COLOR_AMBER_BRIGHT : TFT_WHITE;
    canvas.drawPixel(starX, seedY, color);
  }
}

function drawStratosphericStars(canvas: M5CanvasSim, nowSec: number): void {
  // 1. Cosmic Starfield (48 stars across upper stratospheric space)
  for (let i = 0; i < 48; i++) {
    const seedX = (i * 31 + 17) % SCREEN_WIDTH;
    const seedY = 16 + ((i * 43 + 7) % 68);

    // Ensure star is in space above the curved Earth horizon
    const dx = seedX - RADAR_CENTER_X;
    const horizonY = 88 + Math.floor((dx * dx * 18) / 14400);
    if (seedY >= horizonY - 2) continue;

    const speed = (i % 3 === 0) ? 3 : (i % 2 === 0) ? 5 : 8;
    const starX = (((seedX - Math.floor(nowSec * speed)) % SCREEN_WIDTH) + SCREEN_WIDTH) % SCREEN_WIDTH;

    const twinkleVal = Math.sin(nowSec * 5.0 + i * 1.7);
    if (twinkleVal > -0.4) {
      const color = (i % 5 === 0) ? COLOR_CYAN_BRIGHT : (i % 3 === 0) ? COLOR_GOLD : TFT_WHITE;
      canvas.drawPixel(starX, seedY, color);

      // Prominent bright cross stars (when twinkle peaks)
      if (i % 7 === 0 && twinkleVal > 0.6) {
        canvas.drawPixel(starX - 1, seedY, COLOR_CYAN_BRIGHT);
        canvas.drawPixel(starX + 1, seedY, COLOR_CYAN_BRIGHT);
        canvas.drawPixel(starX, seedY - 1, COLOR_CYAN_BRIGHT);
        canvas.drawPixel(starX, seedY + 1, COLOR_CYAN_BRIGHT);
      }
    }
  }

  // 2. Occasional graceful cosmic shooting star streak (every ~4 seconds)
  const meteorCycle = (nowSec * 0.25) % 1.0;
  if (meteorCycle < 0.25) {
    const mProg = meteorCycle / 0.25;
    const mx = Math.floor(200 - mProg * 90);
    const my = Math.floor(18 + mProg * 26);
    canvas.drawLine(mx, my, mx + 7, my - 2, COLOR_CYAN_BRIGHT);
    canvas.drawPixel(mx, my, TFT_WHITE);
  }
}

function drawCurvedEarthGlobe(canvas: M5CanvasSim, nowSec: number): void {
  // 1. Draw Globe Curvature & Glowing Atmosphere Limb
  for (let x = 0; x < SCREEN_WIDTH; x++) {
    const dx = x - 120;
    const horizonY = 88 + Math.floor((dx * dx * 18) / 14400);

    // Glowing atmospheric limb (electric cyan upper glow + softer cyan inner)
    canvas.drawPixel(x, horizonY - 1, COLOR_CYAN_BRIGHT);
    canvas.drawPixel(x, horizonY, COLOR_EARTH_ATMOS);

    // Deep oceanic surface below horizon down to bottom HUD (y=119)
    const oceanH = 119 - horizonY;
    if (oceanH > 0) {
      canvas.drawFastVLine(x, horizonY + 1, oceanH, COLOR_EARTH_OCEAN);
    }
  }

  // 2. Continents Drifting Beneath Santa (Westward scroll as Santa speeds east at M4.8)
  const scrollLon = Math.floor(nowSec * 16) % 360;
  for (let x = 0; x < SCREEN_WIDTH; x++) {
    const dx = x - 120;
    const horizonY = 88 + Math.floor((dx * dx * 18) / 14400);
    const lon = (x + scrollLon) % 360;

    // Continents: 3 distinct nocturnal landmasses
    const isLand =
      (lon >= 25 && lon <= 85) ||
      (lon >= 135 && lon <= 210) ||
      (lon >= 265 && lon <= 325);

    if (isLand) {
      const landTop = horizonY + 3 + ((lon * 7) % 5);
      const landBottom = Math.min(118, horizonY + 18 + ((lon * 11) % 7));
      const landH = landBottom - landTop;
      if (landH > 0) {
        canvas.drawFastVLine(x, landTop, landH, COLOR_EARTH_LAND);

        // Twinkling city lights on sleeping nighttime continents
        const citySeed = (lon * 23 + x * 17) % 29;
        if (citySeed < 3 && landH > 4) {
          const cityY = landTop + 2 + ((citySeed * 5) % Math.max(1, landH - 4));
          const twinkle = Math.sin(nowSec * 6 + citySeed) > 0;
          canvas.drawPixel(x, cityY, twinkle ? COLOR_CITY_LIGHT : COLOR_AMBER_BRIGHT);
        }
      }
    }

    // 3. High-altitude wispy cloud bands
    const cloudLon = (x + Math.floor(nowSec * 22)) % 260;
    if ((cloudLon >= 40 && cloudLon <= 75) || (cloudLon >= 150 && cloudLon <= 190)) {
      const cloudY = horizonY + 2 + ((cloudLon * 3) % 4);
      if (cloudY < 118) {
        canvas.drawPixel(x, cloudY, COLOR_EARTH_CLOUD);
      }
    }
  }
}

// ============================================================================
// Mode 3: Gliding Descent ("Zniżanie") & Christmas Tree Forest
// ============================================================================

function drawFestiveChristmasTree(
  canvas: M5CanvasSim,
  baseX: number,
  baseY: number,
  treeH: number,
  seed: number,
  nowSec: number
): void {
  if (baseX < -15 || baseX > SCREEN_WIDTH + 15) return;

  // 1. Wood Trunk
  const trunkW = treeH > 14 ? 3 : 1;
  const trunkH = Math.max(2, Math.floor(treeH * 0.2));
  canvas.fillRect(baseX - Math.floor(trunkW / 2), baseY - trunkH, trunkW, trunkH, 0x4180);

  // 2. Evergreen Pine Boughs with Snow Rim
  const foliageH = treeH - trunkH;
  const topY = baseY - treeH;
  const numTiers = treeH > 14 ? 3 : 2;
  const tierH = Math.floor(foliageH / numTiers);

  for (let t = 0; t < numTiers; t++) {
    const tierTop = topY + t * (tierH - 1);
    const tierBottom = tierTop + tierH + 1;
    const progress = (t + 1) / numTiers;
    const maxHalfW = Math.max(2, Math.floor(treeH * 0.38 * progress));

    for (let y = tierTop; y <= tierBottom; y++) {
      const rowProgress = (y - tierTop) / (tierBottom - tierTop);
      const halfW = Math.max(1, Math.round(maxHalfW * rowProgress));
      const rowX = baseX - halfW;
      const rowW = halfW * 2 + 1;

      // Dark pine needle row
      canvas.drawFastHLine(rowX, y, rowW, COLOR_PINE_NEEDLE);

      // Snow on tier shoulders
      if (y === tierTop || y === tierTop + 1) {
        canvas.drawPixel(rowX, y, COLOR_SNOW);
        canvas.drawPixel(rowX + rowW - 1, y, COLOR_SNOW);
      }
    }
  }

  // 3. Golden Star on Top
  canvas.drawPixel(baseX, topY, COLOR_GOLD);
  if (treeH > 12) {
    canvas.drawPixel(baseX, topY - 1, COLOR_GOLD);
    canvas.drawPixel(baseX - 1, topY, COLOR_AMBER_BRIGHT);
    canvas.drawPixel(baseX + 1, topY, COLOR_AMBER_BRIGHT);
  }

  // 4. Twinkling Multi-Color Christmas Fairy Lights!
  const LIGHT_COLORS = [
    COLOR_SANTA_RED,
    COLOR_GOLD,
    COLOR_CYAN_BRIGHT,
    COLOR_EMERALD_NEON,
    COLOR_AMBER_BRIGHT,
  ];

  const numLights = treeH > 16 ? 6 : treeH > 10 ? 4 : 2;
  for (let l = 0; l < numLights; l++) {
    const lightSeed = seed * 7 + l * 13;
    const lProg = (l + 0.6) / numLights;
    const ly = Math.round(topY + 3 + lProg * (foliageH - 5));
    const tierSpread = Math.floor(treeH * 0.32 * lProg);
    const side = (l % 2 === 0) ? 1 : -1;
    const lx = baseX + side * Math.max(1, Math.floor(tierSpread * 0.7));

    // Twinkling animation
    const twinkle = Math.sin(nowSec * 7.0 + lightSeed) > -0.2;
    if (twinkle) {
      const color = LIGHT_COLORS[(l + seed) % LIGHT_COLORS.length];
      canvas.drawPixel(lx, ly, color);
    }
  }
}

function drawDescendingWinterLandscape(
  canvas: M5CanvasSim,
  nowSec: number,
  descentP: number
): void {
  // Ground snow blanket rises slightly as altitude decreases
  const groundBaseY = Math.round(118 - descentP * 6);

  // 1. Layer 1: Distant Rolling Snowdrifts with Small Christmas Trees (Slow scroll: v = 10 px/s)
  const distCycleW = 240;
  const distScroll = Math.floor(nowSec * 10) % distCycleW;
  const distTreeH = Math.round(7 + descentP * 4); // 7px -> 11px

  // Draw gentle distant snow ridge (y = 96..118)
  for (let x = 0; x < SCREEN_WIDTH; x += 2) {
    const wx = (x + distScroll) % distCycleW;
    const ridgeY = Math.round(groundBaseY - 14 - Math.sin(wx * 0.04) * 4);
    canvas.drawFastVLine(x, ridgeY, 119 - ridgeY, 0x18c4); // Soft distant snow shadow
    canvas.drawFastVLine(x + 1, ridgeY, 119 - ridgeY, 0x18c4);
    canvas.drawPixel(x, ridgeY, COLOR_SNOW);
    canvas.drawPixel(x + 1, ridgeY, COLOR_SNOW);
  }

  // Small distant Christmas trees on the ridge
  const DIST_TREES = [24, 76, 134, 182, 218];
  for (let cycle = 0; cycle < 2; cycle++) {
    const baseX = cycle * distCycleW - distScroll;
    for (let i = 0; i < DIST_TREES.length; i++) {
      const tx = baseX + DIST_TREES[i];
      if (tx < -15 || tx > SCREEN_WIDTH + 15) continue;
      const wx = DIST_TREES[i] % distCycleW;
      const ridgeY = Math.round(groundBaseY - 14 - Math.sin(wx * 0.04) * 4);
      drawFestiveChristmasTree(canvas, tx, ridgeY, distTreeH, i + 3, nowSec);
    }
  }

  // 2. Layer 2: Foreground Snowy Rolling Hills with BIGGER Christmas Trees (Medium scroll: v = 24 px/s)
  const fgCycleW = 240;
  const fgScroll = Math.floor(nowSec * 24) % fgCycleW;
  // Big trees get noticeably larger as Santa descends!
  const fgTreeH = Math.round(13 + descentP * 11); // 13px -> 24px!

  // Rolling foreground snowdrifts
  for (let x = 0; x < SCREEN_WIDTH; x++) {
    const wx = (x + fgScroll) % fgCycleW;
    const hillY = Math.round(groundBaseY - Math.sin(wx * 0.035) * 5);
    canvas.drawFastVLine(x, hillY, 119 - hillY, 0x2128); // Slate snow underlayer
    canvas.drawPixel(x, hillY, COLOR_SNOW);
    canvas.drawPixel(x, hillY + 1, COLOR_SNOW);
  }

  // Beautiful big Christmas trees in the foreground
  const FG_TREES = [16, 58, 108, 154, 198];
  for (let cycle = 0; cycle < 2; cycle++) {
    const baseX = cycle * fgCycleW - fgScroll;
    for (let i = 0; i < FG_TREES.length; i++) {
      const tx = baseX + FG_TREES[i];
      if (tx < -20 || tx > SCREEN_WIDTH + 20) continue;
      const wx = FG_TREES[i] % fgCycleW;
      const hillY = Math.round(groundBaseY - Math.sin(wx * 0.035) * 5);
      const varH = fgTreeH + ((i % 3) - 1) * 2;
      drawFestiveChristmasTree(canvas, tx, hillY, varH, i, nowSec);
    }
  }

  // 3. Gentle falling snow flurries in the cold night air
  for (let s = 0; s < 14; s++) {
    const sx = (((s * 37 + 13) - Math.floor(nowSec * 18) + 480) % SCREEN_WIDTH);
    const sy = 16 + ((s * 23 + Math.floor(nowSec * 16)) % 90);
    canvas.drawPixel(sx, sy, COLOR_SNOW);
  }
}

import {
  CamSceneMode,
  CamSceneInfo,
  CAM_SCENE_DEFINITIONS,
} from "../telemetry/stage-definitions";

export type { CamSceneMode, CamSceneInfo };
export { CAM_SCENE_DEFINITIONS };

export interface CamRenderOptions {
  forcedMode?: CamSceneMode;
  forcedProgress?: number; // 0..1 progress within that phase
}

// ============================================================================
// SCREEN 3: Side-View Santa Cam (Kamera Mikołaja)
// ============================================================================

export function renderCamScreen(
  canvas: M5CanvasSim,
  state: SimulatorAppState,
  telemetry: TelemetryState,
  nowMs: number,
  options?: CamRenderOptions
): void {
  const totalSimTime = state.cityCount * SEC_PER_CITY;
  const effectiveSimTime =
    state.simTime >= totalSimTime ? totalSimTime - 0.001 : Math.max(0, state.simTime);
  const cityIdx = Math.floor(effectiveSimTime / SEC_PER_CITY);
  const naturalU = Math.max(0, effectiveSimTime - cityIdx * SEC_PER_CITY);
  const nowSec = nowMs / 1000.0;

  // Resolve forced modes if requested for debugging
  let u = naturalU;
  let isFlight = true;
  let isFinale = false;

  if (options?.forcedMode !== undefined) {
    const p = Math.max(0, Math.min(1, options.forcedProgress ?? 0.5));
    switch (options.forcedMode) {
      case 1: // Hyper-Warp (0..4.5s)
        u = p * 4.49;
        isFlight = true;
        isFinale = false;
        break;
      case 2: // Cruising Sky (4.5..12.0s)
        u = 4.5 + p * 7.49;
        isFlight = true;
        isFinale = false;
        break;
      case 3: // Gliding Descent (12.0..15.0s)
        u = 12.0 + p * 2.99;
        isFlight = true;
        isFinale = false;
        break;
      case 4: // Rooftop Chimney Cruise (15.0..21.0s)
        u = 15.0 + p * 5.99;
        isFlight = false;
        isFinale = false;
        break;
      case 5: // Big Santa Cookie Break (21.0..27.0s)
        u = 21.0 + p * 5.99;
        isFlight = false;
        isFinale = false;
        break;
      case 6: // Takeoff Climb (27.0..30.0s)
        u = 27.0 + p * 2.99;
        isFlight = false;
        isFinale = false;
        break;
      case 7: // Kraków Finale Hold
        u = 29.9;
        isFlight = false;
        isFinale = true;
        break;
    }
  } else {
    const metricsNatural = computeSantaMetrics(
      state.activeDay,
      telemetry.safeIdx,
      u,
      nowSec,
      telemetry.nextCityName,
      telemetry.isDay24Finale
    );
    isFlight = metricsNatural.flightPhase !== "DACH" && metricsNatural.flightPhase !== "FINAL";
    isFinale = metricsNatural.flightPhase === "FINAL";
  }

  const metrics = computeSantaMetrics(
    state.activeDay,
    telemetry.safeIdx,
    u,
    nowSec,
    telemetry.nextCityName,
    isFinale
  );

  const flightProgress = u / 15.0;

  // 1. Clear Screen with Deep Night Polar Navy (y = 14..119)
  canvas.fillScreen(COLOR_BG_DARK);
  canvas.fillRect(0, 14, SCREEN_WIDTH, 105, COLOR_SKY_MIDNIGHT);

  // --------------------------------------------------------------------------
  // 2. Viewport Scene Dispatch
  // --------------------------------------------------------------------------

  if (isFinale) {
    // ========================================================================
    // MODE 7: Kraków Grand Finale Hold (Bazylika Mariacka & Fireworks)
    // ========================================================================
    drawParallaxStars(canvas, nowSec * 0.2);
    drawStationarySnowyRooftop(canvas, nowSec * 20);
    drawKrakowBasilica(canvas, 15, 86);

    // Landed Sleigh on Kraków rooftop
    drawSantaSleigh(canvas, 95, 72);
    drawReindeer(canvas, 126, 70, 0, true);
    drawReins(canvas, 95, 72, 126, 70);

    // Multi-color Celebratory Fireworks Bursts
    const fPhase = (nowSec * 1.5) % 2.0;
    if (fPhase < 1.0) {
      const radius = Math.floor(fPhase * 16);
      canvas.drawCircle(80, 40, radius, COLOR_GOLD);
      canvas.drawCircle(170, 35, Math.floor(radius * 0.8), COLOR_CYAN_BRIGHT);
      canvas.drawCircle(125, 28, Math.floor(radius * 0.9), COLOR_SANTA_RED);
    }

    // Celebration Festive Banner
    canvas.setTextDatum(top_center);
    canvas.setTextSize(1);
    canvas.setTextColor(COLOR_AMBER_BRIGHT, COLOR_SKY_MIDNIGHT);
    canvas.drawString("WESOLYCH SWIAT!", RADAR_CENTER_X, 18);

  } else if (isFlight) {
    // ========================================================================
    // IN TRANSIT: HIGH FLIGHT MODES (WARP / CRUISING / DESCENT)
    // ========================================================================

    if (flightProgress < 0.3) {
      // ----------------------------------------------------------------------
      // MODE 1: Hyper-Warp (Speed Streaks & Intense Rudolph Nose Aura)
      // ----------------------------------------------------------------------
      const wrapW = SCREEN_WIDTH + 60;
      for (let i = 0; i < 22; i++) {
        const lineY = 18 + ((i * 29) % 95);
        const lineSpeed = 250 + (i * 35);
        const lineLen = 20 + ((i * 13) % 40);
        const offset = Math.floor(nowSec * lineSpeed) % wrapW;
        const rawX = SCREEN_WIDTH + (i * 47) - offset;
        const lineX = (((rawX % wrapW) + wrapW) % wrapW) - 30;
        const color = (i % 3 === 0) ? COLOR_AMBER_BRIGHT : (i % 2 === 0) ? COLOR_CYAN_BRIGHT : TFT_WHITE;
        canvas.drawFastHLine(lineX, lineY, lineLen, color);
      }

      const shakeY = (Math.floor(nowMs / 40) % 3) - 1;
      const sleighX = 65;
      const sleighY = 52 + shakeY;
      const deerX = 101;
      const deerY = 50 + shakeY;

      drawSleighJetFlames(canvas, sleighX, sleighY, nowMs);
      drawSantaSleigh(canvas, sleighX, sleighY);
      drawReindeer(canvas, deerX, deerY, 0, true);
      drawReins(canvas, sleighX, sleighY, deerX, deerY);

      canvas.setTextDatum(top_center);
      canvas.setTextColor(COLOR_AMBER_BRIGHT, COLOR_SKY_MIDNIGHT);
      canvas.drawString("TRYB HYPER-WARP", RADAR_CENTER_X, 18);

    } else if (flightProgress < 0.8) {
      // ----------------------------------------------------------------------
      // MODE 2: Cruising Sky (Curved Globe, Drifting Continents & Night City Lights)
      // ----------------------------------------------------------------------
      drawStratosphericStars(canvas, nowSec);
      drawCurvedEarthGlobe(canvas, nowSec);

      const bobY = Math.round(Math.sin(nowSec * 3.5) * 4);
      const legFrame = Math.floor(nowMs / 120) % 2;
      const sleighX = 65;
      const sleighY = 48 + bobY;
      const deerX = 101;
      const deerY = 46 + bobY;

      for (let t = 0; t < 5; t++) {
        const trailX = sleighX - 4 - t * 4;
        const trailY = sleighY + 12 + Math.floor(Math.sin(nowSec * 8 + t) * 2);
        canvas.drawPixel(trailX, trailY, COLOR_GOLD);
      }

      drawSantaSleigh(canvas, sleighX, sleighY);
      drawReindeer(canvas, deerX, deerY, legFrame, true);
      drawReins(canvas, sleighX, sleighY, deerX, deerY);

      canvas.setTextDatum(top_center);
      canvas.setTextColor(COLOR_CYAN_BRIGHT, COLOR_SKY_MIDNIGHT);
      canvas.drawString("PRZELOT STRATOSFERYCZNY", RADAR_CENTER_X, 18);

    } else {
      // ----------------------------------------------------------------------
      // MODE 3: Gliding Descent ("Zniżanie") — Floating down from top toward Christmas Trees
      // ----------------------------------------------------------------------
      drawParallaxStars(canvas, nowSec * 0.3);

      const isDebuggerAuto = options?.forcedMode === 3 && options.forcedProgress === undefined;
      const descentP = isDebuggerAuto
        ? ((nowSec * 0.25) % 1.0)
        : Math.max(0, Math.min(1, (flightProgress - 0.8) / 0.2));

      // 1. Winter landscape with trees growing in perspective and twinkling Christmas lights
      drawDescendingWinterLandscape(canvas, nowSec, descentP);

      // 2. Santa floats down from top (sleighY from 22 down to 54)
      const glideY = Math.round(22 + descentP * 32 + Math.sin(nowSec * 3.0) * 1.5);
      const legFrame = Math.floor(nowMs / 140) % 2;
      const sleighX = 60;
      const deerX = 96;

      // Golden stardust floating behind sleigh
      for (let t = 0; t < 5; t++) {
        const trailX = sleighX - 4 - t * 4;
        const trailY = glideY + 12 + Math.floor(Math.sin(nowSec * 8 + t) * 2);
        canvas.drawPixel(trailX, trailY, COLOR_GOLD);
      }

      drawSantaSleigh(canvas, sleighX, glideY);
      drawReindeer(canvas, deerX, glideY - 1, legFrame, true);
      drawReins(canvas, sleighX, glideY, deerX, glideY - 1);

      canvas.setTextDatum(top_center);
      canvas.setTextColor(COLOR_AMBER_BRIGHT, COLOR_SKY_MIDNIGHT);
      canvas.drawString("ZNIZANIE", RADAR_CENTER_X, 18);
    }

  } else {
    // ========================================================================
    // CITY STAY: ROOFTOP CHIMNEY CRUISE & BIG SANTA COOKIE BREAK
    // ========================================================================
    const legFrame = Math.floor(nowMs / 120) % 2;
    const landedU = u - 15.0;
    const citySubPhase = landedU < 6.0 ? 0 : landedU < 12.0 ? 1 : 2; // 0: Drop (0-6s), 1: Cookie (6-12s), 2: Climb (12-15s)

    if (citySubPhase === 0) {
      // ----------------------------------------------------------------------
      // MODE 4: Rooftop Chimney Cruise & Active Gift Drops
      // ----------------------------------------------------------------------
      drawParallaxStars(canvas, nowSec * 0.2);

      for (let s = 0; s < 12; s++) {
        const sx = ((s * 39 + 11) - Math.floor(nowSec * 24) + 480) % SCREEN_WIDTH;
        const sy = 16 + ((s * 19 + Math.floor(nowSec * 20)) % 70);
        canvas.drawPixel(sx, sy, COLOR_SNOW);
      }

      drawScrollingRooftops(canvas, nowSec);

      const bobY = Math.round(Math.sin(nowSec * 3.5) * 3);
      const sleighX = 60;
      const sleighY = 32 + bobY;
      const deerX = 96;
      const deerY = 30 + bobY;

      // Rooftops with active presents dropped straight into passing chimneys
      drawScrollingRooftops(canvas, nowSec, sleighY, true);

      drawSantaSleigh(canvas, sleighX, sleighY);
      drawReindeer(canvas, deerX, deerY, legFrame, true);
      drawReins(canvas, sleighX, sleighY, deerX, deerY);

      canvas.setTextDatum(top_center);
      canvas.setTextColor(COLOR_EMERALD_NEON, COLOR_SKY_MIDNIGHT);
      canvas.drawString("ZRZUT PREZENTOW", RADAR_CENTER_X, 18);

    } else if (citySubPhase === 1) {
      // ----------------------------------------------------------------------
      // MODE 5: Dedicated Scene — BIGGER SIZE SANTA CLAUS EATING COOKIES!
      // ----------------------------------------------------------------------
      drawBigSantaCookieBreak(canvas, nowSec, nowMs);

      canvas.setTextDatum(top_center);
      canvas.setTextColor(COLOR_AMBER_BRIGHT, COLOR_SKY_MIDNIGHT);
      canvas.drawString("PRZERWA NA CIASTKA I MLEKO", RADAR_CENTER_X, 18);

    } else {
      // ----------------------------------------------------------------------
      // MODE 6: Takeoff Climb ("Wznoszenie") — Ascending above Christmas Trees into the stars
      // ----------------------------------------------------------------------
      drawParallaxStars(canvas, nowSec * 0.3);

      const isDebuggerAuto = options?.forcedMode === 6 && options.forcedProgress === undefined;
      const climbP = isDebuggerAuto
        ? ((nowSec * 0.25) % 1.0)
        : Math.max(0, Math.min(1, (u - 27.0) / 3.0));

      // As Santa climbs higher into the sky, trees and ground shrink in perspective (1.0 -> 0.0)
      drawDescendingWinterLandscape(canvas, nowSec, 1.0 - climbP);

      // Santa ascends from lower altitude (y=54) up to the high sky (y=22)
      const climbY = Math.round(54 - climbP * 32 + Math.sin(nowSec * 3.0) * 1.5);
      const legFrame = Math.floor(nowMs / 100) % 2;
      const sleighX = 60;
      const deerX = 96;
      const deerY = climbY - 3;

      // Golden stardust floating behind ascending sleigh
      for (let t = 0; t < 6; t++) {
        const trailX = sleighX - 4 - t * 4;
        const trailY = climbY + 12 + t * 2 + Math.floor(Math.sin(nowSec * 8 + t) * 2);
        canvas.drawPixel(trailX, trailY, COLOR_GOLD);
      }

      // Rudolph glowing nose beacon preparing for warp flight
      const strobe = Math.sin(nowSec * 12.0) > -0.3;

      drawSantaSleigh(canvas, sleighX, climbY);
      drawReindeer(canvas, deerX, deerY, legFrame, strobe);
      drawReins(canvas, sleighX, climbY, deerX, deerY);

      canvas.setTextDatum(top_center);
      canvas.setTextColor(COLOR_CYAN_BRIGHT, COLOR_SKY_MIDNIGHT);
      canvas.drawString("WZNOSZENIE", RADAR_CENTER_X, 18);
    }
  }

  // --------------------------------------------------------------------------
  // 3. Top Header Bar (y: 0..13, 1:1 Parity with Screens 1 & 2)
  // --------------------------------------------------------------------------
  canvas.fillRect(0, 0, SCREEN_WIDTH, 13, COLOR_HEADER_BG);
  canvas.drawFastHLine(0, 13, SCREEN_WIDTH, COLOR_BORDER);

  // Battery Icon + 98%
  drawBatteryIcon(canvas, 4, 3, COLOR_EMERALD_NEON);
  canvas.setTextSize(1);
  canvas.setTextDatum(top_left);
  canvas.setTextColor(TFT_WHITE, COLOR_HEADER_BG);
  canvas.drawString("98%", 18, 3);

  // Active Advent Day Badge
  canvas.setTextDatum(top_right);
  canvas.setTextColor(COLOR_AMBER_BRIGHT, COLOR_HEADER_BG);
  canvas.drawString(`DZIEN ${String(state.activeDay).padStart(2, "0")}`, SCREEN_WIDTH - 4, 3);

  // --------------------------------------------------------------------------
  // 4. Bottom Navigation HUD Bar (y: 120..134, 1:1 Parity with Screens 1 & 2)
  // --------------------------------------------------------------------------
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
