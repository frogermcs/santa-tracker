# SANTA-OS: M5StickC-Plus SE Santa Tracker

A pocket-sized retro aviation Santa Tracker for the **M5StickC-Plus SE** (ESP32-PICO-D4, 240×135 ST7789v2 IPS display) with a companion Next.js web emulator and in-browser USB flasher.

**Live Demo & Web Flasher:** [santa-tracker-five.vercel.app](https://santa-tracker-five.vercel.app)

## Documentation

* **[Product Requirements (PRD)](docs/PRD.md):** Screen specs, simulation math, and UI states.
* **[Architecture](docs/ARCHITECTURE.md):** Dual-target design, `/api/journey` contract, and Wi-Fi "Burst & Sleep" lifecycle.
* **[Design System](docs/DESIGN.md):** Color tokens, typography, and surface specs.
* **[Roadmap](docs/ROADMAP.md):** Milestone history and deliverables.

## Repository Structure

```
.
├── firmware/       # ESP32 C++17 firmware (PlatformIO + M5Unified + ArduinoJson)
│   ├── include/    # Config, types, 288-stop PROGMEM schedule, and coastline dots
│   ├── src/        # Core engine, radar/cockpit/cam renderers, Improv Wi-Fi handler
│   └── test/       # Native desktop Unity test suite (29 tests)
├── page/           # Next.js 15 web app & 1:1 hardware emulator (App Router, Tailwind)
│   ├── app/        # /, /install, /debugger, /map-debugger, /scene-debugging, /api/journey
│   └── public/     # Static assets, prebuilt firmware binaries, and journey.json
├── docs/           # PRD, Architecture, Design System, and Roadmap
├── scripts/        # CSV schedule ingest & firmware binary packaging scripts
└── .github/        # GitHub Actions CI workflow (Web + Firmware)
```

## Quick Start

### 1. Web App & Emulator (`page/`)
```bash
cd page
npm install
npm run dev
```
* **Landing Page:** [http://localhost:3000](http://localhost:3000)
* **In-Browser Flasher & Wi-Fi Setup:** [http://localhost:3000/install](http://localhost:3000/install) (Chrome / Edge via Web Serial + Improv Wi-Fi)
* **Hardware Emulator & Workbench:** [http://localhost:3000/debugger](http://localhost:3000/debugger)
* **Debug Views:** `/map-debugger` (coordinates) and `/scene-debugging` (Santa Cam 7-scene matrix)

### 2. Firmware Testing & Flashing (`firmware/`)
```bash
cd firmware

# Run native desktop unit tests (29 tests, no hardware required)
pio test -e native

# Compile ESP32 firmware
pio run -e m5stick-c

# Flash to connected M5StickC-Plus SE
pio run -e m5stick-c --target upload
```

## Hardware Controls (M5StickC-Plus SE)

| Input | Action |
| :--- | :--- |
| **Button A (Front M5)** | **Cycle Screen:** `MikoRadar` → `Kokpit Misji` → `Santa Cam` |
| **Button A (Hold >0.6s)** | **Next Advent Day:** Cycles `D01` → `D24` (Demo Mode) |
| **Button B (Top Side)** | **Next City:** Advances stop `1` → `12` on active day (Demo Mode) |
| **Button B / PWR (Hold >0.6s)** | **Toggle Mode:** Switches between Real-Time Advent Mode and Demo Mode |
| **Button PWR (Side Click)** | **Mute / Unmute:** Toggles piezo buzzer sound |

## Self-Hosting & Customization

* **API Endpoint:** To point the firmware at your own deployment, update `JOURNEY_API_URL` in [firmware/include/config.h](firmware/include/config.h) and `home_page` in [scripts/package-firmware.mjs](scripts/package-firmware.mjs) / [page/public/firmware/manifest.json](page/public/firmware/manifest.json).
* **Customizing Cities:** Edit the schedule CSV and run `npm --prefix page run ingest` to regenerate `page/lib/advent-schedule.ts`, `page/public/journey.json`, and `firmware/include/advent_schedule.h`.
* **Rebuilding Web Flasher Binaries:** Run `npm --prefix page run package:firmware` after firmware changes to refresh `page/public/firmware/`.

## License

[MIT](LICENSE) © 2026 Mirek Stanek
