#include "screen_cockpit.h"
#include <math.h>
#include <stdio.h>
#include <string.h>

// ============================================================================
// Modern Aerospace Glass Cockpit Palette (RGB565)
// ============================================================================
#define COLOR_BG_DARK        0x0000  // #000000 Pitch black for maximum IPS contrast
#define COLOR_BORDER         0x2124  // #20242c Subtle graphite titanium divider
#define COLOR_SEG_OFF        0x18e3  // #181c24 Inactive gauge segment
#define COLOR_LABEL          0x94b2  // #94a3b8 Aerospace cool slate label
#define COLOR_DIM            0x4aa9  // #475569 Muted standby value
#define COLOR_CYAN           0x3dfa  // #38bdf8 Cockpit section header cyan
#define COLOR_CYAN_BRIGHT    0x07ff  // #00f0ff Electric Ice Cyan
#define COLOR_AMBER_BRIGHT   0xfde0  // #fbbf24 High-visibility aviation amber
#define COLOR_EMERALD_NEON   0x07e0  // #00ff00 Vivid avionics green
#define COLOR_PANEL_BG       0x0842  // #0a101f Sleek dark avionics panel
#define COLOR_HEADER_BG      0x0821  // #080c14 Sleek dark avionics glass

// 10-segment Mach speed meter colors: 0..3 Cyan, 4..6 Amber, 7..9 Coral/Flame Red
static const uint16_t MACH_BAR_COLORS[10] = {
  0x07ff, 0x07ff, 0x07ff, 0x07ff,
  0xfde0, 0xfde0, 0xfde0,
  0xfda0, 0xf800, 0xf800
};

ScreenCockpit::ScreenCockpit() : _canvas(nullptr) {}

void ScreenCockpit::init(M5Canvas* canvas) {
  _canvas = canvas;
}

void ScreenCockpit::drawBatteryIcon(int x, int y, uint16_t color) {
  if (!_canvas) return;
  _canvas->drawRect(x, y + 1, 10, 6, color);
  _canvas->fillRect(x + 10, y + 2, 2, 4, color);
  _canvas->fillRect(x + 2, y + 2, 6, 4, color);
}

void ScreenCockpit::drawMiniGiftIcon(int x, int y) {
  if (!_canvas) return;
  const uint16_t COLOR_GOLD = 0xffe0;
  _canvas->fillRect(x + 2, y, 4, 2, COLOR_GOLD);     // Top ribbon bow
  _canvas->fillRect(x, y + 2, 8, 6, TFT_RED);        // Ruby red package
  _canvas->fillRect(x + 3, y + 2, 2, 6, COLOR_GOLD); // Vertical ribbon
  _canvas->fillRect(x, y + 4, 8, 2, COLOR_GOLD);     // Horizontal ribbon
}

void ScreenCockpit::drawMiniCookieIcon(int x, int y) {
  if (!_canvas) return;
  const uint16_t COLOR_COOKIE_BASE = 0xfc80; // Baked amber (#f59e0b)
  const uint16_t COLOR_COOKIE_EDGE = 0xc340; // Crispy cookie edge (#b45309)
  const uint16_t COLOR_CHIP = 0x3940;        // Dark chocolate chip (#3b1802)

  // Cookie circular shape
  _canvas->fillRect(x + 2, y, 4, 8, COLOR_COOKIE_BASE);
  _canvas->fillRect(x, y + 2, 8, 4, COLOR_COOKIE_BASE);
  _canvas->fillRect(x + 1, y + 1, 6, 6, COLOR_COOKIE_BASE);

  // Outer edge dots
  _canvas->drawPixel(x + 1, y + 1, COLOR_COOKIE_EDGE);
  _canvas->drawPixel(x + 6, y + 1, COLOR_COOKIE_EDGE);
  _canvas->drawPixel(x + 1, y + 6, COLOR_COOKIE_EDGE);
  _canvas->drawPixel(x + 6, y + 6, COLOR_COOKIE_EDGE);

  // Dark chocolate chips
  _canvas->fillRect(x + 2, y + 2, 2, 2, COLOR_CHIP);
  _canvas->fillRect(x + 5, y + 3, 2, 2, COLOR_CHIP);
  _canvas->fillRect(x + 3, y + 5, 2, 2, COLOR_CHIP);
}

void ScreenCockpit::drawMiniMilkIcon(int x, int y) {
  if (!_canvas) return;
  const uint16_t COLOR_CAP = TFT_RED;
  const uint16_t COLOR_MILK_LABEL = 0x05ff; // Vivid sky blue label

  _canvas->fillRect(x + 2, y, 3, 2, COLOR_CAP);
  _canvas->fillRect(x + 2, y + 2, 3, 1, TFT_WHITE);
  _canvas->fillRect(x + 1, y + 3, 5, 6, TFT_WHITE);
  _canvas->fillRect(x + 1, y + 5, 5, 2, COLOR_MILK_LABEL);
}

void ScreenCockpit::drawSegmentedBar(
  int x, int y, int width, int height,
  int segments, int activeSegs,
  uint16_t activeColor, uint16_t inactiveColor
) {
  if (!_canvas) return;
  int gap = 1;
  int segWidth = (width - (segments - 1) * gap) / segments;
  for (int i = 0; i < segments; i++) {
    int segX = x + i * (segWidth + gap);
    uint16_t color = (i < activeSegs) ? activeColor : inactiveColor;
    _canvas->fillRect(segX, y, segWidth, height, color);
  }
}

void ScreenCockpit::drawMultiColorBar(
  int x, int y, int width, int height,
  int segments, int activeSegs,
  const uint16_t* colors, uint16_t inactiveColor
) {
  if (!_canvas) return;
  int gap = 1;
  int segWidth = (width - (segments - 1) * gap) / segments;
  for (int i = 0; i < segments; i++) {
    int segX = x + i * (segWidth + gap);
    uint16_t color = (i < activeSegs) ? colors[i] : inactiveColor;
    _canvas->fillRect(segX, y, segWidth, height, color);
  }
}

void ScreenCockpit::render(
  const JourneyData& journey,
  const TelemetryState& telemetry,
  unsigned long nowMs
) {
  (void)journey;
  if (!_canvas) return;

  float nowSec = (float)nowMs / 1000.0f;

  SantaCockpitMetrics metrics;
  computeSantaMetrics(
    telemetry.activeDay,
    telemetry.safeIdx,
    telemetry.u,
    nowSec,
    telemetry.nextCityName,
    telemetry.isDay24Finale,
    metrics
  );

  bool isFlight = (metrics.flightPhase != PHASE_DACH && metrics.flightPhase != PHASE_FINAL);
  bool isFinale = (metrics.flightPhase == PHASE_FINAL);

  // 1. Clear with pitch black for modern glass cockpit
  _canvas->fillScreen(COLOR_BG_DARK);

  // 2. Top Header Bar (y: 0..13)
  _canvas->fillRect(0, 0, SCREEN_WIDTH, 13, COLOR_HEADER_BG);
  _canvas->drawFastHLine(0, 13, SCREEN_WIDTH, COLOR_BORDER);

  // Battery icon + percentage
  drawBatteryIcon(4, 3, COLOR_EMERALD_NEON);
  int battery = M5.Power.getBatteryLevel();
  char batBuf[12];
  if (battery >= 0) {
    snprintf(batBuf, sizeof(batBuf), "%d%%", battery);
  } else {
    strncpy(batBuf, "98%", sizeof(batBuf));
  }
  _canvas->setTextSize(1);
  _canvas->setTextDatum(top_left);
  _canvas->setTextColor(TFT_WHITE, COLOR_HEADER_BG);
  _canvas->drawString(batBuf, 18, 3);

  // System Title
  _canvas->setTextDatum(top_center);
  _canvas->setTextColor(COLOR_CYAN_BRIGHT, COLOR_HEADER_BG);
  _canvas->drawString("KOKPIT MISJI", RADAR_CENTER_X, 3);

  // Active Advent Day
  char dayBuf[16];
  snprintf(dayBuf, sizeof(dayBuf), "DZIEN %02d", telemetry.activeDay);
  _canvas->setTextDatum(top_right);
  _canvas->setTextColor(COLOR_AMBER_BRIGHT, COLOR_HEADER_BG);
  _canvas->drawString(dayBuf, SCREEN_WIDTH - 4, 3);

  // 3. Flight Dynamics & Gift Payload Box (y: 14..57)
  _canvas->drawFastVLine(120, 14, 43, COLOR_BORDER);
  _canvas->drawFastHLine(0, 57, SCREEN_WIDTH, COLOR_BORDER);

  // --- Left Column: Flight Dynamics (x: 4..116) ---
  _canvas->setTextDatum(top_left);
  _canvas->setTextColor(COLOR_CYAN, COLOR_BG_DARK);
  _canvas->drawString("DYNAMIKA LOTU", 4, 16);

  _canvas->setTextColor(COLOR_LABEL, COLOR_BG_DARK);
  _canvas->drawString("PREDK.", 4, 26);
  _canvas->drawString("PULAP", 4, 36);

  uint16_t speedColor = isFlight ? COLOR_AMBER_BRIGHT : COLOR_DIM;
  _canvas->setTextColor(speedColor, COLOR_BG_DARK);
  _canvas->drawString(metrics.machDisplay, 44, 26);

  _canvas->setTextColor(COLOR_CYAN_BRIGHT, COLOR_BG_DARK);
  _canvas->drawString(metrics.altitudeDisplay, 44, 36);

  // 10-segment multi-color speed bar (Mach 0..5.0 scale)
  int activeMachSegs = (int)roundf((metrics.machSpeed / 5.0f) * 10.0f);
  if (activeMachSegs < 0) activeMachSegs = 0;
  if (activeMachSegs > 10) activeMachSegs = 10;
  drawMultiColorBar(4, 46, 112, 7, 10, activeMachSegs, MACH_BAR_COLORS, COLOR_SEG_OFF);

  // --- Right Column: Gifts (x: 124..236) ---
  _canvas->setTextDatum(top_left);
  _canvas->setTextColor(COLOR_CYAN, COLOR_BG_DARK);
  _canvas->drawString("PREZENTY", 124, 16);
  drawMiniGiftIcon(226, 15);

  _canvas->setTextColor(COLOR_LABEL, COLOR_BG_DARK);
  _canvas->drawString("DOSTARCZONO:", 124, 26);
  _canvas->setTextDatum(top_right);
  _canvas->setTextColor(TFT_WHITE, COLOR_BG_DARK);
  _canvas->drawString(metrics.giftsDeliveredDisplay, 236, 26);

  _canvas->setTextDatum(top_left);
  _canvas->setTextColor(COLOR_LABEL, COLOR_BG_DARK);
  _canvas->drawString("ZRZUT:", 124, 36);
  uint16_t rateColor = (metrics.giftRatePerSec > 0) ? COLOR_AMBER_BRIGHT : COLOR_DIM;
  _canvas->setTextDatum(top_right);
  _canvas->setTextColor(rateColor, COLOR_BG_DARK);
  _canvas->drawString(metrics.giftRateDisplay, 236, 36);

  // 10-segment gift progress bar (Vivid Emerald Neon)
  int payloadSegs = (int)roundf((float)metrics.payloadPct / 10.0f);
  if (payloadSegs < 1) payloadSegs = 1;
  if (payloadSegs > 10) payloadSegs = 10;
  drawSegmentedBar(124, 46, 112, 7, 10, payloadSegs, COLOR_EMERALD_NEON, COLOR_SEG_OFF);

  // 4. Sustenance Box: Paliwo Mikołaja (Cookies & Milk, y: 58..82)
  _canvas->drawFastHLine(0, 82, SCREEN_WIDTH, COLOR_BORDER);
  _canvas->setTextDatum(top_left);
  _canvas->setTextColor(COLOR_CYAN, COLOR_BG_DARK);
  _canvas->drawString("PALIWO MIKOLAJA", 4, 60);

  // Cookies (left side): Icon + Label + Value
  drawMiniCookieIcon(4, 71);
  _canvas->setTextColor(COLOR_LABEL, COLOR_BG_DARK);
  _canvas->drawString("CIASTKA:", 15, 72);
  _canvas->setTextColor(TFT_WHITE, COLOR_BG_DARK);
  _canvas->drawString(metrics.cookiesEatenDisplay, 66, 72);

  // Milk (right side): Icon + Label + Value
  drawMiniMilkIcon(124, 70);
  _canvas->setTextColor(COLOR_LABEL, COLOR_BG_DARK);
  _canvas->drawString("MLEKO:", 134, 72);
  _canvas->setTextColor(TFT_WHITE, COLOR_BG_DARK);
  _canvas->drawString(metrics.milkLitersDisplay, 174, 72);

  // 5. Tactical Mission Phase Status Box (y: 85..116)
  uint16_t boxBorderColor;
  if (isFinale) {
    boxBorderColor = (sinf(nowSec * 5.0f) > 0.0f) ? COLOR_AMBER_BRIGHT : TFT_RED;
  } else if (isFlight) {
    boxBorderColor = COLOR_CYAN_BRIGHT;
  } else {
    boxBorderColor = COLOR_EMERALD_NEON;
  }

  _canvas->fillRect(3, 85, 234, 31, COLOR_PANEL_BG);
  _canvas->drawRect(3, 85, 234, 31, boxBorderColor);

  _canvas->setTextDatum(top_left);
  _canvas->setTextColor(COLOR_LABEL, COLOR_PANEL_BG);
  _canvas->drawString("AKTUALNA FAZA MISJI:", 8, 89);

  _canvas->setTextDatum(top_center);
  uint16_t titleColor = isFinale ? TFT_WHITE : (isFlight ? COLOR_AMBER_BRIGHT : COLOR_EMERALD_NEON);
  _canvas->setTextColor(titleColor, COLOR_PANEL_BG);
  _canvas->drawString(metrics.stageTitle, RADAR_CENTER_X, 102);

  // 6. Bottom Navigation HUD Bar (y: 120..134)
  _canvas->fillRect(0, 120, SCREEN_WIDTH, 15, COLOR_HEADER_BG);
  _canvas->drawFastHLine(0, 119, SCREEN_WIDTH, COLOR_BORDER);

  _canvas->setTextDatum(top_left);
  uint16_t prefixColor = isFinale ? COLOR_AMBER_BRIGHT : (isFlight ? COLOR_CYAN_BRIGHT : COLOR_EMERALD_NEON);
  const char* prefixText = isFinale ? "FINAL: " : (isFlight ? "CEL: " : "POSTOJ: ");
  _canvas->setTextColor(prefixColor, COLOR_HEADER_BG);
  _canvas->drawString(prefixText, 4, 123);

  int prefixWidth = (int)strlen(prefixText) * 6;
  _canvas->setTextColor(TFT_WHITE, COLOR_HEADER_BG);
  _canvas->drawString(metrics.targetCity, 4 + prefixWidth, 123);

  // ETA Countdown on right
  _canvas->setTextDatum(top_right);
  _canvas->setTextColor(COLOR_AMBER_BRIGHT, COLOR_HEADER_BG);
  if (isFinale && metrics.etaSeconds == 0) {
    _canvas->drawString("WIGILIA!", SCREEN_WIDTH - 4, 123);
  } else {
    char etaBuf[16];
    snprintf(etaBuf, sizeof(etaBuf), "CZAS 0:%02d", metrics.etaSeconds);
    _canvas->drawString(etaBuf, SCREEN_WIDTH - 4, 123);
  }
}
