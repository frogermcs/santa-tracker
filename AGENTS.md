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
- **Screen 2 (Flight Telemetry / Cockpit Dashboard)**: Modern aerospace glass cockpit, multi-color Mach 4.8 gauge, demographic gift delivery, pixel-art cookies & milk, and tactical mission phase box.
- **Screen 3 (Side-View Santa Cam)**: 7 contextual sub-phase pixel-art scenes:
  * In-transit (15.0s): *Hyper-Warp* (30% / 4.5s), *Przelot Stratosferyczny* (50% / 7.5s), *Zniżanie* (20% / 3.0s).
  * Rooftop stay (15.0s): *Zrzut Prezentów* (40% / 6.0s), *Przerwa na Ciastka i Mleko* (40% / 6.0s), *Wznoszenie* (20% / 3.0s).
  * Finale: *Wesołych Świąt!* (permanent Kraków arrival lock with Bazylika Mariacka spires & fireworks).
- **Algorithm Parity**: Trajectory interpolation (`easeInOut()`), coordinates projection, and 30-second simulation cadence (`secPerCity = 30.0s`: `u < 15.0s` in-flight transit, `u >= 15.0s` rooftop stay) must be mathematically identical across TypeScript and C++.

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

### 3.1. Code Review & Quality Protocol (Addy Osmani's 5-Axis Framework)
All pull requests must undergo structured peer or agent review adhering to [Addy Osmani's Code Review and Quality standards](https://skills.addy.ie/skills/code-review-and-quality/) across the **Five Review Axes**:

1. **Correctness**:
   - Verify logic errors, edge cases, timing limits, and full unit test coverage.
   - Guard against state regression, integer rounding traps, and off-by-one errors.
   - Ensure Day 24 immutable constraints and Grand Finale arrival lock are strictly honored.
2. **Readability & Maintainability**:
   - Enforce descriptive naming, clean component boundaries, and educational C++/TS parity comments.
   - Keep diffs focused (~100–300 lines of logic where practical).
3. **Architecture & 1:1 Parity**:
   - Maintain the Living Specification hierarchy: Web companion first, C++ firmware second.
   - Zero dynamic heap allocations in active frame render and simulation loops.
   - Single source of truth for all routes, math models, and constants.
4. **Security & Safety**:
   - Strictly avoid dangerous DOM injections (`dangerouslySetInnerHTML`, `eval`).
   - Validate array bounds on bitmap/coordinate buffers. Zero secrets or keys in client bundles.
5. **Performance & Resource Utilization**:
   - Ensure sub-millisecond canvas draw cycles.
   - Strictly decouple high-frequency 60 FPS animation/canvas loops from React DOM tree reconciliation (throttle React state updates to 4–10 Hz).

#### Severity Classification for Review Feedback:
- **Critical**: Blocks merge immediately (crash risks, security vulnerabilities, broken delivery gates).
- **Required**: Must be addressed before merge (architectural violations, timing/easing bugs, performance thrashing).
- **Optional**: Suggested improvement, refactoring, or defensive hardening.
- **Nit**: Minor stylistic or non-functional polish.

### 3.2. AI-Native SDLC Artifact Chain (Intent $\rightarrow$ Spec $\rightarrow$ Plan)
To prevent drift, scope explosion, and silent regressions during autonomous engineering, all major features and milestones must adhere to the **AI-Native SDLC Playbook** (Anthropic Applied AI standard). Before modifying production code, agents and contributors maintain a version-controlled markdown artifact chain in `docs/features/<feature-name>/`:

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    intent.md    │  ───► │     spec.md     │  ───► │     plan.md     │
│ (Why & Problem) │       │(Contracts & UX) │       │(Step-by-Step)   │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

1. **`intent.md` (Capture & Alignment)**:
   - Authored first. Defines the user problem, motivation, target user journey, and **explicit non-goals** (what we are NOT doing).
   - Keeps humans and agents aligned on scope without getting bogged down in implementation details.
   - Template: `docs/templates/intent.md`.
2. **`spec.md` (Living Specification & Contracts)**:
   - Authored second. Turns `intent.md` into concrete behavioral contracts, UI mockups/states, communication protocols (e.g. Improv Wi-Fi Serial framing, Web Serial JSON), memory budgets, and 1:1 Web-to-C++ parity definitions.
   - Template: `docs/templates/spec.md`.
3. **`plan.md` (Implementation Blueprint & Quality Gates)**:
   - Authored third before code execution. Outlines the precise ordered list of code changes (`[NEW]`, `[MODIFY]`, `[DELETE]`), verification commands, and delivery gates.
   - Template: `docs/templates/plan.md`.

---

## 4. Product Requirements Alignment (`PRD.md`)

**All product changes must always be reflected in `PRD.md` (and `docs/PRD.md`).**

Whenever requirements change:
- If a route, stop sequence, timing, or continent progression changes $\rightarrow$ update **Section 1 & 3**.
- If a hardware interaction, button binding, or display behavior changes $\rightarrow$ update **Section 4**.
- If milestone scope or acceptance criteria changes $\rightarrow$ update **Section 6**.

No feature is considered delivered unless the PRD accurately describes its latest behavior.

### 4.1. Language Requirement (Always English)
- **`PRD.md`, `docs/PRD.md`, `docs/ARCHITECTURE.md`, and all markdown specifications must ALWAYS be written strictly in English.**
- In-app Polish UI labels (e.g. `KOKPIT MIKOLAJA`, `TRYB HYPER-WARP`, `WESOŁYCH ŚWIĄT!`) may be quoted in code blocks or parentheses as the exact on-screen visual strings, but all section content, explanatory prose, table headers, columns, and descriptions must be authored in English.

---

## 5. December 24th Christmas Eve Immutable Constraints

As requested by the product owner for their child's hometown, the December 24th Grand Finale itinerary must strictly adhere to:
1. **Starting Point**: Oceania (first city in the world to greet sunrise, e.g. Gisborne).
2. **Continent Progression**: `Oceania` $\rightarrow$ `Asia` $\rightarrow$ `Africa` $\rightarrow$ `Americas` $\rightarrow$ `Europe`.
3. **Grand Finale Stop (#288 / Day 24 Stop 12)**: **Kraków, Poland** (`50.06° N, 19.94° E`).
4. **Arrival Window**: `22:00 - 23:00 UTC` (23:00 - 24:00 CET in Poland).
5. **Radar Behavior**: Santa must land and remain in Kraków with a celebration state (`FINAŁ: KRAKOW 🎁`), never prematurely wrapping back to the Pacific before the child sees Santa at home.
