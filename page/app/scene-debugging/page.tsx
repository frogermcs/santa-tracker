"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Layers,
  Map,
} from "lucide-react";
import { M5StickDevice } from "@/components/M5StickDevice";
import { SnowEffect } from "@/components/SnowEffect";
import { M5CanvasSim } from "@/lib/simulator/M5CanvasSim";
import {
  setup as setupSimulator,
  update as updateSimulator,
  render as renderSimulator,
  getTelemetry,
  setDay,
  setCityIndex,
  SimulatorAppState,
  ButtonEventState,
} from "@/lib/simulator/iotAppLogic";
import {
  renderCamScreen,
  CAM_SCENE_DEFINITIONS,
  CamSceneInfo,
  CamSceneMode,
} from "@/lib/simulator/camScreen";
import { getDaySchedule, DEFAULT_ADVENT_DAY } from "@/lib/advent-schedule";
import { buzzer } from "@/lib/audio/buzzer";

// ============================================================================
// Scene Card Component (Dedicated Canvas & Interactive Scrubbing)
// ============================================================================

interface SceneCardProps {
  scene: CamSceneInfo;
  simState: SimulatorAppState;
  isFocused: boolean;
  onFocus: () => void;
  globalPaused: boolean;
  globalSpeed: number;
}

function SceneCard({
  scene,
  simState,
  isFocused,
  onFocus,
  globalPaused,
  globalSpeed,
}: SceneCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasSimRef = useRef<M5CanvasSim | null>(null);

  const localTimeMsRef = useRef<number>(performance.now());
  const pausedRef = useRef<boolean>(false);
  const globalSpeedRef = useRef<number>(globalSpeed);

  pausedRef.current = globalPaused;
  globalSpeedRef.current = globalSpeed;

  // Initialize Canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = 240;
    canvas.height = 135;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    canvasSimRef.current = new M5CanvasSim(ctx, canvas);
    canvasSimRef.current.setRotation(1);
  }, []);

  // Dedicated Render Loop for this Scene Card (Looping animation in lockstep)
  useEffect(() => {
    let animId: number;
    let lastTimestamp = performance.now();

    const loop = (timestamp: number) => {
      const dt = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      if (!pausedRef.current) {
        localTimeMsRef.current += dt * globalSpeedRef.current;
      }

      if (canvasSimRef.current) {
        const telemetry = getTelemetry(simState);

        renderCamScreen(
          canvasSimRef.current,
          simState,
          telemetry,
          localTimeMsRef.current,
          {
            forcedMode: scene.mode,
          }
        );
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [scene.mode, simState]);

  return (
    <div
      onClick={onFocus}
      className={`relative rounded-xl border transition-all duration-200 overflow-hidden cursor-pointer bg-black ${
        isFocused
          ? "border-amber-400 ring-2 ring-amber-400/50 shadow-xl shadow-amber-950/40"
          : "border-white/10 hover:border-white/30 hover:scale-[1.01] shadow-lg"
      }`}
      title={`Tryb ${scene.mode} — Kliknij, aby wyświetlić na głównym symulatorze`}
    >
      <canvas
        ref={canvasRef}
        width={240}
        height={135}
        className="w-full h-auto aspect-[240/135] block"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
}

// ============================================================================
// Main Scene Debugging Page
// ============================================================================

export default function SceneDebuggingPage() {
  const [selectedDay, setSelectedDay] = useState<number>(DEFAULT_ADVENT_DAY);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  // Active focused scene (null = full live simulation, 1..8 = forced scene mode)
  const [focusedMode, setFocusedMode] = useState<CamSceneMode | null>(5); // Default to Big Santa Cookie Break!
  const [focusedProgress, setFocusedProgress] = useState<number>(0.5);
  const [globalPaused, setGlobalPaused] = useState<boolean>(false);
  const [globalSpeed, setGlobalSpeed] = useState<number>(1.0);

  // Button visual states for M5Stick device
  const [isBtnAPressed, setIsBtnAPressed] = useState<boolean>(false);
  const [isBtnBPressed, setIsBtnBPressed] = useState<boolean>(false);

  // Hardware Simulator refs
  const primaryCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const primarySimRef = useRef<M5CanvasSim | null>(null);
  const simStateRef = useRef<SimulatorAppState>(setupSimulator(0));
  const pendingButtonsRef = useRef<ButtonEventState>({
    wasPressedA: false,
    wasHoldA: false,
    wasPressedB: false,
    wasHoldB: false,
    wasPressedPWR: false,
  });

  // Current day stops
  const currentStops = useMemo(() => getDaySchedule(selectedDay).stops, [selectedDay]);

  // Initialize Primary Canvas
  useEffect(() => {
    if (!primaryCanvasRef.current) return;
    const canvas = primaryCanvasRef.current;
    canvas.width = 240;
    canvas.height = 135;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    primarySimRef.current = new M5CanvasSim(ctx, canvas);
    primarySimRef.current.setRotation(1);
  }, []);

  // Button Handlers
  const handleButtonAShortPress = useCallback(() => {
    setIsBtnAPressed(true);
    setTimeout(() => setIsBtnAPressed(false), 200);
    // Cycle focused mode: 1 -> 2 -> ... -> 8 -> Live -> 1
    setFocusedMode((prev) => {
      if (prev === null) return 1;
      if (prev >= 8) return null;
      return (prev + 1) as CamSceneMode;
    });
    if (!isMuted) buzzer.playTone(1600, 35);
  }, [isMuted]);

  const handleButtonALongPress = useCallback(() => {
    setIsBtnAPressed(true);
    setTimeout(() => setIsBtnAPressed(false), 300);
    // Advance Advent Day
    setSelectedDay((prev) => {
      const next = prev >= 24 ? 1 : prev + 1;
      setDay(simStateRef.current, next);
      return next;
    });
    if (!isMuted) buzzer.playTone(1900, 70);
  }, [isMuted]);

  const handleButtonBShortPress = useCallback(() => {
    setIsBtnBPressed(true);
    setTimeout(() => setIsBtnBPressed(false), 200);
    pendingButtonsRef.current.wasPressedB = true;
    if (!isMuted) buzzer.playTone(1400, 35);
  }, [isMuted]);

  const handleButtonBLongPress = useCallback(() => {
    setIsBtnBPressed(true);
    setTimeout(() => setIsBtnBPressed(false), 300);
    setIsMuted((prev) => {
      const next = !prev;
      if (!next) buzzer.playTone(2200, 80);
      return next;
    });
  }, []);

  // Primary Device Animation Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let simClockMs = performance.now();

    const tick = (now: number) => {
      const dt = now - lastTime;
      lastTime = now;

      if (!globalPaused) {
        simClockMs += dt * globalSpeed;
        const state = simStateRef.current;
        const btn = pendingButtonsRef.current;

        // Apply any pending button clicks
        updateSimulator(state, btn, dt * 0.001 * globalSpeed, simClockMs);
        btn.wasPressedA = false;
        btn.wasHoldA = false;
        btn.wasPressedB = false;
        btn.wasHoldB = false;
        btn.wasPressedPWR = false;
      }

      if (primarySimRef.current) {
        const state = simStateRef.current;
        const telemetry = getTelemetry(state);

        if (focusedMode !== null) {
          // Render the explicitly focused camera mode
          renderCamScreen(
            primarySimRef.current,
            state,
            telemetry,
            simClockMs,
            {
              forcedMode: focusedMode,
              forcedProgress: focusedProgress,
            }
          );
        } else {
          // Full live simulator render (Screen 0, 1, or 2)
          renderSimulator(primarySimRef.current, state, simClockMs);
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [focusedMode, focusedProgress, globalPaused, globalSpeed]);

  return (
    <div className="min-h-screen bg-[#060a16] text-slate-100 flex flex-col selection:bg-rose-900 selection:text-amber-100 relative overflow-x-hidden">
      {/* Arctic Midnight Sky with Aurora & Starlight Depth */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(14,165,233,0.12),transparent_70%),radial-gradient(circle_at_50%_35%,#091326_0%,#060a16_55%,#03050d_100%)]"
      />

      {/* Gentle Falling Snow Particle Layer */}
      <SnowEffect />

      {/* Navigation Top Header */}
      <header className="border-b border-white/10 bg-[#070e1c]/80 backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition text-xs font-mono font-bold cursor-pointer"
            title="Powrót do głównego symulatora"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Symulator</span>
          </Link>

          <div className="h-4 w-px bg-white/10 hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-center justify-center p-1 shadow-sm shrink-0">
              <Image src="/santa-icon.svg" alt="Santa" width={24} height={24} className="w-6 h-6" priority />
            </div>
            <h1 className="text-xs sm:text-sm font-bold font-mono tracking-tight text-white">
              Santa OS scene debugger
            </h1>
          </div>
        </div>

        {/* Global Controls & Links */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono">
          <Link
            href="/map-debugger"
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 transition font-bold cursor-pointer"
          >
            <Map className="w-3.5 h-3.5 text-sky-400" />
            <span>Map Debugger</span>
          </Link>

          {/* Global Pause / Play */}
          <button
            onClick={() => setGlobalPaused((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-bold transition cursor-pointer ${
              globalPaused
                ? "bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/40 text-emerald-300"
                : "bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-300"
            }`}
          >
            {globalPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{globalPaused ? "WZNÓW WSZYSTKIE" : "ZATRZYMAJ"}</span>
          </button>

          {/* Global Speed Selector */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-900/80 border border-white/10 rounded-md p-0.5">
            {[0.25, 0.5, 1.0, 2.0].map((s) => (
              <button
                key={s}
                onClick={() => setGlobalSpeed(s)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                  globalSpeed === s
                    ? "bg-cyan-500 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Audio Mute Toggle */}
          <button
            onClick={() => setIsMuted((prev) => !prev)}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 transition cursor-pointer"
            title="Dźwięk brzęczyka"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-500" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* Main Studio Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-8 relative z-10">
        {/* Top Section: Focused Device & Scene Selector */}
        <section className="flex flex-col items-center justify-center gap-4 bg-[#070e1e]/60 border border-white/10 rounded-2xl p-4 sm:p-6 backdrop-blur-md">
          <div className="pt-2 sm:pt-4 pb-5 sm:pb-6">
            <M5StickDevice
              canvasRef={primaryCanvasRef}
              onButtonAShortPress={handleButtonAShortPress}
              onButtonALongPress={handleButtonALongPress}
              onButtonBShortPress={handleButtonBShortPress}
              onButtonBLongPress={handleButtonBLongPress}
              onButtonPWRShortPress={() => setIsMuted((prev) => !prev)}
              onButtonPWRLongPress={handleButtonBLongPress}
              isButtonAPressed={isBtnAPressed}
              isButtonBPressed={isBtnBPressed}
              scanlines={false}
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setFocusedMode(null)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold border transition cursor-pointer ${
                focusedMode === null
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  : "bg-slate-800 text-slate-300 border-white/10 hover:border-white/30"
              }`}
            >
              TRYB NATURALNY (PEŁNY CAROUSEL)
            </button>

            {CAM_SCENE_DEFINITIONS.map((s) => (
              <button
                key={s.mode}
                onClick={() => setFocusedMode(s.mode)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition cursor-pointer border flex items-center gap-1.5 ${
                  focusedMode === s.mode
                    ? "bg-amber-500 text-slate-950 font-bold border-amber-400 shadow"
                    : "bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-white/10"
                }`}
              >
                <span className="font-bold">T{s.mode}</span>
                <span className="text-[11px] opacity-80">{s.name.split(":")[1]?.trim() || s.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Bottom Section: 8-Scene Multi-Cam Matrix (Side-by-Side Gallery) */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div>
              <h2 className="text-base font-bold font-mono text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>WSZYSTKIE 8 SCEN</span>
              </h2>
            </div>
          </div>

          {/* Grid of All 8 Scenes */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {CAM_SCENE_DEFINITIONS.map((scene) => (
              <SceneCard
                key={scene.mode}
                scene={scene}
                simState={simStateRef.current}
                isFocused={focusedMode === scene.mode}
                onFocus={() => setFocusedMode(scene.mode)}
                globalPaused={globalPaused}
                globalSpeed={globalSpeed}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Festive Santa Climatic Footer */}
      <footer className="border-t border-white/10 bg-[#040712]/90 py-5 px-6 text-center text-xs font-mono text-slate-400 relative z-10 flex flex-col items-center justify-center gap-1.5">
        <div className="flex items-center gap-2 text-amber-300/90 font-bold">
          <span>🎅</span>
          <span>Santa OS Mission Control • Raport z Bieguna Północnego</span>
          <span>🎄</span>
        </div>
        <p className="text-slate-400 max-w-2xl text-[11px] leading-relaxed">
          Renifery zatankowane świeżym owsem i marchewkami 🥕. Jeśli sanie lecą za szybko — to nie błąd, to czysty <span className="text-cyan-300">Hyper-Warp</span>! Żaden elf ani renifer nie ucierpiał podczas debugowania tych scen. 🥛🍪✨
        </p>
      </footer>
    </div>
  );
}
