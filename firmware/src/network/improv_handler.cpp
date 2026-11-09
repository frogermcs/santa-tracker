#include "improv_handler.h"
#include <string.h>
#include <stdio.h>

#if defined(ARDUINO)
  #include <Arduino.h>
  #include <WiFi.h>
  #include <Preferences.h>
  #include <M5Unified.h>
  #include <esp_sntp.h>
  #define LOG_PRINTF(...) Serial.printf(__VA_ARGS__)
  #define LOG_PRINTLN(...) Serial.println(__VA_ARGS__)
#else
  #define LOG_PRINTF(...) printf(__VA_ARGS__)
  #define LOG_PRINTLN(...) printf("%s\n", __VA_ARGS__)
#endif

// Improv Serial Header: "IMPROV" (6 bytes) + version 1 (1 byte)
static const uint8_t IMPROV_HEADER[7] = {'I', 'M', 'P', 'R', 'O', 'V', 1};

ImprovHandler::ImprovHandler()
  : currentState(IMPROV_STATE_READY),
    toastType(TOAST_NONE),
    hasPendingCredentials(false),
    toastMs(0),
    sleepCountdownMs(0),
    connectTimeoutMs(0),
    sntpTimeoutMs(0),
    justConnected(false),
    justFailed(false),
    isConnectingAsync(false),
    isWaitingSntp(false),
    isScanning(false),
    radioSleeping(true),
    syncSucceeded(false),
    rxIndex(0),
    inPacket(false) {
  memset(localIp, 0, sizeof(localIp));
  memset(currentSsid, 0, sizeof(currentSsid));
  memset(ntpTimeStr, 0, sizeof(ntpTimeStr));
  memset(pendingSsid, 0, sizeof(pendingSsid));
  memset(pendingPass, 0, sizeof(pendingPass));
  memset(rxBuffer, 0, sizeof(rxBuffer));
}

const char* ImprovHandler::getFormattedTime() const {
#if defined(ARDUINO)
  time_t now = time(nullptr);
  if (now > 1700000000) {
    struct tm timeinfo;
    localtime_r(&now, &timeinfo);
    static char buf[32];
    strftime(buf, sizeof(buf), "CZAS NTP: %H:%M CET", &timeinfo);
    return buf;
  }
  return ntpTimeStr[0] ? ntpTimeStr : "CZAS NTP: OK";
#else
  return "CZAS NTP: 15:44 CET";
#endif
}

void ImprovHandler::init() {
  char savedSsid[33] = {0};
  char savedPass[65] = {0};

  // Check if Wi-Fi credentials are already saved in Flash NVS
  if (loadCredentials(savedSsid, sizeof(savedSsid), savedPass, sizeof(savedPass))) {
    LOG_PRINTF("[IMPROV] Found saved credentials for SSID: %s. Starting non-blocking connection...\n", savedSsid);
    startConnectAsync(savedSsid, savedPass);
  } else {
    LOG_PRINTLN("[IMPROV] No saved Wi-Fi credentials. Booting instantly in offline autonomous mode.");
    currentState = IMPROV_STATE_READY;
    toastType = TOAST_NONE;
    radioSleeping = true;
  }

  // Announce initial state over serial
  sendCurrentState();
}

void ImprovHandler::startConnectAsync(const char* ssid, const char* pass) {
  if (!ssid || strlen(ssid) == 0) {
    currentState = IMPROV_STATE_READY;
    toastType = TOAST_NONE;
    isConnectingAsync = false;
    return;
  }

  // Cancel any prior sleep timer to avoid powering down during provisioning
  sleepCountdownMs = 0;

  strncpy(currentSsid, ssid, sizeof(currentSsid) - 1);
  currentSsid[sizeof(currentSsid) - 1] = '\0';
  currentState = IMPROV_STATE_PROVISIONING;
  connectTimeoutMs = 8000; // 8-second non-blocking timeout
  isConnectingAsync = true;
  radioSleeping = false;

#if defined(ARDUINO)
  LOG_PRINTF("[IMPROV] Connecting asynchronously to SSID: '%s'...\n", currentSsid);
  WiFi.disconnect(true);
  delay(10);
  WiFi.mode(WIFI_STA);
  delay(10);
  WiFi.begin(currentSsid, (pass && strlen(pass) > 0) ? pass : nullptr);
#else
  if (strcmp(ssid, "FailNet") != 0) {
    currentState = IMPROV_STATE_PROVISIONED;
    strncpy(localIp, "192.168.1.100", sizeof(localIp) - 1);
    toastMs = 4000;
    toastType = TOAST_CONNECTED;
    justConnected = true;
    syncSucceeded = true;
    radioSleeping = false;
    isConnectingAsync = false;
    scheduleRadioSleep(5000);
  }
#endif
}

void ImprovHandler::updateTimers(uint32_t dtMs) {
  if (toastMs > 0) {
    if (toastMs > dtMs) {
      toastMs -= dtMs;
    } else {
      toastMs = 0;
      toastType = TOAST_NONE;
    }
  }

  if (sleepCountdownMs > 0) {
    if (sleepCountdownMs > dtMs) {
      sleepCountdownMs -= dtMs;
    } else {
      sleepCountdownMs = 0;
      powerDownRadio();
    }
  }

#if defined(ARDUINO)
  // Poll background network scan
  if (isScanning) {
    int n = WiFi.scanComplete();
    if (n >= 0) {
      isScanning = false;
      if (n > 10) n = 10;
      for (int i = 0; i < n; ++i) {
        String ssidStr = WiFi.SSID(i);
        String rssiStr = String(WiFi.RSSI(i));
        const char* authStr = (WiFi.encryptionType(i) == WIFI_AUTH_OPEN) ? "NO" : "YES";

        const char* strings[3] = {
          ssidStr.c_str(),
          rssiStr.c_str(),
          authStr
        };

        uint8_t txBuf[128];
        size_t len = buildRpcResult(IMPROV_CMD_REQUEST_NETWORKS, strings, 3, txBuf, sizeof(txBuf));
        writeSerial(txBuf, len);
      }
      WiFi.scanDelete();

      uint8_t emptyBuf[32];
      size_t emptyLen = buildRpcResult(IMPROV_CMD_REQUEST_NETWORKS, nullptr, 0, emptyBuf, sizeof(emptyBuf));
      writeSerial(emptyBuf, emptyLen);

      // Re-enter sleep after 30s idle if not provisioning
      if (!isConnectingAsync) {
        scheduleRadioSleep(30000);
      }
    } else if (n == -2) {
      isScanning = false;
      uint8_t emptyBuf[32];
      size_t emptyLen = buildRpcResult(IMPROV_CMD_REQUEST_NETWORKS, nullptr, 0, emptyBuf, sizeof(emptyBuf));
      writeSerial(emptyBuf, emptyLen);
      if (!isConnectingAsync) {
        scheduleRadioSleep(30000);
      }
    }
  }

  // Poll asynchronous SNTP time sync
  if (isWaitingSntp) {
    bool sntpReady = (sntp_get_sync_status() == SNTP_SYNC_STATUS_COMPLETED);
    if (sntpTimeoutMs > dtMs) {
      sntpTimeoutMs -= dtMs;
    } else {
      sntpTimeoutMs = 0;
    }

    if (sntpReady || sntpTimeoutMs == 0) {
      isWaitingSntp = false;
      struct tm timeinfo;
      if (getLocalTime(&timeinfo, 0)) {
        strftime(ntpTimeStr, sizeof(ntpTimeStr), "CZAS NTP: %H:%M CET", &timeinfo);
        LOG_PRINTF("[NTP] Clock synchronized: %s\n", ntpTimeStr);

        time_t nowUtc = time(nullptr);
        if (nowUtc > 1700000000 && M5.Rtc.isEnabled()) {
          struct tm tmUtc;
          gmtime_r(&nowUtc, &tmUtc);
          M5.Rtc.setDateTime(&tmUtc);
          LOG_PRINTLN("[RTC] Synced to hardware BM8563 RTC via gmtime_r.");
        }
      } else {
        snprintf(ntpTimeStr, sizeof(ntpTimeStr), "CZAS NTP: OK");
      }

      syncSucceeded = true;
      scheduleRadioSleep(5000); // 5-second burst then power down radio

      char url[48];
      snprintf(url, sizeof(url), "http://%s/", localIp);
      sendProvisionResult(url, IMPROV_CMD_SEND_WIFI_SETTINGS);
    }
  }
#endif

  if (isConnectingAsync) {
#if defined(ARDUINO)
    if (WiFi.status() == WL_CONNECTED) {
      isConnectingAsync = false;
      currentState = IMPROV_STATE_PROVISIONED;
      strncpy(localIp, WiFi.localIP().toString().c_str(), sizeof(localIp) - 1);
      localIp[sizeof(localIp) - 1] = '\0';
      LOG_PRINTF("[IMPROV] Connected! IP: %s, RSSI: %d dBm\n", localIp, (int)WiFi.RSSI());

      // Commit candidate credentials to NVS only after connection is verified
      if (hasPendingCredentials) {
        saveCredentials(pendingSsid, pendingPass);
        hasPendingCredentials = false;
      }

      // Initiate asynchronous SNTP sync
      configTzTime("CET-1CEST,M3.5.0,M10.5.0/3", "pool.ntp.org", "time.google.com");
      isWaitingSntp = true;
      sntpTimeoutMs = 3000;

      triggerToast(TOAST_CONNECTED, 4000);
      justConnected = true;
      radioSleeping = false;

      sendCurrentState();
    } else if (connectTimeoutMs > dtMs) {
      connectTimeoutMs -= dtMs;
    } else {
      // 8-second timeout reached: connection failed / network unavailable
      isConnectingAsync = false;
      hasPendingCredentials = false; // Discard invalid candidate credentials without touching NVS
      currentState = IMPROV_STATE_READY;
      LOG_PRINTF("[IMPROV] Wi-Fi connection timed out for SSID: '%s'. Entering autonomous mode.\n", currentSsid);

      triggerToast(TOAST_OFFLINE, 3500);
      justFailed = true;
      powerDownRadio();

      sendCurrentState();
      sendError(IMPROV_ERR_UNABLE_TO_CONNECT);
    }
#else
    if (connectTimeoutMs > dtMs) {
      connectTimeoutMs -= dtMs;
    } else {
      isConnectingAsync = false;
      hasPendingCredentials = false;
      currentState = IMPROV_STATE_READY;
      triggerToast(TOAST_OFFLINE, 3500);
      justFailed = true;
      powerDownRadio();
    }
#endif
  }
}

void ImprovHandler::powerDownRadio() {
#if defined(ARDUINO)
  WiFi.disconnect(true);
  delay(50);
  WiFi.mode(WIFI_OFF);
  LOG_PRINTLN("[POWER] Wi-Fi Radio powered OFF (Burst & Sleep active). Current dropped to ~40mA.");
#endif
  radioSleeping = true;
}

void ImprovHandler::update() {
#if defined(ARDUINO)
  while (Serial.available() > 0) {
    uint8_t byte = Serial.read();
    processByte(byte);
  }
#endif
}

bool ImprovHandler::processByte(uint8_t byte) {
  // If buffer overflows, reset and start looking for header again
  if (rxIndex >= RX_BUFFER_SIZE) {
    rxIndex = 0;
    inPacket = false;
  }

  rxBuffer[rxIndex++] = byte;

  // Header detection: check first 7 bytes ("IMPROV\x01")
  if (!inPacket) {
    if (rxIndex <= 7) {
      if (rxBuffer[rxIndex - 1] != IMPROV_HEADER[rxIndex - 1]) {
        // Mismatch during header detection
        // If current byte matches start of header ('I'), keep it as index 1 to preserve sync
        if (byte == IMPROV_HEADER[0]) {
          rxBuffer[0] = byte;
          rxIndex = 1;
        } else {
          rxIndex = 0;
        }
        return false;
      }
      if (rxIndex == 7) {
        inPacket = true;
      }
      return false;
    }
  }

  // We are inside an Improv packet:
  // [0..6]: Header (7 bytes)
  // [7]: Type (1 byte)
  // [8]: Data Length (1 byte)
  // [9 .. 9 + dataLen - 1]: Data
  // [9 + dataLen]: Checksum (1 byte)
  if (rxIndex >= 9) {
    uint8_t dataLen = rxBuffer[8];
    size_t expectedPacketLen = 7 + 1 + 1 + dataLen + 1; // 10 + dataLen

    if (rxIndex >= expectedPacketLen) {
      // Calculate and verify checksum
      uint8_t receivedChecksum = rxBuffer[expectedPacketLen - 1];
      uint8_t calculatedChecksum = 0;
      for (size_t i = 0; i < expectedPacketLen - 1; ++i) {
        calculatedChecksum = (calculatedChecksum + rxBuffer[i]) & 0xFF;
      }

      bool valid = (receivedChecksum == calculatedChecksum);
      if (valid) {
        uint8_t type = rxBuffer[7];
        const uint8_t* data = (dataLen > 0) ? &rxBuffer[9] : nullptr;
        handlePacket(type, data, dataLen);
      } else {
        LOG_PRINTF("[IMPROV] Bad checksum: got 0x%02X, expected 0x%02X\n", receivedChecksum, calculatedChecksum);
      }

      // Reset buffer for next packet
      rxIndex = 0;
      inPacket = false;
      return valid;
    }
  }

  return false;
}

void ImprovHandler::handlePacket(uint8_t type, const uint8_t* data, uint8_t dataLen) {
  if (type == IMPROV_TYPE_RPC) {
    if (dataLen < 1 || !data) {
      sendError(IMPROV_ERR_INVALID_RPC);
      return;
    }
    uint8_t command = data[0];
    const uint8_t* cmdData = nullptr;
    uint8_t cmdDataLen = 0;

    // Check if data contains an inner length header (e.g. [cmd, inner_len, ...inner_data])
    if (dataLen >= 2) {
      uint8_t innerLen = data[1];
      if (dataLen >= 2 + innerLen) {
        cmdData = &data[2];
        cmdDataLen = innerLen;
      } else {
        cmdData = &data[1];
        cmdDataLen = dataLen - 1;
      }
    }
    handleRpcCommand(command, cmdData, cmdDataLen);
  }
}

void ImprovHandler::handleRpcCommand(uint8_t command, const uint8_t* data, uint8_t dataLen) {
  switch (command) {
    case IMPROV_CMD_REQUEST_STATE: {
      sendCurrentState();
      if (currentState == IMPROV_STATE_PROVISIONED) {
        char url[48];
        snprintf(url, sizeof(url), "http://%s/", localIp[0] ? localIp : "santa.local");
        sendProvisionResult(url, IMPROV_CMD_REQUEST_STATE);
      }
      break;
    }

    case IMPROV_CMD_REQUEST_INFO: {
      sendDeviceInfo();
      break;
    }

    case IMPROV_CMD_REQUEST_NETWORKS: {
#if defined(ARDUINO)
      if (radioSleeping) {
        WiFi.mode(WIFI_STA);
        radioSleeping = false;
        delay(50);
      }
      WiFi.scanNetworks(true /* async */, false, false, 300);
      isScanning = true;
#else
      handleScanNetworks();
      if (!isConnectingAsync) {
        scheduleRadioSleep(30000);
      }
#endif
      break;
    }

    case IMPROV_CMD_SEND_WIFI_SETTINGS: {
      char ssid[33] = {0};
      char pass[65] = {0};

      if (!parseWifiSettings(data, dataLen, ssid, sizeof(ssid), pass, sizeof(pass))) {
        sendError(IMPROV_ERR_INVALID_RPC);
        return;
      }

      // Store candidate credentials in pending buffer; commit to NVS only upon connection success
      strncpy(pendingSsid, ssid, sizeof(pendingSsid) - 1);
      pendingSsid[sizeof(pendingSsid) - 1] = '\0';
      strncpy(pendingPass, pass, sizeof(pendingPass) - 1);
      pendingPass[sizeof(pendingPass) - 1] = '\0';
      hasPendingCredentials = true;

      startConnectAsync(ssid, pass);
      sendCurrentState();
      break;
    }

    default:
      sendError(IMPROV_ERR_UNKNOWN_RPC_CMD);
      break;
  }
}

void ImprovHandler::sendCurrentState() {
  uint8_t stateByte = (uint8_t)currentState;
  uint8_t txBuf[32];
  size_t len = buildPacket(IMPROV_TYPE_CURRENT_STATE, &stateByte, 1, txBuf, sizeof(txBuf));
  writeSerial(txBuf, len);
}

void ImprovHandler::sendError(ImprovError error) {
  uint8_t errByte = (uint8_t)error;
  uint8_t txBuf[32];
  size_t len = buildPacket(IMPROV_TYPE_ERROR_STATE, &errByte, 1, txBuf, sizeof(txBuf));
  writeSerial(txBuf, len);
}

void ImprovHandler::sendDeviceInfo() {
  const char* infoStrings[4] = {
    "SANTA-OS for M5StickC-Plus", // Firmware Name (matches manifest.json)
    "1.0.0",                      // Version
    "ESP32",                      // Chip Family
    "SANTA-OS"                    // Device Name
  };

  uint8_t txBuf[128];
  size_t len = buildRpcResult(IMPROV_CMD_REQUEST_INFO, infoStrings, 4, txBuf, sizeof(txBuf));
  writeSerial(txBuf, len);
}

void ImprovHandler::sendProvisionResult(const char* url, uint8_t command) {
  const char* urlStrings[1] = { url ? url : "" };
  uint8_t txBuf[128];
  size_t len = buildRpcResult(command, urlStrings, 1, txBuf, sizeof(txBuf));
  writeSerial(txBuf, len);
}

void ImprovHandler::handleScanNetworks() {
#if defined(ARDUINO)
  int n = WiFi.scanNetworks(false, false, false, 300); // 300ms passive scan
  if (n > 0) {
    if (n > 10) n = 10; // Cap at 10 strongest networks for buffer conservation
    for (int i = 0; i < n; ++i) {
      String ssidStr = WiFi.SSID(i);
      String rssiStr = String(WiFi.RSSI(i));
      const char* authStr = (WiFi.encryptionType(i) == WIFI_AUTH_OPEN) ? "NO" : "YES";

      const char* strings[3] = {
        ssidStr.c_str(),
        rssiStr.c_str(),
        authStr
      };

      uint8_t txBuf[128];
      size_t len = buildRpcResult(IMPROV_CMD_REQUEST_NETWORKS, strings, 3, txBuf, sizeof(txBuf));
      writeSerial(txBuf, len);
      delay(30);
    }
  }
  WiFi.scanDelete();

  // Send empty scan result to signal completion
  uint8_t emptyBuf[32];
  size_t emptyLen = buildRpcResult(IMPROV_CMD_REQUEST_NETWORKS, nullptr, 0, emptyBuf, sizeof(emptyBuf));
  writeSerial(emptyBuf, emptyLen);
#else
  // Native test simulation: send 1 simulated network then empty end
  const char* strings[3] = { "NorthPole-WiFi", "-55", "YES" };
  uint8_t txBuf[128];
  size_t len = buildRpcResult(IMPROV_CMD_REQUEST_NETWORKS, strings, 3, txBuf, sizeof(txBuf));
  writeSerial(txBuf, len);

  uint8_t emptyBuf[32];
  size_t emptyLen = buildRpcResult(IMPROV_CMD_REQUEST_NETWORKS, nullptr, 0, emptyBuf, sizeof(emptyBuf));
  writeSerial(emptyBuf, emptyLen);
#endif
}

bool ImprovHandler::connectWifi(const char* ssid, const char* pass) {
  if (!ssid || strlen(ssid) == 0) return false;
  startConnectAsync(ssid, pass);
#if defined(ARDUINO)
  unsigned long start = millis();
  while (isConnectingAsync && (millis() - start < 8000)) {
    updateTimers(100);
    delay(100);
  }
#endif
  return (currentState == IMPROV_STATE_PROVISIONED);
}

bool ImprovHandler::loadCredentials(char* outSsid, size_t maxSsid, char* outPass, size_t maxPass) {
  if (!outSsid || maxSsid == 0) return false;
  outSsid[0] = '\0';
  if (outPass && maxPass > 0) outPass[0] = '\0';

#if defined(ARDUINO)
  Preferences prefs;
  if (!prefs.begin("santa_cfg", true)) return false; // Read-only

  String ssid = prefs.getString("ssid", "");
  String pass = prefs.getString("pass", "");
  prefs.end();

  if (ssid.length() == 0) return false;

  strncpy(outSsid, ssid.c_str(), maxSsid - 1);
  outSsid[maxSsid - 1] = '\0';

  if (outPass && maxPass > 0) {
    strncpy(outPass, pass.c_str(), maxPass - 1);
    outPass[maxPass - 1] = '\0';
  }
  return true;
#else
  return false;
#endif
}

bool ImprovHandler::saveCredentials(const char* ssid, const char* pass) {
  if (!ssid || strlen(ssid) == 0) return false;

#if defined(ARDUINO)
  Preferences prefs;
  if (!prefs.begin("santa_cfg", false)) return false; // Read-write

  prefs.putString("ssid", ssid);
  prefs.putString("pass", pass ? pass : "");
  prefs.end();
  LOG_PRINTLN("[IMPROV] Credentials persisted to NVS (namespace: santa_cfg).");
  return true;
#else
  return true;
#endif
}

bool ImprovHandler::clearCredentials() {
#if defined(ARDUINO)
  Preferences prefs;
  if (!prefs.begin("santa_cfg", false)) return false;
  prefs.clear();
  prefs.end();
  return true;
#else
  return true;
#endif
}

size_t ImprovHandler::buildPacket(uint8_t type, const uint8_t* data, uint8_t dataLen, uint8_t* outBuffer, size_t maxLen) {
  // Format:
  // [0..6]: "IMPROV\x01" (7 bytes)
  // [7]: type
  // [8]: dataLen
  // [9..9+dataLen-1]: data
  // [9+dataLen]: checksum
  // [10+dataLen]: '\n' (0x0A)
  size_t totalLen = 7 + 1 + 1 + dataLen + 2;
  if (totalLen > maxLen || !outBuffer) return 0;

  memcpy(outBuffer, IMPROV_HEADER, 7);
  outBuffer[7] = type;
  outBuffer[8] = dataLen;

  if (dataLen > 0 && data) {
    memcpy(&outBuffer[9], data, dataLen);
  }

  // Calculate checksum
  uint8_t checksum = 0;
  for (size_t i = 0; i < 9 + dataLen; ++i) {
    checksum = (checksum + outBuffer[i]) & 0xFF;
  }

  outBuffer[9 + dataLen] = checksum;
  outBuffer[10 + dataLen] = '\n'; // 0x0A

  return totalLen;
}

size_t ImprovHandler::buildRpcResult(uint8_t command, const char* const* strings, size_t stringCount, uint8_t* outBuffer, size_t maxLen) {
  // RPC_RESULT data format:
  // [0]: command
  // [1]: total_strings_length
  // For each string:
  //   [idx]: len
  //   [idx+1..idx+len]: string bytes
  uint8_t rpcData[128];
  rpcData[0] = command;

  size_t dataIdx = 2; // reserve [1] for total_strings_length
  for (size_t s = 0; s < stringCount && strings; ++s) {
    if (!strings[s]) continue;
    size_t sLen = strlen(strings[s]);
    if (sLen > 64) sLen = 64; // guard
    if (dataIdx + 1 + sLen >= sizeof(rpcData)) break;

    rpcData[dataIdx++] = (uint8_t)sLen;
    memcpy(&rpcData[dataIdx], strings[s], sLen);
    dataIdx += sLen;
  }

  rpcData[1] = (uint8_t)(dataIdx - 2); // total strings payload length
  return buildPacket(IMPROV_TYPE_RPC_RESULT, rpcData, (uint8_t)dataIdx, outBuffer, maxLen);
}

bool ImprovHandler::parseWifiSettings(const uint8_t* data, uint8_t dataLen, char* outSsid, size_t maxSsid, char* outPass, size_t maxPass) {
  if (!data || dataLen < 2 || !outSsid || maxSsid == 0) return false;

  // Format: [ssid_len, ...ssid, pass_len, ...pass]
  uint8_t ssidLen = data[0];
  if (1 + ssidLen > dataLen) return false;

  size_t copySsid = (ssidLen < maxSsid - 1) ? ssidLen : (maxSsid - 1);
  memcpy(outSsid, &data[1], copySsid);
  outSsid[copySsid] = '\0';

  size_t passIdx = 1 + ssidLen;
  // Must have at least pass_len byte
  if (passIdx >= dataLen) {
    return false;
  }

  uint8_t passLen = data[passIdx];
  // Guard against truncated payload claiming more bytes than available
  if (passIdx + 1 + passLen > dataLen) {
    return false;
  }

  if (outPass && maxPass > 0) {
    size_t copyPass = (passLen < maxPass - 1) ? passLen : (maxPass - 1);
    if (passLen > 0) {
      memcpy(outPass, &data[passIdx + 1], copyPass);
    }
    outPass[copyPass] = '\0';
  }

  return true;
}

void ImprovHandler::writeSerial(const uint8_t* buffer, size_t length) {
#if defined(ARDUINO)
  if (buffer && length > 0) {
    Serial.write(buffer, length);
    Serial.flush();
  }
#else
  (void)buffer;
  (void)length;
#endif
}
