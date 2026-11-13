# Design System: SANTA-OS Strategic Polar Command

## Identity & Aesthetic Direction
- **Atmosphere**: Polar Tactical Mission Control & Retro Hardware Studio. High-precision instrumentation meeting holiday warmth without cartoonish tropes.
- **Mode**: Operate & Experience. High utility for testing and scrubbing the 24-day journey, paired with immersive physical hardware simulation.

## Palette & Color Tokens
- **Background Base**: Deep obsidian night `#060913` with layered midnight navy `#0b1021`.
- **Screen 1: Retro CRT Radar Accent**: CRT Phosphor Emerald (`#10b981`, dark `#022c16`, light `#34d399`), rotating sweep ray, golden breadcrumb dots (`#fea9`), and pulsing red contact beacon (`#f800`).
- **Screen 2: Modern Glass Cockpit System**: Pure pitch-black obsidian (`#000000`, 0x0000), titanium slate framing (`#20242c`, 0x2124), electric ice cyan headers (`#00f0ff`, 0x07ff), multi-color Mach power bar (Cyan → Amber → Flame Red), vivid emerald gifts (`#00ff00`, 0x07e0), and crisp pure white readouts (`#ffffff`, 0xffff).
- **Screen 3: Side-View Santa Cam**: 7 contextual sub-phase scenes in a 30.0s city cycle:
  - In-Transit Flight (15.0s): *Hyper-Warp Mode* (`TRYB HYPER-WARP`: 4.5s / 30% — horizontal streaks & twin jet flames), *Stratospheric Flight* (`PRZELOT STRATOSFERYCZNY`: 7.5s / 50% — curved Earth, 48 cosmic stars & shooting star), *Gliding Descent* (`ZNIZANIE`: 3.0s / 20% — descending toward perspective-growing Christmas trees with fairy lights).
  - Rooftop Dwell (15.0s): *Gift Drop* (`ZRZUT PREZENTOW`: 6.0s / 40% — parachuting presents into chimneys), *Cookie & Milk Break* (`PRZERWA NA CIASTKA I MLEKO`: 6.0s / 40% — hearth with dark oak logs, glowing embers, dancing flame tongues, cookies & milk), *Takeoff Climb* (`WZNOSZENIE`: 3.0s / 20% — ascending above trees shrinking in reverse perspective).
  - Grand Finale: *Merry Christmas!* (`WESOŁYCH ŚWIĄT!` — permanent Kraków arrival lock with Bazylika Mariacka spires & fireworks).
  All titles centered at top without brackets.
- **Tactical Alert & Sleigh Accent**: Translucent Enclosure Amber / Orange (`#f59e0b`, `#ea580c`). Used for hardware buttons, warp acceleration, and active target highlight.
- **Rule on Colored Surfaces**: Any text on colored backgrounds must be tinted from that hue (e.g. `text-emerald-100` on emerald, `text-amber-100` on amber). Never gray.

## Typography
- **UI / Headings / Labels**: Authoritative, clean sans-serif with balanced tracking and distinct weight steps.
- **Telemetry / Measurements / Data**: `font-mono tabular-nums` strictly for coordinates (`lat/lon`), timestamps (`UTC`), ETA countdowns, Mach speed, and API payloads. Monospace is never used as a decorative costume for ordinary prose.

## Layout & Hierarchy
- **No Eyebrow / Kicker**: Headings speak for themselves.
- **No Nested Cards**: Avoid borders inside borders. Group telemetry with clean typographic rhythm and divider rules instead of card-in-card containers.
- **Hardware Centerpiece**: The M5StickC-Plus SE device is elevated as a physical artifact on a tactical workbench, featuring synchronous ambient backlight glow reacting to the radar sweep.
- **Advent Timeline**: Seamless horizontal ribbon for days Dec 01 to Dec 24, giving immediate visual status for each day's leg.
- **Warp Engine**: Direct tactile presets for 1x, 2x, 5x, 10x (Test Mode), 20x, and 60x.

---

## Landing Page Surface (`/`): Kurier Bieguna Północnego
- **Mode**: Persuade — warm, slightly goofy Polish North Pole holiday tabloid & poster driving visitors to `/install` (`Zainstaluj na M5Stick`), while `/debugger` hosts the full dark-mode hardware workbench.
- **Ground & Seams**: Warm gingerbread-cream paper (`#fbf3e4`) with `#dfd0b4` masthead/footer rules and `#f2e4cb` tactile control trays.
- **Ink & Accents**: Santa-hat crimson (`#c81e1e`) for oversized condensed headlines, deep holly-pine (`#0d3b26`) for body copy and rubber-stamp badges (`288 MIAST`, `FINAŁ: KRAKÓW`), and M5Stick translucent orange (`#ea580c`) for the primary Install CTA.
- **Typography**: `Barlow Condensed` (`--font-poster`) for bold Polish poster headlines paired with `Bricolage Grotesque` (`--font-display`) for warm body copy and `JetBrains Mono` (`--font-mono`, `tabular-nums`) for screen tabs and stamps.
- **Signature Interaction**: Live interactive `M5StickDevice` cycling `MikoRadar`, `Kokpit Misji`, and `Santa Cam` via the physical `M5` button or the cream-paper screen pills.
