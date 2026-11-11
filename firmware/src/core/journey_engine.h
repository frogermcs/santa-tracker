#pragma once
#include "types.h"
#include "config.h"

// ============================================================================
// JourneyEngine - Core Santa Tracker Trajectory & Advent Schedule Simulator
// ============================================================================
// Educational Notes:
// - Deterministic memory model: operates strictly on static memory (PROGMEM).
// - No heap allocation (malloc/new) inside update() or getTelemetry().
// - Simulation cadence: SEC_PER_CITY = 30.0s (15s flight easing + 15s landed stop).
// - Day 24 Grand Finale: Stop 12 (Kraków) arrival lock permanently celebrates in Kraków.
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

  // Operating mode (Demo vs Real-Time) with proportional time-scaling
  void setMode(OperatingMode mode) {
    if (_mode != mode) {
      if (mode == MODE_REAL) {
        _simTime *= (7200.0f / 30.0f);
      } else {
        _simTime /= (7200.0f / 30.0f);
      }
      _mode = mode;
    }
  }
  OperatingMode getMode() const { return _mode; }
  void toggleMode() { setMode((_mode == MODE_DEMO) ? MODE_REAL : MODE_DEMO); }

  // Simulated / live calendar date for Real-Time mode
  void setCalendarDate(int year, int month, int day);
  bool isOffSeason() const;
  int getDaysUntilAdvent() const;

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
  OperatingMode _mode;
  int _activeDay;
  float _simTime;
  float _speedMultiplier;
  int _calYear;
  int _calMonth;
  int _calDay;
};
