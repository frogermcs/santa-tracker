#include <M5Unified.h>
#include "config.h"
#include "types.h"
#include "core/journey_engine.h"
#include "network/journey_client.h"
#include "network/improv_handler.h"
#include "ui/screen_radar.h"
#include "ui/screen_cockpit.h"
#include "ui/screen_cam.h"

// ============================================================================
// SANTA-OS - Main Application Entrypoint
// Architecture: Core Engine (Advent Calendar) + Network Client + Triple UI Screens
// Hardware: M5StickC-Plus SE (ESP32-PICO-D4, 240x135 ST7789v2 IPS Display)
// ============================================================================

enum ActiveScreen {
  SCREEN_RADAR = 0,
  SCREEN_COCKPIT = 1,
  SCREEN_CAM = 2
};

M5Canvas canvas(&M5.Display);
JourneyEngine engine;
ScreenRadar radar;
ScreenCockpit cockpit;
ScreenCam cam;
ImprovHandler improvHandler;
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

  // Initialize Central European Timezone (CET/CEST) for battery-backed RTC
  setenv("TZ", "CET-1CEST,M3.5.0,M10.5.0/3", 1);
  tzset();

  // Restore persistent hardware RTC clock if enabled
  if (M5.Rtc.isEnabled()) {
    M5.Rtc.setSystemTimeFromRtc();
    time_t bootTime = time(nullptr);
    if (bootTime > 1700000000) {
      struct tm tmBoot;
      localtime_r(&bootTime, &tmBoot);
      Serial.printf("[RTC] Battery-backed BM8563 restored: %02d:%02d:%02d CET\n",
                    tmBoot.tm_hour, tmBoot.tm_min, tmBoot.tm_sec);
    }
  }

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
  cam.init(&canvas);

  // Initialize simulation engine with preloaded Day 24 Grand Finale itinerary
  // (All 24 days / 288 stops are compiled in PROGMEM, so no Wi-Fi is needed to boot!)
  engine.init(24);

  // Initialize Improv Wi-Fi Serial handler (loads credentials from Flash NVS if saved)
  improvHandler.init();

  // If Wi-Fi credentials are provided in config.h and not provisioned yet, attempt fallback
  if (!improvHandler.isConnected() && strlen(DEFAULT_WIFI_SSID) > 0) {
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
  improvHandler.update();

  unsigned long now = millis();
  float dt = (now - lastFrameTime) / 1000.0f;
  lastFrameTime = now;
  if (dt > 0.1f) dt = 0.033f;

  improvHandler.updateTimers((uint32_t)(dt * 1000.0f));
  if (improvHandler.checkJustConnected()) {
    playChirp(2000, 70);
  }
  if (improvHandler.checkJustFailed()) {
    playChirp(600, 90);
  }

  // Advance simulation clock and physics
  engine.update(dt);

  // ========================================================================
  // Unified Button Navigation (Variant 1 — 1:1 Hardware/Simulator Parity)
  // ========================================================================

  // Button A (Front M5) Short Click: Cycle Active Screen (Radar -> Cockpit -> Cam -> Radar)
  if (M5.BtnA.wasClicked()) {
    activeScreen = (ActiveScreen)((activeScreen + 1) % 3);
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
  } else if (activeScreen == SCREEN_COCKPIT) {
    cockpit.render(engine.getJourneyData(), telemetry, now);
  } else {
    cam.render(engine.getJourneyData(), telemetry, now);
  }

  // Top Status Bar Wi-Fi / Sync Micro Dot Indicator (x: 6, y: 6 in top-left corner across all screens)
  if (improvHandler.isConnecting()) {
    bool pulse = (now / 300) % 2 == 0;
    if (pulse) {
      canvas.fillCircle(6, 6, 2, 0xfde0); // Vibrant amber pulsing dot
    }
  } else if (improvHandler.isConnected() || (improvHandler.isRadioSleeping() && improvHandler.isSyncSucceeded())) {
    canvas.fillCircle(6, 6, 2, 0x07e0); // Solid emerald green dot
  } else {
    canvas.drawCircle(6, 6, 2, 0x52aa); // Muted slate ring
  }

  // High-Contrast Wi-Fi Toast Overlay (Connected vs Offline)
  if (improvHandler.hasToast()) {
    ToastType tType = improvHandler.getToastType();
    if (tType == TOAST_CONNECTED) {
      canvas.fillRoundRect(15, 32, 210, 68, 8, 0x0083); // Deep polar navy
      canvas.drawRoundRect(15, 32, 210, 68, 8, 0x07ff); // Electric cyan border
      canvas.drawRoundRect(16, 33, 208, 66, 7, 0x07e0); // Emerald inner accent

      canvas.setTextDatum(top_center);
      canvas.setTextColor(0x07e0, 0x0083); // Emerald
      canvas.drawString("WI-FI: POLACZONO!", 120, 39);

      canvas.setTextColor(0xffff, 0x0083); // Pure white
      char toastLine2[40];
      snprintf(toastLine2, sizeof(toastLine2), "SSID: %s", improvHandler.getSsid());
      canvas.drawString(toastLine2, 120, 56);

      canvas.setTextColor(0x7dff, 0x0083); // Cyan
      canvas.drawString(improvHandler.getFormattedTime(), 120, 73);
    } else if (tType == TOAST_OFFLINE) {
      canvas.fillRoundRect(15, 36, 210, 56, 8, 0x0083); // Deep polar navy (sleek 56px height)
      canvas.drawRoundRect(15, 36, 210, 56, 8, 0xfda0); // Amber outer border
      canvas.drawRoundRect(16, 37, 208, 54, 7, 0xf800); // Coral red inner accent

      canvas.setTextDatum(top_center);
      canvas.setTextColor(0xfda0, 0x0083); // Amber
      canvas.drawString("WI-FI: BRAK POLACZENIA", 120, 45);

      canvas.setTextColor(0xffff, 0x0083); // Pure white
      char toastLine2[40];
      snprintf(toastLine2, sizeof(toastLine2), "SSID: %s", strlen(improvHandler.getSsid()) > 0 ? improvHandler.getSsid() : "BRAK SIECI");
      canvas.drawString(toastLine2, 120, 64);
    }
  }

  // Flush to screen (flicker-free ST7789v2 IPS push)
  canvas.pushSprite(0, 0);

  delay(FRAME_DELAY_MS);
}
