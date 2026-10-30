#pragma once
#include <M5Unified.h>
#include "types.h"
#include "config.h"
#include "core/santa_metrics.h"

// ============================================================================
// ScreenCockpit - Modern Aerospace Glass Cockpit Telemetry Dashboard
// ============================================================================
// Hardware: M5StickC-Plus SE (ST7789v2 240x135 IPS Display)
// 1:1 Parity with page/lib/simulator/iotAppLogic.ts & dashboard-screen.ts
//
// Sections:
// 1. Top Header Bar: Battery %, System Title, Active Advent Day
// 2. Flight Dynamics: Mach speed, 10-seg gauge, altitude
// 3. Gift Payload: Delivered count, drop rate, 10-seg progress bar
// 4. Sustenance ("Paliwo Mikołaja"): Pixel-art cookies & milk bottle counters
// 5. Tactical Mission Phase Box: Dynamic border & status headline
// 6. Navigation HUD Footer: Destination city & countdown ETA
// ============================================================================

class ScreenCockpit {
public:
  ScreenCockpit();
  void init(M5Canvas* canvas);

  // Render a full frame of the Cockpit Dashboard
  void render(const JourneyData& journey, const TelemetryState& telemetry, unsigned long nowMs);

private:
  M5Canvas* _canvas;

  void drawBatteryIcon(int x, int y, uint16_t color);
  void drawMiniGiftIcon(int x, int y);
  void drawMiniCookieIcon(int x, int y);
  void drawMiniMilkIcon(int x, int y);
  void drawSegmentedBar(int x, int y, int width, int height, int segments, int activeSegs, uint16_t activeColor, uint16_t inactiveColor);
  void drawMultiColorBar(int x, int y, int width, int height, int segments, int activeSegs, const uint16_t* colors, uint16_t inactiveColor);
};
