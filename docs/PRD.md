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
    * Rooftop phase 1 (0–4s): `BEZPIECZNY DACH // ZRZUT PREZENTOW` in vivid emerald neon.
    * Rooftop phase 2 (4–8s): `PRZERWA NA CIASTKA I MLEKO` in vivid emerald neon.
    * Rooftop phase 3 (8–12s): `DACH ZALICZONY // START ZA CHWILE` in vivid emerald neon.
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
| **Button A Short Click (<0.6s)** | Front `M5` button (click) | Click `M5` Button | **Przełącz Ekran**: Cycles between operational screens (`Radar Lotu` ↔ `Kokpit Mikołaja`). Instant visual feedback. |
| **Button A Long Hold (>0.6s)** | Front `M5` button (hold) | Hold `M5` Button (>0.6s) | **Następny Dzień (1–24)**: Cycles through the 24 Advent days (`D01` → `D02` → ... → `D24` → `D01`) with chime confirmation. |
| **Button B Short Click (<0.6s)** | Top side button (click) | Click Top Side Button | **Następne Miasto (1–12)**: Advances Santa to the next city on the active day, placing Santa landed at that city. |
| **Button B Long Hold (>0.6s)** | Top side button (hold) | Hold Top Side Button (>0.6s) | **Dźwięk Mute / Unmute**: Toggles synthesized retro buzzer chirps and chimes with audio chirp on unmute. |

### 4.2. Simulation Rhythm & Speed Ratio
* **Real-World Itinerary**: 1 hour in transit (flight) + 1 hour in city (stop) = 2 hours per waypoint (12 stops = 24 hours).
* **Hardcoded Web Simulation**: Scaled to **12 seconds in transit + 12 seconds landed in city** (**24 seconds total per waypoint**, `secPerCity = 24`).
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

## 6. Milestone 1 Acceptance Criteria (Operational Radar End-to-End) (COMPLETE ✅)

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

---

## 7. Phased Roadmap Sequence

To ensure rich visual development and interactive verification outside of December, SANTA-OS operates on **simulated/demo time** (`secPerCity = 12s` or manual day/city jumping) through Milestones 2–4. Connecting live real-time clock (NTP/RTC) is reserved for the **very last milestone** before December 1st.

* **Milestone 1 (COMPLETE ✅):** Fully Operational Aviation Radar End-to-End (Web & M5StickC hardware).
* **Milestone 2 (ACTIVE 🎯):** Context-Aware Multi-Screen Expansion:
  * Screen 2: Side-View Santa Cam (Cruising Sky, Hyper-Warp, Chimney Drop, Cookie Break).
  * Screen 3: Flight Telemetry / Cockpit Dashboard (Mach Speed, KM counter, Gift Counter).
  * 3-screen carousel navigation (Web first, Firmware second).
* **Milestone 3:** Parent Customization & Wi-Fi Management (Bedtime arrival override, Burst & Sleep sync).
* **Milestone 4:** Hardware Polish & Festive Packaging (Audio jingles, 3D printed dock, kid's flight log).
* **Milestone 5 (Final Milestone Before Dec 1st):** Live Real-Time Clock & Advent Launch (NTP & RTC synchronization, 1h flight + 1h stay, with interactive demo override toggle).


