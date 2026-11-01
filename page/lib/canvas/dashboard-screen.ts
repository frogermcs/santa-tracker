/**
 * SANTA-OS Cockpit Dashboard (Wersja Polska)
 * 1:1 Specyfikacja dla M5StickC-Plus SE (240x135 ST7789v2 IPS Display)
 *
 * Sekcje:
 * 1. Pasek górny: Stan baterii, tytuł systemu, aktywny dzień grudnia
 * 2. Dynamika lotu: Prędkość Mach, pułap w stopach, 10-segmentowy wskaźnik mocy
 * 3. Ładunek prezentów: Licznik dostarczonych prezentów, tempo zrzutu, wskaźnik zapasu
 * 4. Spożycie (Ciastka i Mleko): Licznik ciastek i litrów mleka z tempem wcinania
 * 5. Wyróżniona faza misji: Dedykowana ramka taktyczna ze statusem lądowania/lotu
 * 6. Dolny pasek: Aktualny cel, odliczanie ETA i tryb nawigacji
 */

import { drawBitmapText } from "./glcd-font";
import { SantaCockpitMetrics } from "../telemetry/santa-metrics";

const W = 240;
const H = 135;

// Kolory z DESIGN.md
const COLOR_BG = "#050914";
const COLOR_GRID = "#0b261b";
const COLOR_BORDER = "#144933";
const COLOR_EMERALD = "#10b981";
const COLOR_EMERALD_BRIGHT = "#34d399";
const COLOR_CYAN = "#38bdf8";
const COLOR_AMBER = "#f59e0b";
const COLOR_AMBER_BRIGHT = "#fbbf24";
const COLOR_RED = "#ef4444";
const COLOR_WHITE = "#f8fafc";
const COLOR_DIM = "#475569";
const COLOR_STAGE_BG = "#081622";
const COLOR_STAGE_BORDER = "#0284c7";

export function renderDashboardScreen(
  ctx: CanvasRenderingContext2D,
  metrics: SantaCockpitMetrics,
  dayNum: number,
  nowSec: number
) {
  // 1. Tło ekranu
  ctx.fillStyle = COLOR_BG;
  ctx.fillRect(0, 0, W, H);

  // Subtelne linie kineskopowe CRT (co 2px)
  ctx.fillStyle = "rgba(0, 20, 10, 0.22)";
  for (let y = 0; y < H; y += 2) {
    ctx.fillRect(0, y, W, 1);
  }

  // -------------------------------------------------------------
  // 2. GÓRNY PASEK STANU (y: 0..13)
  // -------------------------------------------------------------
  ctx.fillStyle = "#081320";
  ctx.fillRect(0, 0, W, 13);
  ctx.strokeStyle = COLOR_BORDER;
  ctx.beginPath();
  ctx.moveTo(0, 13.5);
  ctx.lineTo(W, 13.5);
  ctx.stroke();

  // Bateria (lewa strona)
  drawBatteryIcon(ctx, 4, 3);
  drawBitmapText(ctx, "98%", 18, 3, COLOR_EMERALD_BRIGHT);

  // Tytuł centralny (zbalansowany na szerokość ekranu)
  drawBitmapText(ctx, "KOKPIT MISJI", 120, 3, COLOR_EMERALD, "center");

  // Dzień grudnia (prawa strona)
  const dayStr = `DZIEN ${String(dayNum).padStart(2, "0")}`;
  drawBitmapText(ctx, dayStr, 236, 3, COLOR_AMBER_BRIGHT, "right");

  // -------------------------------------------------------------
  // 3. GÓRNY RZĄD: DYNAMIKA LOTU & ŁADUNEK PREZENTÓW (y: 15..57)
  // -------------------------------------------------------------
  // Linia pionowa dzieląca dwie kolumny
  ctx.strokeStyle = COLOR_BORDER;
  ctx.beginPath();
  ctx.moveTo(120.5, 14);
  ctx.lineTo(120.5, 57);
  ctx.stroke();

  // Linia pozioma pod górnym rzędem
  ctx.beginPath();
  ctx.moveTo(0, 57.5);
  ctx.lineTo(W, 57.5);
  ctx.stroke();

  // LEWA KOLUMNA: DYNAMIKA LOTU (x: 4..116)
  drawBitmapText(ctx, "DYNAMIKA LOTU", 4, 16, COLOR_CYAN);

  // Prędkość
  drawBitmapText(ctx, "PREDK.", 4, 26, COLOR_DIM);
  const isFlight = metrics.flightPhase !== "DACH" && metrics.flightPhase !== "FINAL";
  const speedColor = isFlight ? COLOR_AMBER_BRIGHT : COLOR_DIM;
  drawBitmapText(ctx, metrics.machDisplay, 44, 26, speedColor);

  // Pułap lotu
  drawBitmapText(ctx, "PULAP", 4, 36, COLOR_DIM);
  drawBitmapText(ctx, metrics.altitudeDisplay, 44, 36, COLOR_CYAN);

  // Pasek segmentowy prędkości Mach (10 segmentów)
  const maxMach = 5.0;
  const activeMachSegs = Math.min(10, Math.round((metrics.machSpeed / maxMach) * 10));
  drawSegmentedBar(ctx, 4, 46, 112, 7, 10, activeMachSegs, COLOR_AMBER, COLOR_GRID);

  // PRAWA KOLUMNA: PREZENTY (x: 124..236)
  drawBitmapText(ctx, "PREZENTY", 124, 16, COLOR_CYAN);
  drawMiniGiftIcon(ctx, 226, 15);

  // Dostarczono prezentów
  drawBitmapText(ctx, "DOSTARCZONO:", 124, 26, COLOR_DIM);
  drawBitmapText(ctx, metrics.giftsDeliveredDisplay, 236, 26, COLOR_EMERALD_BRIGHT, "right");

  // Tempo zrzutu (0/s w locie - wygaszone, realna wartość regionalna na dachu)
  drawBitmapText(ctx, "ZRZUT:", 124, 36, COLOR_DIM);
  const rateColor = metrics.giftRatePerSec > 0 ? COLOR_AMBER_BRIGHT : COLOR_DIM;
  drawBitmapText(ctx, metrics.giftRateDisplay, 236, 36, rateColor, "right");

  // Pasek postępu dostaw danego dnia (1..10 segmentów)
  const payloadSegs = Math.min(10, Math.max(1, Math.round(metrics.payloadPct / 10)));
  drawSegmentedBar(ctx, 124, 46, 112, 7, 10, payloadSegs, COLOR_EMERALD, COLOR_GRID);

  // -------------------------------------------------------------
  // 4. ŚRODKOWY RZĄD: PALIWO MIKOŁAJA (CIASTKA I MLEKO) (y: 59..82)
  // -------------------------------------------------------------
  ctx.strokeStyle = COLOR_BORDER;
  ctx.beginPath();
  ctx.moveTo(0, 82.5);
  ctx.lineTo(W, 82.5);
  ctx.stroke();

  drawBitmapText(ctx, "PALIWO MIKOLAJA", 4, 60, COLOR_CYAN);

  // Ciasteczka (lewa strona x: 4..116)
  drawBitmapText(ctx, "CIASTKA:", 4, 71, COLOR_DIM);
  drawBitmapText(ctx, metrics.cookiesEatenDisplay, 56, 71, COLOR_AMBER_BRIGHT);
  drawMiniCookieIcon(ctx, 98, 70);

  // Mleko (prawa strona x: 124..236)
  drawBitmapText(ctx, "MLEKO:", 124, 71, COLOR_DIM);
  drawBitmapText(ctx, metrics.milkLitersDisplay, 166, 71, COLOR_CYAN);
  drawMiniMilkIcon(ctx, 222, 70);

  // -------------------------------------------------------------
  // 5. WYRÓŻNIONA RAMKA: AKTUALNA FAZA MISJI (y: 85..116, h=31px)
  // -------------------------------------------------------------
  const isFinale = metrics.flightPhase === "FINAL";
  const boxBorderColor = isFinale
    ? Math.sin(nowSec * 5) > 0 ? COLOR_AMBER_BRIGHT : COLOR_RED
    : isFlight
    ? COLOR_STAGE_BORDER
    : COLOR_EMERALD;

  ctx.fillStyle = COLOR_STAGE_BG;
  ctx.fillRect(3, 85, 234, 31);

  ctx.strokeStyle = boxBorderColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(3.5, 85.5, 233, 30);

  // Nagłówek ramki fazy
  drawBitmapText(ctx, "AKTUALNA FAZA MISJI:", 8, 89, COLOR_CYAN);

  // Główny, pojedynczy i czytelny tytuł fazy
  const titleColor = isFinale ? COLOR_WHITE : isFlight ? COLOR_AMBER_BRIGHT : COLOR_EMERALD_BRIGHT;
  drawBitmapText(ctx, metrics.stageTitle, 120, 102, titleColor, "center");

  // -------------------------------------------------------------
  // 6. DOLNY PASEK NAWIGACYJNY (y: 120..134)
  // -------------------------------------------------------------
  ctx.fillStyle = "#040d16";
  ctx.fillRect(0, 120, W, 15);
  ctx.strokeStyle = COLOR_BORDER;
  ctx.beginPath();
  ctx.moveTo(0, 119.5);
  ctx.lineTo(W, 119.5);
  ctx.stroke();

  // Cel podróży (w locie "CEL: ", w mieście "POSTÓJ: ", w finale "FINAŁ: ")
  const targetPrefix = isFinale ? "FINAL: " : isFlight ? "CEL: " : "POSTOJ: ";
  const targetLabel = `${targetPrefix}${metrics.targetCity}`;
  drawBitmapText(ctx, targetLabel, 4, 123, isFinale ? COLOR_AMBER_BRIGHT : COLOR_EMERALD_BRIGHT);

  // Odliczanie czasu po prawej stronie
  let countdownText = "";
  if (isFinale && metrics.etaSeconds === 0) {
    countdownText = "WIGILIA!";
  } else {
    countdownText = `CZAS 0:${String(metrics.etaSeconds).padStart(2, "0")}`;
  }
  drawBitmapText(ctx, countdownText, 236, 123, COLOR_AMBER_BRIGHT, "right");
}

// -------------------------------------------------------------
// Pomocnicze funkcje rysujące piktogramy i paski
// -------------------------------------------------------------

function drawBatteryIcon(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.strokeStyle = COLOR_EMERALD_BRIGHT;
  ctx.strokeRect(x, y + 1, 10, 6);
  ctx.fillStyle = COLOR_EMERALD_BRIGHT;
  ctx.fillRect(x + 10, y + 2, 2, 4);
  ctx.fillRect(x + 2, y + 2, 6, 4);
}

function drawSegmentedBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  segments: number,
  activeSegs: number,
  activeColor: string,
  inactiveColor: string
) {
  const gap = 1;
  const segWidth = Math.floor((width - (segments - 1) * gap) / segments);

  for (let i = 0; i < segments; i++) {
    const segX = x + i * (segWidth + gap);
    ctx.fillStyle = i < activeSegs ? activeColor : inactiveColor;
    ctx.fillRect(segX, y, segWidth, height);
  }
}

function drawMiniGiftIcon(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = COLOR_RED;
  ctx.fillRect(x, y + 2, 7, 6);
  ctx.fillStyle = COLOR_AMBER_BRIGHT;
  ctx.fillRect(x + 3, y + 2, 1, 6);
  ctx.fillRect(x, y + 4, 7, 1);
  ctx.fillRect(x + 2, y, 3, 2);
}

function drawMiniCookieIcon(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#b45309";
  ctx.fillRect(x + 1, y, 5, 7);
  ctx.fillRect(x, y + 1, 7, 5);
  ctx.fillStyle = "#451a03";
  ctx.fillRect(x + 2, y + 2, 1, 1);
  ctx.fillRect(x + 4, y + 4, 1, 1);
  ctx.fillRect(x + 2, y + 5, 1, 1);
}

function drawMiniMilkIcon(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // Buteleczka z mlekiem 5x7 px
  ctx.fillStyle = "#e2e8f0"; // Biała butelka
  ctx.fillRect(x + 1, y + 2, 4, 5);
  ctx.fillRect(x + 2, y, 2, 2); // Szyjka
  ctx.fillStyle = "#38bdf8"; // Etykieta błękitna
  ctx.fillRect(x + 1, y + 4, 4, 2);
}

function formatEta(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
