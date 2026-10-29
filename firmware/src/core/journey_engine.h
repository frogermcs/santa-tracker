#pragma once
#include "types.h"
#include "config.h"

// ============================================================================
// JourneyEngine - Core Santa Tracker Trajectory & Advent Schedule Simulator
// ============================================================================
// Educational Notes:
// - Deterministic memory model: operates strictly on static memory (PROGMEM).
// - No heap allocation (malloc/new) inside update() or getTelemetry().
// - Simulation cadence: SEC_PER_CITY = 12.0s (6s flight easing + 6s landed stop).
// - Day 24 Grand Finale: Stop 12 (Kraków) holds celebration state for 16 seconds.
// ============================================================================

class JourneyEngine {
public:
  JourneyEngine();

  // Initialize engine (defaults to Day 24 Grand Finale)
  void init(int initialDay = 24);

  // Directly set journey data (e.g. from Wi-Fi sync)
  void setJourneyData(const JourneyData& data);
  const JourneyData& getJourneyData() const { return _data; }

  // Advent Day switching (Button A: 1 -> 24 -> 1)
  void setDay(int dayNumber);
  void nextDay();
  int getActiveDay() const { return _activeDay; }
  bool isGrandFinale() const { return _activeDay == 24; }

  // City jumping on current day (Button B: 0 -> 11 -> 0)
  void nextCity();

  // Advance simulation clock by dt seconds
  void update(float dt);

  // Speed multiplier (1.0x standard)
  float getSpeedMultiplier() const { return _speedMultiplier; }

  // Calculate current telemetry state for screen rendering
  TelemetryState getTelemetry() const;

  // Projection math: (lon, lat) -> (screenX, screenY)
  // Maps Longitude (-180..+180) to X (0..240)
  // Maps Latitude  (+80..-58)   to Y (12..120)
  static void projectCoordinates(float lon, float lat, float& outX, float& outY);

private:
  JourneyData _data;
  int _activeDay;
  float _simTime;
  float _speedMultiplier;

  // Quadratic ease-in-out interpolation curve matching web ease()
  static float easeInOut(float q);
};
