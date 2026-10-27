#pragma once
#include "types.h"

#ifndef PROGMEM
  #define PROGMEM
#endif

// Default offline demo JSON (used if Wi-Fi is unreachable or disabled)
const char DEFAULT_JOURNEY_JSON[] PROGMEM = R"rawliteral({
  "version": 1,
  "secPerCity": 16,
  "speedMultiplier": 1,
  "route": [
    { "name": "AUCKLAND",    "lon": 174.8,  "lat": -36.8 },
    { "name": "SYDNEY",      "lon": 151.2,  "lat": -33.9 },
    { "name": "TOKYO",       "lon": 139.7,  "lat": 35.7 },
    { "name": "BEIJING",     "lon": 116.4,  "lat": 39.9 },
    { "name": "DELHI",        "lon": 77.2,   "lat": 28.6 },
    { "name": "DUBAI",        "lon": 55.3,   "lat": 25.2 },
    { "name": "NAIROBI",      "lon": 36.8,   "lat": -1.3 },
    { "name": "CAIRO",        "lon": 31.2,   "lat": 30.0 },
    { "name": "KRAKOW",       "lon": 19.9,   "lat": 50.1 },
    { "name": "LONDON",       "lon": -0.1,   "lat": 51.5 },
    { "name": "RIO",         "lon": -43.2,  "lat": -22.9 },
    { "name": "NEW YORK",    "lon": -74.0,  "lat": 40.7 },
    { "name": "MEXICO CITY", "lon": -99.1,  "lat": 19.4 },
    { "name": "LOS ANGELES", "lon": -118.2, "lat": 34.0 },
    { "name": "HONOLULU",    "lon": -157.8, "lat": 21.3 }
  ]
})rawliteral";
