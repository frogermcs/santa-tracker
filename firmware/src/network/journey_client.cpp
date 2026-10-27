#include "journey_client.h"
#include "default_journey.h"
#include "config.h"
#include <ArduinoJson.h>

#if defined(ARDUINO)
  #include <WiFi.h>
  #include <HTTPClient.h>
  #include <WiFiClientSecure.h>
  #define LOG_PRINTF(...) Serial.printf(__VA_ARGS__)
  #define LOG_PRINTLN(...) Serial.println(__VA_ARGS__)
#else
  #include <stdio.h>
  #define LOG_PRINTF(...) printf(__VA_ARGS__)
  #define LOG_PRINTLN(...) printf("%s\n", __VA_ARGS__)
#endif

JourneyClient::JourneyClient() {}

bool JourneyClient::parseJson(const char* jsonString, JourneyData& outData) {
  if (!jsonString) return false;

  JsonDocument doc;
  DeserializationError err = deserializeJson(doc, jsonString);
  if (err) {
    LOG_PRINTF("[JSON] Deserialization failed: %s\n", err.c_str());
    return false;
  }

  outData.version = doc["version"] | 1;
  outData.secPerCity = doc["secPerCity"] | 16.0f;
  outData.speedMultiplier = doc["speedMultiplier"] | 1.0f;

  JsonArray route = doc["route"].as<JsonArray>();
  int count = 0;
  for (JsonObject city : route) {
    if (count >= MAX_WAYPOINTS) break;
    const char* name = city["name"] | "UNKNOWN";
    strncpy(outData.cities[count].name, name, sizeof(outData.cities[count].name) - 1);
    outData.cities[count].name[sizeof(outData.cities[count].name) - 1] = '\0';
    outData.cities[count].lon = city["lon"] | 0.0f;
    outData.cities[count].lat = city["lat"] | 0.0f;
    count++;
  }

  outData.cityCount = count;
  LOG_PRINTF("[JSON] Successfully loaded %d cities (v%d)\n", count, outData.version);
  return count > 0;
}

bool JourneyClient::loadDefaultData(JourneyData& outData) {
  LOG_PRINTLN("[DATA] Loading embedded offline demo journey...");
  return parseJson(DEFAULT_JOURNEY_JSON, outData);
}

bool JourneyClient::fetchRemoteOrFallback(const char* ssid, const char* pass, const char* url, JourneyData& outData) {
#if defined(ARDUINO)
  // If no SSID configured, immediately load default demo data
  if (!ssid || strlen(ssid) == 0) {
    LOG_PRINTLN("[WIFI] No SSID provided. Using offline demo data.");
    return loadDefaultData(outData);
  }

  LOG_PRINTF("[WIFI] Connecting to SSID: %s\n", ssid);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, pass);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - start < WIFI_CONNECT_TIMEOUT_MS)) {
    delay(100);
  }

  if (WiFi.status() != WL_CONNECTED) {
    LOG_PRINTLN("[WIFI] Connection timed out. Falling back to offline demo data.");
    WiFi.disconnect(true);
    WiFi.mode(WIFI_OFF);
    return loadDefaultData(outData);
  }

  LOG_PRINTF("[WIFI] Connected! IP: %s. Fetching %s\n", WiFi.localIP().toString().c_str(), url);

  bool success = false;
  HTTPClient http;
  http.setTimeout(HTTP_TIMEOUT_MS);

  if (strncmp(url, "https", 5) == 0) {
    WiFiClientSecure secureClient;
    secureClient.setInsecure(); // Skip certificate verification for flexible hosting
    if (http.begin(secureClient, url)) {
      int httpCode = http.GET();
      if (httpCode == HTTP_CODE_OK) {
        String payload = http.getString();
        success = parseJson(payload.c_str(), outData);
      } else {
        LOG_PRINTF("[HTTP] Error GET failed: %d\n", httpCode);
      }
      http.end();
    }
  } else {
    WiFiClient client;
    if (http.begin(client, url)) {
      int httpCode = http.GET();
      if (httpCode == HTTP_CODE_OK) {
        String payload = http.getString();
        success = parseJson(payload.c_str(), outData);
      }
      http.end();
    }
  }

  // Turn OFF Wi-Fi radio immediately to conserve battery!
  WiFi.disconnect(true);
  WiFi.mode(WIFI_OFF);
  LOG_PRINTLN("[WIFI] Radio turned OFF for battery conservation.");

  if (!success) {
    LOG_PRINTLN("[HTTP] Fetch failed. Using offline fallback.");
    return loadDefaultData(outData);
  }

  return true;
#else
  // On desktop / native test runner: load embedded demo data directly
  (void)ssid;
  (void)pass;
  (void)url;
  return loadDefaultData(outData);
#endif
}
