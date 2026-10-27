# SANTA-OS Development Roadmap

This document outlines the phased milestone roadmap for **SANTA-OS**, guiding the project from its current MVP into a full multi-screen gadget with live Christmas Eve wall-clock synchronization and parent customizers.

---

## Milestone Overview

```
Phase 1: Pure Radar MVP (COMPLETE ✅)
   │
   ▼
Phase 2: Live Clock Sync & Christmas Eve Countdown
   │
   ▼
Phase 3: Parent Configuration Portal & Storage
   │
   ▼
Phase 4: Multi-Screen Expansion (Santa Cam & Dashboard)
   │
   ▼
Phase 5: Production, 3D Prints & Gift Packaging
```

---

## Phase 1: Pure Radar MVP (Complete ✅)

* [x] **Repository Reorganization:** Clean separation of web (`page/`) and embedded firmware (`firmware/`).
* [x] **Hardware Architecture:** M5StickC-Plus SE support with 3MB `huge_app` partition table.
* [x] **Retro Radar Display:**
  * 912 precomputed PROGMEM coastline dots.
  * Fixed-center 360° rotating radar sweep line with secondary trailing beam.
  * Red/white flashing Santa contact blip with radiating radar ping rings.
  * Golden dotted breadcrumb flight trail.
  * Phosphor CRT green background and grid lines.
* [x] **Single Source of Truth:**
  * Shared JSON schema exposed at `/api/journey` and `public/journey.json`.
* [x] **Offline Resilience:**
  * Embedded PROGMEM fallback JSON guaranteeing instant boot with zero network delay.
  * "Burst & Sleep" Wi-Fi mode that shuts off the radio immediately after sync to preserve the 120mAh battery.
* [x] **Testing & CI:**
  * PlatformIO native desktop unit test suite passing in under 1 second.
  * GitHub Actions CI workflow running Next.js build, native tests, and firmware build on push.
* [x] **Dedicated Presentation View:**
  * Built [`/radar`](file:///Users/frogermcs/dev/workspace/ai-workflow/santa-demo/page/app/radar/page.tsx) with live telemetry and emulator controls.

---

## Phase 2: Live Wall-Clock Synchronization (Christmas Eve Mode)

* **Objective:** Enable Santa to progress across the globe in real time on Christmas Eve (December 24th).
* **Key Tasks:**
  - [ ] **NTP Synchronization:** Brief Wi-Fi connection on boot to sync the onboard BM8563 Real-Time Clock (RTC) chip with UTC time.
  - [ ] **Pre-Flight Staging Mode:**
    - Before December 24th, 10:00 UTC: Santa is parked at the North Pole undergoing sleigh inspections.
    - Display a live countdown timer until launch.
  - [ ] **Live Flight Timeline:**
    - Dec 24, 10:00 UTC (Auckland departure) to Dec 25, 06:00 UTC (Honolulu arrival).
    - Map Santa's current waypoint and lat/lon automatically to real wall-clock minutes.
  - [ ] **Demo Mode Override:**
    - Preserve the current manual simulation mode (fast-forward, speed multipliers) when triggered via button hold.

---

## Phase 3: Parent Configuration Portal & Persistent Storage

* **Objective:** Allow parents to personalize the experience for their child without editing code or flashing firmware.
* **Key Tasks:**
  - [ ] **Kid's Hometown Destination:**
    - Allow parents to configure their child's home city name, coordinates, and expected bedtime.
    - Santa's route dynamically calculates an arrival time just before the child goes to sleep.
  - [ ] **Captive Wi-Fi Setup Portal (ESP32 Access Point):**
    - If the device cannot connect to a known network, it spawns an open Wi-Fi AP (`Santa-OS-Setup`).
    - Parents connect with their smartphone to enter home Wi-Fi credentials via a local web form.
  - [ ] **Non-Volatile Storage (Preferences / LittleFS):**
    - Save child settings, Wi-Fi credentials, and mute preferences in ESP32 flash memory across power cycles.

---

## Phase 4: Multi-Screen Feature Expansion

* **Objective:** Port the remaining screens from the prototype into the modular architecture.
* **Key Tasks:**
  - [ ] **Screen 1 (Side-View Santa Cam):**
    - Create `ui/screen_cam.cpp` rendering the 4-step pixel animations:
      1. *Cruising Sky:* Sleigh bobbing through snowflakes and pine trees.
      2. *Chimney Drop:* Parachuting gift boxes.
      3. *Cookie Break:* Side profile of Santa eating cookies.
      4. *Hyper-Warp:* Star streaks and glowing Rudolph nose.
  - [ ] **Screen 2 (Santa's Telemetry Dashboard):**
    - Create `ui/screen_dash.cpp` displaying:
      - Live distance covered (`KM`).
      - Sleigh speed (`MACH`).
      - Gifts delivered counter.
      - Highlighted destination banner.
  - [ ] **Screen Navigation:**
    - Short press Button A to cycle between: `Santa Cam` → `Dashboard` → `World Radar`.
  - [ ] **Sound FX Expansion:**
    - Polyphonic Christmas arrival jingle played through `M5.Speaker` upon reaching the child's hometown.

---

## Phase 5: Production, 3D Prints & Gift Packaging

* **Objective:** Polish the physical gadget into an unforgettable Christmas Eve gift.
* **Key Tasks:**
  - [ ] **3D-Printed Desktop Stand:** Snap-on display dock shaped like a chimney or sleigh stand with a USB-C charging slot.
  - [ ] **Lanyard & Neck Strap:** Printable or branded festive lanyard for wearable tracking.
  - [ ] **Kid's Mission Briefing Card:** Printable retro air-traffic control flight manual and gift box insert.
