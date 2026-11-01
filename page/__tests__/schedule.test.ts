import { describe, it, expect } from "vitest";
import { getDaySchedule, getAllDays, DEFAULT_ADVENT_DAY } from "@/lib/advent-schedule";
import journeyJson from "@/public/journey.json";

describe("Advent Schedule & Route Validation", () => {
  it("defaults to Day 24 (Grand Finale)", () => {
    expect(DEFAULT_ADVENT_DAY).toBe(24);
  });

  it("contains all 24 Advent days with exactly 12 stops each (288 stops total)", () => {
    const allDays = getAllDays();
    expect(allDays).toHaveLength(24);

    let totalStops = 0;
    allDays.forEach((day) => {
      expect(day.stops).toHaveLength(12);
      totalStops += day.stops.length;
    });

    expect(totalStops).toBe(288);
  });

  describe("December 24th Grand Finale Immutable Constraints", () => {
    const day24 = getDaySchedule(24);

    it("starts in Oceania (Gisborne)", () => {
      const firstStop = day24.stops[0];
      expect(firstStop.radarName).toBe("GISBORNE");
      expect(firstStop.continent).toBe("Oceania");
    });

    it("ends in Kraków, Poland as the 12th and final stop", () => {
      const finalStop = day24.stops[11];
      expect(finalStop.radarName).toBe("KRAKOW");
      expect(finalStop.country).toBe("Polska");
      expect(finalStop.continent).toBe("Europa");
      expect(finalStop.lat).toBeCloseTo(50.06, 1);
      expect(finalStop.lon).toBeCloseTo(19.94, 1);
    });

    it("contains North Pole as the penultimate stop before Kraków", () => {
      const penultimateStop = day24.stops[10];
      expect(penultimateStop.radarName).toBe("BIEGUN POLNOCNY");
    });

    it("covers global hub regions across the 12 stops", () => {
      const continents = new Set(day24.stops.map((s) => s.continent));
      expect(continents.has("Oceania")).toBe(true);
      expect(continents.has("Azja")).toBe(true);
      expect(continents.has("Afryka")).toBe(true);
      expect(continents.has("Europa")).toBe(true);
    });
  });

  describe("API Journey Contract (journey.json)", () => {
    it("matches the 30s cycle timing per city", () => {
      expect(journeyJson.secPerCity).toBe(30);
    });

    it("has 12 route stops and 24 days in the master payload", () => {
      expect(journeyJson.route).toHaveLength(12);
      expect(journeyJson.days).toHaveLength(24);
      expect(journeyJson.activeDay).toBe(24);
    });
  });
});
