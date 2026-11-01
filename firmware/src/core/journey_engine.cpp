#include "journey_engine.h"
#include "advent_schedule.h"
#include <math.h>

JourneyEngine::JourneyEngine()
  : _activeDay(24), _simTime(15.0f), _speedMultiplier(1.0f) {
  _data.version = 2;
  _data.activeDay = 24;
  _data.secPerCity = 30.0f;
  _data.speedMultiplier = 1.0f;
  _data.cityCount = 0;
  loadAdventDay(24, _data);
}

void JourneyEngine::init(int initialDay) {
  setDay(initialDay);
}

void JourneyEngine::setDay(int dayNumber) {
  if (dayNumber < 1) dayNumber = 1;
  if (dayNumber > 24) dayNumber = 24;
  _activeDay = dayNumber;
  loadAdventDay(dayNumber, _data);
  _simTime = 15.0f; // Start landed at the first stop (matches web companion)
}

void JourneyEngine::nextDay() {
  int next = (_activeDay % 24) + 1;
  setDay(next);
}

void JourneyEngine::nextCity() {
  if (_data.cityCount == 0 || _data.secPerCity <= 0.0f) return;
  int curIdx = (int)(_simTime / _data.secPerCity);
  int nextIdx = (curIdx + 1) % _data.cityCount;
  // Setting simTime to nextIdx * secPerCity + 15 lands Santa immediately at that city
  _simTime = nextIdx * _data.secPerCity + 15.0f;
}

void JourneyEngine::setJourneyData(const JourneyData& data) {
  _data = data;
  if (_data.secPerCity < 1.0f) _data.secPerCity = 30.0f;
  if (_data.activeDay >= 1 && _data.activeDay <= 24) {
    _activeDay = _data.activeDay;
  }
  _simTime = 15.0f;
}

void JourneyEngine::update(float dt) {
  if (_data.cityCount == 0 || _data.secPerCity <= 0.0f) return;

  float totalSimTime = _data.cityCount * _data.secPerCity;

  if (_activeDay == 24) {
    // Day 24 Grand Finale Lock (AGENTS.md Section 5):
    // On arrival at Kraków (Stop 12 after 15s transit flight), Santa lands and permanently
    // locks in the celebration state (FINAŁ: KRAKOW 🎁), never prematurely wrapping back to the Pacific!
    float krakowArrivalTime = (_data.cityCount - 1) * _data.secPerCity + 15.0f;
    _simTime += dt * _speedMultiplier;
    if (_simTime >= krakowArrivalTime) {
      _simTime = krakowArrivalTime;
    }
  } else {
    // Days 1..23: loop through all 12 stops continuously
    _simTime += dt * _speedMultiplier;
    if (totalSimTime > 0.0f) {
      if (_simTime >= totalSimTime || _simTime < 0.0f) {
        _simTime = fmodf(_simTime, totalSimTime);
        if (_simTime < 0.0f) _simTime += totalSimTime;
      }
    }
  }
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
  state.activeDay = _activeDay;

  if (_data.cityCount == 0) {
    state.currentCityIdx = 0;
    state.safeIdx = 0;
    state.targetCityIdx = 0;
    state.isFlightPhase = false;
    state.isDay24Finale = false;
    state.santaLon = 0.0f;
    state.santaLat = 0.0f;
    state.santaScreenX = RADAR_CENTER_X;
    state.santaScreenY = RADAR_CENTER_Y;
    state.nextCityName = "UNKNOWN";
    state.etaSeconds = 0;
    state.progressRatio = 0.0f;
    state.u = 0.0f;
    return state;
  }

  float totalSimTime = _data.cityCount * _data.secPerCity;
  float effectiveSimTime = (_simTime >= totalSimTime) ? (totalSimTime - 0.001f) : _simTime;
  if (effectiveSimTime < 0.0f) effectiveSimTime = 0.0f;

  int cityIdx = (int)(effectiveSimTime / _data.secPerCity);
  float u = effectiveSimTime - (cityIdx * _data.secPerCity);
  if (u < 0.0f) u = 0.0f;

  int safeIdx = ((cityIdx % _data.cityCount) + _data.cityCount) % _data.cityCount;
  int prevIdx = (safeIdx > 0) ? (safeIdx - 1) : 0;

  bool isLastCity = (safeIdx == _data.cityCount - 1);
  bool isDay24Finale = (_activeDay == 24) && isLastCity && (u >= 15.0f || _simTime >= totalSimTime);

  bool isFlight = !isDay24Finale && (u < 15.0f);
  float p = isFlight ? easeInOut(u / 15.0f) : 1.0f;

  float prevLon = _data.cities[prevIdx].lon;
  float prevLat = _data.cities[prevIdx].lat;
  float currLon = _data.cities[safeIdx].lon;
  float currLat = _data.cities[safeIdx].lat;

  state.activeDay = _activeDay;
  state.currentCityIdx = cityIdx;
  state.safeIdx = safeIdx;
  state.targetCityIdx = isFlight ? safeIdx : ((safeIdx + 1) % _data.cityCount);
  state.isFlightPhase = isFlight;
  state.isDay24Finale = isDay24Finale;

  state.santaLon = prevLon + (currLon - prevLon) * p;
  state.santaLat = prevLat + (currLat - prevLat) * p;

  projectCoordinates(state.santaLon, state.santaLat, state.santaScreenX, state.santaScreenY);

  if (isDay24Finale) {
    state.nextCityName = _data.cities[safeIdx].name; // KRAKOW
    state.etaSeconds = 0;
  } else if (isFlight) {
    state.nextCityName = _data.cities[safeIdx].name;
    state.etaSeconds = (int)ceilf(15.0f - u);
  } else {
    state.nextCityName = _data.cities[safeIdx].name;
    state.etaSeconds = (int)ceilf(_data.secPerCity - u);
  }

  state.progressRatio = _simTime / totalSimTime;
  if (state.progressRatio > 1.0f) state.progressRatio = 1.0f;
  state.u = u;

  return state;
}
