#pragma once

#if defined(ARDUINO)
  #include <Arduino.h>
#else
  #include <stdint.h>
  #include <stddef.h>
  #include <string.h>
  #include <math.h>
#endif

enum OperatingMode {
  MODE_DEMO = 0,
  MODE_REAL = 1
};

// Represents a city waypoint on Santa's route
struct Waypoint {
  char name[24];
  float lon;
  float lat;
};

// Maximum number of waypoints supported in active memory (12 stops/day standard)
#define MAX_WAYPOINTS 32

// Journey dataset for the active day loaded from PROGMEM or network JSON
struct JourneyData {
  int version;
  int activeDay;           // Advent Day 1..24
  float secPerCity;        // 30.0s per city (15s flight + 15s landed)
  float speedMultiplier;   // 1.0x fixed
  int cityCount;           // Number of stops on active day (12)
  Waypoint cities[MAX_WAYPOINTS];
};

// Real-time calculated telemetry for rendering
struct TelemetryState {
  OperatingMode mode;      // Operating mode (MODE_DEMO or MODE_REAL)
  int activeDay;           // Active Advent Day (1..24)
  int currentCityIdx;      // Simulation city counter
  int safeIdx;             // Clamp/modulo city index (0..cityCount-1)
  int targetCityIdx;       // Target blip index for blink highlight
  bool isFlightPhase;      // true if in transit (u < 15.0s), false if landed
  bool isDay24Finale;      // true if landed at Day 24 Kraków (Stop 12)
  bool isOffSeason;        // true if in Real-Time mode outside Dec 01-24 Advent window
  int daysUntilAdvent;     // Days remaining until December 1st Advent start
  float santaLon;          // Interpolated GPS Longitude
  float santaLat;          // Interpolated GPS Latitude
  float santaScreenX;      // Projected pixel coordinate X (0..240)
  float santaScreenY;      // Projected pixel coordinate Y (12..120)
  const char* nextCityName;// Next or current destination city name
  int etaSeconds;          // Seconds remaining until arrival
  int stepEtaSeconds;      // Seconds remaining until next subphase
  const char* nextStepName;// Name of next subphase (e.g. "PRZELOT", "ZNIZANIE", etc.)
  float progressRatio;     // Overall progress ratio (0.0 .. 1.0)
  float u;                 // Active city cycle time in seconds (0.0 .. 30.0f)
};
