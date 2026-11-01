# Product Requirements Document (PRD): SANTA-OS

**Product Name:** SANTA-OS (Santa Sleigh Radar & Telemetry Tracker)  
**Target Hardware:** M5StickC-Plus SE (ESP32-PICO-D4, 240×135 ST7789v2 IPS Display)  
**Companion App:** Next.js 15 (TypeScript, Tailwind CSS, HTML5 Canvas)  
**Status:** MVP Complete & Active Master Plan  

---

## 1. Executive Summary & Vision

**SANTA-OS** is a pocket-sized retro gadget and companion web experience designed to bring the excitement of Santa Claus's worldwide journey to life for kids (ages 4–10) and maker families throughout the entire Advent season.

Rather than a simple one-night tracker, SANTA-OS operates as a **24-day Advent chronicle (December 1st – 24th)**. Over these 24 days, Santa visits **over 200 cities across all 7 continents**, establishing a regular global rhythm:
* **~1 hour in transit** (flying high across oceans and continents).
* **~1 hour in the city** (landed on rooftops, dropping gifts and eating cookies).
* Santa traverses the entire globe daily (~12 cities per day, 288 waypoints total), culminating on **December 24th** when Santa arrives at the child's configured hometown right before bedtime.

### 1.1. Core Architectural Principle: Web App as the IoT Specification
The companion web application (`page/`) serves as the definitive functional, visual, and mathematical specification for the physical M5StickC-Plus SE IoT application (`firmware/`):
* **Web-First Delivery Sequence**: The web app must always be 100% development-complete, tested, and approved **prior** to porting features to the IoT firmware.
* **1:1 Screen Parity**: Every single screen, mode, and state present on the IoT device must have an exact 1:1 corresponding screen on the web companion app (running the exact 240×135 ST7789v2 canvas emulation).
* **Algorithm & Coordinate Parity**: Coordinate projections, interpolation easing curves (`ease()`), and transit/landed timings are perfected and verified on the web before being mirrored into C++.
* **1:1 LovyanGFX / M5Canvas Web Twin (`/`)**: Root application page directly executes `M5CanvasSim` and zero-allocation C++ logic (`iotAppLogic.ts`) inside the native 1x physical ST7789v2 enclosure. Implements exact LovyanGFX method signatures, RGB565 color math, text datums, and integer coordinate truncation (`Math.floor`) with instant HMR and 100% C++ portability.

---

## 2. Hardware Specifications & Budget

The physical gadget runs on the **M5StickC-Plus SE** (Special Edition, translucent orange casing):

* **Processor:** ESP32-PICO-D4 (240MHz dual-core, 520KB SRAM, 4MB Flash).
* **Display:** 1.14" IPS LCD, `240 × 135` px landscape orientation, 16-bit RGB565 color.
* **Internal RAM Buffer:** 16-bit double buffer (`240 × 135 × 2 = ~64.8 KB RAM`) via `M5Canvas` guaranteeing 30+ FPS flicker-free rendering.
* **Memory Budget for 288 Cities:**
  * 288 cities $\times$ 28 bytes per waypoint struct compiled in `PROGMEM` $\approx$ **8.0 KB of Flash ROM** (0 bytes dynamic heap allocation).
  * Internal SRAM usage is only 11.0% (35.9 KB / 320 KB), well below the 25% (< 56 KB) safety budget.
* **Power Management:** 120mAh LiPo battery with AXP192 PMU.
* **Inputs:**
  * `Button A` (Front M5 button): Cycles through the 24 Advent Days (1 $\rightarrow$ 24 $\rightarrow$ 1).
  * `Button B` (Top side button): Cycles Cities on active day (1 $\rightarrow$ 12 $\rightarrow$ 1). Long press toggles audio mute/unmute.
* **Audio:** Onboard passive piezo buzzer (`M5.Speaker.tone()`).
* **Hardware Note:** The *SE* model omits the 6-axis IMU (MPU6886). All interactions rely strictly on buttons.

---

## 3. Core Feature Requirements

### 3.1. Hero View: Global Aviation Radar (MVP ✅)
* **CRT Phosphor Aesthetic:** Deep green background (`#02110a`) with 40×27px faint green grid.
* **Coastline Dot Matrix:** 912 precomputed PROGMEM coastline dots (`#1f8a4a`) representing world landmasses.
* **Fixed Radar Center:** Stationary radar dish at center `(120, 68)` with concentric range rings (`r = 32, 64, 96`) and crosshairs.
* **Rotating Radar Beam:** 360° sweeping green ray (`#5aff8c`) with faint trailing ray.
* **Santa Blip:** Pulsing red/white contact marker with radiating radar ping rings.
* **Dotted Breadcrumbs:** Gold dotted flight trail (`#ffd54a`, 3px spacing) trailing Santa.
* **HUD Readouts:** Header (`RADAR MIKOLAJA`, battery %, speed multiplier); Footer (`CEL: <CITY>`, `CZAS 0:<ETA>`).

### 3.2. Context-Aware Visuals Across Screens
The app features 3 distinct views, where animations automatically reflect Santa's flight status:

| Screen | When in Transit (~1 hr Flight) | When in City (~1 hr Stay) |
| :--- | :--- | :--- |
| **1. World Radar** (Hero) | Santa moving along dotted flight path toward next city | Radar locked on city coordinates; beacon pulsing |
| **2. Side-View Santa Cam** | **Cruising Sky** (bobbing in snowflakes) / **Hyper-Warp** (speed lines) | **Chimney Drop** (parachuting gifts) / **Cookie Break** (eating cookies) |
| **3. Telemetry Dashboard** | **High Mach Speed** readout (e.g. `M 4.8`), stratospheric altitude, Rudolph strobe beacon, high-speed carrot burn | **Speed: 0.0 Mach** (Landed); Cookie intake surge, rapid Gift delivery cascade (`+18.5k/s`), cocoa refill |

### 3.3. Cockpit Dashboard Specification (Milestone 2 — Screen 3 / Modern Glass Cockpit)
For the 240×135 ST7789v2 IPS display, the Cockpit Dashboard provides a high-contrast, modern aerospace glass cockpit interface (pitch-black obsidian background, titanium slate dividers, electric ice cyan headers, pure white live telemetry, and full-color 16-bit iconography):
* **Header Bar**: Sleek dark avionics glass (`0x0821`), battery level with green gauge and pure white readout (`98%`), electric cyan system title (`KOKPIT MIKOLAJA`), and active Advent day badge in high-visibility amber (`DZIEN 24` / `DZIEN XX`).
* **Flight Dynamics Box (Left Column, Upper)**:
  * Speed meter: `PREDK.` with live readout in flame amber (`M 4.8` in flight) or muted slate (`M 0.0` landed).
  * Multi-color 10-segment speed bar: Segments 0–3 in Ice Cyan (`0x07ff`), 4–6 in Aviation Amber (`0xfde0`), and 7–9 in Hypersonic Flame/Red (`0xf800`) over dark graphite slots (`0x18e3`).
  * Stratospheric altitude: Metric readout in electric cyan (`PULAP 11.5k M` cruising at 11,500m; `PULAP 65 M` on city rooftops).
* **Gift Payload Box (Right Column, Upper)**:
  * Header: `PREZENTY` in electric cyan with 8×8 full-color pixel-art gift box icon (ruby red box with bright yellow/gold ribbon).
  * Delivered count: `DOSTARCZONO:` in cool slate with pure white (`0xffff`) demographic metrics based on ~2.20B global children (e.g. `2.20B`).
  * Drop rate: `ZRZUT:` displaying strictly `0/s` (muted) during transit flight and regional distribution rates in flame gold (e.g. `+105.6k/s`) while landed.
  * Progress bar: 10-segment vivid emerald neon meter (`0x07e0`) over dark graphite slots.
* **Sustenance Box ("Paliwo Mikołaja", Full Width, Middle)**:
  * Header: `PALIWO MIKOLAJA` in electric cyan.
  * 8×8 Pixel-Art Chocolate Chip Cookie: Golden-amber baked cookie (`0xfc80`) with crispy edges and dark chocolate chips, placed before label `CIASTKA:` with pure white counter (e.g. `330.0M`).
  * 7×9 Pixel-Art Milk Bottle: Crisp pure white glass bottle (`0xffff`) with red cap and sky-blue label band, placed before label `MLEKO:` with pure white counter (e.g. `25.3M L`).
* **Mission Phase Tactical Box (Full Width, Lower Middle)**:
  * Sleek avionics console panel (`0x0842`) framed by dynamic status borders: Electric Cyan during flight, Vivid Emerald Neon on rooftops, and flashing Gold/Red during the Kraków finale.
  * Header: `AKTUALNA FAZA MISJI:` in cool slate.
  * Single concise status headline with dynamic contextual text:
    * In transit: `PRZELOT HIPERSONICZNY (M4.8)` in bright flame amber.
    * Rooftop phase 1 (0–6s): `BEZPIECZNY DACH // ZRZUT PREZENTOW` in vivid emerald neon.
    * Rooftop phase 2 (6–12s): `PRZERWA NA CIASTKA I MLEKO` in vivid emerald neon.
    * Rooftop phase 3 (12–15s): `DACH ZALICZONY // START ZA CHWILE` in vivid emerald neon.
    * Grand Finale: `FINAL WIGILII: KRAKOW!` in pure white on flashing border.
* **Telemetry Navigation Footer (Bottom)**:
  * Dynamic destination indicator: `CEL:` in Electric Cyan during flight vs `POSTOJ:` in Vivid Emerald on rooftops (or `FINAL:` in Amber Gold on Dec 24 finale), followed by target city name in pure white (`0xffff`).
  * Phase countdown timer: `CZAS 0:12` in high-visibility amber (or `WIGILIA!` on finale hold).

### 3.4. Single Source of Truth & Parent Customization
* **JSON Master Schedule:** Master 288-city route served at `/api/journey` and `journey.json`.
* **Hometown Injection:** Parents can configure their hometown on December 24th, letting Santa approach their house right at bedtime.
* **Wi-Fi Sync ("Burst & Sleep"):** Device periodically checks the API, updates its route in memory, and powers down Wi-Fi immediately to maximize the 120mAh battery.
* **Offline Demo Fallback:** Preloaded route in flash memory; zero delay or dependency on Wi-Fi during presentations or travel.

---

## 4. User Interaction Matrix & Hardware-Simulator 1:1 Parity

### 4.1. Unified Two-Button Control Layout (Variant 1 — Child-Friendly)
To maintain strict 1:1 parity between physical M5StickC-Plus SE hardware and the web emulator, all navigation is performed strictly via the two physical/emulated buttons (eliminating artificial keyboard shortcuts):

| Input | Physical Device (M5StickC) | Web Emulator | Description |
| :--- | :--- | :--- | :--- |
| **Button A Short Click (<0.6s)** | Front `M5` button (click) | Click `M5` Button | **Przełącz Ekran**: 3-screen carousel navigation (`Radar Lotu` → `Kokpit Mikołaja` → `Kamera Mikołaja` → `Radar Lotu`). Instant visual feedback. |
| **Button A Long Hold (>0.6s)** | Front `M5` button (hold) | Hold `M5` Button (>0.6s) | **Następny Dzień (1–24)**: Cycles through the 24 Advent days (`D01` → `D02` → ... → `D24` → `D01`) with chime confirmation. |
| **Button B Short Click (<0.6s)** | Top side button (click) | Click Top Side Button | **Następne Miasto (1–12)**: Advances Santa to the next city on the active day, placing Santa landed at that city. |
| **Button B Long Hold (>0.6s)** | Top side button (hold) | Hold Top Side Button (>0.6s) | **Dźwięk Mute / Unmute**: Toggles synthesized retro buzzer chirps and chimes with audio chirp on unmute. |

### 4.2. Simulation Rhythm & Speed Ratio
* **Real-World Itinerary**: 1 hour in transit (flight) + 1 hour in city (stop) = 2 hours per waypoint (12 stops = 24 hours).
* **Hardcoded Web Simulation**: Scaled to **15 seconds in transit + 15 seconds landed in city** (**30 seconds total per waypoint**, `secPerCity = 30`).
* **Day 24 Grand Finale Hold**: Once Santa lands in Kraków (#288), Santa remains landed in Kraków for an extended celebration hold (`FINAŁ: KRAKOW 🎁`).

---

## 5. Non-Functional Requirements & Delivery Quality Gates

### 5.1. Performance & Hardware Budgets
* **Performance:** Constant 30+ FPS rendering on ESP32 LCD.
* **Flash Budget:** Within 3MB partition limit (`huge_app.csv`, ~870 KB / 27.6% used).
* **RAM Budget:** Under 25% total internal SRAM usage (35.9 KB / 11.0% used; 0 bytes dynamic heap allocation in render loop).
* **Testability:** Core simulation mathematics decoupled from LCD code; passes 12 native unit tests on desktop macOS/Linux in under 1 second (0.76s).

### 5.2. Mandatory Delivery Gates (Zero Tolerance for Errors)
* **Web Companion App (`page/`):**
  * `npm --prefix page run typecheck` (`tsc --noEmit`): **0 errors**.
  * `npm --prefix page run lint`: **0 errors, 0 warnings**.
  * `npm --prefix page run test:schedule`: **100% passing tests** validating 288 stops and Kraków finale.
* **C++ Firmware (`firmware/`):**
  * Zero compiler warnings/errors under `-Wall -Wextra`.
  * Passes `pio test -e native` on desktop without requiring hardware.
  * Clear code documentation and comments explaining memory layouts and pointer logic.
* **Delivery Workflow:**
  * Each new functionality or non-trivial change must be delivered via an isolated, reviewable Pull Request (`feat/...` or `fix/...`).
  * All product changes and requirements modifications must be immediately documented in this PRD.

---

## 6. Milestone Acceptance Criteria

### 6.1. Milestone 1: Operational Radar End-to-End (COMPLETE ✅)

1. **City List Ingestion:** Schema and parser support 288 stops across 24 Advent days from `Harmonogram Santa Tracker 2026 - Harmonogram_Lotow.csv`.
2. **December 24th Grand Finale Route:**
   * Sequence: `Oceania` $\rightarrow$ `Asia` $\rightarrow$ `Africa` $\rightarrow$ `Americas` $\rightarrow$ `Europe`.
   * Final Stop (#288): **Kraków, Poland** (`22:00 - 23:00 UTC` / 23:00-midnight CET in Poland).
   * Radar lock on Kraków: Santa lands and remains in Kraków with `FINAŁ: KRAKOW 🎁` celebration.
3. **Web Simulation & Twin Engine (`/` and `/map-debugger`):**
   * **Root Device Twin (`/`):** Pixel-accurate 1:1 hardware emulator (`240×135` @ 1x scale) executing `M5CanvasSim` and `iotAppLogic.ts` directly inside the physical M5Stick enclosure, with 1:1 button navigation (Button A toggles screen, Button B jumps city, Button B hold toggles buzzer).
   * **Map Route Debugger (`/map-debugger`):** OpenStreetMap tiles, stop-by-stop inspector, stardust trajectory vectors, and sleigh flyby test simulator.
4. **API Endpoint (`/api/journey`):** Serves complete multi-day schedule with CORS, edge caching, and active Day 24 payload.
5. **M5StickC-Plus SE Firmware (`firmware/`):**
   * Preloads all 24 days (288 stops) in Flash ROM (`PROGMEM`) with 0 dynamic heap allocations in render loop.
   * Boots directly into December 24th Grand Finale route (Kraków arrival lock).
   * Button A cycles days (1–24); Button B advances through cities on active day.
   * 12 native desktop unit tests passing in 0.76s.

### 6.2. Milestone 2: Cockpit Dashboard & Telemetry Screen (COMPLETE ✅)

1. **Modern Aerospace Glass Cockpit Interface (`ScreenCockpit` / `dashboard-screen.ts`):**
   * Pitch-black background (`0x0000`), titanium slate dividers (`0x2124`), electric ice cyan headers (`0x07ff`), pure white live telemetry, and aviation amber highlights (`0xfde0`).
   * Top Header: Battery percentage, `KOKPIT MIKOLAJA` title, active Advent day badge (`DZIEN XX`).
   * Flight Dynamics: Mach speed, 10-segment multi-color speed bar (Cyan $\rightarrow$ Amber $\rightarrow$ Red), stratospheric altitude (`PULAP 11.5k M` vs `65 M`).
   * Gift Payload: Delivered count (`DOSTARCZONO:`), regional drop rate (`ZRZUT:` in flame gold on roofs, `0/s` in flight), 10-segment emerald progress bar.
   * Sustenance ("Paliwo Mikołaja"): 8×8 pixel-art chocolate chip cookie icon + counter (`CIASTKA: 330.0M`); 7×9 pixel-art milk bottle icon + counter (`MLEKO: 25.3M L`).
   * Tactical Mission Phase: Panel with dynamic border (Ice Cyan in flight, Emerald Neon on roofs, flashing Gold/Red on finale) displaying current sub-phase headline.
   * Navigation HUD Footer: Destination indicator (`CEL:`, `POSTOJ:`, `FINAL:`) + city name + countdown ETA (`CZAS 0:XX` or `WIGILIA!`).
2. **Mathematical & Demographics Parity:**
   * Global 2.20 Billion children demographic model across the 12 Day 24 stops.
   * Cookie intake factor ($0.15 \times \text{gifts}$) and milk consumption ($0.0115 \text{ L} \times \text{gifts}$).
   * 30s simulation cadence (`secPerCity = 30.0s`, 15s transit flight + 15s rooftop dwell).
3. **M5StickC-Plus SE Firmware Delivery:**
   * Zero dynamic heap allocations in frame render loop (`ScreenCockpit::render`).
   * SRAM usage: 11.0% (35.9 KB / 320 KB), safely under 25% budget.
   * Flash usage: 28.2% (885 KB / 3.0 MB).
   * Button A short click cycles `SCREEN_RADAR` $\leftrightarrow$ `SCREEN_COCKPIT`.
   * 18 desktop Unity tests passing in 4.2s (`pio test -e native`).

### 6.3. Milestone 2 Expansion: Side-View Santa Cam (Screen 3) (COMPLETE ✅)

1. **Context-Aware Pixel-Art Cinematic Engine (`ScreenCam` / `camScreen.ts`):**
   * Mode 1: *Hyper-Warp* (`u < 4.5s`, Flight 0–30%): Rapid horizontal speed streaks, sleigh micro-vibrations, supersonic dual-stage exhaust flames, and Rudolph clean nose indicator.
   * Mode 2: *Cruising Sky / Przelot Stratosferyczny* (`4.5s <= u < 12.0s`, Flight 30–80%): Stratospheric cruise over the curved Earth globe, glowing cyan atmospheric limb, nocturnal continents with twinkling city lights, wispy clouds, and golden stardust particle trails.
   * Mode 3: *Gliding Descent / Zniżanie* (`12.0s <= u < 15.0s`, Flight 80–100%): Santa floats down from upper sky toward snowy rolling ridges with pine trees growing in perspective, decorated with multi-colored twinkling Christmas fairy lights.
   * Mode 4: *City Rooftop Chimney Cruise & Active Gift Drops* (`15.0s <= u < 21.0s`, Landed 0–6s / 40%): Sleigh cruising low over distinct separate townhouses, cottages, and chalets separated by snowy alleys with lampposts and pine trees; precision chimney-targeted present drops with parachutes landing directly into chimney mouths with delivery sparkle bursts.
   * Mode 5: *Big Santa Cookie Break* (`21.0s <= u < 27.0s`, Landed 6–12s / 40%): Dedicated cozy fireplace close-up with cross-stacked dark oak logs, bed of glowing embers, organic licking flame tongues with thermal gradients, rising sparks, big jolly Santa Claus eating chocolate chip cookies, crumbs falling, cold glass of milk with striped straw, and `MNIAM! *` speech bubble.
   * Mode 6: *Takeoff Climb / Wznoszenie* (`27.0s <= u < 30.0s`, Landed 12–15s / 20%): Sleigh ascending from ground altitude into the night sky, pine trees shrinking in reverse perspective with twinkling Christmas lights, Rudolph navigation beacon strobe, and trailing golden stardust.
   * Mode 7: *Kraków Grand Finale Hold* (Dec 24 Stop 12 Arrival Lock): Santa landed overlooking Bazylika Mariacka (St. Mary's Basilica) spires silhouette with celebratory multi-color fireworks and `WESOŁYCH ŚWIĄT!` banner.
2. **Unified 3-Screen Carousel Navigation:**
   * Button A short click rotates `SCREEN_RADAR` (0) $\rightarrow$ `SCREEN_COCKPIT` (1) $\rightarrow$ `SCREEN_CAM` (2) $\rightarrow$ `SCREEN_RADAR` (0).
   * Tactical Screen Selector Bar in companion web app with 3 tabs.
3. **M5StickC-Plus SE Firmware Delivery:**
   * Zero dynamic heap allocations in `ScreenCam::render()`.
   * SRAM: 11.0% (35.9 KB / 320 KB), safely under 25% safety budget.
   * Flash: 30.9% (971 KB / 3.0 MB).
   * 18 native Unity tests passing in 0.5s (`pio test -e native`).

---

## 7. Phased Roadmap Sequence

To ensure rich visual development and interactive verification outside of December, SANTA-OS operates on **simulated/demo time** (`secPerCity = 12s` or manual day/city jumping) through Milestones 2–4. Connecting live real-time clock (NTP/RTC) is reserved for the **very last milestone** before December 1st.

* **Milestone 1 (COMPLETE ✅):** Fully Operational Aviation Radar End-to-End (Web & M5StickC hardware).
* **Milestone 2 (COMPLETE ✅):** Context-Aware Multi-Screen Expansion:
  * Screen 1: World Aviation Radar.
  * Screen 2: Flight Telemetry / Cockpit Dashboard (Modern Glass Cockpit).
  * Screen 3: Side-View Santa Cam (Cruising Sky, Hyper-Warp, Chimney Drop, Cookie Break, Kraków Finale).
  * 3-screen circular carousel navigation across Web & Hardware.
* **Milestone 3 (ACTIVE 🎯):** Parent Customization & Wi-Fi Management (Bedtime arrival override, Burst & Sleep sync).
* **Milestone 4:** Hardware Polish & Festive Packaging (Audio jingles, 3D printed dock, kid's flight log).
* **Milestone 5 (Final Milestone Before Dec 1st):** Live Real-Time Clock & Advent Launch (NTP & RTC synchronization, 1h flight + 1h stay, with interactive demo override toggle).


