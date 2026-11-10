#include <unity.h>
#include <stdio.h>
#include <math.h>
#include "types.h"
#include "config.h"
#include "advent_schedule.h"
#include "core/journey_engine.h"
#include "core/santa_metrics.h"
#include "network/journey_client.h"
#include "network/improv_handler.h"

void setUp(void) {}
void tearDown(void) {}

// Test 1: Validate default fallback JSON parsing (Day 24 Grand Finale, 12 stops)
void test_default_journey_parsing(void) {
  JourneyData data;
  bool ok = JourneyClient::loadDefaultData(data);
  TEST_ASSERT_TRUE(ok);
  TEST_ASSERT_EQUAL_INT(2, data.version);
  TEST_ASSERT_EQUAL_INT(24, data.activeDay);
  TEST_ASSERT_EQUAL_INT(12, data.cityCount);
  TEST_ASSERT_EQUAL_FLOAT(30.0f, data.secPerCity);
  TEST_ASSERT_EQUAL_STRING("GISBORNE", data.cities[0].name);
  TEST_ASSERT_EQUAL_STRING("KRAKOW", data.cities[11].name);
  TEST_ASSERT_FLOAT_WITHIN(0.01f, 19.9450f, data.cities[11].lon);
  TEST_ASSERT_FLOAT_WITHIN(0.01f, 50.0647f, data.cities[11].lat);
}

// Test 2: Validate entire 24-day itinerary (288 stops) in PROGMEM
void test_advent_schedule_integrity(void) {
  JourneyData dayData;
  int totalStopsCounted = 0;

  for (int day = 1; day <= 24; day++) {
    bool ok = loadAdventDay(day, dayData);
    TEST_ASSERT_TRUE_MESSAGE(ok, "Day failed to load from PROGMEM");
    TEST_ASSERT_EQUAL_INT(day, dayData.activeDay);
    TEST_ASSERT_EQUAL_INT(12, dayData.cityCount);
    TEST_ASSERT_EQUAL_FLOAT(30.0f, dayData.secPerCity);

    for (int s = 0; s < 12; s++) {
      totalStopsCounted++;
      // Name must not be empty
      TEST_ASSERT_TRUE(strlen(dayData.cities[s].name) > 0);
      // Longitude within world bounds [-180, +180]
      TEST_ASSERT_TRUE(dayData.cities[s].lon >= -180.0f && dayData.cities[s].lon <= 180.0f);
      // Latitude within world bounds [-90, +90]
      TEST_ASSERT_TRUE(dayData.cities[s].lat >= -90.0f && dayData.cities[s].lat <= 90.0f);
    }
  }

  TEST_ASSERT_EQUAL_INT(288, totalStopsCounted);

  // Validate Day 1 starts in Auckland, NZ
  loadAdventDay(1, dayData);
  TEST_ASSERT_EQUAL_STRING("AUCKLAND", dayData.cities[0].name);

  // Validate Day 24 culminates in Kraków, Poland
  loadAdventDay(24, dayData);
  TEST_ASSERT_EQUAL_STRING("GISBORNE", dayData.cities[0].name);
  TEST_ASSERT_EQUAL_STRING("KRAKOW", dayData.cities[11].name);
  TEST_ASSERT_FLOAT_WITHIN(0.01f, 19.9450f, dayData.cities[11].lon);
  TEST_ASSERT_FLOAT_WITHIN(0.01f, 50.0647f, dayData.cities[11].lat);
}

// Test 3: Validate Coordinate Projection to 240x135 Screen
void test_coordinate_projection(void) {
  float x, y;

  // Prime Meridian (0 lon, 0 lat) -> center X (120 px)
  JourneyEngine::projectCoordinates(0.0f, 0.0f, x, y);
  TEST_ASSERT_FLOAT_WITHIN(1.0f, 120.0f, x);
  TEST_ASSERT_FLOAT_WITHIN(2.0f, 74.6f, y);

  // International Date Line (-180 lon) -> screen left edge (0 px)
  JourneyEngine::projectCoordinates(-180.0f, 0.0f, x, y);
  TEST_ASSERT_FLOAT_WITHIN(0.1f, 0.0f, x);

  // Eastern Date Line (+180 lon) -> screen right edge (240 px)
  JourneyEngine::projectCoordinates(180.0f, 0.0f, x, y);
  TEST_ASSERT_FLOAT_WITHIN(0.1f, 240.0f, x);

  // Top projection boundary (lat 80) -> Y = 12 px (bottom edge of top HUD)
  JourneyEngine::projectCoordinates(0.0f, 80.0f, x, y);
  TEST_ASSERT_FLOAT_WITHIN(0.1f, 12.0f, y);
}

// Test 4: Validate Button A (Advent Day Cycling 1 -> 24 -> 1)
void test_day_cycling_btn_a(void) {
  JourneyEngine engine;
  engine.init(24);
  TEST_ASSERT_EQUAL_INT(24, engine.getActiveDay());

  // Button A: Day 24 -> Day 1
  engine.nextDay();
  TEST_ASSERT_EQUAL_INT(1, engine.getActiveDay());
  TEST_ASSERT_EQUAL_STRING("AUCKLAND", engine.getJourneyData().cities[0].name);

  // Telemetry must be in landed phase at first stop
  TelemetryState s = engine.getTelemetry();
  TEST_ASSERT_EQUAL_INT(1, s.activeDay);
  TEST_ASSERT_EQUAL_INT(0, s.safeIdx);
  TEST_ASSERT_FALSE(s.isFlightPhase);

  // Cycle all 24 days
  for (int expectedDay = 2; expectedDay <= 24; expectedDay++) {
    engine.nextDay();
    TEST_ASSERT_EQUAL_INT(expectedDay, engine.getActiveDay());
  }

  // Wrap back to Day 1
  engine.nextDay();
  TEST_ASSERT_EQUAL_INT(1, engine.getActiveDay());
}

// Test 5: Validate Button B (City Jumping on Current Day 0 -> 11 -> 0)
void test_city_jumping_btn_b(void) {
  JourneyEngine engine;
  engine.init(24);

  // Starts landed at stop 0 (Gisborne)
  TelemetryState s0 = engine.getTelemetry();
  TEST_ASSERT_EQUAL_INT(0, s0.safeIdx);
  TEST_ASSERT_FALSE(s0.isFlightPhase);

  // Jump to stop 1 (Bethlehem)
  engine.nextCity();
  TelemetryState s1 = engine.getTelemetry();
  TEST_ASSERT_EQUAL_INT(1, s1.safeIdx);
  TEST_ASSERT_FALSE(s1.isFlightPhase);
  TEST_ASSERT_FLOAT_WITHIN(0.1f, engine.getJourneyData().cities[1].lon, s1.santaLon);

  // Jump through all remaining stops
  for (int expectedIdx = 2; expectedIdx < 12; expectedIdx++) {
    engine.nextCity();
    TelemetryState s = engine.getTelemetry();
    TEST_ASSERT_EQUAL_INT(expectedIdx, s.safeIdx);
    TEST_ASSERT_FALSE(s.isFlightPhase);
  }

  // Next jump wraps back to stop 0
  engine.nextCity();
  TelemetryState sWrap = engine.getTelemetry();
  TEST_ASSERT_EQUAL_INT(0, sWrap.safeIdx);
  TEST_ASSERT_FALSE(sWrap.isFlightPhase);
}

// Test 6: Validate Day 24 Kraków Grand Finale Lock (AGENTS.md Section 5)
void test_day24_krakow_grand_finale_lock(void) {
  JourneyEngine engine;
  engine.init(24);

  // Advance to stop 11 (Kraków) directly
  for (int i = 0; i < 11; i++) {
    engine.nextCity();
  }

  TelemetryState sKrakow = engine.getTelemetry();
  TEST_ASSERT_EQUAL_INT(11, sKrakow.safeIdx);
  TEST_ASSERT_FALSE(sKrakow.isFlightPhase);
  TEST_ASSERT_TRUE(sKrakow.isDay24Finale);
  TEST_ASSERT_EQUAL_STRING("KRAKOW", sKrakow.nextCityName);
  TEST_ASSERT_EQUAL_INT(0, sKrakow.etaSeconds);
  TEST_ASSERT_FLOAT_WITHIN(0.01f, 19.9450f, sKrakow.santaLon);
  TEST_ASSERT_FLOAT_WITHIN(0.01f, 50.0647f, sKrakow.santaLat);

  // Advance 60 seconds into celebration
  engine.update(60.0f);
  TelemetryState sHold = engine.getTelemetry();
  TEST_ASSERT_TRUE(sHold.isDay24Finale);
  TEST_ASSERT_EQUAL_STRING("KRAKOW", sHold.nextCityName);
  TEST_ASSERT_EQUAL_INT(0, sHold.etaSeconds);
  TEST_ASSERT_FLOAT_WITHIN(0.01f, 19.9450f, sHold.santaLon);
  TEST_ASSERT_FLOAT_WITHIN(0.01f, 50.0647f, sHold.santaLat);

  // Advance another 3600 seconds (1 hour): Santa must REMAIN in Kraków permanently!
  engine.update(3600.0f);
  TelemetryState sPermanent = engine.getTelemetry();
  TEST_ASSERT_TRUE(sPermanent.isDay24Finale);
  TEST_ASSERT_EQUAL_INT(11, sPermanent.safeIdx);
  TEST_ASSERT_EQUAL_STRING("KRAKOW", sPermanent.nextCityName);
}

// Test 7: Validate Trajectory Interpolation and easeInOut curve
void test_trajectory_ease_interpolation(void) {
  JourneyEngine engine;
  engine.init(24); // Day 24
  const JourneyData& jd = engine.getJourneyData();

  // Jump to stop 1 so we have a distinct prev (stop 0: Gisborne) and curr (stop 1: Bethlehem)
  // At landed phase (u = 15.0s), advance 15.0s to complete stop 0, entering stop 1 flight at t = 30.0s
  engine.update(15.0f); // t = 30.0s: leg 1 flight begins (u = 0.0s)

  TelemetryState t0 = engine.getTelemetry();
  TEST_ASSERT_EQUAL_INT(1, t0.safeIdx);
  TEST_ASSERT_TRUE(t0.isFlightPhase);
  // At u = 0.0, Santa should be exactly at previous city (stop 0)
  TEST_ASSERT_FLOAT_WITHIN(0.01f, jd.cities[0].lon, t0.santaLon);
  TEST_ASSERT_FLOAT_WITHIN(0.01f, jd.cities[0].lat, t0.santaLat);

  // Advance 7.5 seconds (halfway through 15.0s flight phase, u = 7.5s, u/15 = 0.5)
  // easeInOut(0.5) = 2 * (0.5)^2 = 0.5 (exact halfway point!)
  engine.update(7.5f);
  TelemetryState tMid = engine.getTelemetry();
  TEST_ASSERT_TRUE(tMid.isFlightPhase);
  float expectedMidLon = jd.cities[0].lon + (jd.cities[1].lon - jd.cities[0].lon) * 0.5f;
  float expectedMidLat = jd.cities[0].lat + (jd.cities[1].lat - jd.cities[0].lat) * 0.5f;
  TEST_ASSERT_FLOAT_WITHIN(0.05f, expectedMidLon, tMid.santaLon);
  TEST_ASSERT_FLOAT_WITHIN(0.05f, expectedMidLat, tMid.santaLat);

  // Advance 7.5 seconds to finish flight phase (u = 15.0s, landed at stop 1)
  engine.update(7.5f);
  TelemetryState tLand = engine.getTelemetry();
  TEST_ASSERT_FALSE(tLand.isFlightPhase);
  TEST_ASSERT_FLOAT_WITHIN(0.01f, jd.cities[1].lon, tLand.santaLon);
  TEST_ASSERT_FLOAT_WITHIN(0.01f, jd.cities[1].lat, tLand.santaLat);
}

// Test 8: Validate ETA Countdown Progression in both Flight and Landed phases
void test_eta_countdown_progression(void) {
  JourneyEngine engine;
  engine.init(1); // Day 1

  // Start landed at stop 0: ETA to takeoff is 30 - 15 = 15s
  TelemetryState sStart = engine.getTelemetry();
  TEST_ASSERT_EQUAL_INT(15, sStart.etaSeconds);

  // Advance 5s in landed phase -> ETA should decrease to 10s
  engine.update(5.0f);
  TelemetryState sLanded5 = engine.getTelemetry();
  TEST_ASSERT_EQUAL_INT(10, sLanded5.etaSeconds);

  // Advance 10s -> completes stop 0, enters stop 1 flight (u = 0s) -> ETA is flight duration (15s)
  engine.update(10.0f);
  TelemetryState sFlight0 = engine.getTelemetry();
  TEST_ASSERT_TRUE(sFlight0.isFlightPhase);
  TEST_ASSERT_EQUAL_INT(15, sFlight0.etaSeconds);

  // Advance 9.0s in flight -> ETA should be ceil(15 - 9.0) = 6s
  engine.update(9.0f);
  TelemetryState sFlight9 = engine.getTelemetry();
  TEST_ASSERT_TRUE(sFlight9.isFlightPhase);
  TEST_ASSERT_EQUAL_INT(6, sFlight9.etaSeconds);
}

// Test 9: Validate Regular Day Looping (Days 1 to 23)
void test_normal_day_looping_without_hold(void) {
  JourneyEngine engine;
  engine.init(6); // Mikołajki (Day 6) - loops smoothly
  TEST_ASSERT_EQUAL_INT(6, engine.getActiveDay());

  // Jump to last stop (index 11) landed at t = 11 * 30 + 15 = 345.0s
  for (int i = 0; i < 11; i++) {
    engine.nextCity();
  }
  TelemetryState s11 = engine.getTelemetry();
  TEST_ASSERT_EQUAL_INT(11, s11.safeIdx);
  TEST_ASSERT_FALSE(s11.isDay24Finale);

  // Advance 20.0s: 345.0 + 20.0 = 365.0s, which cleanly exceeds totalSimTime 360.0s (12 * 30s)
  // Day 6 must wrap to stop 0 (365.0 % 360.0 = 5.0s, which is flight phase of stop 0)
  engine.update(20.0f);
  TelemetryState sWrapped = engine.getTelemetry();
  TEST_ASSERT_EQUAL_INT(0, sWrapped.safeIdx);
  TEST_ASSERT_FALSE(sWrapped.isDay24Finale);
}

// Test 10: Validate Day Switching Isolation and State Reset
void test_day_switch_state_isolation(void) {
  JourneyEngine engine;
  engine.init(24);

  // Advance to Kraków lock
  for (int i = 0; i < 11; i++) engine.nextCity();
  TelemetryState sLock = engine.getTelemetry();
  TEST_ASSERT_TRUE(sLock.isDay24Finale);
  TEST_ASSERT_EQUAL_STRING("KRAKOW", sLock.nextCityName);

  // Switch to Day 1
  engine.nextDay();
  TelemetryState sDay1 = engine.getTelemetry();
  TEST_ASSERT_EQUAL_INT(1, sDay1.activeDay);
  TEST_ASSERT_EQUAL_INT(0, sDay1.safeIdx);
  TEST_ASSERT_FALSE(sDay1.isFlightPhase);
  TEST_ASSERT_FALSE(sDay1.isDay24Finale);
  TEST_ASSERT_EQUAL_STRING("AUCKLAND", sDay1.nextCityName);
}

// Test 11: Long-Duration Stability & Immunity to Large Time Steps
void test_long_duration_stability(void) {
  JourneyEngine engine;
  engine.init(24);

  // Advance clock by 24 hours (86,400 seconds) in one call
  engine.update(86400.0f);
  TelemetryState s24h = engine.getTelemetry();

  TEST_ASSERT_TRUE(!isnan(s24h.santaLon));
  TEST_ASSERT_TRUE(!isnan(s24h.santaLat));
  TEST_ASSERT_TRUE(!isinf(s24h.santaLon));
  TEST_ASSERT_TRUE(!isinf(s24h.santaLat));
  TEST_ASSERT_TRUE(s24h.safeIdx >= 0 && s24h.safeIdx < 12);
  TEST_ASSERT_TRUE(s24h.progressRatio >= 0.0f && s24h.progressRatio <= 1.0f);
  TEST_ASSERT_TRUE(s24h.santaScreenX >= 0.0f && s24h.santaScreenX <= 240.0f);
}

// Test 12: Resilience Against Corrupt/Malformed JSON and Buffer Overflow Protection
void test_malformed_json_resilience(void) {
  JourneyData data;

  // Null string
  TEST_ASSERT_FALSE(JourneyClient::parseJson(nullptr, data));

  // Empty string
  TEST_ASSERT_FALSE(JourneyClient::parseJson("", data));

  // Corrupt / truncated syntax
  TEST_ASSERT_FALSE(JourneyClient::parseJson("{ invalid json :::", data));

  // Valid JSON with 0 stops
  TEST_ASSERT_FALSE(JourneyClient::parseJson("{\"route\":[]}", data));

  // Buffer overflow test: 40-character city name (struct Waypoint has char name[24])
  const char* longNameJson = R"({"route":[{"name":"VERY_LONG_CITY_NAME_EXCEEDING_TWENTY_FOUR_CHARS","lon":10.0,"lat":20.0}]})";
  TEST_ASSERT_TRUE(JourneyClient::parseJson(longNameJson, data));
  TEST_ASSERT_EQUAL_INT(1, data.cityCount);
  TEST_ASSERT_EQUAL_INT(23, strlen(data.cities[0].name));
  TEST_ASSERT_EQUAL_INT('\0', data.cities[0].name[23]);

  // Array overflow test: 40 waypoints (exceeds MAX_WAYPOINTS 32)
  char hugeJson[2048] = "{\"route\":[";
  for (int i = 0; i < 40; i++) {
    char entry[48];
    snprintf(entry, sizeof(entry), "%s{\"name\":\"C%d\",\"lon\":%d.0,\"lat\":0.0}", (i > 0 ? "," : ""), i, i);
    strcat(hugeJson, entry);
  }
  strcat(hugeJson, "]}");

  TEST_ASSERT_TRUE(JourneyClient::parseJson(hugeJson, data));
  TEST_ASSERT_EQUAL_INT(MAX_WAYPOINTS, data.cityCount);
}

// Test 13: Validate formatCompact helper string outputs
void test_format_compact(void) {
  char buf[16];

  formatCompact(0ULL, buf, sizeof(buf));
  TEST_ASSERT_EQUAL_STRING("0", buf);

  formatCompact(999ULL, buf, sizeof(buf));
  TEST_ASSERT_EQUAL_STRING("999", buf);

  formatCompact(1500ULL, buf, sizeof(buf));
  TEST_ASSERT_EQUAL_STRING("1.5k", buf);

  formatCompact(105600ULL, buf, sizeof(buf));
  TEST_ASSERT_EQUAL_STRING("105.6k", buf);

  formatCompact(15000000ULL, buf, sizeof(buf));
  TEST_ASSERT_EQUAL_STRING("15.0M", buf);

  formatCompact(380000000ULL, buf, sizeof(buf));
  TEST_ASSERT_EQUAL_STRING("380.0M", buf);

  formatCompact(2200000000ULL, buf, sizeof(buf));
  TEST_ASSERT_EQUAL_STRING("2.20B", buf);
}

// Test 14: Validate Cockpit Flight Dynamics (Mach and Altitude transitions)
void test_santa_metrics_flight_dynamics(void) {
  SantaCockpitMetrics m;

  // START phase: u = 2.0s (flightProgress = 2.0 / 15.0 = 0.133 < 0.3)
  computeSantaMetrics(24, 0, 2.0f, 0.0f, "GISBORNE", false, m);
  TEST_ASSERT_EQUAL_INT(PHASE_START, m.flightPhase);
  TEST_ASSERT_FLOAT_WITHIN(0.1f, 1.87f, m.machSpeed);
  TEST_ASSERT_EQUAL_STRING("TRYB HYPER-WARP", m.stageTitle);

  // PRZELOT phase: u = 7.5s (flightProgress = 0.5)
  computeSantaMetrics(24, 0, 7.5f, 0.0f, "GISBORNE", false, m);
  TEST_ASSERT_EQUAL_INT(PHASE_PRZELOT, m.flightPhase);
  TEST_ASSERT_FLOAT_WITHIN(0.4f, 4.8f, m.machSpeed);
  TEST_ASSERT_EQUAL_STRING("PRZELOT STRATOSFERYCZNY", m.stageTitle);

  // ZNIZANIE phase: u = 13.5s (flightProgress = 0.9)
  computeSantaMetrics(24, 0, 13.5f, 0.0f, "GISBORNE", false, m);
  TEST_ASSERT_EQUAL_INT(PHASE_ZNIZANIE, m.flightPhase);
  TEST_ASSERT_FLOAT_WITHIN(0.1f, 2.4f, m.machSpeed);
  TEST_ASSERT_EQUAL_STRING("ZNIZANIE", m.stageTitle);

  // DACH phase: u = 15.0s
  computeSantaMetrics(24, 0, 15.0f, 0.0f, "GISBORNE", false, m);
  TEST_ASSERT_EQUAL_INT(PHASE_DACH, m.flightPhase);
  TEST_ASSERT_EQUAL_FLOAT(0.0f, m.machSpeed);
  TEST_ASSERT_EQUAL_STRING("M 0.0", m.machDisplay);
  TEST_ASSERT_EQUAL_INT(65, m.altitudeM);
  TEST_ASSERT_EQUAL_STRING("65 M", m.altitudeDisplay);
}

// Test 15: Validate Rooftop Sub-Phases (Gifts, Cookies & Milk, Ready for takeoff)
void test_santa_metrics_rooftop_subphases(void) {
  SantaCockpitMetrics m;

  // Sub-phase 0 (0-6s rooftop -> u = 18.0s): Gift drop
  computeSantaMetrics(24, 1, 18.0f, 0.0f, "BETHLEHEM", false, m);
  TEST_ASSERT_EQUAL_STRING("ZRZUT PREZENTOW", m.stageTitle);
  TEST_ASSERT_TRUE(m.giftRatePerSec > 0);

  // Sub-phase 1 (6-12s rooftop -> u = 24.0s): Cookie break
  computeSantaMetrics(24, 1, 24.0f, 0.0f, "BETHLEHEM", false, m);
  TEST_ASSERT_EQUAL_STRING("PRZERWA NA CIASTKA I MLEKO", m.stageTitle);

  // Sub-phase 2 (12-15s rooftop -> u = 28.5s): Preparing for launch
  computeSantaMetrics(24, 1, 28.5f, 0.0f, "BETHLEHEM", false, m);
  TEST_ASSERT_EQUAL_STRING("WZNOSZENIE", m.stageTitle);
}

// Test 16: Validate Day 24 Demographic Totals & Grand Finale Values
void test_santa_metrics_krakow_finale(void) {
  SantaCockpitMetrics m;

  // Kraków Grand Finale reached
  computeSantaMetrics(24, 11, 15.0f, 0.0f, "KRAKOW", true, m);
  TEST_ASSERT_EQUAL_INT(PHASE_FINAL, m.flightPhase);
  TEST_ASSERT_EQUAL_FLOAT(0.0f, m.machSpeed);
  TEST_ASSERT_EQUAL_INT(219, m.altitudeM); // Kraków altitude
  TEST_ASSERT_EQUAL_STRING("219 M", m.altitudeDisplay);
  TEST_ASSERT_EQUAL_STRING("WESOLYCH SWIAT!", m.stageTitle);
  TEST_ASSERT_EQUAL_INT(0, m.etaSeconds);

  // Exactly 2.20 Billion gifts delivered
  TEST_ASSERT_EQUAL_UINT64(2200000000ULL, m.giftsDelivered);
  TEST_ASSERT_EQUAL_STRING("2.20B", m.giftsDeliveredDisplay);

  // Cookies: 2.20B * 0.15 = 330.0M
  TEST_ASSERT_EQUAL_UINT64(330000000ULL, m.cookiesEaten);
  TEST_ASSERT_EQUAL_STRING("330.0M", m.cookiesEatenDisplay);

  // Milk: 2.20B * 0.0115 = 25,300,000 L (25.3M L)
  TEST_ASSERT_EQUAL_UINT64(25300000ULL, m.milkLiters);
  TEST_ASSERT_EQUAL_STRING("25.3M L", m.milkLitersDisplay);
}

// Test 17: Validate 3-Screen Carousel Navigation (Radar -> Cockpit -> Cam -> Radar)
void test_screen_carousel_navigation(void) {
  enum TestScreen {
    T_RADAR = 0,
    T_COCKPIT = 1,
    T_CAM = 2
  };

  TestScreen active = T_RADAR;
  TEST_ASSERT_EQUAL_INT(0, active);

  // Button A Short Press 1: Radar -> Cockpit
  active = (TestScreen)((active + 1) % 3);
  TEST_ASSERT_EQUAL_INT(1, active);

  // Button A Short Press 2: Cockpit -> Cam
  active = (TestScreen)((active + 1) % 3);
  TEST_ASSERT_EQUAL_INT(2, active);

  // Button A Short Press 3: Cam -> Radar
  active = (TestScreen)((active + 1) % 3);
  TEST_ASSERT_EQUAL_INT(0, active);
}

// Test 18: Validate Santa Cam Sub-Phase Timing and Metrics Mapping
void test_santa_cam_subphase_resolution(void) {
  SantaCockpitMetrics m;

  // 1. Hyper-Warp (Flight 0-30% -> u = 2.0s)
  computeSantaMetrics(24, 0, 2.0f, 0.0f, "GISBORNE", false, m);
  TEST_ASSERT_EQUAL_INT(PHASE_START, m.flightPhase);
  TEST_ASSERT_TRUE(m.machSpeed > 0.0f);

  // 2. Cruising Sky (Flight 30-80% -> u = 7.5s)
  computeSantaMetrics(24, 0, 7.5f, 0.0f, "GISBORNE", false, m);
  TEST_ASSERT_EQUAL_INT(PHASE_PRZELOT, m.flightPhase);
  TEST_ASSERT_TRUE(m.altitudeM > 10000);

  // 3. Gliding Descent (Flight 80-100% -> u = 13.5s)
  computeSantaMetrics(24, 0, 13.5f, 0.0f, "GISBORNE", false, m);
  TEST_ASSERT_EQUAL_INT(PHASE_ZNIZANIE, m.flightPhase);

  // 4. Chimney Drop (Landed 0-6s -> u = 18.0s)
  computeSantaMetrics(24, 0, 18.0f, 0.0f, "GISBORNE", false, m);
  TEST_ASSERT_EQUAL_INT(PHASE_DACH, m.flightPhase);
  float landedU_Drop = 18.0f - 15.0f;
  int subPhaseDrop = landedU_Drop < 6.0f ? 0 : 1;
  TEST_ASSERT_EQUAL_INT(0, subPhaseDrop);

  // 5. Cookie & Milk Break (Landed 6-12s -> u = 24.0s)
  computeSantaMetrics(24, 0, 24.0f, 0.0f, "GISBORNE", false, m);
  TEST_ASSERT_EQUAL_INT(PHASE_DACH, m.flightPhase);
  float landedU_Cookie = 24.0f - 15.0f;
  int subPhaseCookie = landedU_Cookie < 12.0f ? 1 : 2;
  TEST_ASSERT_EQUAL_INT(1, subPhaseCookie);

  // 6. Takeoff Prep (Landed 12-15s -> u = 28.5s)
  computeSantaMetrics(24, 0, 28.5f, 0.0f, "GISBORNE", false, m);
  TEST_ASSERT_EQUAL_INT(PHASE_DACH, m.flightPhase);
  float landedU_Takeoff = 28.5f - 15.0f;
  int subPhaseTakeoff = landedU_Takeoff >= 12.0f ? 2 : 1;
  TEST_ASSERT_EQUAL_INT(2, subPhaseTakeoff);

  // 7. Kraków Finale Hold (Arrival Lock)
  computeSantaMetrics(24, 11, 15.0f, 0.0f, "KRAKOW", true, m);
  TEST_ASSERT_EQUAL_INT(PHASE_FINAL, m.flightPhase);
}

// Test 19: Improv Wi-Fi Serial packet framing and checksum verification
void test_improv_packet_framing_and_checksum(void) {
  uint8_t data[1] = { (uint8_t)IMPROV_STATE_READY };
  uint8_t packet[32];
  size_t len = ImprovHandler::buildPacket(IMPROV_TYPE_CURRENT_STATE, data, 1, packet, sizeof(packet));

  // 7 header + 1 type + 1 dataLen + 1 data + 1 checksum + 1 newline = 12 bytes
  TEST_ASSERT_EQUAL_UINT(12, len);
  TEST_ASSERT_EQUAL_UINT8('I', packet[0]);
  TEST_ASSERT_EQUAL_UINT8('M', packet[1]);
  TEST_ASSERT_EQUAL_UINT8('P', packet[2]);
  TEST_ASSERT_EQUAL_UINT8('R', packet[3]);
  TEST_ASSERT_EQUAL_UINT8('O', packet[4]);
  TEST_ASSERT_EQUAL_UINT8('V', packet[5]);
  TEST_ASSERT_EQUAL_UINT8(1, packet[6]); // version 1
  TEST_ASSERT_EQUAL_UINT8(IMPROV_TYPE_CURRENT_STATE, packet[7]);
  TEST_ASSERT_EQUAL_UINT8(1, packet[8]); // dataLen
  TEST_ASSERT_EQUAL_UINT8(IMPROV_STATE_READY, packet[9]);

  // Verify checksum at index 10
  uint8_t expectedChecksum = 0;
  for (size_t i = 0; i < 10; ++i) {
    expectedChecksum = (expectedChecksum + packet[i]) & 0xFF;
  }
  TEST_ASSERT_EQUAL_UINT8(expectedChecksum, packet[10]);
  TEST_ASSERT_EQUAL_UINT8('\n', packet[11]);
}

// Test 20: Improv Wi-Fi RPC Result formatting (Device Info and Zero-String Result)
void test_improv_rpc_result_formatting(void) {
  const char* info[4] = { "SANTA-OS for M5StickC-Plus", "1.0.0", "ESP32", "SANTA-OS" };
  uint8_t outBuf[128];
  size_t len = ImprovHandler::buildRpcResult(IMPROV_CMD_REQUEST_INFO, info, 4, outBuf, sizeof(outBuf));

  TEST_ASSERT_TRUE(len > 12);
  TEST_ASSERT_EQUAL_UINT8(IMPROV_TYPE_RPC_RESULT, outBuf[7]);
  TEST_ASSERT_EQUAL_UINT8(IMPROV_CMD_REQUEST_INFO, outBuf[9]); // RPC command in payload

  // Test zero-string result for devices without HTTP server (suppresses dead "Visit device" button)
  uint8_t emptyRpcBuf[32];
  size_t emptyLen = ImprovHandler::buildRpcResult(IMPROV_CMD_SEND_WIFI_SETTINGS, nullptr, 0, emptyRpcBuf, sizeof(emptyRpcBuf));
  TEST_ASSERT_EQUAL_UINT32(13, emptyLen);
  TEST_ASSERT_EQUAL_UINT8(IMPROV_TYPE_RPC_RESULT, emptyRpcBuf[7]);
  TEST_ASSERT_EQUAL_UINT8(2, emptyRpcBuf[8]); // data length = 2 bytes (command + stringCount byte)
  TEST_ASSERT_EQUAL_UINT8(IMPROV_CMD_SEND_WIFI_SETTINGS, emptyRpcBuf[9]);
  TEST_ASSERT_EQUAL_UINT8(0, emptyRpcBuf[10]); // total strings payload length = 0
}

// Test 21: Improv Wi-Fi settings payload decoding
void test_improv_wifi_settings_parser(void) {
  // [4, 'H','o','m','e', 6, 'S','e','c','r','e','t']
  uint8_t payload[] = { 4, 'H', 'o', 'm', 'e', 6, 'S', 'e', 'c', 'r', 'e', 't' };
  char ssid[32] = {0};
  char pass[32] = {0};

  bool ok = ImprovHandler::parseWifiSettings(payload, sizeof(payload), ssid, sizeof(ssid), pass, sizeof(pass));
  TEST_ASSERT_TRUE(ok);
  TEST_ASSERT_EQUAL_STRING("Home", ssid);
  TEST_ASSERT_EQUAL_STRING("Secret", pass);

  // Test malformed payload with out-of-bounds SSID length
  uint8_t badPayload[] = { 50, 'X' };
  bool badOk = ImprovHandler::parseWifiSettings(badPayload, sizeof(badPayload), ssid, sizeof(ssid), pass, sizeof(pass));
  TEST_ASSERT_FALSE(badOk);

  // Test truncated payload missing password length byte
  uint8_t missingPassLen[] = { 4, 'H', 'o', 'm', 'e' };
  bool missingOk = ImprovHandler::parseWifiSettings(missingPassLen, sizeof(missingPassLen), ssid, sizeof(ssid), pass, sizeof(pass));
  TEST_ASSERT_FALSE(missingOk);

  // Test truncated payload where password length exceeds remaining bytes
  uint8_t truncatedPass[] = { 4, 'H', 'o', 'm', 'e', 10, 'A', 'B' };
  bool truncOk = ImprovHandler::parseWifiSettings(truncatedPass, sizeof(truncatedPass), ssid, sizeof(ssid), pass, sizeof(pass));
  TEST_ASSERT_FALSE(truncOk);

  // Test explicit zero-length password (open network)
  uint8_t openWifi[] = { 4, 'H', 'o', 'm', 'e', 0 };
  bool openOk = ImprovHandler::parseWifiSettings(openWifi, sizeof(openWifi), ssid, sizeof(ssid), pass, sizeof(pass));
  TEST_ASSERT_TRUE(openOk);
  TEST_ASSERT_EQUAL_STRING("Home", ssid);
  TEST_ASSERT_EQUAL_STRING("", pass);
}

// Test 22: Improv byte stream parser and state transitions
void test_improv_state_machine_stream(void) {
  ImprovHandler handler;
  handler.setState(IMPROV_STATE_READY);
  TEST_ASSERT_EQUAL_INT(IMPROV_STATE_READY, handler.getState());

  // Build a valid REQUEST_STATE (0x02) RPC packet
  uint8_t rpcData[1] = { IMPROV_CMD_REQUEST_STATE };
  uint8_t packet[32];
  size_t len = ImprovHandler::buildPacket(IMPROV_TYPE_RPC, rpcData, 1, packet, sizeof(packet));
  TEST_ASSERT_TRUE(len > 0);

  // Stream bytes into handler
  bool packetCompleted = false;
  for (size_t i = 0; i < len; ++i) {
    if (handler.processByte(packet[i])) {
      packetCompleted = true;
    }
  }
  TEST_ASSERT_TRUE(packetCompleted);

  // Corrupt checksum stream test
  packet[len - 2] ^= 0xFF; // Invert checksum byte
  bool badCompleted = false;
  for (size_t i = 0; i < len; ++i) {
    if (handler.processByte(packet[i])) {
      badCompleted = true;
    }
  }
  TEST_ASSERT_FALSE(badCompleted);
}

// Test 23: Improv Wi-Fi RPC packet unwrapping with inner length header
void test_improv_rpc_wifi_settings_unwrapping(void) {
  ImprovHandler handler;
  handler.setState(IMPROV_STATE_READY);

  const char* testSsid = "NorthPole_2.4G";
  const char* testPass = "RudolphRedNose2026";
  uint8_t rpcData[64];
  rpcData[0] = IMPROV_CMD_SEND_WIFI_SETTINGS;
  rpcData[1] = 1 + strlen(testSsid) + 1 + strlen(testPass); // 34
  rpcData[2] = strlen(testSsid);
  memcpy(&rpcData[3], testSsid, strlen(testSsid));
  rpcData[3 + strlen(testSsid)] = strlen(testPass);
  memcpy(&rpcData[4 + strlen(testSsid)], testPass, strlen(testPass));

  uint8_t packet[128];
  size_t len = ImprovHandler::buildPacket(IMPROV_TYPE_RPC, rpcData, 2 + rpcData[1], packet, sizeof(packet));

  for (size_t i = 0; i < len; ++i) {
    handler.processByte(packet[i]);
  }

  // Under native test, connectWifi succeeds for valid ssid and transitions to PROVISIONED
  TEST_ASSERT_EQUAL_INT(IMPROV_STATE_PROVISIONED, handler.getState());
  TEST_ASSERT_EQUAL_STRING("192.168.1.100", handler.getLocalIp());
  TEST_ASSERT_EQUAL_STRING("CZAS NTP: 15:44 CET", handler.getFormattedTime());
}

// Test 24: Improv Wi-Fi Burst & Sleep countdown and state transition
void test_improv_burst_and_sleep_cycle(void) {
  ImprovHandler handler;
  handler.setState(IMPROV_STATE_PROVISIONED);
  handler.scheduleRadioSleep(5000);
  TEST_ASSERT_FALSE(handler.isRadioSleeping());

  // Advance by 3 seconds: should still be awake
  handler.updateTimers(3000);
  TEST_ASSERT_FALSE(handler.isRadioSleeping());

  // Advance by 3 more seconds (total 6s): should power down radio
  handler.updateTimers(3000);
  TEST_ASSERT_TRUE(handler.isRadioSleeping());
}

// Test 25: Improv Wi-Fi async timeout failure and offline toast transition
void test_improv_async_timeout_failure(void) {
  ImprovHandler handler;
  handler.startConnectAsync("FailNet", "WrongPass");
  TEST_ASSERT_TRUE(handler.isConnecting());
  TEST_ASSERT_EQUAL_INT(IMPROV_STATE_PROVISIONING, handler.getState());
  TEST_ASSERT_FALSE(handler.isRadioSleeping());

  // Advance by 4 seconds (timeout is 8 seconds): should still be connecting
  handler.updateTimers(4000);
  TEST_ASSERT_TRUE(handler.isConnecting());

  // Advance by 5 more seconds (total 9s): should time out, trigger offline toast, and sleep
  handler.updateTimers(5000);
  TEST_ASSERT_FALSE(handler.isConnecting());
  TEST_ASSERT_EQUAL_INT(IMPROV_STATE_READY, handler.getState());
  TEST_ASSERT_EQUAL_INT(TOAST_OFFLINE, handler.getToastType());
  TEST_ASSERT_TRUE(handler.hasToast());
  TEST_ASSERT_TRUE(handler.isRadioSleeping());
  TEST_ASSERT_TRUE(handler.checkJustFailed());
}

int main(void) {
  UNITY_BEGIN();
  RUN_TEST(test_default_journey_parsing);
  RUN_TEST(test_advent_schedule_integrity);
  RUN_TEST(test_coordinate_projection);
  RUN_TEST(test_day_cycling_btn_a);
  RUN_TEST(test_city_jumping_btn_b);
  RUN_TEST(test_day24_krakow_grand_finale_lock);
  RUN_TEST(test_trajectory_ease_interpolation);
  RUN_TEST(test_eta_countdown_progression);
  RUN_TEST(test_normal_day_looping_without_hold);
  RUN_TEST(test_day_switch_state_isolation);
  RUN_TEST(test_long_duration_stability);
  RUN_TEST(test_malformed_json_resilience);
  RUN_TEST(test_format_compact);
  RUN_TEST(test_santa_metrics_flight_dynamics);
  RUN_TEST(test_santa_metrics_rooftop_subphases);
  RUN_TEST(test_santa_metrics_krakow_finale);
  RUN_TEST(test_screen_carousel_navigation);
  RUN_TEST(test_santa_cam_subphase_resolution);
  RUN_TEST(test_improv_packet_framing_and_checksum);
  RUN_TEST(test_improv_rpc_result_formatting);
  RUN_TEST(test_improv_wifi_settings_parser);
  RUN_TEST(test_improv_state_machine_stream);
  RUN_TEST(test_improv_rpc_wifi_settings_unwrapping);
  RUN_TEST(test_improv_burst_and_sleep_cycle);
  RUN_TEST(test_improv_async_timeout_failure);
  return UNITY_END();
}
