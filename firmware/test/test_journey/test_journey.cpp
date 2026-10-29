#include <unity.h>
#include "types.h"
#include "config.h"
#include "advent_schedule.h"
#include "core/journey_engine.h"
#include "network/journey_client.h"

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
  TEST_ASSERT_EQUAL_FLOAT(12.0f, data.secPerCity);
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
    TEST_ASSERT_EQUAL_FLOAT(12.0f, dayData.secPerCity);

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

// Test 6: Validate Day 24 Kraków Grand Finale Lock and Celebration Hold
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

  // Advance 10 seconds into the 16-second celebration hold
  engine.update(10.0f);
  TelemetryState sHold = engine.getTelemetry();
  TEST_ASSERT_TRUE(sHold.isDay24Finale);
  TEST_ASSERT_EQUAL_STRING("KRAKOW", sHold.nextCityName);
  TEST_ASSERT_EQUAL_INT(0, sHold.etaSeconds);
  TEST_ASSERT_FLOAT_WITHIN(0.01f, 19.9450f, sHold.santaLon);
  TEST_ASSERT_FLOAT_WITHIN(0.01f, 50.0647f, sHold.santaLat);

  // Advance past the 16-second celebration hold (+15s -> total 163s, wraps past cycleTotal 160s)
  engine.update(15.0f);
  TelemetryState sLoop = engine.getTelemetry();
  TEST_ASSERT_EQUAL_INT(0, sLoop.safeIdx);
  TEST_ASSERT_FALSE(sLoop.isDay24Finale);
}

int main(void) {
  UNITY_BEGIN();
  RUN_TEST(test_default_journey_parsing);
  RUN_TEST(test_advent_schedule_integrity);
  RUN_TEST(test_coordinate_projection);
  RUN_TEST(test_day_cycling_btn_a);
  RUN_TEST(test_city_jumping_btn_b);
  RUN_TEST(test_day24_krakow_grand_finale_lock);
  return UNITY_END();
}
