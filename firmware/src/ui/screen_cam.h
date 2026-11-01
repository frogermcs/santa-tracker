#pragma once
#include <M5Unified.h>
#include "types.h"
#include "config.h"
#include "core/santa_metrics.h"

// ============================================================================
// ScreenCam - Side-View Santa Cam (Kamera Mikołaja — Screen 3 / SCREEN_CAM)
// ============================================================================
// Hardware: M5StickC-Plus SE (ST7789v2 240x135 IPS Display)
// 1:1 Parity with page/lib/simulator/camScreen.ts
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

class ScreenCam {
public:
  ScreenCam();
  void init(M5Canvas* canvas);

  // Render a full frame of the Santa Cam
  void render(const JourneyData& journey, const TelemetryState& telemetry, unsigned long nowMs);

private:
  M5Canvas* _canvas;

  void drawBatteryIcon(int x, int y, uint16_t color);
  void drawSantaSleigh(int x, int y);
  void drawSleighJetFlames(int sleighX, int sleighY, unsigned long nowMs);
  void drawReindeer(int x, int y, int legFrame, bool noseGlow);
  void drawReins(int sleighX, int sleighY, int deerX, int deerY);
  void drawParachuteGift(int x, int y);
  bool drawChimneyGiftDrop(int sleighY, int chimCenterX, int chimY);
  void drawDroppingGift(int sleighX, int sleighY, float dropProgress);
  void drawScrollingRooftops(float nowSec, int sleighY = 32, bool enableDrops = false);
  void drawStationarySnowyRooftop(float chimneySmokeY);
  void drawKrakowBasilica(int x, int baseY);
  void drawBigSantaCookieBreak(float nowSec, unsigned long nowMs);
  void drawParallaxStars(float nowSec);
  void drawStratosphericStars(float nowSec);
  void drawCurvedEarthGlobe(float nowSec);
  void drawFestiveChristmasTree(int baseX, int baseY, int treeH, int seed, float nowSec);
  void drawDescendingWinterLandscape(float nowSec, float descentP);
};
