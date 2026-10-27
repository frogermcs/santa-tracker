#pragma once
#include <M5Unified.h>
#include "types.h"
#include "config.h"

class ScreenRadar {
public:
  ScreenRadar();
  void init(M5Canvas* canvas);

  // Render a full frame of the World Radar
  void render(const JourneyData& journey, const TelemetryState& telemetry, float speedMultiplier, unsigned long nowMs);

private:
  M5Canvas* _canvas;

  void drawDottedLine(float x0, float y0, float x1, float y1, uint16_t color, float spacing = 3.0f);
};
