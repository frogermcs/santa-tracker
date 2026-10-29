#include "screen_radar.h"
#include "land_dots.h"
#include <math.h>

// Color Palette (RGB565 matching prototype)
#define COLOR_BG            0x00A1  // #02110a Deep CRT phosphor green
#define COLOR_GRID          0x0183  // #073018 Faint green radar grid & rings
#define COLOR_LAND          0x1C49  // #1f8a4a Coastline dot matrix
#define COLOR_BREADCRUMB    0xFEA9  // #ffd54a Sleigh route breadcrumbs
#define COLOR_CITY_VISITED  0x7FF3  // #7dff9b Visited city waypoint
#define COLOR_CITY_FUTURE   0x4EB1  // #4fd68a Upcoming city waypoint
#define COLOR_RADAR_BEAM    0x5FE1  // #5aff8c Rotating green radar beam
#define COLOR_BEACON_PULSE  0xFA8B  // #ff5a5a Expanding pulse ring around Santa
#define COLOR_BEACON_CORE   0xF9C7  // #ff3b3b Santa bright red beacon
#define COLOR_BEACON_GLOW   0x4800  // Faint red aura
#define COLOR_HUD_BG        0x00C1  // Top & bottom HUD bars
#define COLOR_TEXT_GREEN    0x7FF3  // #7dff9b Radar HUD text
#define COLOR_TEXT_GOLD     0xFEA9  // #ffd54a ETA countdown text

ScreenRadar::ScreenRadar() : _canvas(nullptr) {}

void ScreenRadar::init(M5Canvas* canvas) {
  _canvas = canvas;
}

void ScreenRadar::drawDottedLine(float x0, float y0, float x1, float y1, uint16_t color, float spacing) {
  if (!_canvas) return;
  float dx = x1 - x0;
  float dy = y1 - y0;
  float dist = hypotf(dx, dy);
  if (dist < 1.0f) return;
  float ux = dx / dist;
  float uy = dy / dist;
  for (float d = 0; d <= dist; d += spacing) {
    _canvas->drawPixel((int)(x0 + ux * d), (int)(y0 + uy * d), color);
  }
}

void ScreenRadar::render(const JourneyData& journey, const TelemetryState& telemetry, float speedMultiplier, unsigned long nowMs) {
  if (!_canvas) return;

  bool blink = ((nowMs / 220) % 2 == 0);

  // 1. Clear with Deep CRT background
  _canvas->fillScreen(COLOR_BG);

  // 2. Fixed Center Radar: Concentric Range Rings & Crosshairs
  _canvas->drawCircle(RADAR_CENTER_X, RADAR_CENTER_Y, 32, COLOR_GRID);
  _canvas->drawCircle(RADAR_CENTER_X, RADAR_CENTER_Y, 64, COLOR_GRID);
  _canvas->drawCircle(RADAR_CENTER_X, RADAR_CENTER_Y, 96, COLOR_GRID);
  _canvas->drawFastHLine(0, RADAR_CENTER_Y, SCREEN_WIDTH, COLOR_GRID);
  _canvas->drawFastVLine(RADAR_CENTER_X, 12, 108, COLOR_GRID);

  // 3. Dot-Matrix Coastlines (912 World Land Dots)
  for (size_t i = 0; i < LAND_DOTS_COUNT; i++) {
    uint8_t dx = pgm_read_byte(&LAND_DOTS[i].x);
    uint8_t dy = pgm_read_byte(&LAND_DOTS[i].y);
    _canvas->fillRect(dx - 1, dy - 1, 2, 2, COLOR_LAND);
  }

  // 4. Fixed Center Rotating Radar Sweep Beam
  float beamAngle = (nowMs % 3200) * (2.0f * PI / 3200.0f);
  int beamLen = 110;
  int beamEndX = RADAR_CENTER_X + (int)(cosf(beamAngle) * beamLen);
  int beamEndY = RADAR_CENTER_Y + (int)(sinf(beamAngle) * beamLen);
  _canvas->drawLine(RADAR_CENTER_X, RADAR_CENTER_Y, beamEndX, beamEndY, COLOR_RADAR_BEAM);

  // Secondary sweep trailing line
  float trailAngle = beamAngle - 0.08f;
  int trailEndX = RADAR_CENTER_X + (int)(cosf(trailAngle) * (beamLen - 10));
  int trailEndY = RADAR_CENTER_Y + (int)(sinf(trailAngle) * (beamLen - 10));
  _canvas->drawLine(RADAR_CENTER_X, RADAR_CENTER_Y, trailEndX, trailEndY, COLOR_GRID);

  // 5. Breadcrumb Trail following Santa across the world (Dotted)
  for (int i = 1; i <= telemetry.safeIdx; i++) {
    float ax, ay, bx, by;
    ax = ((journey.cities[i - 1].lon + 180.0f) / 360.0f) * (float)SCREEN_WIDTH;
    ay = 12.0f + ((80.0f - journey.cities[i - 1].lat) / 138.0f) * 108.0f;

    if (i < telemetry.safeIdx || !telemetry.isFlightPhase) {
      bx = ((journey.cities[i].lon + 180.0f) / 360.0f) * (float)SCREEN_WIDTH;
      by = 12.0f + ((80.0f - journey.cities[i].lat) / 138.0f) * 108.0f;
    } else {
      bx = telemetry.santaScreenX;
      by = telemetry.santaScreenY;
    }
    drawDottedLine(ax, ay, bx, by, COLOR_BREADCRUMB, 3.0f);
  }

  // 6. City Waypoint Dots
  for (int i = 0; i < journey.cityCount; i++) {
    float wx = ((journey.cities[i].lon + 180.0f) / 360.0f) * (float)SCREEN_WIDTH;
    float wy = 12.0f + ((80.0f - journey.cities[i].lat) / 138.0f) * 108.0f;
    int ix = (int)wx;
    int iy = (int)wy;

    if (i == telemetry.targetCityIdx) {
      _canvas->fillRect(ix - 1, iy - 1, 3, 3, blink ? TFT_WHITE : COLOR_CITY_VISITED);
    } else if (i < telemetry.safeIdx || (i == telemetry.safeIdx && !telemetry.isFlightPhase)) {
      _canvas->fillRect(ix - 1, iy - 1, 3, 3, COLOR_CITY_VISITED);
    } else {
      _canvas->drawPixel(ix, iy, COLOR_CITY_FUTURE);
    }
  }

  // 7. Santa Beacon: Red Flashing Blip + Expanding Ping Circle
  int pulseRadius = (nowMs / 40) % 20;
  if (pulseRadius > 2) {
    _canvas->drawCircle((int)telemetry.santaScreenX, (int)telemetry.santaScreenY, pulseRadius, COLOR_BEACON_PULSE);
  }
  _canvas->drawRect((int)telemetry.santaScreenX - 3, (int)telemetry.santaScreenY - 3, 7, 7, COLOR_BEACON_GLOW);
  _canvas->fillRect((int)telemetry.santaScreenX - 1, (int)telemetry.santaScreenY - 1, 3, 3, blink ? COLOR_BEACON_CORE : TFT_WHITE);

  // 8. Top HUD Bar (y: 0..12)
  _canvas->fillRect(0, 0, SCREEN_WIDTH, 12, COLOR_HUD_BG);
  _canvas->drawFastHLine(0, 12, SCREEN_WIDTH, COLOR_GRID);
  _canvas->setTextSize(1);

  // Left (x: 4, y: 2): BAT % or USB 5V
  int battery = M5.Power.getBatteryLevel();
  char batBuf[16];
  if (battery >= 0) {
    snprintf(batBuf, sizeof(batBuf), "BAT %d%%", battery);
  } else {
    strncpy(batBuf, "USB 5V", sizeof(batBuf));
  }
  _canvas->setTextDatum(top_left);
  _canvas->setTextColor(COLOR_TEXT_GREEN, COLOR_HUD_BG);
  _canvas->drawString(batBuf, 4, 2);

  // Center (x: 120, y: 2): RADAR MIKOLAJA
  _canvas->setTextDatum(top_center);
  _canvas->setTextColor(COLOR_TEXT_GREEN, COLOR_HUD_BG);
  _canvas->drawString("RADAR MIKOLAJA", RADAR_CENTER_X, 2);

  // Right (x: 236, y: 2): DZIEN <activeDay> (Gold on Day 24, Green on Days 1..23)
  char dayBuf[16];
  snprintf(dayBuf, sizeof(dayBuf), "DZIEN %d", telemetry.activeDay);
  _canvas->setTextDatum(top_right);
  _canvas->setTextColor(telemetry.activeDay == 24 ? COLOR_TEXT_GOLD : COLOR_TEXT_GREEN, COLOR_HUD_BG);
  _canvas->drawString(dayBuf, SCREEN_WIDTH - 4, 2);

  // 9. Bottom HUD Bar (y: 121..135)
  _canvas->fillRect(0, 121, SCREEN_WIDTH, 14, COLOR_HUD_BG);
  _canvas->drawFastHLine(0, 120, SCREEN_WIDTH, COLOR_GRID);

  // Left (x: 4, y: 124): CEL: <CITY> or FINAL: KRAKOW
  char targetBuf[32];
  if (telemetry.isDay24Finale) {
    snprintf(targetBuf, sizeof(targetBuf), "FINAL: %s", telemetry.nextCityName);
    _canvas->setTextColor(COLOR_TEXT_GOLD, COLOR_HUD_BG);
  } else {
    snprintf(targetBuf, sizeof(targetBuf), "CEL: %s", telemetry.nextCityName);
    _canvas->setTextColor(COLOR_TEXT_GREEN, COLOR_HUD_BG);
  }
  _canvas->setTextDatum(top_left);
  _canvas->drawString(targetBuf, 4, 124);

  // Right (x: 236, y: 124): CZAS 0:<ETA> or WIGILIA!
  char etaBuf[16];
  if (telemetry.isDay24Finale) {
    strncpy(etaBuf, "WIGILIA!", sizeof(etaBuf));
  } else {
    snprintf(etaBuf, sizeof(etaBuf), "CZAS 0:%02d", telemetry.etaSeconds);
  }
  _canvas->setTextDatum(top_right);
  _canvas->setTextColor(COLOR_TEXT_GOLD, COLOR_HUD_BG);
  _canvas->drawString(etaBuf, SCREEN_WIDTH - 4, 124);
}
