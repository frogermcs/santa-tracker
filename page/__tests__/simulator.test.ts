import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  color565,
  toCssColor,
  TFT_BLACK,
  TFT_WHITE,
  TFT_RED,
  TFT_GREEN,
  TFT_BLUE,
  MC_DATUM,
} from "@/lib/simulator/M5Constants";
import { M5CanvasSim } from "@/lib/simulator/M5CanvasSim";
import {
  setup,
  update,
  render,
  getTelemetry,
  ButtonEventState,
} from "@/lib/simulator/iotAppLogic";

describe("M5Canvas Simulator Parity Tests", () => {
  describe("RGB565 Color Math & CSS Conversion", () => {
    it("packs RGB channels into standard 16-bit RGB565 integer", () => {
      expect(color565(0, 0, 0)).toBe(TFT_BLACK);
      expect(color565(255, 255, 255)).toBe(TFT_WHITE);
      expect(color565(255, 0, 0)).toBe(TFT_RED);
      expect(color565(0, 255, 0)).toBe(TFT_GREEN);
      expect(color565(0, 0, 255)).toBe(TFT_BLUE);
    });

    it("converts 16-bit RGB565 colors into valid rgb() CSS strings", () => {
      expect(toCssColor(TFT_BLACK)).toBe("rgb(0, 0, 0)");
      expect(toCssColor(TFT_WHITE)).toBe("rgb(255, 255, 255)");
      expect(toCssColor(TFT_RED)).toBe("rgb(255, 0, 0)");
      expect(toCssColor(TFT_GREEN)).toBe("rgb(0, 255, 0)");
      expect(toCssColor(TFT_BLUE)).toBe("rgb(0, 0, 255)");
    });

    it("converts 24-bit hex numbers and preserves CSS string colors", () => {
      expect(toCssColor(0xffaa00)).toBe("#ffaa00");
      expect(toCssColor("#02110a")).toBe("#02110a");
    });
  });

  describe("M5CanvasSim LovyanGFX API Surface", () => {
    let mockCtx: unknown;
    let mockCanvas: unknown;
    let fillRectSpy: ReturnType<typeof vi.fn>;
    let strokeRectSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      fillRectSpy = vi.fn();
      strokeRectSpy = vi.fn();

      mockCtx = {
        imageSmoothingEnabled: true,
        fillStyle: "",
        strokeStyle: "",
        lineWidth: 1,
        fillRect: fillRectSpy,
        strokeRect: strokeRectSpy,
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        fill: vi.fn(),
        closePath: vi.fn(),
        arc: vi.fn(),
        roundRect: vi.fn(),
      };

      mockCanvas = {
        width: 240,
        height: 135,
      };
    });

    it("initializes with 240x135 landscape resolution and disables imageSmoothing", () => {
      const sim = new M5CanvasSim(
        mockCtx as CanvasRenderingContext2D,
        mockCanvas as HTMLCanvasElement
      );
      expect(sim.width()).toBe(240);
      expect(sim.height()).toBe(135);
      expect((mockCtx as { imageSmoothingEnabled: boolean }).imageSmoothingEnabled).toBe(false);
    });

    it("switches between Landscape and Portrait with setRotation()", () => {
      const sim = new M5CanvasSim(
        mockCtx as CanvasRenderingContext2D,
        mockCanvas as HTMLCanvasElement
      );
      sim.setRotation(0); // Portrait (135x240)
      expect(sim.width()).toBe(135);
      expect(sim.height()).toBe(240);

      sim.setRotation(1); // Landscape (240x135)
      expect(sim.width()).toBe(240);
      expect(sim.height()).toBe(135);
    });

    it("truncates coordinates with Math.floor internally for integer physics", () => {
      const sim = new M5CanvasSim(
        mockCtx as CanvasRenderingContext2D,
        mockCanvas as HTMLCanvasElement
      );
      sim.drawPixel(14.9, 28.7, TFT_WHITE);
      expect(fillRectSpy).toHaveBeenCalledWith(14, 28, 1, 1);
    });

    it("calculates font metrics and datums accurately", () => {
      const sim = new M5CanvasSim(
        mockCtx as CanvasRenderingContext2D,
        mockCanvas as HTMLCanvasElement
      );
      sim.setTextSize(1);
      expect(sim.textWidth("SANTA")).toBe(30); // 5 chars * 6px
      expect(sim.fontHeight()).toBe(8);

      sim.setTextSize(2);
      expect(sim.textWidth("SANTA")).toBe(60); // 5 chars * 12px
      expect(sim.fontHeight()).toBe(16);

      sim.setTextDatum(MC_DATUM);
      expect(sim.getTextDatum()).toBe(MC_DATUM);
    });

    it("draws 1-bit bitmaps pixel-by-pixel using MSB byte order", () => {
      const sim = new M5CanvasSim(
        mockCtx as CanvasRenderingContext2D,
        mockCanvas as HTMLCanvasElement
      );
      // 8x1 bitmap with bits 10100000 (0xA0)
      const testBitmap = [0xa0];
      sim.drawBitmap(10, 20, testBitmap, 8, 1, TFT_WHITE);

      // Bit 0 (col 0): set
      expect(fillRectSpy).toHaveBeenCalledWith(10, 20, 1, 1);
      // Bit 1 (col 1): not set
      expect(fillRectSpy).not.toHaveBeenCalledWith(11, 20, 1, 1);
      // Bit 2 (col 2): set
      expect(fillRectSpy).toHaveBeenCalledWith(12, 20, 1, 1);
    });
  });

  describe("Santa-OS Firmware Engine (JourneyEngine & Telemetry)", () => {
    const noButtons: ButtonEventState = {
      wasPressedA: false,
      wasHoldA: false,
      wasPressedB: false,
      wasHoldB: false,
      wasPressedPWR: false,
    };

    it("initializes state cleanly in setup() matching hardware defaults", () => {
      const state = setup(0);
      expect(state.activeDay).toBe(24);
      expect(state.activeScreen).toBe(0); // Radar
      expect(state.cityCount).toBe(12);
      expect(state.cities[0].name).toBe("GISBORNE");
      expect(state.cities[11].name).toBe("KRAKOW");
    });

    it("toggles active screen between Radar and Cockpit on Button A click", () => {
      const state = setup(0);
      expect(state.activeScreen).toBe(0); // Radar

      update(state, { ...noButtons, wasPressedA: true }, 16, 16);
      expect(state.activeScreen).toBe(1); // Cockpit

      update(state, { ...noButtons, wasPressedA: true }, 16, 32);
      expect(state.activeScreen).toBe(0); // Radar
    });

    it("cycles Advent Day on Button A long hold", () => {
      const state = setup(0);
      expect(state.activeDay).toBe(24);

      update(state, { ...noButtons, wasHoldA: true }, 16, 16);
      expect(state.activeDay).toBe(1); // Wraps 24 -> 1
      expect(state.cities[0].name).toBe("AUCKLAND");

      update(state, { ...noButtons, wasHoldA: true }, 16, 32);
      expect(state.activeDay).toBe(2);
    });

    it("jumps to next city on Button B click and lands immediately", () => {
      const state = setup(0);
      expect(state.simTime).toBe(12.0); // Stop 1 landed (u = 12.0)

      update(state, { ...noButtons, wasPressedB: true }, 16, 16);
      // Stop 2 landed = 1 * 24 + 12 = 36.0
      expect(state.simTime).toBe(36.0);
    });

    it("toggles sound on Button B long hold", () => {
      const state = setup(0);
      expect(state.soundEnabled).toBe(true);

      update(state, { ...noButtons, wasHoldB: true }, 16, 16);
      expect(state.soundEnabled).toBe(false);

      update(state, { ...noButtons, wasHoldB: true }, 16, 32);
      expect(state.soundEnabled).toBe(true);
    });

    it("computes accurate telemetry for 12s transit flight (CEL) and 12s landed stay (POSTOJ)", () => {
      const state = setup(0);

      // At simTime = 5.0s, transit flight phase (u = 5.0 < 12.0s)
      state.simTime = 5.0;
      const tFlight = getTelemetry(state);
      expect(tFlight.isFlightPhase).toBe(true);
      expect(tFlight.nextCityName).toBe("GISBORNE");
      expect(tFlight.etaSeconds).toBe(7); // 12 - 5 = 7s remaining in flight
      expect(tFlight.u).toBe(5.0);

      // At simTime = 16.0s, landed stay phase (u = 16.0 >= 12.0s)
      state.simTime = 16.0;
      const tLanded = getTelemetry(state);
      expect(tLanded.isFlightPhase).toBe(false);
      expect(tLanded.nextCityName).toBe("GISBORNE");
      expect(tLanded.etaSeconds).toBe(8); // 24 - 16 = 8s remaining on roof
      expect(tLanded.u).toBe(16.0);
    });

    it("renders Radar and Cockpit screens without throwing errors", () => {
      const mockCtx = {
        imageSmoothingEnabled: false,
        fillStyle: "",
        strokeStyle: "",
        lineWidth: 1,
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        fill: vi.fn(),
        closePath: vi.fn(),
        arc: vi.fn(),
        roundRect: vi.fn(),
      };
      const mockCanvas = { width: 240, height: 135 };
      const sim = new M5CanvasSim(
        mockCtx as unknown as CanvasRenderingContext2D,
        mockCanvas as unknown as HTMLCanvasElement
      );

      const state = setup(0);

      // Render Radar (Screen 0)
      state.activeScreen = 0;
      expect(() => render(sim, state, 1500)).not.toThrow();

      // Render Cockpit (Screen 1)
      state.activeScreen = 1;
      expect(() => render(sim, state, 2000)).not.toThrow();
    });

    it("strictly verifies 'CEL:' in transit and 'POSTOJ:' on rooftop across both Radar and Cockpit screens", () => {
      const mockCtx = {
        imageSmoothingEnabled: false,
        fillStyle: "",
        strokeStyle: "",
        lineWidth: 1,
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        fill: vi.fn(),
        closePath: vi.fn(),
        arc: vi.fn(),
        roundRect: vi.fn(),
      };
      const mockCanvas = { width: 240, height: 135 };
      const sim = new M5CanvasSim(
        mockCtx as unknown as CanvasRenderingContext2D,
        mockCanvas as unknown as HTMLCanvasElement
      );

      const drawStringSpy = vi.spyOn(sim, "drawString");
      const state = setup(0);

      // --- 1. Transit Flight (u = 5.0s < 12.0s) ---
      state.simTime = 5.0;

      // Radar Screen (Screen 0)
      state.activeScreen = 0;
      drawStringSpy.mockClear();
      render(sim, state, 1000);
      const radarFlightStrings = drawStringSpy.mock.calls.map((c) => c[0]);
      expect(radarFlightStrings).toContain("CEL: GISBORNE");
      expect(radarFlightStrings.some((s) => s.startsWith("POSTOJ:"))).toBe(false);

      // Cockpit Screen (Screen 1)
      state.activeScreen = 1;
      drawStringSpy.mockClear();
      render(sim, state, 1000);
      const cockpitFlightStrings = drawStringSpy.mock.calls.map((c) => c[0]);
      expect(cockpitFlightStrings).toContain("CEL: ");
      expect(cockpitFlightStrings).toContain("GISBORNE");
      expect(cockpitFlightStrings).toContain("PRZELOT HIPERSONICZNY (M4.8)");
      expect(cockpitFlightStrings).not.toContain("POSTOJ: ");

      // --- 2. Rooftop Landed Stay (u = 16.0s >= 12.0s) ---
      state.simTime = 16.0;

      // Radar Screen (Screen 0)
      state.activeScreen = 0;
      drawStringSpy.mockClear();
      render(sim, state, 1000);
      const radarLandedStrings = drawStringSpy.mock.calls.map((c) => c[0]);
      expect(radarLandedStrings).toContain("POSTOJ: GISBORNE");
      expect(radarLandedStrings.some((s) => s.startsWith("CEL:"))).toBe(false);

      // Cockpit Screen (Screen 1)
      state.activeScreen = 1;
      drawStringSpy.mockClear();
      render(sim, state, 1000);
      const cockpitLandedStrings = drawStringSpy.mock.calls.map((c) => c[0]);
      expect(cockpitLandedStrings).toContain("POSTOJ: ");
      expect(cockpitLandedStrings).toContain("GISBORNE");
      expect(cockpitLandedStrings).toContain("PRZERWA NA CIASTKA I MLEKO");
      expect(cockpitLandedStrings).not.toContain("CEL: ");

      // --- 3. December 24th Kraków Grand Finale ---
      state.activeDay = 24;
      state.simTime = 11 * 24.0 + 12.0; // Kraków arrival

      // Radar Screen (Screen 0)
      state.activeScreen = 0;
      drawStringSpy.mockClear();
      render(sim, state, 1000);
      const radarFinaleStrings = drawStringSpy.mock.calls.map((c) => c[0]);
      expect(radarFinaleStrings).toContain("FINAL: KRAKOW");
      expect(radarFinaleStrings).toContain("WIGILIA!");

      // Cockpit Screen (Screen 1)
      state.activeScreen = 1;
      drawStringSpy.mockClear();
      render(sim, state, 1000);
      const cockpitFinaleStrings = drawStringSpy.mock.calls.map((c) => c[0]);
      expect(cockpitFinaleStrings).toContain("FINAL: ");
      expect(cockpitFinaleStrings).toContain("KRAKOW");
      expect(cockpitFinaleStrings).toContain("FINAL WIGILII: KRAKOW!");
      expect(cockpitFinaleStrings).toContain("WIGILIA!");
    });

    it("locks indefinitely on Day 24 at Kraków without wrapping back to the Pacific", () => {
      const state = setup(0);
      state.activeDay = 24;
      const krakowArrivalTime = 11 * 24.0 + 12.0; // 276.0s (Stop 11 arrival)
      state.simTime = krakowArrivalTime;

      // Simulate 120 seconds of continuous clock advancement
      for (let i = 0; i < 120; i++) {
        update(state, noButtons, 1000, 1000 * i);
      }

      // Must remain locked at krakowArrivalTime
      expect(state.simTime).toBe(krakowArrivalTime);
      const telemetry = getTelemetry(state);
      expect(telemetry.isDay24Finale).toBe(true);
      expect(telemetry.safeIdx).toBe(11);
      expect(telemetry.nextCityName).toBe("KRAKOW");
      expect(telemetry.etaSeconds).toBe(0);
    });

    it("loops continuously through all 12 stops on Days 1 to 23", () => {
      const state = setup(0);
      state.activeDay = 1;
      const totalDayTime = 12 * 24.0; // 288.0s
      state.simTime = totalDayTime - 1.0; // 287.0s

      // Advance by 2.0s (20 frames of 100ms) -> crosses 288.0s boundary
      for (let i = 0; i < 20; i++) {
        update(state, noButtons, 100, 100 * i);
      }
      expect(Math.round(state.simTime * 10) / 10).toBe(1.0); // Cleanly wrapped to 1.0s
      const telemetry = getTelemetry(state);
      expect(telemetry.isDay24Finale).toBe(false);
      expect(telemetry.safeIdx).toBe(0); // Back at Stop 0
    });

    it("transliterates Polish diacritics cleanly to ASCII in M5CanvasSim", () => {
      const fillRectSpy = vi.fn();
      const mockCtx = {
        imageSmoothingEnabled: false,
        fillStyle: "",
        strokeStyle: "",
        lineWidth: 1,
        fillRect: fillRectSpy,
        strokeRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        fill: vi.fn(),
        closePath: vi.fn(),
        arc: vi.fn(),
        roundRect: vi.fn(),
      };
      const mockCanvas = { width: 240, height: 135 };
      const sim = new M5CanvasSim(
        mockCtx as unknown as CanvasRenderingContext2D,
        mockCanvas as unknown as HTMLCanvasElement
      );

      // String with Polish characters: "FINAŁ KRAKÓW"
      expect(sim.textWidth("FINAŁ KRAKÓW")).toBe(12 * 6);
      expect(() => sim.drawString("FINAŁ KRAKÓW", 10, 20)).not.toThrow();
      expect(fillRectSpy).toHaveBeenCalled();
    });
  });
});
