#include "journey_engine.h"
#include <math.h>

JourneyEngine::JourneyEngine()
  : _simTime(0.0f), _speedMultiplier(1.0f) {
  _data.cityCount = 0;
  _data.secPerCity = 16.0f;
  _data.version = 1;
}

void JourneyEngine::setJourneyData(const JourneyData& data) {
  _data = data;
  if (_data.secPerCity < 1.0f) _data.secPerCity = 16.0f;
  _simTime = 0.0f;
}

void JourneyEngine::update(float dt) {
  if (_data.cityCount == 0) return;

  float totalTime = _data.cityCount * _data.secPerCity;
  _simTime += dt * _speedMultiplier;
  while (_simTime >= totalTime) {
    _simTime -= totalTime;
  }
}

void JourneyEngine::jumpToNextCity() {
  if (_data.cityCount == 0) return;
  int curCity = (int)(_simTime / _data.secPerCity);
  _simTime = (curCity + 1) * _data.secPerCity;
  float totalTime = _data.cityCount * _data.secPerCity;
  if (_simTime >= totalTime) _simTime = 0.0f;
}

void JourneyEngine::cycleSpeed() {
  if (_speedMultiplier == 1.0f) _speedMultiplier = 2.0f;
  else if (_speedMultiplier == 2.0f) _speedMultiplier = 4.0f;
  else if (_speedMultiplier == 4.0f) _speedMultiplier = 8.0f;
  else _speedMultiplier = 1.0f;
}

float JourneyEngine::easeInOut(float q) {
  return q < 0.5f ? 2.0f * q * q : 1.0f - powf(-2.0f * q + 2.0f, 2.0f) / 2.0f;
}

void JourneyEngine::projectCoordinates(float lon, float lat, float& outX, float& outY) {
  outX = ((lon + 180.0f) / 360.0f) * (float)SCREEN_WIDTH;
  outY = 12.0f + ((80.0f - lat) / 138.0f) * 108.0f;
}

TelemetryState JourneyEngine::getTelemetry() const {
  TelemetryState state;
  if (_data.cityCount == 0) {
    state.currentCityIdx = 0;
    state.safeIdx = 0;
    state.targetCityIdx = 0;
    state.isFlightPhase = false;
    state.santaLon = 0;
    state.santaLat = 0;
    state.santaScreenX = RADAR_CENTER_X;
    state.santaScreenY = RADAR_CENTER_Y;
    state.nextCityName = "UNKNOWN";
    state.etaSeconds = 0;
    state.progressRatio = 0.0f;
    return state;
  }

  int cityIdx = (int)(_simTime / _data.secPerCity);
  float u = _simTime - (cityIdx * _data.secPerCity);
  int safeIdx = cityIdx % _data.cityCount;
  int prevIdx = (safeIdx > 0) ? (safeIdx - 1) : 0;

  bool isFlight = (u < 6.0f);
  float p = isFlight ? easeInOut(u / 6.0f) : 1.0f;

  float prevLon = _data.cities[prevIdx].lon;
  float prevLat = _data.cities[prevIdx].lat;
  float currLon = _data.cities[safeIdx].lon;
  float currLat = _data.cities[safeIdx].lat;

  state.currentCityIdx = cityIdx;
  state.safeIdx = safeIdx;
  state.targetCityIdx = isFlight ? safeIdx : ((safeIdx + 1) % _data.cityCount);
  state.isFlightPhase = isFlight;
  state.santaLon = prevLon + (currLon - prevLon) * p;
  state.santaLat = prevLat + (currLat - prevLat) * p;

  projectCoordinates(state.santaLon, state.santaLat, state.santaScreenX, state.santaScreenY);

  state.nextCityName = isFlight
    ? _data.cities[safeIdx].name
    : ((safeIdx < _data.cityCount - 1) ? _data.cities[safeIdx + 1].name : "NORTH POLE");

  state.etaSeconds = isFlight
    ? (int)ceilf(6.0f - u)
    : (int)ceilf(_data.secPerCity - u + 6.0f);

  state.progressRatio = _simTime / (_data.cityCount * _data.secPerCity);

  return state;
}
