import { describe, it, expect } from "vitest";
import { computeSantaMetrics, formatCompact } from "@/lib/telemetry/santa-metrics";

describe("Santa Telemetry Calculations (computeSantaMetrics)", () => {
  describe("Transit Flight Phase (u < 15s)", () => {
    it("reports Mach 4.8 and stratospheric altitude during transit flight", () => {
      // Day 24, stop 3 (Khartoum), u = 7.5 seconds (in flight), nowSec = 100.0
      const metrics = computeSantaMetrics(24, 3, 7.5, 100.0, "KHARTOUM", false);

      expect(metrics.flightPhase).toBe("PRZELOT");
      expect(metrics.machSpeed).toBeGreaterThan(4.0);
      expect(metrics.machDisplay).toMatch(/^M \d+\.\d+$/);
      expect(metrics.altitudeM).toBeGreaterThan(10000);
      expect(metrics.altitudeDisplay).toMatch(/^\d+(\.\d+)?k M$/);
    });

    it("reports strictly 0 gift drop rate while in transit flight", () => {
      const metrics = computeSantaMetrics(24, 3, 7.5, 100.0, "KHARTOUM", false);

      expect(metrics.giftRatePerSec).toBe(0);
      expect(metrics.giftRateDisplay).toBe("0/s");
    });

    it("displays hypersonic transit stage title and description", () => {
      const metrics = computeSantaMetrics(24, 3, 7.5, 100.0, "KHARTOUM", false);

      expect(metrics.stageTitle).toBe("PRZELOT STRATOSFERYCZNY");
      expect(metrics.stageDescription).toContain("krzywizną kuli ziemskiej");
    });
  });

  describe("Rooftop Landed Phase (u >= 15s)", () => {
    it("reports Mach 0.0 and rooftop altitude when landed", () => {
      // Day 24, stop 3, u = 17.0 seconds (on rooftop)
      const metrics = computeSantaMetrics(24, 3, 17.0, 100.0, "KHARTOUM", false);

      expect(metrics.flightPhase).toBe("DACH");
      expect(metrics.machSpeed).toBe(0.0);
      expect(metrics.machDisplay).toBe("M 0.0");
      expect(metrics.altitudeM).toBe(65);
      expect(metrics.altitudeDisplay).toBe("65 M");
    });

    it("reports positive regional gift drop rate when landed", () => {
      const metrics = computeSantaMetrics(24, 3, 17.0, 100.0, "KHARTOUM", false);

      expect(metrics.giftRatePerSec).toBeGreaterThan(0);
      expect(metrics.giftRateDisplay).toMatch(/^\+\d+(\.\d+)?[kM]\/s$/);
    });

    it("transitions rooftop stages accurately across the 15s stay", () => {
      // Phase 1 (0..6s on roof: u = 15..21)
      const phase1 = computeSantaMetrics(24, 3, 17.0, 100.0, "KHARTOUM", false);
      expect(phase1.stageTitle).toBe("ZRZUT PREZENTOW");
      expect(phase1.stageDescription).toContain("spadochronach");

      // Phase 2 (6..12s on roof: u = 21..27)
      const phase2 = computeSantaMetrics(24, 3, 23.0, 100.0, "KHARTOUM", false);
      expect(phase2.stageTitle).toBe("PRZERWA NA CIASTKA I MLEKO");
      expect(phase2.stageDescription).toContain("kominku");

      // Phase 3 (12..15s on roof: u = 27..30)
      const phase3 = computeSantaMetrics(24, 3, 28.5, 100.0, "KHARTOUM", false);
      expect(phase3.stageTitle).toBe("WZNOSZENIE");
      expect(phase3.stageDescription).toContain("choinki");
    });
  });

  describe("December 24th Grand Finale Lock (Kraków)", () => {
    it("locks in celebration mode when landed at final stop in Kraków", () => {
      // Stop 11 is Kraków (last stop of 12)
      const metrics = computeSantaMetrics(24, 11, 15.0, 100.0, "KRAKOW", true);

      expect(metrics.flightPhase).toBe("FINAL");
      expect(metrics.stageTitle).toBe("WESOŁYCH ŚWIĄT!");
      expect(metrics.stageDescription).toContain("Bazyliki Mariackiej");
      expect(metrics.machSpeed).toBe(0.0);
      expect(metrics.altitudeM).toBe(219);
      // All 2.20B global gifts delivered
      expect(metrics.giftsDeliveredDisplay).toBe("2.20B");
      expect(metrics.giftRatePerSec).toBe(0);
    });
  });

  describe("Cumulative Fuel & Progress", () => {
    it("correctly tracks cumulative cookies and milk", () => {
      const metrics = computeSantaMetrics(24, 6, 14.0, 100.0, "WYSPA WIELKANOCNA", false);

      expect(metrics.cookiesEaten).toBeGreaterThan(0);
      expect(metrics.milkLiters).toBeGreaterThan(0);
      expect(metrics.cookiesEatenDisplay).toMatch(/^\d+(\.\d+)?[kMB]$/);
      expect(metrics.milkLitersDisplay).toMatch(/^\d+(\.\d+)?[kMB] L$/);
    });
  });

  describe("Compact Number Formatting (formatCompact)", () => {
    it("formats thousands, millions, and billions cleanly", () => {
      expect(formatCompact(500)).toBe("500");
      expect(formatCompact(1500)).toBe("1.5k");
      expect(formatCompact(12500000)).toBe("12.5M");
      expect(formatCompact(2200000000)).toBe("2.20B");
    });
  });
});
