# Implementation Plan: Milestone 3 — Single-Journey Web Flasher & In-Browser Wi-Fi Setup

## 1. Prerequisites & Dependencies
* `esp-web-tools` npm package for client-side web flasher.
* PlatformIO build environment to generate `bootloader.bin`, `partitions.bin`, `boot_app0.bin`, and `firmware.bin`.
* Packaging script to bundle binaries and manifest into `page/public/firmware/`.

---

## 2. Step-by-Step Task Breakdown

### Phase 1: Firmware Packaging Pipeline
- [ ] **Task 1.1: Automated Firmware Bundler Script**
  - Create `scripts/package-firmware.mjs` to invoke PlatformIO compile and copy generated binaries into `page/public/firmware/`.
  - Files: `[NEW] scripts/package-firmware.mjs`
  - Verification: Run script and verify `public/firmware/manifest.json` and `.bin` files exist.

### Phase 2: Web Installer Component & Landing Page Integration
- [ ] **Task 2.1: Add `esp-web-tools` Dependency**
  - Install `esp-web-tools` in `page/package.json`.
  - Files: `[MODIFY] page/package.json`
  - Verification: `npm --prefix page run typecheck` passes.
- [ ] **Task 2.2: Build Client-Side Installer Component**
  - Create `page/components/ESPWebInstaller.tsx` wrapping `<esp-web-install-button>`.
  - Include Web Serial capability detection (`'serial' in navigator`) and educational Chrome/Edge prompts.
  - Files: `[NEW] page/components/ESPWebInstaller.tsx`
  - Verification: Renders cleanly on SSR/CSR without hydration mismatch.
- [ ] **Task 2.3: Integrate Installer into Landing Page**
  - Add "Install on M5Stick" hero button and modal on `page/app/page.tsx`.
  - Files: `[MODIFY] page/app/page.tsx`
  - Verification: Button launches dialog on desktop Chromium browser.

### Phase 3: Firmware Improv Wi-Fi Serial & NVS Persistence
- [ ] **Task 3.1: Improv Wi-Fi Serial Protocol Handler**
  - Implement zero-allocation Improv Serial parser in `firmware/src/network/improv_handler.h` and `.cpp`.
  - Handles Improv RPC `0x01` (Credentials), `0x02` (Identify), `0x03` (State).
  - Files: `[NEW] firmware/src/network/improv_handler.h`, `[NEW] firmware/src/network/improv_handler.cpp`
  - Verification: Native unit tests validating packet decoding and checksum validation.
- [ ] **Task 3.2: Configuration Manager with NVS (`Preferences`)**
  - Implement `firmware/src/core/config_manager.h` and `.cpp` to persist SSID, password, and mode in Flash NVS.
  - Files: `[NEW] firmware/src/core/config_manager.h`, `[NEW] firmware/src/core/config_manager.cpp`
  - Verification: Native unit tests with mock storage interface.
- [ ] **Task 3.3: Firmware Entrypoint Integration (`main.cpp`)**
  - Hook Improv handler into `setup()` and `loop()`.
  - If Wi-Fi connects successfully, run initial NTP sync and then put Wi-Fi to sleep.
  - Files: `[MODIFY] firmware/src/main.cpp`
  - Verification: Clean compilation with zero warnings under `-Wall -Wextra`.

---

## 3. Verification Plan & Delivery Gates

### Automated Delivery Gates
- [ ] `npm --prefix page run typecheck` $\rightarrow$ 0 errors.
- [ ] `npm --prefix page run lint` $\rightarrow$ 0 errors, 0 warnings.
- [ ] `npm --prefix page test` $\rightarrow$ 100% passing tests.
- [ ] `pio test -e native` $\rightarrow$ All native unit tests pass.

### Manual Verification
- [ ] Connect physical M5StickC-Plus SE to USB.
- [ ] Open landing page in Google Chrome.
- [ ] Click "Install on M5Stick" and select the USB Serial port.
- [ ] Verify firmware flashes successfully to 100%.
- [ ] Verify the modal immediately prompts for Wi-Fi SSID and password.
- [ ] Enter home Wi-Fi credentials and click Connect.
- [ ] Verify M5Stick connects, reports its IP, and completes setup.
