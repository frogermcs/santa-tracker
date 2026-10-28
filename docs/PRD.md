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

---

## 2. Hardware Specifications & Budget

The physical gadget runs on the **M5StickC-Plus SE** (Special Edition, translucent orange casing):

* **Processor:** ESP32-PICO-D4 (240MHz dual-core, 520KB SRAM, 4MB Flash).
* **Display:** 1.14" IPS LCD, `240 × 135` px landscape orientation, 16-bit RGB565 color.
* **Internal RAM Buffer:** 16-bit double buffer (`240 × 135 × 2 = ~64.8 KB RAM`) via `M5Canvas` guaranteeing 30+ FPS flicker-free rendering.
* **Memory Budget for 288 Cities:**
  * 288 cities $\times$ 32 bytes per waypoint struct $\approx$ **9.2 KB of RAM**.
  * Fits comfortably within available ESP32 SRAM (currently utilizing only 17.1% / 56 KB).
* **Power Management:** 120mAh LiPo battery with AXP192 PMU.
* **Inputs:**
  * `Button A` (Front M5 button): Screen navigation / waypoint jump.
  * `Button B` (Top side button): Context actions (speed multiplier, audio mute/unmute).
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
| **3. Telemetry Dashboard** | **High Mach Speed** readout (e.g. `M 4.5`); distance climbing | **Speed: 0.0 Mach** (Landed); Gifts counter ticking rapidly |

### 3.3. Single Source of Truth & Parent Customization
* **JSON Master Schedule:** Master 288-city route served at `/api/journey` and `journey.json`.
* **Hometown Injection:** Parents can configure their hometown on December 24th, letting Santa approach their house right at bedtime.
* **Wi-Fi Sync ("Burst & Sleep"):** Device periodically checks the API, updates its route in memory, and powers down Wi-Fi immediately to maximize the 120mAh battery.
* **Offline Demo Fallback:** Preloaded route in flash memory; zero delay or dependency on Wi-Fi during presentations or travel.

---

## 4. User Interaction Matrix

| Input | Physical Device (M5StickC) | Web Emulator |
| :--- | :--- | :--- |
| **Button A (Short Press)** | Cycle Screens (`Radar` → `Santa Cam` → `Dashboard`) | Click M5 Button or press `Space` / `A` |
| **Button B (Short Press)** | Cycle Speed Multiplier (`1x` → `2x` → `4x` → `8x`) | Click Side Button or press `B` |
| **Button B (Long Press)** | Toggle Buzzer Sound Chirps (Mute / Unmute) | Audio Toggle Button or press `M` |

---

## 5. Non-Functional Requirements

* **Performance:** Constant 30+ FPS rendering on ESP32 LCD.
* **Flash Budget:** Within 3MB partition limit (`huge_app.csv`, ~1.6MB / 50.9% currently used).
* **RAM Budget:** Under 25% total internal SRAM usage (9.2 KB for 288 cities).
* **Testability:** Core simulation mathematics decoupled from LCD code; passes native unit tests on desktop macOS/Linux in under 1 second.

---

## 6. Milestone 1 Acceptance Criteria (Operational Radar End-to-End)

1. **City List Ingestion:** Schema and parser support user-supplied multi-day cities schedule.
2. **Web Simulation Enhancements (`/`):**
   * **Day Selector:** Interactive selector allows picking any day between December 1st and December 24th to load that day's itinerary.
   * **10x Speed Mode:** Dedicated toggle to run at 10x speed to easily test and inspect the full journey.
3. **API Endpoint (`/api/journey`):** Serves complete multi-day schedule with CORS and edge caching.
4. **M5StickC-Plus SE Firmware (`firmware/`):**
   * Successfully connects to Wi-Fi on boot and downloads the JSON schedule.
   * Hardcoded initial date: "Today is Dec 24th" to immediately test the Dec 24th finale route.
   * Offline fallback: Uses preloaded Dec 24th itinerary if Wi-Fi is unavailable.

