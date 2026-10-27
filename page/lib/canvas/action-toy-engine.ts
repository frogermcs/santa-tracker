// Action Toy Engine (Ported & Enhanced from M5StickC prototype)
// Native ST7789v2 240x135 Landscape Engine with 4-step actions & cookie break

import { ScreenIndex } from "./types";
import {
  renderSharedRadar,
  JOURNEY_CITIES,
  SEC_PER_CITY,
  getJourneyTelemetry,
  RadarWaypoint,
} from "./shared-radar";

const W = 240;
const H = 135;
const FONT = "'Press Start 2P', monospace";

const SLEIGH_SPRITE = [
  "......RRRR..........",
  ".....RRRRRRW........",
  "......RFFWW.........",
  "..GGG.WWWWWW........",
  ".GGGGGRRRRRR....RR..",
  "YRRRRRRRRRRRRRRRRR..",
  ".RRRRRRRRRRRRRRRR...",
  "..YYYYYYYYYYYYYYYYY.",
  "....Y.......Y....Y..",
  "..YYYYYYYYYYYYYYYYYY",
];

const DEER_F1 = [
  ".......YY...",
  "........Y...",
  ".......BBBB.",
  "......BBBBBN",
  ".BBBBBBBB...",
  ".BBBBBBBB...",
  ".B.B..B.B...",
  "B...B..B...B",
];

const DEER_F2 = [
  ".......YY...",
  "........Y...",
  ".......BBBB.",
  "......BBBBBN",
  ".BBBBBBBB...",
  ".BBBBBBBB...",
  "..BB...BB...",
  "...B..B.....",
];

const SANTA_COOKIE_SPRITE = [
  "....RRRRRR......",
  "...RRRRRRRR.....",
  "..WWWWWWWWWW....",
  "..WWFFFFFFWW....",
  "...WFFBBFFW.....",
  "..WWWWWWWWWW....",
  "..RRRRRRRRRR..CC",
  ".RRRRRRRRRRRR.CC",
  ".RRRRRRRRRRRR...",
  "..YYYYYYYYYY....",
  "..RRRRRRRRRR....",
  "...BBBB..BBBB...",
];

const PALETTE: Record<string, string> = {
  R: "#ef4444",
  W: "#ffffff",
  F: "#fdba74",
  G: "#22c55e",
  Y: "#facc15",
  B: "#92400e",
  N: "#ff0000",
  C: "#d97706",
};

export const WAYPOINTS: RadarWaypoint[] = JOURNEY_CITIES;

export interface ActionToyCallbacks {
  onActionChange?: (action: 0 | 1 | 2 | 3) => void;
  onScreenChange?: (screen: ScreenIndex) => void;
}

export class ActionToyEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animId: number | null = null;

  public currentScreen: ScreenIndex = 0;
  public santaAction: 0 | 1 | 2 | 3 = 0;
  public autoCycle = true;
  public speedMultiplier = 1;
  public radarSweep = true;
  public callbacks: ActionToyCallbacks = {};

  public distanceKm = 418920;
  public giftsDelivered = 1842910;
  public customNextStop = "KRAKOW, PL";
  public customCityOverride: string | null = "KRAKOW, PL";

  public currentWaypointIndex = 8;
  public simTime = 8 * SEC_PER_CITY;
  private lastTime = 0;
  private lastActionSwitch = Date.now();
  private frameCount = 0;

  private snowflakes = Array.from({ length: 28 }, () => ({
    x: Math.random() * W,
    y: Math.random() * 115 + 18,
    speed: Math.random() * 1.2 + 0.4,
    size: Math.random() > 0.75 ? 2 : 1,
  }));

  constructor(canvas: HTMLCanvasElement, callbacks?: ActionToyCallbacks) {
    this.canvas = canvas;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not get 2D context");
    this.ctx = context;
    this.ctx.imageSmoothingEnabled = false;
    if (callbacks) this.callbacks = callbacks;
  }

  private drawPixelMatrix(
    matrix: string[],
    startX: number,
    startY: number,
    scale: number
  ) {
    for (let r = 0; r < matrix.length; r++) {
      const row = matrix[r];
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        if (ch !== "." && PALETTE[ch]) {
          this.ctx.fillStyle = PALETTE[ch];
          this.ctx.fillRect(
            Math.floor(startX + c * scale),
            Math.floor(startY + r * scale),
            scale,
            scale
          );
        }
      }
    }
  }

  // SCREEN 1: 4 ACTIONS
  private renderScreen1() {
    // Reset canvas text metrics to prevent shifting
    this.ctx.textBaseline = "alphabetic";
    this.ctx.textAlign = "left";

    if (this.autoCycle && Date.now() - this.lastActionSwitch > 4200) {
      this.santaAction = ((this.santaAction + 1) % 4) as 0 | 1 | 2 | 3;
      this.lastActionSwitch = Date.now();
      this.callbacks.onActionChange?.(this.santaAction);
    }

    // Sky
    this.ctx.fillStyle = this.santaAction === 3 ? "#090d16" : "#0b1528";
    this.ctx.fillRect(0, 0, W, H);

    // Top status header (18px high)
    this.ctx.fillStyle = "#991b1b";
    this.ctx.fillRect(0, 0, W, 18);
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = `8px ${FONT}`;
    this.ctx.textBaseline = "alphabetic";
    this.ctx.textAlign = "left";
    const stepTitles = [
      "1/4 LOT PO NIEBIE",
      "2/4 ZRZUT DO KOMINA",
      "3/4 CIASTKA I MLEKO",
      "4/4 HIPER-PREDKOSC!",
    ];
    this.ctx.fillText(stepTitles[this.santaAction], 6, 13);

    // Step dots
    for (let i = 0; i < 4; i++) {
      this.ctx.fillStyle = i === this.santaAction ? "#facc15" : "#450a0a";
      this.ctx.fillRect(202 + i * 9, 6, 6, 6);
    }

    // Moon
    this.ctx.fillStyle = "#fef08a";
    this.ctx.beginPath();
    this.ctx.arc(205, 42, 12, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = this.santaAction === 3 ? "#090d16" : "#0b1528";
    this.ctx.beginPath();
    this.ctx.arc(200, 39, 10, 0, Math.PI * 2);
    this.ctx.fill();

    // Snowflakes / streaks
    this.snowflakes.forEach((s) => {
      if (this.santaAction === 3) {
        s.x -= s.speed * 6;
        if (s.x < 0) s.x = W;
        this.ctx.fillStyle = "#38bdf8";
        this.ctx.fillRect(s.x, s.y, 14, 1);
      } else {
        s.x -= s.speed * (this.santaAction === 2 ? 0.1 : 1.2);
        s.y += s.speed * 0.4;
        if (s.x < 0) s.x = W;
        if (s.y > 125) s.y = 20;
        this.ctx.fillStyle = "#e2e8f0";
        this.ctx.fillRect(s.x, s.y, s.size, s.size);
      }
    });

    const bobY = Math.round(Math.sin(this.frameCount * 0.12) * 3);
    const deerFrame =
      Math.floor(this.frameCount / 6) % 2 === 0 ? DEER_F1 : DEER_F2;

    if (this.santaAction === 0 || this.santaAction === 3) {
      // 1. Cruising / 4. Hyper-warp
      const shakeX = this.santaAction === 3 ? this.frameCount % 2 : 0;

      // Exhaust sparkles
      for (let i = 0; i < 5; i++) {
        const px = 42 - ((this.frameCount * 3 + i * 11) % 38);
        const py = 68 + bobY + Math.sin(this.frameCount + i) * 4;
        this.ctx.fillStyle = this.santaAction === 3 ? "#38bdf8" : "#facc15";
        this.ctx.fillRect(px, py, 2, 2);
      }

      this.drawPixelMatrix(SLEIGH_SPRITE, 45 + shakeX, 46 + bobY, 3);

      this.ctx.strokeStyle = "#facc15";
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(100 + shakeX, 62 + bobY);
      this.ctx.lineTo(148 + shakeX, 62 - bobY);
      this.ctx.stroke();

      this.drawPixelMatrix(deerFrame, 142 + shakeX, 48 - bobY, 3);

      // Rudolph glowing nose aura
      this.ctx.fillStyle = "rgba(239, 68, 68, 0.45)";
      const noseRadius =
        this.santaAction === 3 ? 8 : 4 + (this.frameCount % 3);
      this.ctx.beginPath();
      this.ctx.arc(177 + shakeX, 59 - bobY, noseRadius, 0, Math.PI * 2);
      this.ctx.fill();

      // Snowy pine trees
      this.ctx.fillStyle = "#f8fafc";
      this.ctx.fillRect(0, 118, W, 17);
      for (let t = 0; t < 8; t++) {
        const tx =
          W -
          ((this.frameCount * (this.santaAction === 3 ? 6 : 1.5) + t * 35) %
            260);
        this.ctx.fillStyle = "#14532d";
        this.ctx.beginPath();
        this.ctx.moveTo(tx, 102);
        this.ctx.lineTo(tx - 8, 118);
        this.ctx.lineTo(tx + 8, 118);
        this.ctx.fill();
      }
    } else if (this.santaAction === 1) {
      // 2. Chimney Drop
      this.drawPixelMatrix(SLEIGH_SPRITE, 52, 26 + bobY, 2);
      this.drawPixelMatrix(deerFrame, 110, 28 - bobY, 2);

      // Rooftops
      for (let h = 0; h < 4; h++) {
        const hx = W - ((this.frameCount * 2 + h * 70) % 280);
        this.ctx.fillStyle = "#334155";
        this.ctx.fillRect(hx, 106, 52, 29);
        this.ctx.fillStyle = "#f8fafc";
        this.ctx.fillRect(hx - 2, 104, 56, 4);
        this.ctx.fillStyle = "#b91c1c";
        this.ctx.fillRect(hx + 30, 88, 14, 18);
        this.ctx.fillStyle = "#f8fafc";
        this.ctx.fillRect(hx + 28, 86, 18, 3);
        this.ctx.fillStyle = "#facc15";
        this.ctx.fillRect(hx + 10, 114, 10, 10);
      }

      // Parachuting gift
      const giftY = 48 + ((this.frameCount * 1.8) % 52);
      const giftX = 76 + Math.sin(this.frameCount * 0.15) * 4;
      this.ctx.fillStyle = "#f8fafc";
      this.ctx.fillRect(giftX - 2, giftY - 10, 12, 4);
      this.ctx.strokeStyle = "#94a3b8";
      this.ctx.beginPath();
      this.ctx.moveTo(giftX - 1, giftY - 6);
      this.ctx.lineTo(giftX + 2, giftY);
      this.ctx.moveTo(giftX + 9, giftY - 6);
      this.ctx.lineTo(giftX + 6, giftY);
      this.ctx.stroke();

      this.ctx.fillStyle = "#22c55e";
      this.ctx.fillRect(giftX, giftY, 8, 8);
      this.ctx.fillStyle = "#ef4444";
      this.ctx.fillRect(giftX + 3, giftY, 2, 8);
      this.ctx.fillRect(giftX, giftY + 3, 8, 2);
    } else if (this.santaAction === 2) {
      // 3. Cookie Break
      this.ctx.fillStyle = "#451a03";
      this.ctx.fillRect(0, 112, W, 23);

      const chewOffset = (Math.floor(this.frameCount / 8) % 2) * 2;
      this.drawPixelMatrix(
        SANTA_COOKIE_SPRITE,
        52,
        58 + chewOffset,
        4
      );

      // Table & milk & cookie
      this.ctx.fillStyle = "#78350f";
      this.ctx.fillRect(136, 90, 44, 6);
      this.ctx.fillRect(142, 96, 6, 18);
      this.ctx.fillRect(168, 96, 6, 18);

      this.ctx.fillStyle = "#e2e8f0";
      this.ctx.fillRect(140, 87, 18, 3);
      this.ctx.fillStyle = "#d97706";
      this.ctx.fillRect(143, 83, 6, 4);
      this.ctx.fillRect(150, 84, 5, 3);

      this.ctx.fillStyle = "#bae6fd";
      this.ctx.fillRect(164, 76, 10, 14);
      this.ctx.fillStyle = "#ffffff";
      this.ctx.fillRect(165, 80, 8, 9);

      const floatY = this.frameCount % 30;
      this.ctx.fillStyle = "#facc15";
      this.ctx.font = `8px ${FONT}`;
      this.ctx.textBaseline = "alphabetic";
      this.ctx.textAlign = "left";
      this.ctx.fillText("MNIAM MNIAM!", 116, 52 - floatY * 0.4);
    }

    // Bottom instruction bar
    this.ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    this.ctx.fillRect(0, 122, W, 13);
    this.ctx.fillStyle = "#94a3b8";
    this.ctx.font = `7px ${FONT}`;
    this.ctx.textBaseline = "alphabetic";
    this.ctx.textAlign = "left";
    this.ctx.fillText("A: EKRANY   B: AKCJA MIKOLAJA", 6, 131);
  }

  // SCREEN 2: DASHBOARD
  private renderScreen2() {
    this.ctx.textBaseline = "alphabetic";
    this.ctx.textAlign = "left";

    this.ctx.fillStyle = "#090d16";
    this.ctx.fillRect(0, 0, W, H);

    // Top Header (19px)
    this.ctx.fillStyle = "#15803d";
    this.ctx.fillRect(0, 0, W, 19);
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = `8px ${FONT}`;
    this.ctx.textBaseline = "alphabetic";
    this.ctx.textAlign = "left";
    this.ctx.fillText("PULPIT MIKOLAJA", 8, 13);

    // Blinking LIVE
    if (Math.floor(this.frameCount / 15) % 2 === 0) {
      this.ctx.fillStyle = "#ef4444";
      this.ctx.fillRect(174, 4, 60, 11);
      this.ctx.fillStyle = "#ffffff";
      this.ctx.font = `7px ${FONT}`;
      this.ctx.textBaseline = "alphabetic";
      this.ctx.textAlign = "left";
      this.ctx.fillText("NA ZYWO", 179, 13);
    }

    // Card 1: Distance
    this.ctx.fillStyle = "#1e293b";
    this.ctx.fillRect(6, 24, 110, 44);
    this.ctx.strokeStyle = "#334155";
    this.ctx.strokeRect(6, 24, 110, 44);
    this.ctx.fillStyle = "#94a3b8";
    this.ctx.font = `7px ${FONT}`;
    this.ctx.textBaseline = "alphabetic";
    this.ctx.textAlign = "left";
    this.ctx.fillText("DYSTANS KM", 12, 36);
    this.ctx.fillStyle = "#facc15";
    this.ctx.font = `10px ${FONT}`;
    this.ctx.fillText(this.distanceKm.toLocaleString(), 12, 56);

    // Card 2: Mach
    this.ctx.fillStyle = "#1e293b";
    this.ctx.fillRect(122, 24, 112, 44);
    this.ctx.strokeStyle = "#334155";
    this.ctx.strokeRect(122, 24, 112, 44);
    this.ctx.fillStyle = "#94a3b8";
    this.ctx.font = `7px ${FONT}`;
    this.ctx.textBaseline = "alphabetic";
    this.ctx.textAlign = "left";
    this.ctx.fillText("PREDKOSC SAN", 128, 36);
    this.ctx.fillStyle = "#38bdf8";
    this.ctx.font = `10px ${FONT}`;
    const mach = (
      4.2 +
      this.speedMultiplier * 0.4 +
      Math.sin(this.frameCount * 0.2) * 0.1
    ).toFixed(1);
    this.ctx.fillText("M " + mach, 128, 56);

    // Card 3: Gifts
    this.ctx.fillStyle = "#1e293b";
    this.ctx.fillRect(6, 73, 228, 30);
    this.ctx.strokeStyle = "#334155";
    this.ctx.strokeRect(6, 73, 228, 30);
    this.ctx.fillStyle = "#4ade80";
    this.ctx.font = `7px ${FONT}`;
    this.ctx.textBaseline = "alphabetic";
    this.ctx.textAlign = "left";
    this.ctx.fillText("PREZENTY:", 12, 92);
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = `11px ${FONT}`;
    this.ctx.fillText(this.giftsDelivered.toLocaleString(), 84, 93);

    // Card 4: Next Stop
    this.ctx.fillStyle = "#7f1d1d";
    this.ctx.fillRect(6, 108, 228, 22);
    this.ctx.strokeStyle = "#ef4444";
    this.ctx.strokeRect(6, 108, 228, 22);
    this.ctx.fillStyle = "#fca5a5";
    this.ctx.font = `7px ${FONT}`;
    this.ctx.textBaseline = "alphabetic";
    this.ctx.textAlign = "left";
    this.ctx.fillText("CEL:", 12, 123);
    this.ctx.fillStyle = "#fef08a";
    this.ctx.font = `8px ${FONT}`;
    const tele = getJourneyTelemetry(this.simTime, this.customCityOverride);
    this.ctx.fillText(this.customNextStop || tele.nextCity, 48, 123);
  }

  // SCREEN 3: RADAR (Identical to Journey Engine, smooth & authentic)
  private renderScreen3() {
    const tele = getJourneyTelemetry(this.simTime, this.customCityOverride);
    this.currentWaypointIndex = tele.cityIdx;
    const nextCityName = this.customNextStop || tele.nextCity;

    renderSharedRadar(
      this.ctx,
      this.simTime,
      JOURNEY_CITIES,
      tele.cityIdx,
      tele.lon,
      tele.lat,
      nextCityName,
      tele.etaSeconds,
      tele.isFlightPhase
    );
  }

  public setScreen(idx: ScreenIndex) {
    this.currentScreen = (idx + 3) % 3 as ScreenIndex;
    this.callbacks.onScreenChange?.(this.currentScreen);
  }

  public nextScreen() {
    this.setScreen(((this.currentScreen + 1) % 3) as ScreenIndex);
  }

  public setSantaAction(action: 0 | 1 | 2 | 3) {
    this.santaAction = action;
    this.lastActionSwitch = Date.now();
    this.callbacks.onActionChange?.(action);
  }

  public cycleSantaAction() {
    this.setSantaAction(((this.santaAction + 1) % 4) as 0 | 1 | 2 | 3);
  }

  public boostGifts(amount = 25000) {
    this.giftsDelivered += amount;
  }

  public advanceWaypoint() {
    const tele = getJourneyTelemetry(this.simTime, this.customCityOverride);
    const N = JOURNEY_CITIES.length;
    this.simTime = ((tele.cityIdx + 1) % N) * SEC_PER_CITY;
  }

  public setCustomCity(city: string) {
    this.customNextStop = city.toUpperCase();
    this.customCityOverride = city.toUpperCase();
  }

  public start() {
    const loop = (now: number) => {
      this.animId = requestAnimationFrame(loop);
      this.frameCount++;

      const dt = this.lastTime === 0 ? 0.016 : Math.max(0, Math.min((now - this.lastTime) / 1000, 0.1));
      this.lastTime = now;
      this.simTime += dt * this.speedMultiplier;

      if (this.frameCount % 4 === 0) {
        this.distanceKm += Math.floor(Math.random() * 4 * this.speedMultiplier) + 1;
        this.giftsDelivered += Math.floor(Math.random() * 85 * this.speedMultiplier) + 12;
      }

      try {
        if (this.currentScreen === 0) {
          this.renderScreen1();
        } else if (this.currentScreen === 1) {
          this.renderScreen2();
        } else {
          this.renderScreen3();
        }
      } catch (err) {
        console.error("ActionToyEngine render error:", err);
      }
    };

    this.animId = requestAnimationFrame(loop);
  }

  public stop() {
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  public destroy() {
    this.stop();
  }
}
