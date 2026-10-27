#pragma once
#include "types.h"

class JourneyClient {
public:
  JourneyClient();

  // Load fallback demo data from embedded PROGMEM JSON
  static bool loadDefaultData(JourneyData& outData);

  // Parse any valid JSON string into JourneyData
  static bool parseJson(const char* jsonString, JourneyData& outData);

  // Connects to Wi-Fi, fetches JSON from URL, disconnects Wi-Fi, and fills outData
  // If connection fails, automatically falls back to loadDefaultData()
  static bool fetchRemoteOrFallback(const char* ssid, const char* pass, const char* url, JourneyData& outData);
};
