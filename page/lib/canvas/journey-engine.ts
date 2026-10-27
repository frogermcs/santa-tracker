// Journey & Story Tracker Engine (15-City sequenced global flight)
// Native ST7789v2 240x135 Landscape Engine

import { CityWaypoint, ScreenIndex } from "./types";
import { renderSharedRadar } from "./shared-radar";

export const JOURNEY_CITIES: CityWaypoint[] = [
  { name: "AUCKLAND", lon: 174.8, lat: -36.8 },
  { name: "SYDNEY", lon: 151.2, lat: -33.9 },
  { name: "TOKYO", lon: 139.7, lat: 35.7 },
  { name: "BEIJING", lon: 116.4, lat: 39.9 },
  { name: "DELHI", lon: 77.2, lat: 28.6 },
  { name: "DUBAI", lon: 55.3, lat: 25.2 },
  { name: "NAIROBI", lon: 36.8, lat: -1.3 },
  { name: "CAIRO", lon: 31.2, lat: 30.0 },
  { name: "KRAKOW", lon: 19.9, lat: 50.1 },
  { name: "LONDON", lon: -0.1, lat: 51.5 },
  { name: "RIO", lon: -43.2, lat: -22.9 },
  { name: "NEW YORK", lon: -74.0, lat: 40.7 },
  { name: "MEXICO CITY", lon: -99.1, lat: 19.4 },
  { name: "LOS ANGELES", lon: -118.2, lat: 34.0 },
  { name: "HONOLULU", lon: -157.8, lat: 21.3 },
];

const W = 240;
const H = 135;
const SEC_PER_CITY = 16;
const FONT = "'Press Start 2P', monospace";

const PALETTE: Record<string, string> = {
  R: "#d62b2b",
  W: "#ffffff",
  S: "#f2b98b",
  K: "#1a1a1a",
  Y: "#ffd54a",
};

const SANTA_MATRIX = [
  "..RRRR.....",
  ".RRRRRR....",
  "WRRRRRRR...",
  ".WWWWWWW...",
  ".WWSSSS....",
  ".WWSKSS....",
  ".WWWSSS....",
  ".WWWWW.....",
  "..RRRRR....",
  ".RRRRRRR...",
  ".RYKKKYR...",
  ".RRRRRRR...",
  "..RRRRR....",
  "..KK.KK....",
  ".KKK.KKK...",
];

export interface JourneyCallbacks {
  onCityChange?: (cityName: string) => void;
  onScreenChange?: (screenIdx: ScreenIndex) => void;
}

export class JourneyEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animId: number | null = null;
  private lastTime = 0;
  private simTime = 0;
  private autoAcc = 0;
  private lastReportedCity = -1;

  public currentScreen: ScreenIndex = 0;
  public autoCycle = false;
  public speed = 1;
  public customCityOverride: string | null = null;
  public callbacks: JourneyCallbacks = {};

  private cumDistance: number[] = [];

  constructor(canvas: HTMLCanvasElement, callbacks?: JourneyCallbacks) {
    this.canvas = canvas;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not get 2D context");
    this.ctx = context;
    this.ctx.imageSmoothingEnabled = false;
    if (callbacks) this.callbacks = callbacks;

    this.initMath();
  }

  private initMath() {
    const haversine = (a: CityWaypoint, b: CityWaypoint) => {
      const r = Math.PI / 180;
      const dl = (b.lon - a.lon) * r;
      const dp = (b.lat - a.lat) * r;
      const q =
        Math.sin(dp / 2) ** 2 +
        Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dl / 2) ** 2;
      return 12742 * Math.asin(Math.sqrt(q));
    };

    this.cumDistance = [0];
    for (let i = 1; i < JOURNEY_CITIES.length; i++) {
      this.cumDistance[i] =
        this.cumDistance[i - 1] + haversine(JOURNEY_CITIES[i - 1], JOURNEY_CITIES[i]);
    }
  }

  private project(lon: number, lat: number): [number, number] {
    return [((lon + 180) / 360) * W, 12 + ((80 - lat) / 138) * 108];
  }

  private ease(q: number) {
    return q < 0.5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2;
  }

  private clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
  }

  private rect(color: string, x: number, y: number, w: number, h: number) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }

  private text(
    str: string,
    x: number,
    y: number,
    color = "#fff",
    size = 8,
    align: CanvasTextAlign = "left"
  ) {
    this.ctx.font = `${size}px ${FONT}`;
    this.ctx.textBaseline = "top";
    this.ctx.textAlign = align;
    this.ctx.fillStyle = color;
    this.ctx.fillText(str, Math.round(x), Math.round(y));
  }

  private drawSprite(
    matrix: string[],
    x: number,
    y: number,
    scale: number,
    flip: boolean,
    maxRows = 99
  ) {
    const limit = Math.min(matrix.length, maxRows);
    for (let r = 0; r < limit; r++) {
      for (let c = 0; c < 11; c++) {
        const char = matrix[r][c];
        if (char === "." || !PALETTE[char]) continue;
        this.rect(
          PALETTE[char],
          x + (flip ? 10 - c : c) * scale,
          y + r * scale,
          scale,
          scale
        );
      }
    }
  }

  private drawReindeer(x: number, y: number, frame: number, nose = false) {
    this.rect("#8a5a2b", x, y - 12, 18, 8);
    this.rect("#6b4420", x + 1, y - 4, 2, 3 + frame);
    this.rect("#6b4420", x + 5, y - 4, 2, 4 - frame);
    this.rect("#6b4420", x + 12, y - 4, 2, 4 - frame);
    this.rect("#6b4420", x + 15, y - 4, 2, 3 + frame);
    this.rect("#8a5a2b", x + 15, y - 19, 6, 8);
    this.rect("#8a5a2b", x + 20, y - 17, 4, 4);
    this.rect("#e8dcc0", x + 15, y - 24, 1, 6);
    this.rect("#e8dcc0", x + 18, y - 26, 1, 8);
    this.rect("#e8dcc0", x + 16, y - 25, 3, 1);
    this.rect("#fff", x - 2, y - 12, 3, 3);
    this.rect("#000", x + 19, y - 17, 1, 1);
    this.rect(nose ? "#ff2a2a" : "#2a1a10", x + 23, y - 17, 2, 2);
  }

  private drawSleigh(gx: number, y: number, hasSanta: boolean, time: number, isFlying: boolean) {
    this.rect("#6b4a26", gx + 36, y - 9, 60, 1);
    const f = isFlying ? Math.floor(time * 6) % 2 : 0;
    this.drawReindeer(gx + 42, y, f, false);
    this.drawReindeer(gx + 68, y, 1 - f, true);

    this.rect("#8a5a2b", gx - 3, y - 26, 10, 9);
    this.rect("#c9a15b", gx + 1, y - 28, 3, 3);
    this.rect("#d4a017", gx, y - 2, 36, 2);
    this.rect("#d4a017", gx + 34, y - 6, 3, 5);
    this.rect("#b3202a", gx + 3, y - 12, 30, 10);
    this.rect("#b3202a", gx, y - 20, 7, 18);
    this.rect("#e8b923", gx + 3, y - 6, 30, 2);

    if (hasSanta) {
      this.drawSprite(SANTA_MATRIX, gx + 12, y - 32, 2, false, 10);
    }
  }

  private drawGiftBox(x: number, y: number) {
    this.rect("#e23b3b", x, y + 3, 12, 9);
    this.rect("#ffd54a", x + 5, y + 3, 2, 9);
    this.rect("#ffd54a", x, y + 6, 12, 2);
    this.rect("#e23b3b", x + 2, y, 3, 3);
    this.rect("#e23b3b", x + 7, y, 3, 3);
  }

  private drawIndicators(screenIdx: number, y: number) {
    for (let i = 0; i < 3; i++) {
      this.rect(i === screenIdx ? "#fff" : "#5a6aa0", W - 28 + i * 8, y, 5, 5);
    }
  }

  private getTelemetry(cityIdx: number, u: number) {
    const N = JOURNEY_CITIES.length;
    const safeIdx = Math.min(N - 1, Math.max(0, cityIdx));
    const prev = JOURNEY_CITIES[Math.max(safeIdx - 1, 0)];
    const curr = JOURNEY_CITIES[safeIdx];
    const p = u < 6 ? this.ease(u / 6) : 1;
    const k0 = safeIdx ? this.cumDistance[safeIdx - 1] : 0;

    let nextCityName = u < 6 ? curr.name : safeIdx < N - 1 ? JOURNEY_CITIES[safeIdx + 1].name : "NORTH POLE";
    if (this.customCityOverride && safeIdx === 8) {
      nextCityName = this.customCityOverride;
    }

    return {
      lon: prev.lon + (curr.lon - prev.lon) * p,
      lat: prev.lat + (curr.lat - prev.lat) * p,
      p,
      km: Math.round(k0 + (this.cumDistance[safeIdx] - k0) * p),
      gifts: Math.round((safeIdx + this.clamp((u - 6) / 8, 0, 1)) * 8450) * 1000,
      nextCity: nextCityName,
      etaSeconds: Math.ceil(u < 6 ? 6 - u : SEC_PER_CITY - u + 6),
      progressPercent: (safeIdx + u / SEC_PER_CITY) / N,
    };
  }

  // SCREEN 1: SANTA CAM (Night sky, rooftop, chimney descent, gift popping)
  private renderScreen1(t: number, cityIdx: number, u: number) {
    const safeIdx = Math.min(JOURNEY_CITIES.length - 1, Math.max(0, cityIdx));
    const city = JOURNEY_CITIES[safeIdx]?.name || "NORTH POLE";

    // Sky
    this.rect("#070b26", 0, 0, W, 50);
    this.rect("#0d1440", 0, 50, W, 45);
    this.rect("#16205a", 0, 95, W, 40);

    // Stars
    for (let i = 0; i < 30; i++) {
      this.rect(
        Math.sin(t * 2 + i) > 0.3 ? "#fff" : "#8a96d6",
        (i * 67) % 240,
        ((i * 29) % 70) + 14,
        i % 5 ? 1 : 2,
        i % 5 ? 1 : 2
      );
    }

    // Moon
    this.rect("#ffe9a8", 204, 14, 12, 12);
    this.rect("#070b26", 209, 12, 10, 10);

    // Buildings & Windows
    this.rect("#2a2140", 0, 103, W, 32);
    [
      [16, 110],
      [150, 110],
      [196, 110],
    ].forEach(([wx, wy]) => {
      this.rect("#ffd54a", wx, wy, 14, 14);
      this.rect("#2a2140", wx + 6, wy, 2, 14);
      this.rect("#2a2140", wx, wy + 6, 14, 2);
    });

    // Rooftop
    this.rect("#7a2b36", 0, 97, W, 6);
    this.rect("#eef4ff", 0, 92, W, 5);

    // Chimney
    this.rect("#8a3b2e", 62, 62, 26, 30);
    for (let i = 0; i < 6; i++) {
      this.rect("#6b2c22", 62, 66 + i * 5, 26, 1);
    }
    this.rect("#eef4ff", 60, 56, 30, 2);
    this.rect("#5a2a22", 60, 58, 30, 4);

    // Sleigh Motion
    let gx: number, gy: number;
    if (u < 6) {
      const p = this.ease(u / 6);
      gx = -100 + 160 * p;
      gy = 56 + Math.sin(t * 3) * 3;
    } else if (u < 8) {
      const p = this.ease((u - 6) / 2);
      gx = 60 + 80 * p;
      gy = 56 + 36 * p;
    } else {
      gx = 140;
      gy = 92;
    }

    const hasSantaInSleigh = u < 8 || u >= 15.5;
    this.drawSleigh(gx, gy, hasSantaInSleigh, t, u < 8);

    // Santa outside sleigh climbing into/out of chimney
    if (!hasSantaInSleigh) {
      const RIM = 56;
      let sx = 63,
        sb = 92,
        flip = false,
        clip = false,
        visible = true;

      if (u < 9.5) {
        sx = 150 - (58 * (u - 8)) / 1.5;
        sb = 92 - Math.abs(Math.sin(t * 10)) * 2;
        flip = true;
      } else if (u < 10.3) {
        const q = (u - 9.5) / 0.8;
        sx = 92 - 29 * q;
        sb = 92 - 36 * q - Math.sin(Math.PI * q) * 14;
        flip = true;
      } else if (u < 11.3) {
        sx = 63;
        sb = RIM + 34 * (u - 10.3);
        flip = true;
        clip = true;
      } else if (u < 12) {
        visible = false;
      } else if (u < 13) {
        sx = 63;
        sb = RIM + 34 - 34 * (u - 12);
        clip = true;
      } else if (u < 13.8) {
        const q = (u - 13) / 0.8;
        sx = 63 + 29 * q;
        sb = RIM + 36 * q - Math.sin(Math.PI * q) * 14;
      } else {
        sx = 92 + (58 * (u - 13.8)) / 1.7;
        sb = 92 - Math.abs(Math.sin(t * 10)) * 2;
      }

      if (visible) {
        this.ctx.save();
        if (clip) {
          this.ctx.beginPath();
          this.ctx.rect(0, 0, W, RIM);
          this.ctx.clip();
        }
        this.drawSprite(SANTA_MATRIX, sx, sb - 30, 2, flip);
        this.ctx.restore();
      }
    }

    // Gift delivered popup "+1"
    if (u >= 12.5 && u < 15.5) {
      const q = (u - 12.5) / 3;
      const yy = 50 - q * 26;
      this.ctx.globalAlpha = 1 - q * q;
      this.drawGiftBox(68, yy);
      this.text("+1", 84, yy + 2, "#ffd54a");
      this.rect("#fff", 64, yy - 3, 2, 2);
      this.rect("#fff", 84, yy + 12, 2, 2);
      this.ctx.globalAlpha = 1;
    }

    // Parallax snowflakes
    for (let i = 0; i < 22; i++) {
      const s = i % 4 ? 1 : 2;
      this.rect(
        "#fff",
        (((i * 53) % 240) + Math.sin(t + i) * 4 + 240) % 240,
        (((i * 37) % 135) + t * (14 + (i % 3) * 8)) % 135,
        s,
        s
      );
    }

    // Status bar header
    this.rect("rgba(0,0,0,.55)", 0, 0, W, 12);
    this.rect(Math.floor(t * 2) % 2 ? "#ff3b3b" : "#7a1f1f", 4, 3, 5, 5);
    this.text("NA ZYWO", 14, 2, "#ffd54a");
    this.drawIndicators(0, 3);

    // Bottom Subtitle Banner
    const label =
      u < 6
        ? `LOT DO: ${city}`
        : u < 8
        ? `LADOWANIE W: ${city}`
        : u < 12
        ? "W DOL KOMINA!"
        : "PREZENT DLA DZIECI!";
    this.rect("rgba(0,0,0,.6)", 0, 120, W, 15);
    this.text(label, W / 2, 124, "#fff", 8, "center");

    // Fade in/out at city transitions
    const f = u < 0.6 ? 1 - u / 0.6 : u > 15.4 ? (u - 15.4) / 0.6 : 0;
    if (f > 0) {
      this.ctx.globalAlpha = f;
      this.rect("#000", 0, 0, W, H);
      this.ctx.globalAlpha = 1;
    }
  }

  // SCREEN 2: DASHBOARD
  private renderScreen2(t: number, cityIdx: number, u: number) {
    const tele = this.getTelemetry(cityIdx, u);
    this.rect("#0b1030", 0, 0, W, H);
    for (let i = 0; i < 24; i++) {
      this.rect("#2a3a7a", (i * 47) % 240, (i * 31) % 135, 1, 1);
    }

    // Header
    this.rect("#c0262d", 0, 0, W, 16);
    this.rect("#fff", 0, 16, W, 2);
    this.text("PULPIT MIKOLAJA", W / 2, 4, "#fff", 8, "center");
    this.drawIndicators(1, 5);

    // Icons
    const drawStar = (a: number, b: number) => {
      this.rect("#ffd54a", a - 1, b - 4, 3, 9);
      this.rect("#ffd54a", a - 4, b - 1, 9, 3);
    };
    const drawGift = (a: number, b: number) => {
      this.rect("#e23b3b", a - 4, b - 2, 9, 7);
      this.rect("#ffd54a", a - 1, b - 2, 3, 7);
      this.rect("#ffd54a", a - 4, b, 9, 1);
      this.rect("#e23b3b", a - 3, b - 4, 3, 2);
      this.rect("#e23b3b", a + 1, b - 4, 3, 2);
    };
    const drawPin = (a: number, b: number) => {
      this.rect("#ff3b3b", a - 3, b - 5, 7, 7);
      this.rect("#ff3b3b", a - 1, b + 2, 3, 3);
      this.rect("#fff", a - 1, b - 3, 3, 3);
    };

    const row = (
      y: number,
      icon: (x: number, y: number) => void,
      lbl: string,
      val: string,
      col: string
    ) => {
      icon(12, y + 11);
      this.text(lbl, 26, y, "#8fd3ff");
      this.text(val, 26, y + 10, col, 16);
    };

    row(23, drawStar, "DYSTANS KM", tele.km.toLocaleString("en-US"), "#ffd54a");
    row(53, drawGift, "PREZENTY", tele.gifts.toLocaleString("en-US"), "#7dff9b");
    row(83, drawPin, "KOLEJNY CEL", tele.nextCity, "#ff8f8f");

    // Progress bar
    this.rect("#1a2260", 8, 113, 224, 6);
    this.rect("#ffd54a", 8, 113, Math.round(224 * tele.progressPercent), 6);
    this.rect("#ff3b3b", 8 + 224 * tele.progressPercent - 2, 111, 4, 10);

    this.text("CZAS 0:" + String(tele.etaSeconds).padStart(2, "0"), 8, 123, "#fff");
    this.text(
      `${cityIdx + 1}/${JOURNEY_CITIES.length} MIAST`,
      W - 8,
      123,
      "#fff",
      8,
      "right"
    );
  }

  // SCREEN 3: WORLD RADAR (Retro Aviation Radar from Prototype 1)
  private renderScreen3(t: number, cityIdx: number, u: number) {
    const tele = this.getTelemetry(cityIdx, u);
    renderSharedRadar(
      this.ctx,
      t,
      JOURNEY_CITIES,
      cityIdx,
      tele.lon,
      tele.lat,
      tele.nextCity,
      tele.etaSeconds,
      u < 6
    );
  }

  public setScreen(idx: ScreenIndex) {
    this.currentScreen = (idx + 3) % 3 as ScreenIndex;
    this.autoAcc = 0;
  }

  public nextScreen() {
    this.setScreen(((this.currentScreen + 1) % 3) as ScreenIndex);
    this.callbacks.onScreenChange?.(this.currentScreen);
  }

  public prevScreen() {
    this.setScreen(((this.currentScreen + 2) % 3) as ScreenIndex);
    this.callbacks.onScreenChange?.(this.currentScreen);
  }

  public skipToNextCity() {
    const totalSim = JOURNEY_CITIES.length * SEC_PER_CITY;
    const currentSim = ((this.simTime % totalSim) + totalSim) % totalSim;
    const currentCity = Math.floor(currentSim / SEC_PER_CITY);
    const nextCity = (currentCity + 1) % JOURNEY_CITIES.length;
    this.simTime = nextCity * SEC_PER_CITY;
    this.callbacks.onCityChange?.(JOURNEY_CITIES[nextCity].name);
  }

  public start() {
    this.lastTime = performance.now();
    const loop = (now: number) => {
      // Ensure rAF is scheduled continuously
      this.animId = requestAnimationFrame(loop);

      const dt = Math.max(0, Math.min(0.1, (now - this.lastTime) / 1000));
      this.lastTime = now;
      this.simTime += dt * Math.max(1, this.speed);

      if (this.autoCycle) {
        this.autoAcc += dt;
        if (this.autoAcc > 6) {
          this.autoAcc = 0;
          this.nextScreen();
        }
      }

      const totalSim = JOURNEY_CITIES.length * SEC_PER_CITY;
      const tt = ((this.simTime % totalSim) + totalSim) % totalSim;
      const cityIdx = Math.min(JOURNEY_CITIES.length - 1, Math.max(0, Math.floor(tt / SEC_PER_CITY)));
      const u = Math.min(SEC_PER_CITY, Math.max(0, tt - cityIdx * SEC_PER_CITY));

      if (cityIdx !== this.lastReportedCity) {
        this.lastReportedCity = cityIdx;
        this.callbacks.onCityChange?.(JOURNEY_CITIES[cityIdx].name);
      }

      try {
        if (this.currentScreen === 0) {
          this.renderScreen1(now / 1000, cityIdx, u);
        } else if (this.currentScreen === 1) {
          this.renderScreen2(now / 1000, cityIdx, u);
        } else {
          this.renderScreen3(now / 1000, cityIdx, u);
        }
      } catch (err) {
        console.error("JourneyEngine render error:", err);
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
