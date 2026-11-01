import { describe, it, expect, vi } from "vitest";
import { renderCamScreen } from "@/lib/simulator/camScreen";
import { M5CanvasSim } from "@/lib/simulator/M5CanvasSim";
import { setup, getTelemetry } from "@/lib/simulator/iotAppLogic";

function createMockCanvas() {
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
  return { sim, mockCtx };
}

describe("ScreenCam (Kamera Mikołaja — Screen 3 / SCREEN_CAM)", () => {
  it("renders the static HUD header and footer reliably", () => {
    const { sim } = createMockCanvas();
    const drawStringSpy = vi.spyOn(sim, "drawString");
    const state = setup(0);
    state.activeScreen = 2;
    state.activeDay = 24;
    state.simTime = 5.0; // In transit
    const telemetry = getTelemetry(state);

    renderCamScreen(sim, state, telemetry, 1000);

    const strings = drawStringSpy.mock.calls.map((c) => c[0]);
    expect(strings).toContain("98%");
    expect(strings).toContain("KAMERA MIKOLAJA");
    expect(strings).toContain("DZIEN 24");
    expect(strings).toContain("CEL: ");
    expect(strings).toContain("GISBORNE");
  });

  describe("Dynamic Sub-Phase Scene Determination", () => {
    it("Mode 1: renders Hyper-Warp during initial acceleration (u < 4.5s)", () => {
      const { sim } = createMockCanvas();
      const drawStringSpy = vi.spyOn(sim, "drawString");
      const state = setup(0);
      state.activeScreen = 2;
      state.activeDay = 15;
      state.simTime = 2.0; // u = 2.0s (0 < 4.5s)
      const telemetry = getTelemetry(state);

      renderCamScreen(sim, state, telemetry, 1000);

      const strings = drawStringSpy.mock.calls.map((c) => c[0]);
      expect(strings).toContain("TRYB HYPER-WARP");
      expect(strings).toContain("CEL: ");
    });

    it("Mode 2: renders Cruising Sky with parallax during steady flight (4.5s <= u < 12.0s)", () => {
      const { sim } = createMockCanvas();
      const drawStringSpy = vi.spyOn(sim, "drawString");
      const state = setup(0);
      state.activeScreen = 2;
      state.activeDay = 10;
      state.simTime = 8.0; // u = 8.0s (steady cruise)
      const telemetry = getTelemetry(state);

      renderCamScreen(sim, state, telemetry, 2000);

      const strings = drawStringSpy.mock.calls.map((c) => c[0]);
      expect(strings).toContain("PRZELOT STRATOSFERYCZNY");
      expect(strings).toContain("CEL: ");
    });

    it("Mode 3: renders Gliding Descent approaching rooftops (12.0s <= u < 15.0s)", () => {
      const { sim } = createMockCanvas();
      const drawStringSpy = vi.spyOn(sim, "drawString");
      const state = setup(0);
      state.activeScreen = 2;
      state.activeDay = 5;
      state.simTime = 13.5; // u = 13.5s (descent)
      const telemetry = getTelemetry(state);

      renderCamScreen(sim, state, telemetry, 3000);

      const strings = drawStringSpy.mock.calls.map((c) => c[0]);
      expect(strings).toContain("ZNIZANIE");
      expect(strings).toContain("CEL: ");
    });

    it("Mode 4: renders City Rooftop Chimney Cruise with gift drops (15.0s <= u < 21.0s)", () => {
      const { sim } = createMockCanvas();
      const drawStringSpy = vi.spyOn(sim, "drawString");
      const state = setup(0);
      state.activeScreen = 2;
      state.activeDay = 7;
      state.simTime = 18.0; // u = 18.0s (drop)
      const telemetry = getTelemetry(state);

      renderCamScreen(sim, state, telemetry, 4000);

      const strings = drawStringSpy.mock.calls.map((c) => c[0]);
      expect(strings).toContain("ZRZUT PREZENTOW");
      expect(strings).toContain("POSTOJ: ");
      expect(strings).not.toContain("CEL: ");
    });

    it("Mode 5: renders Cookie Break during rooftop snack phase (21.0s <= u < 27.0s)", () => {
      const { sim } = createMockCanvas();
      const drawStringSpy = vi.spyOn(sim, "drawString");
      const state = setup(0);
      state.activeScreen = 2;
      state.activeDay = 12;
      state.simTime = 24.0; // u = 24.0s (cookie break)
      const telemetry = getTelemetry(state);

      renderCamScreen(sim, state, telemetry, 5000);

      const strings = drawStringSpy.mock.calls.map((c) => c[0]);
      expect(strings).toContain("PRZERWA NA CIASTKA I MLEKO");
      expect(strings.some((s) => s.startsWith("MNIAM!"))).toBe(true);
      expect(strings).toContain("POSTOJ: ");
    });

    it("Mode 6: renders Takeoff Climb (Wznoszenie) above Christmas trees (27.0s <= u < 30.0s)", () => {
      const { sim } = createMockCanvas();
      const drawStringSpy = vi.spyOn(sim, "drawString");
      const state = setup(0);
      state.activeScreen = 2;
      state.activeDay = 18;
      state.simTime = 28.5; // u = 28.5s (takeoff climb)
      const telemetry = getTelemetry(state);

      renderCamScreen(sim, state, telemetry, 6000);

      const strings = drawStringSpy.mock.calls.map((c) => c[0]);
      expect(strings).toContain("WZNOSZENIE");
      expect(strings).toContain("POSTOJ: ");
    });

    it("Mode 7: renders Kraków Grand Finale celebration at arrival lock", () => {
      const { sim } = createMockCanvas();
      const drawStringSpy = vi.spyOn(sim, "drawString");
      const state = setup(0);
      state.activeScreen = 2;
      state.activeDay = 24;
      state.simTime = 11 * 30.0 + 15.0; // Stop 11 landed in Kraków
      const telemetry = getTelemetry(state);

      renderCamScreen(sim, state, telemetry, 7000);

      const strings = drawStringSpy.mock.calls.map((c) => c[0]);
      expect(strings).toContain("FINAL: ");
      expect(strings).toContain("KRAKOW");
      expect(strings).toContain("WESOLYCH SWIAT!");
      expect(strings).not.toContain("FINAL WIGILII: KRAKOW");
      expect(strings).toContain("WIGILIA!");
    });
  });

  it("safely handles rapid animation ticks across multiple simulated seconds", () => {
    const { sim } = createMockCanvas();
    const state = setup(0);
    state.activeScreen = 2;

    // Simulate 100 animation frames across various times
    for (let frame = 0; frame < 100; frame++) {
      state.simTime = (frame * 0.25) % 288.0;
      const telemetry = getTelemetry(state);
      expect(() => renderCamScreen(sim, state, telemetry, frame * 33)).not.toThrow();
    }
  });
});
