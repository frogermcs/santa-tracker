#include "journey_engine.h"
#include "advent_schedule.h"
#include <math.h>

JourneyEngine::JourneyEngine()
  : _mode(MODE_DEMO), _activeDay(24), _simTime(15.0f), _speedMultiplier(1.0f),
    _calYear(2026), _calMonth(11), _calDay(10) {
  _data.version = 2;
  _data.activeDay = 24;
  _data.secPerCity = 30.0f;
  _data.speedMultiplier = 1.0f;
  _data.cityCount = 0;
  loadAdventDay(24, _data);
}

void JourneyEngine::setCalendarDate(int year, int month, int day) {
  _calYear = year;
  _calMonth = month;
  _calDay = day;
}

bool JourneyEngine::isOffSeason() const {
  return !(_calMonth == 12 && _calDay >= 1 && _calDay <= 24);
}

int JourneyEngine::getDaysUntilAdvent() const {
  if (_calMonth == 12 && _calDay >= 1 && _calDay <= 24) return 0;
  static const int daysBeforeMonth[13] = {0, 0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334};
  int monthClamped = (_calMonth >= 1 && _calMonth <= 12) ? _calMonth : 1;
  int dayOfYear = daysBeforeMonth[monthClamped] + _calDay;
  int adventDayOfYear = daysBeforeMonth[12] + 1; // 335 (Dec 1)
  if (dayOfYear <= adventDayOfYear) {
    return adventDayOfYear - dayOfYear;
  } else {
    return (365 - dayOfYear) + adventDayOfYear;
  }
}

void JourneyEngine::init(int initialDay) {
  setDay(initialDay);
}

void JourneyEngine::setDay(int dayNumber) {
  if (dayNumber < 1) dayNumber = 1;
  if (dayNumber > 24) dayNumber = 24;
  _activeDay = dayNumber;
  loadAdventDay(dayNumber, _data);
  _simTime = (_mode == MODE_REAL) ? 3600.0f : 15.0f; // Start landed at the first stop (matches web companion)
}

void JourneyEngine::nextDay() {
  if (_mode == MODE_REAL) return; // In Real-Time mode, day is determined by calendar clock
  int next = (_activeDay % 24) + 1;
  setDay(next);
}

void JourneyEngine::nextCity() {
  if (_mode == MODE_REAL) return; // In Real-Time mode, cities cannot be skipped manually
  float dur = (_mode == MODE_REAL) ? 7200.0f : 30.0f;
  float flight = (_mode == MODE_REAL) ? 3600.0f : 15.0f;
  if (_data.cityCount == 0 || dur <= 0.0f) return;
  int curIdx = (int)(_simTime / dur);
  int nextIdx = (curIdx + 1) % _data.cityCount;
  // Setting simTime to nextIdx * dur + flight lands Santa immediately at that city
  _simTime = nextIdx * dur + flight;
}

void JourneyEngine::setJourneyData(const JourneyData& data) {
  _data = data;
  if (_data.secPerCity < 1.0f) _data.secPerCity = 30.0f;
  if (_data.activeDay >= 1 && _data.activeDay <= 24) {
    _activeDay = _data.activeDay;
  }
  _simTime = (_mode == MODE_REAL) ? 3600.0f : 15.0f;
}

void JourneyEngine::update(float dt) {
  float dur = (_mode == MODE_REAL) ? 7200.0f : 30.0f;
  float flight = (_mode == MODE_REAL) ? 3600.0f : 15.0f;
  if (_data.cityCount == 0 || dur <= 0.0f) return;

  float totalSimTime = _data.cityCount * dur;

  if (_activeDay == 24) {
    // Day 24 Grand Finale Lock (AGENTS.md Section 5):
    // On arrival at Kraków (Stop 12 after transit flight), Santa lands and permanently
    // locks in the celebration state (FINAŁ: KRAKOW 🎁), never prematurely wrapping back to the Pacific!
    float krakowArrivalTime = (_data.cityCount - 1) * dur + flight;
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

void JourneyEngine::projectCoordinates(float lon, float lat, float& outX, float& outY) {
  outX = ((lon + 180.0f) / 360.0f) * (float)SCREEN_WIDTH;
  outY = 12.0f + ((80.0f - lat) / 138.0f) * 108.0f;
}

TelemetryState JourneyEngine::getTelemetry() const {
  TelemetryState state;
  state.mode = _mode;
  state.activeDay = _activeDay;

  if (_data.cityCount == 0) {
    state.currentCityIdx = 0;
    state.safeIdx = 0;
    state.targetCityIdx = 0;
    state.isFlightPhase = false;
    state.isDay24Finale = false;
    state.isOffSeason = false;
    state.daysUntilAdvent = 0;
    state.santaLon = 0.0f;
    state.santaLat = 0.0f;
    state.santaScreenX = RADAR_CENTER_X;
    state.santaScreenY = RADAR_CENTER_Y;
    state.nextCityName = "UNKNOWN";
    state.etaSeconds = 0;
    state.stepEtaSeconds = 0;
    state.nextStepName = "ODLOT";
    state.progressRatio = 0.0f;
    state.u = 0.0f;
    return state;
  }

  if (_mode == MODE_REAL && isOffSeason()) {
    state.activeDay = 1;
    state.currentCityIdx = 0;
    state.safeIdx = 0;
    state.targetCityIdx = 0;
    state.isFlightPhase = false;
    state.isDay24Finale = false;
    state.isOffSeason = true;
    state.daysUntilAdvent = getDaysUntilAdvent();
    state.santaLon = 0.0f;
    state.santaLat = 90.0f;
    projectCoordinates(0.0f, 90.0f, state.santaScreenX, state.santaScreenY);
    state.nextCityName = "BIEGUN POLNOCNY";
    state.etaSeconds = state.daysUntilAdvent * 86400;
    state.stepEtaSeconds = state.etaSeconds;
    state.nextStepName = "START 01.12";
    state.progressRatio = 0.0f;
    state.u = 0.0f;
    return state;
  }

  float dur = (_mode == MODE_REAL) ? 7200.0f : 30.0f;
  float flight = (_mode == MODE_REAL) ? 3600.0f : 15.0f;

  float totalSimTime = _data.cityCount * dur;
  float effectiveSimTime = (_simTime >= totalSimTime) ? (totalSimTime - 0.001f) : _simTime;
  if (effectiveSimTime < 0.0f) effectiveSimTime = 0.0f;

  int cityIdx = (int)(effectiveSimTime / dur);
  float u = effectiveSimTime - (cityIdx * dur);
  if (u < 0.0f) u = 0.0f;

  int safeIdx = ((cityIdx % _data.cityCount) + _data.cityCount) % _data.cityCount;
  int prevIdx = (safeIdx > 0) ? (safeIdx - 1) : 0;

  bool isLastCity = (safeIdx == _data.cityCount - 1);
  bool isDay24Finale = (_activeDay == 24) && isLastCity && (u >= flight || _simTime >= totalSimTime);

  bool isFlight = !isDay24Finale && (u < flight);
  // Constant linear velocity throughout all in-flight subphases (Warp, Stratosphere, Descent)
  // so progress is equally visible across the entire transit flight (Milestone 4 parity)
  float p = isFlight ? (u / flight) : 1.0f;

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
  state.isOffSeason = false;
  state.daysUntilAdvent = 0;

  state.santaLon = prevLon + (currLon - prevLon) * p;
  state.santaLat = prevLat + (currLat - prevLat) * p;

  projectCoordinates(state.santaLon, state.santaLat, state.santaScreenX, state.santaScreenY);

  float landed = dur - flight;
  if (landed < 1.0f) landed = 1.0f;

  if (isDay24Finale) {
    state.nextCityName = _data.cities[safeIdx].name; // KRAKOW
    state.etaSeconds = 0;
    state.stepEtaSeconds = 0;
    state.nextStepName = "WIGILIA!";
  } else if (isFlight) {
    state.nextCityName = _data.cities[safeIdx].name;
    state.etaSeconds = (int)ceilf(flight - u);

    float tWarp = 0.3f * flight;
    float tStrato = 0.8f * flight;
    if (u < tWarp) {
      state.stepEtaSeconds = (int)ceilf(tWarp - u);
      state.nextStepName = "PRZELOT";
    } else if (u < tStrato) {
      state.stepEtaSeconds = (int)ceilf(tStrato - u);
      state.nextStepName = "ZNIZANIE";
    } else {
      state.stepEtaSeconds = (int)ceilf(flight - u);
      state.nextStepName = "LADOWANIE";
    }
  } else {
    state.nextCityName = _data.cities[safeIdx].name;
    state.etaSeconds = (int)ceilf(dur - u);

    float tGifts = flight + 0.4f * landed;
    float tCookies = flight + 0.8f * landed;
    if (u < tGifts) {
      state.stepEtaSeconds = (int)ceilf(tGifts - u);
      state.nextStepName = "CIASTKA";
    } else if (u < tCookies) {
      state.stepEtaSeconds = (int)ceilf(tCookies - u);
      state.nextStepName = "WZNOSZENIE";
    } else {
      state.stepEtaSeconds = (int)ceilf(dur - u);
      state.nextStepName = "ODLOT";
    }
  }

  state.progressRatio = _simTime / totalSimTime;
  if (state.progressRatio > 1.0f) state.progressRatio = 1.0f;
  state.u = u;

  return state;
}
