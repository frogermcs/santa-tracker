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
│   ├── include/    # Config, types, fallback JSON, and 912 coastline dots
│   ├── src/        # Core engine, network client, and radar UI renderer
│   └── test/       # Native desktop unit test suite (runs in 0.5s!)
├── page/           # Next.js 15 web platform & emulator (App Router, Tailwind)
│   ├── app/        # / (Interactive Hub), /radar (Dedicated View), /api/journey
│   └── public/     # Static assets and master journey.json
├── docs/           # PRD, Architecture, and Roadmap specifications
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
Open [http://localhost:3000/radar](http://localhost:3000/radar) for the dedicated hardware view, or [http://localhost:3000](http://localhost:3000) for the full hub.

### 2. Firmware Testing & Flashing (`firmware/`)
```bash
cd firmware

# Run fast desktop unit tests (no hardware needed!)
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
| **Button A (Front M5)** | Jump immediately to next city |
| **Button B (Side)** | Cycle simulation speed (`1x` → `2x` → `4x` → `8x`) |
| **Button B (Hold)** | Toggle buzzer sound chirps (Mute / Unmute) |
