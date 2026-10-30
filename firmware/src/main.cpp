#include <M5Unified.h>
#include "config.h"
#include "types.h"
#include "core/journey_engine.h"
#include "network/journey_client.h"
#include "ui/screen_radar.h"
#include "ui/screen_cockpit.h"

// ============================================================================
// SANTA-OS - Main Application Entrypoint
// Architecture: Core Engine (Advent Calendar) + Network Client + Dual UI Screens
// Hardware: M5StickC-Plus SE (ESP32-PICO-D4, 240x135 ST7789v2 IPS Display)
// ============================================================================

enum ActiveScreen {
  SCREEN_RADAR = 0,
  SCREEN_COCKPIT = 1
};

M5Canvas canvas(&M5.Display);
JourneyEngine engine;
ScreenRadar radar;
ScreenCockpit cockpit;
ActiveScreen activeScreen = SCREEN_RADAR;

bool soundEnabled = true;
unsigned long lastFrameTime = 0;

void playChirp(int freq, int durationMs) {
  if (!soundEnabled) return;
  M5.Speaker.tone(freq, durationMs);
}

void setup() {
  auto cfg = M5.config();
  M5.begin(cfg);

  Serial.begin(115200);
  Serial.println("\n=================================");
  Serial.println("  SANTA-OS v2.4 - ADVENT RADAR   ");
  Serial.println("  24 Days / 288 Stops / ST7789v2 ");
  Serial.println("=================================");

  // Initialize 240x135 Landscape Display
  M5.Display.setRotation(1);
  M5.Display.setBrightness(180);

  canvas.setColorDepth(16);
  canvas.createSprite(SCREEN_WIDTH, SCREEN_HEIGHT);
  canvas.setTextDatum(top_left);

  // Initialize UI Renderers
  radar.init(&canvas);
  cockpit.init(&canvas);

  // Initialize simulation engine with preloaded Day 24 Grand Finale itinerary
  // (All 24 days / 288 stops are compiled in PROGMEM, so no Wi-Fi is needed to boot!)
  engine.init(24);

  // If Wi-Fi credentials are provided in config.h, attempt fetch; otherwise runs offline
  if (strlen(DEFAULT_WIFI_SSID) > 0) {
    JourneyData remoteData;
    if (JourneyClient::fetchRemoteOrFallback(DEFAULT_WIFI_SSID, DEFAULT_WIFI_PASS, JOURNEY_API_URL, remoteData)) {
      engine.setJourneyData(remoteData);
    }
  }

  playChirp(1800, 60);
  lastFrameTime = millis();
}

void loop() {
  M5.update();

  unsigned long now = millis();
  float dt = (now - lastFrameTime) / 1000.0f;
  lastFrameTime = now;
  if (dt > 0.1f) dt = 0.033f;

  // Advance simulation clock and physics
  engine.update(dt);

  // ========================================================================
  // Unified Button Navigation (Variant 1 — 1:1 Hardware/Simulator Parity)
  // ========================================================================

  // Button A (Front M5) Short Click: Cycle Active Screen
  if (M5.BtnA.wasClicked()) {
    activeScreen = (activeScreen == SCREEN_RADAR) ? SCREEN_COCKPIT : SCREEN_RADAR;
    playChirp(1600, 35);
  }

  // Button A (Front M5) Long Press (>0.6s): Jump to next Advent Day (1 -> 24 -> 1)
  if (M5.BtnA.wasHold()) {
    engine.nextDay();
    playChirp(1900, 70);
  }

  // Button B (Top Side) Short Click: Jump to next city on current day (0 -> 11 -> 0)
  if (M5.BtnB.wasClicked()) {
    engine.nextCity();
    playChirp(1400, 35);
  }

  // Button B (Top Side) Long Press (>0.6s): Toggle Sound (Mute / Unmute)
  if (M5.BtnB.wasHold()) {
    soundEnabled = !soundEnabled;
    if (soundEnabled) playChirp(2200, 80);
  }

  // Retrieve current calculated state
  TelemetryState telemetry = engine.getTelemetry();

  // Render active screen to double buffer (zero dynamic heap allocation)
  if (activeScreen == SCREEN_RADAR) {
    radar.render(engine.getJourneyData(), telemetry, engine.getSpeedMultiplier(), now);
  } else {
    cockpit.render(engine.getJourneyData(), telemetry, now);
  }

  // Flush to screen (flicker-free ST7789v2 IPS push)
  canvas.pushSprite(0, 0);

  delay(FRAME_DELAY_MS);
}
