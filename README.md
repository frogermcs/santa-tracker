# SANTA-OS: M5StickC-Plus SE Santa Tracker

A pocket-sized retro aviation Santa Tracker gadget for the **M5StickC-Plus SE** (ESP32-PICO-D4, 1.14" 240×135 IPS display, translucent orange enclosure) with a companion Next.js web emulator.

---

## 📚 Project Documentation

* **[Product Requirements Document (PRD)](docs/PRD.md):** Target audience, hardware constraints, core features, and user interaction matrix.
* **[Technical Architecture](docs/ARCHITECTURE.md):** Dual-target design, single-source-of-truth JSON endpoint, Wi-Fi "Burst & Sleep" lifecycle, and native test strategy.
* **[Development Roadmap](docs/ROADMAP.md):** Phased milestones from MVP through live Christmas Eve clock synchronization and multi-screen support.

---

## 📁 Repository Structure

```
.
├── firmware/       # ESP32 C++17 firmware (PlatformIO + M5Unified + ArduinoJson)
│   ├── include/    # Config, types, advent schedule (288 stops in PROGMEM), and land dots
│   ├── src/        # Core engine, demographic telemetry, radar, cockpit & cam UI renderers
│   └── test/       # Native desktop unit test suite (18 tests passing in 0.6s!)
├── page/           # Next.js 15 web platform & emulator (App Router, Tailwind)
│   ├── app/        # / (Mission Control Hub & Emulator), /map-debugger, /scene-debugging, /api/journey
│   └── public/     # Static assets and master journey.json
├── docs/           # PRD, Architecture, and Roadmap specifications
├── scripts/        # CSV ingest & C++ PROGMEM schedule export scripts
└── .github/        # GitHub Actions CI workflow (Web + Firmware build & tests)
```

---

## 🚀 Quick Start

### 1. Web Presentation & Simulator (`page/`)
```bash
cd page
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) for the Mission Control hub & hardware emulator, [http://localhost:3000/map-debugger](http://localhost:3000/map-debugger) for the geographic coordinates debugger, or [http://localhost:3000/scene-debugging](http://localhost:3000/scene-debugging) for the Santa Cam 7-scene matrix.

### 2. Firmware Testing & Flashing (`firmware/`)
```bash
cd firmware

# Run fast desktop unit tests (18 tests in 0.6s, no hardware needed!)
pio test -e native

# Compile ESP32 firmware
pio run -e m5stick-c

# Flash to connected M5StickC-Plus SE
pio run -e m5stick-c --target upload
```

---

## 🎮 Hardware Controls (M5StickC-Plus SE)

| Input | Action |
| :--- | :--- |
| **Button A (Front M5)** | **Toggle Screen**: 3-screen carousel (`Radar Lotu` → `Kokpit Mikołaja` → `Kamera Mikołaja` → `Radar Lotu`) |
| **Button A (Hold >0.6s)** | **Next Advent Day**: Cycles through 24 Advent Days (`D01` → `D02` → ... → `D24` → `D01`) |
| **Button B (Top Side)** | **Next City**: Advances to next city waypoint on active day (1 → 12 → 1) |
| **Button B (Hold >0.6s)** | **Sound Mute/Unmute**: Toggles buzzer sound chirps and chimes |

---

## ⏱️ Simulation Cadence & Scene Timings

The simulation runs a deterministic **30.0-second cycle per city** (`SEC_PER_CITY = 30.0s`), split into **15.0s in-transit flight** and **15.0s rooftop dwell**:

* **In-Transit Flight (15.0s)**:
  * **Hyper-Warp Mode** (`TRYB HYPER-WARP`, $0.0\text{s} - 4.5\text{s}$, 30%): Supersonic acceleration, speed streaks, twin jet flames.
  * **Stratospheric Flight** (`PRZELOT STRATOSFERYCZNY`, $4.5\text{s} - 12.0\text{s}$, 50%): Curved Earth globe, glowing atmosphere, 48 stars, shooting star.
  * **Gliding Descent** (`ZNIZANIE`, $12.0\text{s} - 15.0\text{s}$, 20%): Approaching snowy pine trees decorated with Christmas fairy lights.
* **Rooftop Landed Dwell (15.0s)**:
  * **Gift Drop** (`ZRZUT PREZENTOW`, $15.0\text{s} - 21.0\text{s}$, 40%): Parachuting presents dropped directly into chimneys.
  * **Cookie & Milk Break** (`PRZERWA NA CIASTKA I MLEKO`, $21.0\text{s} - 27.0\text{s}$, 40%): Big Santa by the fireplace, dancing flames, cookies & milk.
  * **Takeoff Climb** (`WZNOSZENIE`, $27.0\text{s} - 30.0\text{s}$, 20%): Takeoff climb, ground & trees shrink in reverse perspective.
* **Grand Finale (Dec 24 Kraków)**: Permanent arrival lock celebrating at Bazylika Mariacka spires with fireworks (`WESOŁYCH ŚWIĄT!`).
