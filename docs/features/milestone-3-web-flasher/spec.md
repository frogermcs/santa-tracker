# Functional & Technical Specification: Milestone 3 — Single-Journey Web Flasher & In-Browser Wi-Fi Setup

## 1. Overview & System Architecture

Milestone 3 implements a unified, browser-to-hardware onboarding journey powered by the **Web Serial API**, **ESP Web Tools**, and the **Improv Wi-Fi Serial** open standard.

```mermaid
sequenceDiagram
    autonumber
    actor Parent as Parent / Kid
    participant Page as Santa Tracker Landing Page (page/)
    participant Dialog as ESP Web Tools Modal (Web Serial)
    participant Bridge as USB-to-UART Bridge (CP2104 / CH9102)
    participant ESP32 as ESP32-PICO-D4 (firmware/)
    participant NVS as Flash NVS (Preferences)

    Parent->>Page: Plugs M5Stick into USB & clicks "Install on M5Stick"
    Page->>Dialog: Launches <esp-web-install-button>
    Dialog->>Bridge: Opens Web Serial connection (115200 -> 1.5M baud)
    Dialog->>ESP32: Toggles DTR/RTS to enter ROM Bootloader
    Dialog->>ESP32: Flashes bootloader (0x1000), partitions (0x8000), app (0x10000)
    Dialog-->>Parent: Displays progress bar (0% -> 100%)
    ESP32->>ESP32: Reboots into newly installed Santa-OS
    ESP32->>Dialog: Emits Improv Wi-Fi Serial Current State: AUTHORIZED (0x01)
    Note over Dialog: Modal automatically transitions to "Connect to Wi-Fi"!
    Dialog-->>Parent: Prompts for Wi-Fi SSID & Password
    Parent->>Dialog: Submits SSID & Password
    Dialog->>ESP32: Sends Improv RPC Packet (0x01: Send Wi-Fi Credentials)
    ESP32->>ESP32: Attempts WiFi.begin(ssid, pass)
    ESP32->>NVS: Saves credentials to "santa_cfg" namespace
    ESP32->>Dialog: Emits Improv Response (0x04: PROVISIONED, with Local IP URL)
    Dialog-->>Parent: Displays "Setup Complete! Device Connected (192.168.1.X)"
    Parent->>ESP32: Unplugs USB cable
    ESP32->>ESP32: Wi-Fi sleeps; Santa-OS runs!
```

---

## 2. Web User Interface Specification (`page/`)

### 2.1. Hero Entrypoint (`page/app/page.tsx`)
* A prominent festive button added to the header/navigation bar and hero section:
  - Text: `⚡ ZAINSTALUJ NA M5STICK` (or `⚡ Install on M5Stick`)
  - Subtitle: `Instalacja w przeglądarce przez kabel USB (Chrome/Edge)`
* Clicking the button opens the native ESP Web Tools modal overlay.

### 2.2. Browser Compatibility Guard
* Before triggering Web Serial:
  - Check `if (!('serial' in navigator))`:
    - Display a friendly alert modal: *"Twoja przeglądarka nie obsługuje Web Serial. Aby zainstalować Santa-OS na urządzeniu, otwórz tę stronę na komputerze w przeglądarce Google Chrome, Microsoft Edge lub Brave."*
* On macOS / Windows driver notice:
  - Provides a discreet help link: *"M5StickC-Plus wymaga sterownika CP2104 lub CH9102 jeśli nie jest automatycznie wykrywany."*

### 2.3. Single Continuous Dialog Lifecycle
* Handled seamlessly by `<esp-web-install-button>` from `esp-web-tools`:
  1. **Select Port**: Native browser serial prompt (`/dev/cu.usbserial-...` or `COMx`).
  2. **Install Prompt**: Confirmation modal with version number and erase option.
  3. **Flashing Progress**: 0–100% progress indicator with live byte counters.
  4. **Post-Flash Improv Wi-Fi Transition**: Immediately renders the Wi-Fi credentials prompt within the same dialog.
  5. **Post-Provisioning Completion**: Displays success confirmation, assigned IP address, and prompt to unplug USB.

---

## 3. Communication Protocols & Data Contracts

### 3.1. Firmware Manifest (`public/firmware/manifest.json`)
```json
{
  "name": "SANTA-OS for M5StickC-Plus",
  "version": "2.4.0",
  "home_page": "https://santa-tracker-five.vercel.app",
  "new_install_prompt_erase": true,
  "builds": [
    {
      "chipFamily": "ESP32",
      "parts": [
        { "path": "bootloader.bin", "offset": 4096 },
        { "path": "partitions.bin", "offset": 32768 },
        { "path": "boot_app0.bin", "offset": 57344 },
        { "path": "firmware.bin", "offset": 65536 }
      ]
    }
  ]
}
```

### 3.2. Improv Wi-Fi Serial Framing (Standard)
The firmware communicates via the **Improv Serial Protocol Specification**:
* **Baud Rate**: 115200, 8-N-1.
* **Packet Header**: `IMPROV` (ASCII, 6 bytes).
* **Packet Format**: `['I', 'M', 'P', 'R', 'O', 'V', VERSION, TYPE, DATA_LEN, ...DATA, CHECKSUM]`.
* **RPC Commands Handled**:
  - `0x01` (Send Wi-Fi Credentials): Payload contains `[SSID_LEN, SSID, PASS_LEN, PASS]`.
  - `0x02` (Identify): Flashes M5Stick LED or beeps buzzer.
  - `0x03` (Request State): Emits current device state.
* **Device States Emitted**:
  - `0x00` = Stopped
  - `0x01` = Awaiting Authorization / Ready
  - `0x02` = Provisioning (Wi-Fi connection attempt in progress)
  - `0x03` = Provisioned (Wi-Fi connected successfully)

### 3.3. Flash NVS Schema (`Preferences`)
* **Namespace**: `"santa_cfg"`
* **Keys**:
  - `"wifi_ssid"`: `char[33]` (String up to 32 chars + null)
  - `"wifi_pass"`: `char[65]` (String up to 64 chars + null)
  - `"mode"`: `uint8_t` (`0` = Demo Mode, `1` = Real Advent Mode)
  - `"tz_offset"`: `int32_t` (Seconds from UTC, default 3600 for CET)

---

## 4. Hardware & Memory Impact

* **RAM Footprint**:
  - Dynamic heap allocation: 0 bytes during frame render loop.
  - Static serial buffer: 256 bytes for incoming Improv packets.
  - Overall SRAM usage: Stays at ~11.5% (well below the 25% / 56 KB budget).
* **Flash Footprint**:
  - Improv Serial logic: ~12 KB compiled.
  - Total Flash usage: Fits comfortably within ~1.0 MB of the 3.0 MB `huge_app` partition.
* **Power & Radio**:
  - Wi-Fi radio is active *only* during the USB provisioning handshake.
  - Immediately after verification and initial NTP time sync, radio is put into deep sleep (`WiFi.mode(WIFI_OFF)`).

---

## 5. Web <-> IoT 1:1 Parity Mapping

| Responsibility | Web Twin (`page/`) | C++ Firmware (`firmware/`) |
|---|---|---|
| **Web Serial Flasher** | `ESPInstallButton.tsx` (wrapped `<esp-web-install-button>`) | ESP32 ROM Bootloader (hardware UART) |
| **Manifest Contract** | `public/firmware/manifest.json` | PlatformIO build artifacts (`firmware.bin`, etc.) |
| **Improv Wi-Fi Serial** | Built into ESP Web Tools core | `firmware/src/network/improv_handler.cpp` |
| **Credential Storage** | Browser input fields (client-side only, zero cloud leakage) | ESP32 Flash NVS (`Preferences`) |
| **First-Boot Time Sync**| Local browser clock feedback | `WiFi.begin()` $\rightarrow$ `configTzTime()` $\rightarrow$ `M5.Rtc.setDateTime()` |

---

## 6. Acceptance Criteria

1. **One-Click Installation**: Clicking "Install on M5Stick" from desktop Chrome/Edge connects to the M5StickC-Plus SE, flashes firmware binaries, and completes without errors.
2. **Unified Wi-Fi Prompt**: Immediately after flashing finishes, the ESP Web Tools modal prompts for Wi-Fi SSID and password without requiring any second dialog or app.
3. **Valid Credential Persistence**: When Wi-Fi credentials are submitted, device connects to the network, saves credentials to NVS, and confirms connection with its IP.
4. **Offline Boot Fallback**: If the user skips or closes the Wi-Fi prompt, the device reboots into offline Demo mode without hanging or crashing.
5. **Quality Gates Passed**:
   - `npm --prefix page run typecheck` passes with 0 errors.
   - `npm --prefix page run lint` passes with 0 errors/warnings.
   - `npm --prefix page test` passes with clean exit code 0.
   - `pio test -e native` passes all unit tests cleanly.
