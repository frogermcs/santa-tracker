#pragma once
#include "types.h"
#include "config.h"

class JourneyEngine {
public:
  JourneyEngine();

  // Load journey data (from network or fallback)
  void setJourneyData(const JourneyData& data);
  const JourneyData& getJourneyData() const { return _data; }

  // Advance simulation clock by dt seconds
  void update(float dt);

  // User interactions
  void jumpToNextCity();
  void cycleSpeed();
  float getSpeedMultiplier() const { return _speedMultiplier; }

  // Calculate current telemetry state
  TelemetryState getTelemetry() const;

  // Projection math: (lon, lat) -> (screenX, screenY)
  static void projectCoordinates(float lon, float lat, float& outX, float& outY);

private:
  JourneyData _data;
  float _simTime;
  float _speedMultiplier;

  static float easeInOut(float q);
};
