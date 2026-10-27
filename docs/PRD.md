# Product Requirements Document (PRD): SANTA-OS

**Product Name:** SANTA-OS (Santa Sleigh Radar & Telemetry Tracker)  
**Target Hardware:** M5StickC-Plus SE (ESP32-PICO-D4, 240×135 ST7789v2 IPS Display)  
**Companion App:** Next.js 15 (TypeScript, Tailwind CSS, HTML5 Canvas)  
**Status:** MVP Complete & Active Development  

---

## 1. Executive Summary & Vision

**SANTA-OS** is a pocket-sized, retro retro-futuristic Christmas Eve gadget and companion web emulator designed to bring the magic of Santa Claus's worldwide journey to life for kids (ages 4–10) and maker families.

Instead of generic smartphone apps filled with ads, SANTA-OS offers an authentic, tactile gadget experience. Styled like an air traffic control or military radar terminal, it tracks Santa's sleigh as a glowing contact moving across a phosphor-green pixel world map, synchronized with an interactive web simulator and cloud data feed.

---

## 2. Target Hardware Specifications & Constraints

The physical gadget is built specifically for the **M5StickC-Plus SE** (Special Edition, translucent orange casing):

* **Microcontroller:** ESP32-PICO-D4 (240MHz dual-core, 520KB SRAM, 4MB Flash).
* **Display:** 1.14" IPS LCD, `240 × 135` px landscape orientation, 16-bit RGB565 color.
* **Internal RAM Buffer:** Full-screen 16-bit double buffer (`240 × 135 × 2 bytes = ~64.8 KB RAM`) via `M5Canvas` / `M5GFX` guaranteeing 30+ FPS flicker-free rendering.
* **Battery & Power:** 120mAh LiPo internal battery with AXP192 PMU.
* **Physical Inputs:**
  * `Button A` (Large front M5 push button): Primary navigation and city jump.
  * `Button B` (Top side action button): Context actions (speed multiplier cycle, audio mute/unmute).
* **Audio:** Onboard passive piezo buzzer driven via `M5.Speaker.tone()` for 8-bit UI feedback and chirps.
* **Hardware Exclusion Note:** The *SE* variant omits the 6-axis IMU (MPU6886). All interactions must be driven through tactile buttons rather than accelerometer/shake gestures.

---

## 3. Core MVP Feature Requirements

### 3.1. Retro Global Aviation Radar Screen
* **Phosphor CRT Aesthetics:** Deep green background (`#02110a`) with 40px vertical and 27px horizontal faint grid lines.
* **Coastline Dot Matrix:** 912 precomputed land coordinates rendered as 2×2 green phosphor dots (`#1f8a4a`) derived from vector world polygons.
* **Fixed Radar Center:** Stationary radar scanning station located at screen center `(120, 68)` with concentric range rings (`r = 32, 64, 96`) and coordinate crosshairs.
* **Rotating Radar Beam:** 360-degree rotating green sweep line (`#5aff8c`) with trailing ray scanning the entire airspace.
* **Santa Contact Blip:** Red and white pulsing contact blip (`#ff3b3b`) with expanding radar ping circles radiating outward.
* **Dotted Breadcrumb Trail:** Gold retro dotted route (`#ffd54a`, 3px spacing) connecting all visited waypoints behind Santa.
* **Target Cities:** Blinking white/green 3×3 square for current destination, solid green for visited cities, subtle dots for future stops.
* **HUD Overlays:**
  * **Top Bar:** `RADAR MIKOLAJA` header, speed multiplier badge (`2x`, `4x`, `8x`), and real-time battery percentage / USB power status.
  * **Bottom Bar:** Destination banner (`CEL: <CITY>`) and dynamic countdown (`CZAS 0:<ETA>`).

### 3.2. Single Source of Truth (Cloud & Device Sync)
* A shared JSON schema defines Santa's itinerary, transit timing, and coordinates.
* **Endpoint:** Served from the Next.js backend via `/api/journey` (and `/journey.json`) with CORS enabled.
* **Dual Consumption:** Consumed by both the physical M5StickC device via Wi-Fi and the web simulator.

### 3.3. Offline Presentation Resilience
* **Zero-Lag Startup:** If Wi-Fi is absent, disabled, or fails to connect within 3 seconds, the device immediately loads an embedded `PROGMEM` demo schedule without showing error prompts or hanging.
* **Battery-Conserving Wi-Fi ("Burst & Sleep"):** When enabled, Wi-Fi turns on only long enough to fetch the JSON payload (<2s), then immediately turns radio power completely off (`WIFI_OFF`).

### 3.4. Dedicated Web Presentation & Emulation
* **Dedicated Route (`/radar`):** A distraction-free presentation page rendering the exact ST7789 display within a skeuomorphic M5StickC-Plus SE enclosure.
* **Live Telemetry Panel:** Real-time latitude, longitude, ETA, and speed controls.
* **Web Audio Synthesis:** Web Audio API oscillator reproducing the physical device's buzzer tones.

---

## 4. User Interaction Matrix (MVP)

| Input | Physical Device (M5StickC) | Web Emulator (`/radar`) |
| :--- | :--- | :--- |
| **Short Press Button A** | Jump to Next City | Click M5 Button or press `Space` / `A` |
| **Short Press Button B** | Cycle Speed (`1x` → `2x` → `4x` → `8x`) | Click Side Button or press `B` |
| **Long Press / Hold Button B** | Toggle Audio Chirps (Mute / Unmute) | Audio Toggle Button or press `M` |

---

## 5. Non-Functional Requirements

* **Performance:** Stable 30+ FPS on ESP32 without frame drops or tearing.
* **Flash Budget:** Maximum 3MB app partition (`huge_app.csv`); MVP currently occupies ~1.6MB (50.9%).
* **Memory Budget:** Internal RAM usage below 25% (currently 17.1% / 55KB used).
* **Testability:** Core simulation mathematics must compile and pass automated tests on desktop macOS/Linux without requiring hardware flashing.
* **Code Standard:** C++17, clean separation of concerns, zero memory leaks, const-correctness.
