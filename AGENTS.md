# AGENTS.md — Autonomous Agent Engineering & Delivery Guidelines

This document defines the mandatory development, quality assurance, and pull-request workflow for all AI agents and contributors working in this repository.

---

## 1. Web App as the Living Specification for IoT Hardware

The companion web application (`page/`) serves as the definitive functional, visual, and mathematical specification for the physical M5StickC-Plus SE IoT firmware (`firmware/`).

### 1.1. Sequential Development Rule (Web First, Firmware Second)
- **Web App Dev-Complete Gate**: The web companion app must be **100% development-complete, tested, and approved** before porting any feature or screen to the C++ IoT firmware.
- **Zero Premature Hardware Coding**: Never write, modify, or refactor firmware code ahead of the web implementation. The web environment allows instant feedback, zero-risk refactoring, and comprehensive automated testing.

### 1.2. Strict 1:1 Screen Parity
**Every screen, state, and interaction on the IoT device must have an exact 1:1 corresponding screen on the web app:**
- The web app operates an exact 240×135 pixel canvas emulator matching the ST7789v2 IPS display.
- **Screen 1 (Global Aviation Radar)**: 912-dot phosphor map, sweeping radar ray, pulsing Santa contact, gold stardust breadcrumbs, top/bottom telemetry HUDs.
- **Screen 2 (Side-View Santa Cam)**: Pixel-art sleigh animation with 4 dynamic flight/ground states (Cruising Sky, Chimney Drop, Cookie Break, Hyper-Warp).
- **Screen 3 (Flight Telemetry / Cockpit Dashboard)**: Mach flight speed, real-time gift counter, cumulative kilometers, and next destination ETA.
- **Algorithm Parity**: Trajectory interpolation (`ease()`), coordinates projection, and transit/landed time slots (`u < 6` in-flight, `u >= 6` landed) must be identical across TypeScript and C++.

---

## 2. Zero-Error Delivery Gates

Every change must pass strict automated validation before it is deemed complete. **There is zero tolerance for errors or regressions.**

### 2.1. Web Companion App (`page/`)
Before declaring any task or feature complete, the following commands **must** execute successfully with zero errors:

| Check | Command | Acceptance Standard |
|---|---|---|
| **TypeScript Typecheck** | `npm --prefix page run typecheck` (`tsc --noEmit`) | **0 errors**. Strict typing maintained; no `any` leaks. |
| **Linting** | `npm --prefix page run lint` | **0 errors, 0 warnings**. |
| **Unit Tests** | `npm --prefix page run test:unit` (`vitest run`) | **All unit tests passing 100%**. Validates telemetry, math, and contracts. |
| **Schedule & Data Tests** | `npm --prefix page run test:schedule` | **All tests passing 100%**. Validates 288 stops, 24 days, and Day 24 finale. |
| **Combined Test Suite** | `npm --prefix page test` | Clean exit code `0`. |

> [!IMPORTANT]
> Never commit or push changes if `npm --prefix page test` fails.

---

### 2.2. C++ & Firmware Development (`firmware/`)
The user has specified **zero tolerance for errors** in C++ code and requires high clarity since C++ is not their primary language.

#### C++ Delivery Gates
1. **Compilation Cleanliness**:
   - Compiles cleanly under both Native and ESP32 targets without compiler warnings (`-Wall -Wextra`).
   - No undefined behavior, dangling references, or uninitialized variables.
2. **Deterministic Memory Management**:
   - **No dynamic heap allocations** (`malloc`, `new`, `std::vector::push_back`, `String` concatenation) inside the active render/animation loop (`loop()` or frame draw).
   - Use fixed-size static buffers or PROGMEM storage for waypoint coordinates and dot matrices.
   - **SRAM Usage Budget**: Must stay below **25%** of internal SRAM (< 56 KB used).
   - **Flash Usage Budget**: Must fit comfortably inside the 3MB partition limit defined in `firmware/huge_app.csv`.
3. **Automated Unit Testing**:
   - Run native desktop tests: `pio test -e native` (executes Unity tests on macOS/Linux in under 1 second without hardware).
4. **Educational & Maintainable Code Style**:
   - Comment every struct, pointer, pointer arithmetic, or hardware register access thoroughly.
   - Explain *why* a particular buffer size or memory layout was chosen so the user can easily follow and maintain the code.

---

## 3. Feature Workflow: Pull Requests for Review

All new functionality, refactors, and non-trivial fixes must follow a structured review workflow:

1. **Branch Isolation**:
   - Never commit directly to `main`.
   - Create a dedicated descriptive feature branch:
     - Features: `feat/<feature-name>` (e.g. `feat/radar-hometown-indicator`)
     - Fixes: `fix/<issue-name>` (e.g. `fix/day24-arrival-lock`)
2. **Verification Prior to Review**:
   - Run all web gates (`typecheck`, `lint`, `test`).
   - Run firmware tests (`pio test -e native` where applicable).
3. **Pull Request Preparation**:
   - Every new feature must be presented as a reviewable PR.
   - Include:
     - **Summary**: Plain-language description of what was changed and why.
     - **File Diff Breakdown**: List of files modified with a rationale for each.
     - **Verification Evidence**: Output from test runs confirming all gates pass.
     - **Hardware Impact**: Confirmation of RAM/Flash consumption if C++ code was touched.

---

## 4. Product Requirements Alignment (`PRD.md`)

**All product changes must always be reflected in `PRD.md` (and `docs/PRD.md`).**

Whenever requirements change:
- If a route, stop sequence, timing, or continent progression changes $\rightarrow$ update **Section 1 & 3**.
- If a hardware interaction, button binding, or display behavior changes $\rightarrow$ update **Section 4**.
- If milestone scope or acceptance criteria changes $\rightarrow$ update **Section 6**.

No feature is considered delivered unless the PRD accurately describes its latest behavior.

---

## 5. December 24th Christmas Eve Immutable Constraints

As requested by the product owner for their child's hometown, the December 24th Grand Finale itinerary must strictly adhere to:
1. **Starting Point**: Oceania (first city in the world to greet sunrise, e.g. Gisborne).
2. **Continent Progression**: `Oceania` $\rightarrow$ `Asia` $\rightarrow$ `Africa` $\rightarrow$ `Americas` $\rightarrow$ `Europe`.
3. **Grand Finale Stop (#288 / Day 24 Stop 12)**: **Kraków, Poland** (`50.06° N, 19.94° E`).
4. **Arrival Window**: `22:00 - 23:00 UTC` (23:00 - 24:00 CET in Poland).
5. **Radar Behavior**: Santa must land and remain in Kraków with a celebration state (`FINAŁ: KRAKOW 🎁`), never prematurely wrapping back to the Pacific before the child sees Santa at home.
