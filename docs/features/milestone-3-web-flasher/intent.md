# Feature Intent: Milestone 3 — Single-Journey Web Flasher & In-Browser Wi-Fi Setup

## 1. Problem Statement
Installing Santa-OS on physical M5StickC-Plus hardware currently requires cloning a Git repository, installing VS Code / Cursor, setting up PlatformIO, resolving Python build toolchains, and manually compiling and uploading C++ code over USB. 

Furthermore, configuring Wi-Fi credentials previously required either hardcoding credentials in `config.h` before flashing or connecting to a clunky captive portal (`192.168.4.1`) on a smartphone. This represents a massive barrier for parents and kids who just want Santa's sleigh radar on their desk.

## 2. Motivation & User Value
We want any parent or child with a laptop and an M5StickC-Plus SE to visit the Santa Tracker website, plug in their device via USB-C, click a single button, and have Santa-OS completely installed and connected to their home Wi-Fi in under 2 minutes—all within a single, continuous browser dialog.

## 3. High-Level User Journey
1. **Visit Landing Page**: User visits `santa-tracker` on Google Chrome or Microsoft Edge.
2. **Connect Device**: User connects the M5StickC-Plus SE via USB-C to their computer.
3. **One-Click Installation**: User clicks "Install on M5Stick" on the landing page.
4. **Browser Flashing**: The browser's Web Serial API communicates with the ESP32 ROM bootloader to flash pre-built binaries (bootloader, partitions, app) in ~30–45 seconds with a visual progress bar.
5. **Seamless Wi-Fi Setup (Improv Wi-Fi Serial)**: As soon as the firmware boots up, the exact same dialog automatically prompts for the home Wi-Fi network and password.
6. **Instant Time Sync & Sleep**: Device connects to Wi-Fi over USB, performs its first NTP time sync, saves credentials to ESP32 Flash memory (`Preferences`), reports success and assigned IP to the browser, and powers off the Wi-Fi radio.
7. **Ready to Enjoy**: User unplugs the USB cable and the Santa gadget is operational!

## 4. Explicit Non-Goals (Out of Scope for Milestone 3)
* **Remote Route Syncing**: We are NOT dynamically fetching or altering city schedules over Wi-Fi; all 288 waypoints remain preloaded in Flash ROM (`PROGMEM`).
* **Hometown Cloud Injection**: Custom cloud API endpoints for bedtime route alteration are out of scope.
* **Captive Portal / Soft-AP**: No mobile captive portal AP is needed since all setup occurs directly in the browser over USB.
* **Bluetooth / BLE Setup**: We are intentionally using Web Serial over USB rather than BLE to avoid the heavy Bluetooth stack footprint in firmware Flash and SRAM.

## 5. Constraints & Architectural Guardrails
* **Hardware Compatibility**: Must support M5StickC-Plus SE (ESP32-PICO-D4 with CP2104 or CH9102 USB-to-UART bridge).
* **Browser Compatibility**: Requires Web Serial API support (Google Chrome, Microsoft Edge, Opera, Brave on Desktop). Not supported on iOS Safari. Clear educational helper messages must guide users.
* **Zero-Error Gates**:
  - `npm --prefix page run typecheck` (0 errors)
  - `npm --prefix page run lint` (0 errors, 0 warnings)
  - `npm --prefix page test` (100% passing)
  - `pio test -e native` (100% passing)
* **Deterministic Firmware Memory**: Zero dynamic heap allocations in active frame render loop; SRAM usage < 25% (< 56 KB); Flash within 3MB `huge_app` limit.
* **Offline Fallback**: If user cancels or skips Wi-Fi setup, Santa-OS must continue booting into offline demo mode without crashing.
