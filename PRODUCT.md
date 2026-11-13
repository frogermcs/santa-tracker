# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Maker parents and their children (ages 4–10) setting up and enjoying a pocket-sized M5StickC-Plus SE Santa Claus tracker across the 24-day Advent season (December 1–24).

## Product Purpose

SANTA-OS turns a tiny translucent-orange M5StickC-Plus SE microcontroller into a standalone pocket Santa tracker that works out of the box for 24 Advent days and lands in Kraków on Christmas Eve. The web app serves two distinct roles:
- `/` (Landing Page): A focused, festive, slightly goofy Santa Tracker IoT showcase whose sole job is to delight visitors and guide them to flash SANTA-OS onto their M5StickC via `/install`.
- `/debugger` (Hardware Twin & Workbench): The full 1:1 240×135 ST7789v2 simulator, day/city ribbon, telemetry readouts, and links to `/map-debugger` and `/scene-debugging`.

## Positioning

Unlike browser-only holiday countdowns, SANTA-OS runs natively on a physical pocket gadget (`M5StickC-Plus SE`) with 288 preloaded worldwide stops, three live screens (MikoRadar, Kokpit Misji, Santa Cam), battery-saving "Burst & Sleep" Wi-Fi/NTP + BM8563 RTC timekeeping, and zero-terminal USB flashing directly from Chrome/Edge via Web Serial.

## Operating Context

Parents plug an M5StickC-Plus SE into a laptop over USB-C, click Install on `/` → `/install`, flash firmware + configure home Wi-Fi in-browser in under a minute, and hand the glowing orange gadget to their kids for December.

## Capabilities and Constraints

- 100% Polish copy on `/` and `/install` matching the on-device HUD (`MikoRadar`, `Kokpit Misji`, `Santa Cam`, `POZA SEZONEM`, `WESOŁYCH ŚWIĄT!`).
- `/` must remain 100% focused on the Santa Tracker IoT gadget with a clear "Zainstaluj na M5Stick" CTA navigating to `/install` (with the discreet link to `/debugger` placed in `/install`'s footer).
- All existing simulator, day/city controls, and telemetry workbench move intact to `/debugger`.
- Must preserve all existing routes (`/install`, `/map-debugger`, `/scene-debugging`, `/api/journey`) and pass `typecheck`, `lint`, and `vitest` gates with 0 errors.

## Brand Commitments

- **Product Name:** SANTA-OS (Lokalizator Mikołaja · M5StickC-Plus SE)
- **Tone:** Warm, festive, and a bit goofy (Christmas / Santa Claus workshop charm without corporate seriousness).
- **Existing Assets:** `page/public/santa-icon.svg`, `page/public/firmware/manifest.json`, `M5StickDevice` 1:1 hardware enclosure component, `SnowEffect`, and the 3 real firmware screens (`MikoRadar`, `Kokpit Misji`, `Santa Cam`).

## Product Principles

- Keep `/` single-purpose: Santa Tracker IoT story + hardware charm + Install CTA.
- Never fabricate metrics, customer counts, or hardware specs—use real firmware facts (288 cities, 24 days, 3 screens, 120mAh battery, Kraków Dec 24 finale).
- Separate festive persuasion (`/`) from engineering diagnostics (`/debugger`, `/map-debugger`, `/scene-debugging`).
