#pragma once
#include "types.h"

#ifndef PROGMEM
  #define PROGMEM
#endif

// Default offline demo JSON: Day 24 Grand Finale Itinerary (12 Stops)
// Used as JSON fallback if Wi-Fi is unreachable or disabled
const char DEFAULT_JOURNEY_JSON[] PROGMEM = R"rawliteral({
  "version": 2,
  "activeDay": 24,
  "secPerCity": 30,
  "speedMultiplier": 1,
  "route": [
    { "name": "GISBORNE",          "lon": 178.0176, "lat": -38.6623 },
    { "name": "BETHLEHEM",         "lon": 35.2024,  "lat": 31.7054 },
    { "name": "NIKOZJA",           "lon": 33.3667,  "lat": 35.1667 },
    { "name": "CHARTUM",           "lon": 32.5599,  "lat": 15.5007 },
    { "name": "NOUAKCHOTT",        "lon": -15.9785, "lat": 18.0735 },
    { "name": "CAYENNE",           "lon": -52.3135, "lat": 4.9224 },
    { "name": "WYSPA WIELKANOCNA", "lon": -109.4324,"lat": -27.1492 },
    { "name": "KIRITIMATI",        "lon": -157.4278,"lat": 1.8721 },
    { "name": "HONOLULU",          "lon": -157.8583,"lat": 21.3069 },
    { "name": "NUUK",              "lon": -51.6941, "lat": 64.1814 },
    { "name": "BIEGUN POLNOCNY",   "lon": 0.0000,   "lat": 90.0000 },
    { "name": "KRAKOW",            "lon": 19.9450,  "lat": 50.0647 }
  ]
})rawliteral";
