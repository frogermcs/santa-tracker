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
  simulateWifiConnect,
  simulateWifiDisconnect,
  triggerWifiToast,
  formatNtpTime,
  formatEta,
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

    it("cycles active screen through Radar, Cockpit, and Santa Cam on Button A click", () => {
      const state = setup(0);
      expect(state.activeScreen).toBe(0); // Radar

      update(state, { ...noButtons, wasPressedA: true }, 16, 16);
      expect(state.activeScreen).toBe(1); // Cockpit

      update(state, { ...noButtons, wasPressedA: true }, 16, 32);
      expect(state.activeScreen).toBe(2); // Santa Cam

      update(state, { ...noButtons, wasPressedA: true }, 16, 48);
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

    it("jumps to next city on Button B click and lands immediately in Demo Mode", () => {
      const state = setup(0);
      expect(state.simTime).toBe(15.0); // Stop 1 landed (u = 15.0)

      update(state, { ...noButtons, wasPressedB: true }, 16, 16);
      // Stop 2 landed = 1 * 30 + 15 = 45.0
      expect(state.simTime).toBe(45.0);
    });

    it("disables manual city and day jumping in Real-Time Mode to preserve clock synchronization", () => {
      const state = setup(0);
      state.journeyMode = "real";
      state.simTime = 1200.0;
      state.activeDay = 24;

      // Button B press in real-time mode: city jump is ignored, only normal dtSec (0.016s) advances
      update(state, { ...noButtons, wasPressedB: true }, 16, 16);
      expect(state.simTime).toBeCloseTo(1200.016, 2);
      expect(state.lastAction).toBe("CZAS RZECZYWISTY: MIASTO ZABLOKOWANE");
      expect(state.toastType).toBe("offline");

      // Button A long hold in real-time mode
      update(state, { ...noButtons, wasHoldA: true }, 16, 32);
      expect(state.activeDay).toBe(24); // Day jump ignored!
      expect(state.lastAction).toBe("CZAS RZECZYWISTY: DZIEN ZABLOKOWANY");
    });

    it("toggles operating mode on Button PWR long hold or Button B long hold, and toggles sound on Button PWR click", () => {
      const state = setup(0);
      expect(state.journeyMode).toBe("demo");
      expect(state.soundEnabled).toBe(true);

      // Button PWR long hold: switches Demo -> Real
      update(state, { ...noButtons, wasHoldPWR: true }, 16, 16);
      expect(state.journeyMode).toBe("real");
      expect(state.toastType).toBe("connected");
      expect(state.lastAction).toContain("CZAS RZECZYWISTY");

      // Button PWR long hold again: switches Real -> Demo
      update(state, { ...noButtons, wasHoldPWR: true }, 16, 32);
      expect(state.journeyMode).toBe("demo");
      expect(state.lastAction).toContain("DEMO");

      // Button B long hold also switches Demo -> Real
      update(state, { ...noButtons, wasHoldB: true }, 16, 48);
      expect(state.journeyMode).toBe("real");

      // Button PWR click: toggles sound
      update(state, { ...noButtons, wasPressedPWR: true }, 16, 64);
      expect(state.soundEnabled).toBe(false);
      expect(state.lastAction).toBe("DZWIEK: WYL");

      update(state, { ...noButtons, wasPressedPWR: true }, 16, 80);
      expect(state.soundEnabled).toBe(true);
      expect(state.lastAction).toBe("DZWIEK: WL");
    });

    it("activates Off-Season Chilling Out when in Real-Time Mode outside Dec 01-24", () => {
      const state = setup(0);
      state.journeyMode = "real";

      // Simulated date: November 10th (Outside Dec 01-24)
      state.simulatedRealDate = new Date(2026, 10, 10, 12, 0, 0); // Month 10 is November in JS (0-indexed)
      const tOffSeason = getTelemetry(state);
      expect(tOffSeason.isOffSeason).toBe(true);
      expect(tOffSeason.santaLon).toBe(0.0);
      expect(tOffSeason.santaLat).toBe(90.0);
      expect(tOffSeason.nextCityName).toBe("BIEGUN POLNOCNY");
      expect(tOffSeason.daysUntilAdvent).toBe(21); // 21 days until Dec 1st

      // Simulated date: December 15th (Active Advent Season)
      state.simulatedRealDate = new Date(2026, 11, 15, 14, 0, 0);
      const tInSeason = getTelemetry(state);
      expect(tInSeason.isOffSeason).toBe(false);
      expect(tInSeason.daysUntilAdvent).toBe(0);
    });

    it("computes accurate telemetry for 15s transit flight (CEL) and 15s landed stay (POSTOJ)", () => {
      const state = setup(0);

      // At simTime = 5.0s, transit flight phase (u = 5.0 < 15.0s)
      state.simTime = 5.0;
      const tFlight = getTelemetry(state);
      expect(tFlight.isFlightPhase).toBe(true);
      expect(tFlight.nextCityName).toBe("GISBORNE");
      expect(tFlight.etaSeconds).toBe(10); // 15 - 5 = 10s remaining in flight
      expect(tFlight.u).toBe(5.0);

      // At u = 5.0s (1/3 of 15s flight), linear interpolation ensures progress is exactly 1/3 (p = 5/15)
      const prevLon = state.cities[0].lon;
      const currLon = state.cities[0].lon; // for stop 0 prevIdx is 0
      // Advance to stop 1 (simTime = 30s + 3.75s, u = 3.75s = 25% of flight)
      state.simTime = 33.75;
      const tQuarter = getTelemetry(state);
      const expectedLonQuarter =
        state.cities[0].lon + (state.cities[1].lon - state.cities[0].lon) * 0.25;
      expect(tQuarter.santaLon).toBeCloseTo(expectedLonQuarter, 2);

      // At u = 7.5s (50% of flight)
      state.simTime = 37.5;
      const tHalf = getTelemetry(state);
      const expectedLonHalf =
        state.cities[0].lon + (state.cities[1].lon - state.cities[0].lon) * 0.5;
      expect(tHalf.santaLon).toBeCloseTo(expectedLonHalf, 2);

      // At u = 11.25s (75% of flight)
      state.simTime = 41.25;
      const tThreeQuarter = getTelemetry(state);
      const expectedLonThreeQuarter =
        state.cities[0].lon + (state.cities[1].lon - state.cities[0].lon) * 0.75;
      expect(tThreeQuarter.santaLon).toBeCloseTo(expectedLonThreeQuarter, 2);

      // At simTime = 18.0s, landed stay phase (u = 18.0 >= 15.0s)
      state.simTime = 18.0;
      const tLanded = getTelemetry(state);
      expect(tLanded.isFlightPhase).toBe(false);
      expect(tLanded.nextCityName).toBe("GISBORNE");
      expect(tLanded.etaSeconds).toBe(12); // 30 - 18 = 12s remaining on roof
      expect(tLanded.u).toBe(18.0);
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

      // Render Santa Cam (Screen 2)
      state.activeScreen = 2;
      expect(() => render(sim, state, 2500)).not.toThrow();
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
      expect(radarFlightStrings).toContain("MIKORADAR");
      expect(radarFlightStrings.some((s) => s.startsWith("POSTOJ:"))).toBe(false);

      // Cockpit Screen (Screen 1)
      state.activeScreen = 1;
      drawStringSpy.mockClear();
      render(sim, state, 1000);
      const cockpitFlightStrings = drawStringSpy.mock.calls.map((c) => c[0]);
      expect(cockpitFlightStrings).toContain("CEL: ");
      expect(cockpitFlightStrings).toContain("GISBORNE");
      expect(cockpitFlightStrings).toContain("KOKPIT MISJI");
      expect(cockpitFlightStrings).toContain("PRZELOT STRATOSFERYCZNY");
      expect(cockpitFlightStrings).not.toContain("POSTOJ: ");

      // Santa Cam Screen (Screen 2)
      state.activeScreen = 2;
      drawStringSpy.mockClear();
      render(sim, state, 1000);
      const camFlightStrings = drawStringSpy.mock.calls.map((c) => c[0]);
      expect(camFlightStrings).toContain("CEL: ");
      expect(camFlightStrings).toContain("GISBORNE");
      expect(camFlightStrings).not.toContain("KAMERA MIKOLAJA");
      expect(camFlightStrings).not.toContain("POSTOJ: ");

      // --- 2. Rooftop Landed Stay (u = 22.0s >= 15.0s) ---
      state.simTime = 22.0;

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

      // Santa Cam Screen (Screen 2)
      state.activeScreen = 2;
      drawStringSpy.mockClear();
      render(sim, state, 1000);
      const camLandedStrings = drawStringSpy.mock.calls.map((c) => c[0]);
      expect(camLandedStrings).toContain("POSTOJ: ");
      expect(camLandedStrings).toContain("GISBORNE");
      expect(camLandedStrings).not.toContain("KAMERA MIKOLAJA");
      expect(camLandedStrings).not.toContain("CEL: ");

      // --- 3. December 24th Kraków Grand Finale ---
      state.activeDay = 24;
      state.simTime = 11 * 30.0 + 15.0; // Kraków arrival

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
      expect(cockpitFinaleStrings).toContain("WESOŁYCH ŚWIĄT!");
      expect(cockpitFinaleStrings).toContain("WIGILIA!");

      // Santa Cam Screen (Screen 2)
      state.activeScreen = 2;
      drawStringSpy.mockClear();
      render(sim, state, 1000);
      const camFinaleStrings = drawStringSpy.mock.calls.map((c) => c[0]);
      expect(camFinaleStrings).toContain("FINAL: ");
      expect(camFinaleStrings).toContain("KRAKOW");
      expect(camFinaleStrings).toContain("WESOLYCH SWIAT!");
      expect(camFinaleStrings).not.toContain("KAMERA MIKOLAJA");
      expect(camFinaleStrings).toContain("WIGILIA!");
    });

    it("locks indefinitely on Day 24 at Kraków without wrapping back to the Pacific", () => {
      const state = setup(0);
      state.activeDay = 24;
      const krakowArrivalTime = 11 * 30.0 + 15.0; // 345.0s (Stop 11 arrival)
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
      const totalDayTime = 12 * 30.0; // 360.0s
      state.simTime = totalDayTime - 1.0; // 359.0s

      // Advance by 2.0s (20 frames of 100ms) -> crosses 360.0s boundary
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

    it("renders Wi-Fi micro dot and toast states with 1:1 hardware parity", () => {
      const fillRectSpy = vi.fn();
      const strokeRectSpy = vi.fn();
      const arcSpy = vi.fn();
      const mockCtx = {
        imageSmoothingEnabled: false,
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
        arc: arcSpy,
        roundRect: vi.fn(),
      };
      const mockCanvas = { width: 240, height: 135 };
      const sim = new M5CanvasSim(
        mockCtx as unknown as CanvasRenderingContext2D,
        mockCanvas as unknown as HTMLCanvasElement
      );

      const state = setup(0);
      expect(state.wifiState).toBe("offline");
      expect(state.toastType).toBe("none");

      // 1. Offline state renders slate ring in top-left corner (x: 6, y: 6)
      render(sim, state, 1000);
      expect(arcSpy).toHaveBeenCalledWith(6.5, 6.5, 2, 0, Math.PI * 2);

      // 2. Connecting state renders pulsing yellow dot (fillCircle uses x, y)
      state.wifiState = "connecting";
      render(sim, state, 1200); // 1200ms: Math.floor(1200/300) = 4 % 2 = 0 (pulse active)
      expect(arcSpy).toHaveBeenCalledWith(6, 6, 2, 0, Math.PI * 2);

      // 3. Connected state with toast
      state.wifiState = "connected";
      state.wifiSsid = "NorthPole_2.4G";
      state.wifiIp = "192.168.0.81";
      state.toastType = "connected";
      state.toastTimer = 4000;
      render(sim, state, 2000);
      expect(arcSpy).toHaveBeenCalledWith(6, 6, 2, 0, Math.PI * 2);

      // 4. Update timer countdown: transitions to sleep (Burst & Sleep active)
      const noButtons = {
        wasPressedA: false,
        wasHoldA: false,
        wasPressedB: false,
        wasHoldB: false,
        wasPressedPWR: false,
      };
      update(state, noButtons, 4000, 4000);
      expect(state.toastTimer).toBe(0);
      expect(state.toastType).toBe("none");
      expect(state.wifiState).toBe("sleep");

      // In sleep state, renders emerald ring
      render(sim, state, 3000);
      expect(arcSpy).toHaveBeenCalledWith(6.5, 6.5, 2, 0, Math.PI * 2);

      // 5. Offline failure toast
      state.wifiState = "offline";
      state.toastType = "offline";
      state.toastTimer = 3500;
      render(sim, state, 5000);
      update(state, noButtons, 3500, 8500);
      expect(state.toastType).toBe("none");

      // 6. Test helper functions: simulateWifiConnect & simulateWifiDisconnect
      simulateWifiConnect(state, "NorthPole_2.4G", "192.168.1.100");
      expect(state.wifiState).toBe("connected");
      expect(state.wifiSsid).toBe("NorthPole_2.4G");
      expect(state.toastType).toBe("connected");
      expect(state.toastTimer).toBe(4000);
      expect(state.wifiTime).toContain("CZAS NTP:");

      simulateWifiDisconnect(state, "FailNet");
      expect(state.wifiState).toBe("offline");
      expect(state.toastType).toBe("offline");
      expect(state.toastTimer).toBe(3500);

      triggerWifiToast(state, "connected", 5000);
      expect(state.toastType).toBe("connected");
      expect(state.toastTimer).toBe(5000);
    });
  });

  describe("formatEta helper", () => {
    it("formats short countdown seconds into M:SS format for demo mode", () => {
      expect(formatEta(0)).toBe("0:00");
      expect(formatEta(5)).toBe("0:05");
      expect(formatEta(12)).toBe("0:12");
      expect(formatEta(59)).toBe("0:59");
      expect(formatEta(60)).toBe("1:00");
    });

    it("formats minutes and seconds accurately for real 2-hour cadence", () => {
      expect(formatEta(65)).toBe("1:05");
      expect(formatEta(3554)).toBe("59:14");
      expect(formatEta(3556)).toBe("59:16");
      expect(formatEta(3599)).toBe("59:59");
    });

    it("formats hour-long countdowns into H:MM:SS format", () => {
      expect(formatEta(3600)).toBe("1:00:00");
      expect(formatEta(3665)).toBe("1:01:05");
      expect(formatEta(7200)).toBe("2:00:00");
    });
  });
});
