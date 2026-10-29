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
│   ├── src/        # Core engine, network client, and radar UI renderer
│   └── test/       # Native desktop unit test suite (12 tests passing in 0.7s!)
├── page/           # Next.js 15 web platform & emulator (App Router, Tailwind)
│   ├── app/        # / (Mission Control Hub & Emulator), /map-debugger, /api/journey
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
Open [http://localhost:3000](http://localhost:3000) for the Mission Control hub & hardware emulator, or [http://localhost:3000/map-debugger](http://localhost:3000/map-debugger) for the full geographic coordinates debugger.

### 2. Firmware Testing & Flashing (`firmware/`)
```bash
cd firmware

# Run fast desktop unit tests (12 tests in 0.7s, no hardware needed!)
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
| **Button A (Front M5)** | Cycle through Advent Days (`D01` → `D02` → ... → `D24` → `D01`) |
| **Button B (Top Side)** | Advance to next city on active day (1 → 12 → 1) |
| **Button B (Hold)** | Toggle buzzer sound chirps (Mute / Unmute) |
