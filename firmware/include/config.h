#pragma once

// ==============================================================
// SANTA-OS Configuration & Constants
// ==============================================================

// Display Dimensions
#define SCREEN_WIDTH        240
#define SCREEN_HEIGHT       135

// Fixed Radar Center
#define RADAR_CENTER_X      120
#define RADAR_CENTER_Y      68

// Wi-Fi Configuration
// Leave SSID empty ("") to operate purely in offline presentation mode
#define DEFAULT_WIFI_SSID       ""
#define DEFAULT_WIFI_PASS       ""
#define WIFI_CONNECT_TIMEOUT_MS 3000   // Fast timeout (3s) so demo boots instantly if offline

// Remote Endpoint (Live Vercel Production Deployment)
#define JOURNEY_API_URL         "https://santa-tracker-five.vercel.app/api/journey"
#define HTTP_TIMEOUT_MS         4000

// Target Frame Rate
#define TARGET_FPS              30
#define FRAME_DELAY_MS          (1000 / TARGET_FPS)
