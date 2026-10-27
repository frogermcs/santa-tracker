#pragma once

#if defined(ARDUINO)
  #include <Arduino.h>
#else
  #include <stdint.h>
  #include <stddef.h>
  #include <string.h>
  #include <math.h>
#endif

// Represents a city waypoint on Santa's route
struct Waypoint {
  char name[24];
  float lon;
  float lat;
};

// Maximum number of waypoints supported in memory
#define MAX_WAYPOINTS 32

// Full journey dataset loaded from JSON or fallback memory
struct JourneyData {
  int version;
  float secPerCity;
  float speedMultiplier;
  int cityCount;
  Waypoint cities[MAX_WAYPOINTS];
};

// Real-time calculated telemetry for rendering
struct TelemetryState {
  int currentCityIdx;
  int safeIdx;
  int targetCityIdx;
  bool isFlightPhase;
  float santaLon;
  float santaLat;
  float santaScreenX;
  float santaScreenY;
  const char* nextCityName;
  int etaSeconds;
  float progressRatio;
};
