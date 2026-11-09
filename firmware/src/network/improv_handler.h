#pragma once

#include <stdint.h>
#include <stddef.h>

// ============================================================================
// SANTA-OS — Improv Wi-Fi Serial Protocol Handler & Flash NVS Provisioner
// Standard: Improv Wi-Fi Serial Protocol v1 (ESPHome / Web Tools Standard)
// Target: M5StickC-Plus SE (ESP32-PICO-D4)
//
// Memory Architecture:
// - Deterministic static buffers (0 dynamic heap allocations in loop)
// - Persistent credential storage in Flash NVS (Preferences "santa_cfg")
// - 100% offline resilience: boots instantly from ROM if no Wi-Fi configured
// ============================================================================

enum ImprovMsgType : uint8_t {
  IMPROV_TYPE_CURRENT_STATE = 0x01,
  IMPROV_TYPE_ERROR_STATE   = 0x02,
  IMPROV_TYPE_RPC           = 0x03,
  IMPROV_TYPE_RPC_RESULT    = 0x04
};

enum ImprovState : uint8_t {
  IMPROV_STATE_STOPPED       = 0x00,
  IMPROV_STATE_AWAITING_AUTH = 0x01,
  IMPROV_STATE_READY         = 0x02,
  IMPROV_STATE_PROVISIONING  = 0x03,
  IMPROV_STATE_PROVISIONED   = 0x04
};

enum ImprovError : uint8_t {
  IMPROV_ERR_NONE              = 0x00,
  IMPROV_ERR_INVALID_RPC       = 0x01,
  IMPROV_ERR_UNKNOWN_RPC_CMD   = 0x02,
  IMPROV_ERR_UNABLE_TO_CONNECT = 0x03,
  IMPROV_ERR_TIMEOUT           = 0xFE,
  IMPROV_ERR_UNKNOWN           = 0xFF
};

enum ImprovCommand : uint8_t {
  IMPROV_CMD_SEND_WIFI_SETTINGS = 0x01,
  IMPROV_CMD_REQUEST_STATE      = 0x02,
  IMPROV_CMD_REQUEST_INFO       = 0x03,
  IMPROV_CMD_REQUEST_NETWORKS   = 0x04
};

enum ToastType : uint8_t {
  TOAST_NONE      = 0x00,
  TOAST_CONNECTED = 0x01,
  TOAST_OFFLINE   = 0x02
};

class ImprovHandler {
public:
  ImprovHandler();

  // Initialize handler, load credentials from NVS, and set initial state
  void init();

  // Active loop hook: processes incoming serial bytes with 0 heap allocation
  void update();

  // Feed a single byte into the Improv framing state machine (testable)
  bool processByte(uint8_t byte);

  // Send current state packet over Serial
  void sendCurrentState();

  // Send error packet over Serial
  void sendError(ImprovError error);

  // Send device info RPC result (Firmware name, version, chip, name)
  void sendDeviceInfo();

  // Send Wi-Fi provisioning result with local IP redirect URL
  void sendProvisionResult(const char* url, uint8_t command = IMPROV_CMD_SEND_WIFI_SETTINGS);

  // Trigger network scan and stream results
  void handleScanNetworks();

  // Attempt connection with credentials and report status
  bool connectWifi(const char* ssid, const char* pass);

  // NVS Credential storage helpers
  static bool loadCredentials(char* outSsid, size_t maxSsid, char* outPass, size_t maxPass);
  static bool saveCredentials(const char* ssid, const char* pass);
  static bool clearCredentials();

  // Getters & Setters
  ImprovState getState() const { return currentState; }
  void setState(ImprovState state) { currentState = state; }
  bool isConnected() const { return currentState == IMPROV_STATE_PROVISIONED; }
  bool isConnecting() const { return currentState == IMPROV_STATE_PROVISIONING || isConnectingAsync; }
  bool isRadioSleeping() const { return radioSleeping; }
  bool isSyncSucceeded() const { return syncSucceeded; }
  const char* getLocalIp() const { return localIp; }
  const char* getSsid() const { return currentSsid; }
  const char* getFormattedTime() const;
  bool hasToast() const { return toastMs > 0 && toastType != TOAST_NONE; }
  ToastType getToastType() const { return toastType; }
  void triggerToast(ToastType type, uint32_t ms = 4000) {
    toastType = type;
    toastMs = ms;
  }
  void updateTimers(uint32_t dtMs);
  bool checkJustConnected() { bool j = justConnected; justConnected = false; return j; }
  bool checkJustFailed() { bool f = justFailed; justFailed = false; return f; }

  // Power management & async connection
  void startConnectAsync(const char* ssid, const char* pass);
  void powerDownRadio();
  void scheduleRadioSleep(uint32_t ms = 5000) {
    sleepCountdownMs = ms;
    radioSleeping = false;
  }

  // Packet builder helper (static & public for native desktop testing)
  static size_t buildPacket(uint8_t type, const uint8_t* data, uint8_t dataLen, uint8_t* outBuffer, size_t maxLen);
  static size_t buildRpcResult(uint8_t command, const char* const* strings, size_t stringCount, uint8_t* outBuffer, size_t maxLen);
  static bool parseWifiSettings(const uint8_t* data, uint8_t dataLen, char* outSsid, size_t maxSsid, char* outPass, size_t maxPass);

private:
  ImprovState currentState;
  ToastType toastType;
  char localIp[24];
  char currentSsid[33];
  char ntpTimeStr[32];
  char pendingSsid[33];
  char pendingPass[65];
  bool hasPendingCredentials;
  uint32_t toastMs;
  uint32_t sleepCountdownMs;
  uint32_t connectTimeoutMs;
  uint32_t sntpTimeoutMs;
  bool justConnected;
  bool justFailed;
  bool isConnectingAsync;
  bool isWaitingSntp;
  bool isScanning;
  bool radioSleeping;
  bool syncSucceeded;

  // Static RX ring/frame buffer (272 bytes covers max legal 265B Improv frame + margin)
  static const size_t RX_BUFFER_SIZE = 272;
  uint8_t rxBuffer[RX_BUFFER_SIZE];
  size_t rxIndex;
  bool inPacket;

  void handlePacket(uint8_t type, const uint8_t* data, uint8_t dataLen);
  void handleRpcCommand(uint8_t command, const uint8_t* data, uint8_t dataLen);
  void writeSerial(const uint8_t* buffer, size_t length);
};
