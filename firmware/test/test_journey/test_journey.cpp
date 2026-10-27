#include <unity.h>
#include "types.h"
#include "config.h"
#include "core/journey_engine.h"
#include "network/journey_client.h"

void setUp(void) {}
void tearDown(void) {}

void test_default_journey_parsing(void) {
  JourneyData data;
  bool ok = JourneyClient::loadDefaultData(data);
  TEST_ASSERT_TRUE(ok);
  TEST_ASSERT_EQUAL_INT(15, data.cityCount);
  TEST_ASSERT_EQUAL_STRING("AUCKLAND", data.cities[0].name);
  TEST_ASSERT_EQUAL_STRING("HONOLULU", data.cities[14].name);
  TEST_ASSERT_EQUAL_FLOAT(16.0f, data.secPerCity);
}

void test_coordinate_projection(void) {
  float x, y;

  // Prime Meridian (0 lon, 0 lat)
  JourneyEngine::projectCoordinates(0.0f, 0.0f, x, y);
  TEST_ASSERT_FLOAT_WITHIN(1.0f, 120.0f, x);
  TEST_ASSERT_FLOAT_WITHIN(2.0f, 74.6f, y);

  // International Date Line (-180 lon) -> screen left edge (0 px)
  JourneyEngine::projectCoordinates(-180.0f, 0.0f, x, y);
  TEST_ASSERT_FLOAT_WITHIN(0.1f, 0.0f, x);

  // Eastern Date Line (+180 lon) -> screen right edge (240 px)
  JourneyEngine::projectCoordinates(180.0f, 0.0f, x, y);
  TEST_ASSERT_FLOAT_WITHIN(0.1f, 240.0f, x);
}

void test_journey_progression_and_interpolation(void) {
  JourneyData data;
  JourneyClient::loadDefaultData(data);

  JourneyEngine engine;
  engine.setJourneyData(data);

  // At t = 0s: Santa starts at city 0 (Auckland)
  TelemetryState s0 = engine.getTelemetry();
  TEST_ASSERT_EQUAL_INT(0, s0.currentCityIdx);
  TEST_ASSERT_FLOAT_WITHIN(0.1f, data.cities[0].lon, s0.santaLon);
  TEST_ASSERT_FLOAT_WITHIN(0.1f, data.cities[0].lat, s0.santaLat);

  // Advance time into leg 1 (flight from Auckland to Sydney: 16s + 3s = 19s)
  engine.update(19.0f);
  TelemetryState s1 = engine.getTelemetry();
  TEST_ASSERT_EQUAL_INT(1, s1.currentCityIdx);
  TEST_ASSERT_TRUE(s1.isFlightPhase);
  // Santa's longitude must be in flight between Auckland (174.8) and Sydney (151.2)
  TEST_ASSERT_TRUE(s1.santaLon < data.cities[0].lon);
  TEST_ASSERT_TRUE(s1.santaLon > data.cities[1].lon);
  TEST_ASSERT_EQUAL_STRING("SYDNEY", s1.nextCityName);

  // Advance past 6 seconds of flight (e.g. +4s -> total 23s, in city gift drop phase)
  engine.update(4.0f);
  TelemetryState s2 = engine.getTelemetry();
  TEST_ASSERT_FALSE(s2.isFlightPhase); // Arrived at Sydney
  TEST_ASSERT_FLOAT_WITHIN(0.1f, data.cities[1].lon, s2.santaLon);
  TEST_ASSERT_FLOAT_WITHIN(0.1f, data.cities[1].lat, s2.santaLat);
}

void test_speed_multiplier_cycle(void) {
  JourneyEngine engine;
  TEST_ASSERT_EQUAL_FLOAT(1.0f, engine.getSpeedMultiplier());

  engine.cycleSpeed();
  TEST_ASSERT_EQUAL_FLOAT(2.0f, engine.getSpeedMultiplier());

  engine.cycleSpeed();
  TEST_ASSERT_EQUAL_FLOAT(4.0f, engine.getSpeedMultiplier());

  engine.cycleSpeed();
  TEST_ASSERT_EQUAL_FLOAT(8.0f, engine.getSpeedMultiplier());

  engine.cycleSpeed();
  TEST_ASSERT_EQUAL_FLOAT(1.0f, engine.getSpeedMultiplier());
}

void test_jump_to_next_city(void) {
  JourneyData data;
  JourneyClient::loadDefaultData(data);

  JourneyEngine engine;
  engine.setJourneyData(data);

  TelemetryState s0 = engine.getTelemetry();
  TEST_ASSERT_EQUAL_INT(0, s0.currentCityIdx);

  // Simulate Button A press (Jump)
  engine.jumpToNextCity();
  TelemetryState s1 = engine.getTelemetry();
  TEST_ASSERT_EQUAL_INT(1, s1.currentCityIdx);

  // Jump again
  engine.jumpToNextCity();
  TelemetryState s2 = engine.getTelemetry();
  TEST_ASSERT_EQUAL_INT(2, s2.currentCityIdx);
}

void test_global_wraparound(void) {
  JourneyData data;
  JourneyClient::loadDefaultData(data);

  JourneyEngine engine;
  engine.setJourneyData(data);

  // Advance past the entire world tour (15 cities * 16 sec = 240 sec)
  engine.update(245.0f);
  TelemetryState s = engine.getTelemetry();
  // Should wrap around to 0 without crashing
  TEST_ASSERT_EQUAL_INT(0, s.safeIdx);
  TEST_ASSERT_TRUE(s.santaScreenX >= 0.0f && s.santaScreenX <= 240.0f);
}

int main(int argc, char **argv) {
  UNITY_BEGIN();
  RUN_TEST(test_default_journey_parsing);
  RUN_TEST(test_coordinate_projection);
  RUN_TEST(test_journey_progression_and_interpolation);
  RUN_TEST(test_speed_multiplier_cycle);
  RUN_TEST(test_jump_to_next_city);
  RUN_TEST(test_global_wraparound);
  return UNITY_END();
}
