# Implementation & Delivery Plan: [Feature Title]

## 1. Prerequisites & Dependencies
*Libraries, tools, packages, or prior milestone outputs required before starting.*

## 2. Step-by-Step Task Breakdown
*Ordered sequence of discrete, bite-sized tasks grouped by component (Dependencies -> Web Living Spec -> Firmware -> Packaging).*

### Task 1: [...]
- [ ] Description
- Files: `[MODIFY]` or `[NEW]`
- Verification: Command or check

### Task 2: [...]
- [ ] Description
- Files: `[MODIFY]` or `[NEW]`
- Verification: Command or check

## 3. Verification Plan & Delivery Gates
*Automated commands and manual verification protocols required by AGENTS.md.*

### Web Quality Gates
- [ ] `npm --prefix page run typecheck` (0 errors)
- [ ] `npm --prefix page run lint` (0 errors, 0 warnings)
- [ ] `npm --prefix page test` (All tests passing 100%)

### Firmware Quality Gates
- [ ] `pio test -e native` (Desktop unit tests pass in < 2s)
- [ ] SRAM usage < 25% (< 56 KB)
- [ ] Flash usage within 3MB `huge_app` limit
- [ ] Zero dynamic heap allocations in active frame / render loop

### Manual End-to-End Verification
- [ ] Step-by-step physical or browser checks
