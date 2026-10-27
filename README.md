# M5StickC-Plus SE Santa Tracker (`SANTA-OS`)

A pocket-sized retro Santa Tracker gadget for the **M5StickC-Plus SE** (1.14" 240×135 IPS display, translucent orange enclosure, ESP32-PICO-D4) along with an interactive web emulator.

---

## Repository Structure

```
├── firmware/      # ESP32 C++ firmware for M5StickC-Plus SE (PlatformIO)
├── page/          # Next.js interactive web preview and emulator
└── docs/          # Product Requirements Document (PRD) and design specs
```

---

## 1. Firmware (`firmware/`)

Powered by **PlatformIO** and **M5Unified**. 

> **Hardware note:** The M5StickC-Plus SE differs from the standard Plus by omitting the 6-axis IMU (MPU6886). The firmware handles this gracefully using `M5Unified` and maps gestures to the physical buttons.

### Controls:
- **Button A (Front M5):** Switch screens (Santa Cam → Telemetry Dashboard → Global Radar).
- **Button B (Side):** Context action (cycle animation / boost delivered gifts).
- **Button B (Hold):** Toggle sound on/off.

### Build & Flash:
```bash
cd firmware

# Compile
pio run

# Flash to connected M5StickC Plus SE
pio run --target upload

# Serial monitor
pio device monitor
```

---

## 2. Web Preview & Emulator (`page/`)

A high-fidelity web emulator simulating the translucent orange hardware enclosure, pixel-perfect 240×135 canvas rendering, and 8-bit buzzer audio.

### Local Development:
```bash
cd page
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
