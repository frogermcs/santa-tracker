#include <M5Unified.h>
#include "config.h"
#include "types.h"
#include "core/journey_engine.h"
#include "network/journey_client.h"
#include "ui/screen_radar.h"

// ==============================================================
// SANTA-OS - Main Application Entrypoint
// Architecture: Core Engine + Network Client + UI Renderers
// Hardware: M5StickC-Plus SE (ESP32-PICO-D4, 240x135 ST7789v2 IPS)
// ==============================================================

M5Canvas canvas(&M5.Display);
JourneyEngine engine;
ScreenRadar radar;

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
  Serial.println("  SANTA-OS v2.2 - GLOBAL RADAR   ");
  Serial.println("=================================");

  // Initialize 240x135 Landscape Display
  M5.Display.setRotation(1);
  M5.Display.setBrightness(180);

  canvas.setColorDepth(16);
  canvas.createSprite(SCREEN_WIDTH, SCREEN_HEIGHT);
  canvas.setTextDatum(top_left);

  // Initialize UI Renderers
  radar.init(&canvas);

  // Load Journey: Attempts Wi-Fi sync; automatically falls back to offline demo
  JourneyData journey;
  JourneyClient::fetchRemoteOrFallback(DEFAULT_WIFI_SSID, DEFAULT_WIFI_PASS, JOURNEY_API_URL, journey);
  engine.setJourneyData(journey);

  playChirp(1400, 60);
  lastFrameTime = millis();
}

void loop() {
  M5.update();

  unsigned long now = millis();
  float dt = (now - lastFrameTime) / 1000.0f;
  lastFrameTime = now;
  if (dt > 0.1f) dt = 0.033f;

  // Advance physics & simulation
  engine.update(dt);

  // Button A (Front M5): Jump to next city
  if (M5.BtnA.wasPressed()) {
    engine.jumpToNextCity();
    playChirp(1600, 40);
  }

  // Button B (Side): Cycle speed multiplier (1x -> 2x -> 4x -> 8x)
  if (M5.BtnB.wasPressed()) {
    engine.cycleSpeed();
    playChirp(1200 + (int)(engine.getSpeedMultiplier() * 100), 30);
  }

  // Button B Long Press: Mute / Unmute
  if (M5.BtnB.wasHold()) {
    soundEnabled = !soundEnabled;
    if (soundEnabled) playChirp(1800, 80);
  }

  // Retrieve current calculated state
  TelemetryState telemetry = engine.getTelemetry();

  // Render radar frame to double buffer
  radar.render(engine.getJourneyData(), telemetry, engine.getSpeedMultiplier(), now);

  // Flush to screen (flicker-free)
  canvas.pushSprite(0, 0);

  delay(FRAME_DELAY_MS);
}
