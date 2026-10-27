# M5StickC-Plus SE Santa Tracker Preview

An interactive, kid-friendly web preview and hardware emulator for the **M5StickC-Plus SE** (1.14" ST7789v2 240×135 IPS display, distinctive translucent orange enclosure) to iterate and test Santa Tracker UI prototypes with children before flashing ESP32 firmware.

---

## Features

- **Translucent Orange Enclosure (StickC-Plus SE)**: High-fidelity skeuomorphic chassis showing internal PCB routing silhouettes, ESP32-PICO-D4 footprint, 120mAh LiPo battery outline, IR diode notch, microphone port, and M5 branding.
- **True Hardware Resolution**: Native 240×135 pixel-perfect canvas rendering (`image-rendering: pixelated`) with toggleable hardware LCD scanline overlay.
- **Two Complete Prototypes in One App**:
  1. **Action Toy Mode**: 4 Santa Cam action states (Cruising Sky, Chimney Drop, Cookie Break, Hyper-Warp speed lines), Mach speed gauge, and 8-bit buzzer audio chirps.
  2. **15-City Christmas Journey Mode**: Multi-city sequenced world tour (flight → rooftop landing → chimney descent → gift popup) with mathematically projected retro world radar.
- **Kid & Parent Friendly Controls**:
  - Customize your kid's hometown destination (e.g. `KRAKOW, PL`, `NEW YORK`, `LONDON`).
  - Speed multiplier slider (`×1` to `×8`).
  - Web Audio API 8-bit passive buzzer sound effects matching `StickCP2.Speaker.tone()`.
  - Tilt device view for simulating holding the gadget in hand.
  - Keyboard shortcuts: `Space` / `A` for Button A, `B` for Button B.
- **Maker Code Exporter**: One-click ready-to-flash Arduino C++ / M5GFX sketch modal matching the hardware PRD.

---

## Getting Started

### Local Development
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm start
```

---

## Deploying to Vercel

This project is a standard Next.js App Router application with zero backend configuration or environment secrets required.

1. Push this repository to GitHub/GitLab.
2. In Vercel, click **Add New Project** and select this repository.
3. Keep default settings (`Framework: Next.js`, root directory `./`).
4. Click **Deploy**.
