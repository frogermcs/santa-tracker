# Product Requirements Document (PRD): M5StickC Santa Tracker (`SANTA-OS`)

**Status:** Draft / Prototype Complete  
**Target Hardware:** M5StickC Plus / Plus2 (ESP32-PICO, 240×135 ST7789v2 TFT)  
**Target Audience:** Kids (ages 4–10) & Makers/Parents  

---

## 1. Overview & Vision
The **M5StickC Santa Tracker** is a pocket-sized, retro pixel-art gadget designed to build excitement for kids on Christmas Eve. Using the M5StickC's built-in screen, buttons, buzzer, and IMU, it simulates a live telemetry link to Santa’s sleigh across three interactive views without requiring a phone or external screen.

---

## 2. Hardware Specifications & Constraints
* **Display:** 1.14" IPS LCD, `240 × 135` px (Landscape orientation), 16-bit RGB565 color.
* **Memory Budget:** Use a full-screen `M5Canvas` / `LGFX_Sprite` double buffer (`240 × 135 × 2 bytes = ~64.8 KB RAM`) to guarantee 30+ FPS flicker-free rendering.
* **Inputs:**
  * `Button A` (Front M5 Button): Primary screen navigation.
  * `Button B` (Top Side Button): Context-sensitive action / animation trigger.
  * `IMU` (MPU6886): Shake detection for snow globe physics or turbo boost.
* **Audio:** Built-in passive buzzer (`StickCP2.Speaker.tone()`) for 8-bit UI chirps and jingles.

---

## 3. Core Functional Requirements (The 3 Screens)

### Screen 1: Side-View Santa Cam (4-Step Pixel Animation)
* **Goal:** Show what Santa is doing right now in a charming, readable side-profile view.
* **States (Auto-cycles every 4s, or manually via `Btn B`):**
  1. **Cruising Sky:** Sleigh & Rudolph bobbing through parallax snowflakes and pine trees.
  2. **Chimney Drop:** Parachuting gift boxes onto scrolling rooftops.
  3. **Cookie Break:** Close-up side profile of Santa eating cookies & drinking milk.
  4. **Hyper-Warp:** High-speed star streaks, sleigh shake, and glowing Rudolph nose aura.

### Screen 2: Santa's Telemetry Dashboard
* **Goal:** High-contrast numerical readout that kids can read at a glance.
* **Metrics Displayed:**
  * **Distance Traveled (`KM`):** Live incrementing counter.
  * **Sleigh Speed (`MACH`):** Fluctuating speed indicator (e.g., `M 4.5`).
  * **Gifts Delivered:** Fast-ticking counter synced to time of day.
  * **Next Destination:** Highlighted banner showing upcoming city (configurable, e.g., `KRAKOW, PL`).

### Screen 3: Global Radar Map
* **Goal:** Present Santa's worldwide journey as a retro military/aviation radar.
* **Features:**
  * Low-res pixel-art world map with lat/lon grid overlay.
  * Sweeping green radar beam (`1px` line with trailing gradient).
  * Breadcrumb trail connecting visited waypoints.
  * Pulsing red beacon at Santa's interpolated `X, Y` position + live `LAT/LON` footer.

---

## 4. User Interaction Matrix

| Input | Screen 1 (Side Cam) | Screen 2 (Dashboard) | Screen 3 (World Radar) |
| :--- | :--- | :--- | :--- |
| **Btn A (Short Press)** | Switch to Screen 2 | Switch to Screen 3 | Switch to Screen 1 |
| **Btn B (Short Press)** | Cycle Santa Action (1–4) | Trigger Gift Boost (+25k) | Jump to Next Continent |
| **Btn B (Long Press)** | Toggle Buzzer Mute/Unmute | Toggle Buzzer Mute/Unmute | Toggle Radar Sweep Line |
| **Shake Device (IMU)** | Blizzard Mode (3x snow) | Mach Speed Spike | Radar Glitch / Ping |

---

## 5. Next Milestones (Prototype → Production Firmware)

- [ ] **Milestone 1: Sprite Asset Pipeline**
  - Convert prototype matrices (`sleighSprite`, `reindeerSprite`, `santaCookieSprite`) into RGB565 `PROGMEM` C++ header files (`sprites.h`).
- [ ] **Milestone 2: Real-Time Clock (RTC) & NTP Sync**
  - Connect to Wi-Fi once on boot to sync the BM8563 RTC chip, then disable Wi-Fi to save battery.
  - Scale `Gifts Delivered` and waypoint progression dynamically based on real time on Dec 24th (12:00 UTC to 06:00 UTC).
- [ ] **Milestone 3: Kid's Home City Configuration**
  - Add a simple `config.h` (or captive Wi-Fi portal) allowing parents to set their kid's hometown name, coordinates, and target bedtime so Santa "approaches" right before sleep.
- [ ] **Milestone 4: Battery & Power Management**
  - Display real battery percentage via `StickCP2.Power.getBatteryLevel()`.
  - Auto-dim screen after 2 minutes of inactivity; wake on `Btn A/B` or IMU shake.