"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Compass,
  Radio,
  Wifi,
  Volume2,
  VolumeX,
  FastForward,
  Play,
  Pause,
  RefreshCw,
  Cpu,
  Shield,
  Zap,
  Activity,
  Calendar,
  Gauge,
  Thermometer,
  CloudSnow,
  Sun,
  Eye,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Layers,
  ArrowUpRight,
  Maximize2,
  RotateCcw,
} from "lucide-react";
import { M5StickDevice } from "@/components/M5StickDevice";
import { renderSharedRadar, RadarWaypoint } from "@/lib/canvas/shared-radar";
import { buzzer } from "@/lib/audio/buzzer";
import {
  ADVENT_SCHEDULES,
  ADVENT_DAYS_COUNT,
  getAdventDay,
  AdventWaypoint,
  AdventDay,
} from "@/lib/advent-schedule";

// Web Audio sound synthesizer for radar pings, warps and clicks
class WebAudioSFX {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playRadarPing(muted = false) {
    if (muted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } catch {
      // AudioContext policy
    }
  }

  playWarpSound(speed: number, muted = false) {
    if (muted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600 + speed * 60, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.19);
    } catch {
      // AudioContext policy
    }
  }

  playClick(muted = false) {
    if (muted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // AudioContext policy
    }
  }
}

const sfx = new WebAudioSFX();

const SPEED_PRESETS = [
  { label: "1x", value: 1, desc: "Realtime Standard" },
  { label: "2x", value: 2, desc: "Expedited Cruise" },
  { label: "5x", value: 5, desc: "Supersonic Run" },
  { label: "10x", value: 10, desc: "⚡ TEST MODE", highlight: true },
  { label: "20x", value: 20, desc: "Hyper-Warp" },
  { label: "60x", value: 60, desc: "Sub-Orbital Flash" },
];

export default function Root2Page() {
  // Advent Calendar State (1 to 24)
  const [selectedDay, setSelectedDay] = useState<number>(24);
  const activeAdventDay: AdventDay = useMemo(() => getAdventDay(selectedDay), [selectedDay]);

  // Convert active day waypoints to RadarWaypoint format for the shared radar renderer
  const waypoints: RadarWaypoint[] = useMemo(() => {
    return activeAdventDay.route.map((w) => ({
      name: w.name,
      lon: w.lon,
      lat: w.lat,
    }));
  }, [activeAdventDay]);

  // Simulation dynamics
  const secPerCity = 16;
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [is3DView, setIs3DView] = useState<boolean>(true);
  const [scanlines, setScanlines] = useState<boolean>(true);

  // Buttons visual state
  const [isBtnAPressed, setIsBtnAPressed] = useState<boolean>(false);
  const [isBtnBPressed, setIsBtnBPressed] = useState<boolean>(false);

  // Real-time HUD telemetry state
  const [currentCityIdx, setCurrentCityIdx] = useState<number>(0);
  const [currentCity, setCurrentCity] = useState<AdventWaypoint>(activeAdventDay.route[0]);
  const [nextCity, setNextCity] = useState<AdventWaypoint>(activeAdventDay.route[1] || activeAdventDay.route[0]);
  const [eta, setEta] = useState<number>(16);
  const [currentCoords, setCurrentCoords] = useState<{ lat: string; lon: string }>({ lat: "0.0", lon: "0.0" });
  const [isFlightPhase, setIsFlightPhase] = useState<boolean>(true);
  const [distanceKm, setDistanceKm] = useState<number>(1420);
  const [giftsDelivered, setGiftsDelivered] = useState<number>(184500000);
  const [currentMach, setCurrentMach] = useState<number>(4.4);
  const [utcTime, setUtcTime] = useState<string>("00:00:00 UTC");

  // Canvas and render refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const simTimeRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // UTC Mission Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = String(now.getUTCHours()).padStart(2, "0");
      const mins = String(now.getUTCMinutes()).padStart(2, "0");
      const secs = String(now.getUTCSeconds()).padStart(2, "0");
      setUtcTime(`${hrs}:${mins}:${secs} UTC`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Reset simulation time when day changes
  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
    simTimeRef.current = 0;
    sfx.playClick(isMuted);
  };

  // Button A: Jump to Next City
  const handleBtnA = useCallback(() => {
    setIsBtnAPressed(true);
    setTimeout(() => setIsBtnAPressed(false), 180);
    sfx.playRadarPing(isMuted);
    if (!isMuted) buzzer.playTone(1600, 35);

    const curIdx = Math.floor(simTimeRef.current / secPerCity);
    simTimeRef.current = (curIdx + 1) * secPerCity;
  }, [secPerCity, isMuted]);

  // Button B: Cycle Speed Presets
  const handleBtnB = useCallback(() => {
    setIsBtnBPressed(true);
    setTimeout(() => setIsBtnBPressed(false), 180);

    setSpeedMultiplier((prev) => {
      const currIdx = SPEED_PRESETS.findIndex((p) => p.value === prev);
      const nextIdx = (currIdx + 1) % SPEED_PRESETS.length;
      const nextSpeed = SPEED_PRESETS[nextIdx].value;
      sfx.playWarpSound(nextSpeed, isMuted);
      if (!isMuted) buzzer.playTone(1100 + nextSpeed * 50, 30);
      return nextSpeed;
    });
  }, [isMuted]);

  // Set Speed Preset directly
  const handleSetSpeed = (val: number) => {
    setSpeedMultiplier(val);
    sfx.playWarpSound(val, isMuted);
    if (!isMuted) buzzer.playTone(1000 + val * 40, 25);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        handleBtnA();
      } else if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        handleBtnB();
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        setIsMuted((prev) => !prev);
      } else if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      } else if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        handleSetSpeed(10);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleBtnA, handleBtnB]);

  // 1:1 Shared Radar Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    lastTimeRef.current = performance.now();

    const render = (now: number) => {
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      const clampedDt = Math.min(dt, 0.1);

      if (!isPaused) {
        simTimeRef.current += clampedDt * speedMultiplier;
      }

      const totalSimTime = waypoints.length * secPerCity;
      if (simTimeRef.current >= totalSimTime) {
        simTimeRef.current -= totalSimTime;
      }

      const totalTime = simTimeRef.current;
      const cityIdx = Math.floor(totalTime / secPerCity);
      const u = totalTime - cityIdx * secPerCity;
      const safeIdx = cityIdx % waypoints.length;
      const prevIdx = safeIdx > 0 ? safeIdx - 1 : 0;
      const nextIdx = (safeIdx + 1) % waypoints.length;

      // Flight phase: first 6 seconds Santa flies between cities; next 10 seconds Santa stays in city
      const isFlight = u < 6;
      const p = isFlight
        ? (u / 6 < 0.5 ? 2 * (u / 6) ** 2 : 1 - (-2 * (u / 6) + 2) ** 2 / 2)
        : 1;

      const prev = waypoints[prevIdx];
      const curr = waypoints[safeIdx];
      const next = waypoints[nextIdx];

      const sLon = prev.lon + (curr.lon - prev.lon) * p;
      const sLat = prev.lat + (curr.lat - prev.lat) * p;

      const nextName = isFlight ? curr.name : next.name;
      const etaSec = Math.ceil(isFlight ? 6 - u : secPerCity - u + 6);

      // Mach velocity calculation: Mach 4.5 in cruise, smoothly decelerates to Mach 0.0 at chimney drop
      const computedMach = isFlight ? 3.8 + Math.sin(u * 2) * 0.8 : 0.0;
      const giftsBase = (safeIdx * 12500000) + (isFlight ? 0 : Math.round(((u - 6) / 10) * 12500000));
      const kmTraveled = Math.round(safeIdx * 2850 + p * 2850);

      setCurrentCityIdx(safeIdx);
      if (activeAdventDay.route[safeIdx]) {
        setCurrentCity(activeAdventDay.route[safeIdx]);
      }
      if (activeAdventDay.route[nextIdx]) {
        setNextCity(activeAdventDay.route[nextIdx]);
      }
      setEta(etaSec);
      setCurrentCoords({ lat: sLat.toFixed(1), lon: sLon.toFixed(1) });
      setIsFlightPhase(isFlight);
      setCurrentMach(computedMach);
      setGiftsDelivered(giftsBase + 4200000);
      setDistanceKm(kmTraveled + 1400);

      // Render the 1:1 hardware identical radar canvas
      renderSharedRadar(
        ctx,
        now / 1000,
        waypoints,
        safeIdx,
        sLon,
        sLat,
        nextName,
        etaSec,
        isFlight
      );

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [waypoints, secPerCity, speedMultiplier, isPaused, activeAdventDay]);

  // Calculate local time for current city
  const localTargetTime = useMemo(() => {
    const now = new Date();
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    let localHours = (utcHours + Math.floor(currentCity.tzOffset)) % 24;
    if (localHours < 0) localHours += 24;
    return `${String(localHours).padStart(2, "0")}:${String(utcMinutes).padStart(2, "0")}`;
  }, [currentCity]);

  return (
    <div className="min-h-screen bg-[#070a13] text-neutral-100 flex flex-col selection:bg-emerald-600 selection:text-white font-sans antialiased overflow-x-hidden">
      {/* Dynamic Background Polar Aurora / Radar Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-emerald-500/10 via-cyan-500/5 to-transparent blur-3xl opacity-70" />
        <div className="absolute top-1/4 right-10 w-[500px] h-[350px] bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-transparent blur-3xl opacity-50" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(7,10,19,0.85)_100%)]" />
        {/* Fine Tactical Grid Lines */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Top Polar Operations Command Header */}
      <header className="relative z-20 border-b border-emerald-950/60 bg-[#0a0f1d]/85 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 shadow-lg shadow-black/40">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-950 to-neutral-900 border border-emerald-500/30 flex items-center justify-center p-1.5 shadow-md shadow-emerald-900/30">
              <Image src="/santa-icon.svg" alt="Santa" width={28} height={28} className="w-7 h-7" priority />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0a0f1d] animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">
                NORAD SECURE // POLAR HQ
              </span>
              <span className="text-[10px] font-mono text-neutral-400 hidden sm:inline">
                BUILD 2.0-PRO
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-black font-mono tracking-tight text-white flex items-center gap-2 mt-0.5">
              SANTA-OS
              <span className="text-xs font-normal text-emerald-400/90 font-mono tracking-wider">
                STRATEGIC FLIGHT COMMAND
              </span>
            </h1>
          </div>
        </div>

        {/* Header Right Tools & Clock */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900/80 border border-neutral-800 text-neutral-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-emerald-300 font-bold">{utcTime}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900/80 border border-neutral-800 text-neutral-300">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline text-neutral-400">Uplink:</span>
            <span className="text-emerald-400 font-bold">1:1 LIVE</span>
          </div>

          {/* Sound Synthesizer Toggle */}
          <button
            onClick={() => {
              setIsMuted((prev) => !prev);
              sfx.playClick(!isMuted);
            }}
            className={`p-2 rounded-xl transition border cursor-pointer ${
              isMuted
                ? "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-300"
                : "bg-emerald-950/80 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-500/20"
            }`}
            title={isMuted ? "Audio Synthesizer Muted (Press M)" : "Audio Synthesizer Active (Press M)"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Perspective View Toggle */}
          <button
            onClick={() => setIs3DView((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-xl font-mono text-xs transition border cursor-pointer flex items-center gap-1.5 ${
              is3DView
                ? "bg-amber-950/50 border-amber-500/40 text-amber-300 shadow-sm shadow-amber-500/10"
                : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200"
            }`}
            title="Toggle 3D Workbench Perspective"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">{is3DView ? "3D BENCH" : "FLAT CAD"}</span>
          </button>

          {/* Quick link to /radar (root) */}
          <Link
            href="/"
            className="px-2.5 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition flex items-center gap-1"
            title="Switch to Minimal Radar View"
          >
            <span>Clean View</span>
            <ArrowUpRight className="w-3 h-3 text-neutral-500" />
          </Link>
        </div>
      </header>

      {/* ADVENT CALENDAR 24-DAY MISSION SCRUBBER */}
      <section className="relative z-10 border-b border-neutral-800/80 bg-[#0d1326]/70 backdrop-blur-md px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold text-white tracking-wide">ADVENT JOURNEY TIMELINE</span>
              <span className="text-neutral-500 hidden sm:inline">|</span>
              <span className="text-neutral-400 hidden sm:inline">
                {activeAdventDay.day === 24
                  ? "⭐ CHRISTMAS EVE GRAND FINALE (Global Route)"
                  : `Day ${activeAdventDay.day}: ${activeAdventDay.title}`}
              </span>
            </div>

            <span className="text-[11px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
              {activeAdventDay.route.length} CITIES TODAY
            </span>
          </div>

          {/* Horizontal Scrubber Ribbon with All 24 Days */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar scroll-smooth">
            {Array.from({ length: ADVENT_DAYS_COUNT }, (_, i) => i + 1).map((day) => {
              const isSelected = selectedDay === day;
              const isDec24 = day === 24;

              return (
                <button
                  key={day}
                  onClick={() => handleSelectDay(day)}
                  className={`shrink-0 px-2.5 py-1.5 rounded-lg font-mono text-xs transition-all flex flex-col items-center justify-center min-w-[50px] border cursor-pointer select-none ${
                    isSelected
                      ? isDec24
                        ? "bg-gradient-to-b from-amber-500 to-orange-600 text-neutral-950 font-black border-amber-300 shadow-lg shadow-orange-500/30 scale-105"
                        : "bg-emerald-600 text-white font-bold border-emerald-400 shadow-md shadow-emerald-600/30 scale-105"
                      : isDec24
                      ? "bg-amber-950/30 border-amber-600/40 text-amber-400 hover:bg-amber-900/40"
                      : "bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800"
                  }`}
                >
                  <span className="text-[9px] uppercase tracking-tighter opacity-80">
                    DEC
                  </span>
                  <span className="text-sm font-bold leading-none">
                    {String(day).padStart(2, "0")}
                  </span>
                  {isDec24 && (
                    <span className="text-[8px] font-black tracking-widest text-amber-200 mt-0.5">
                      ★ EVE
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Mission Control Layout */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: 1:1 Hardware Emulator Workbench (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center gap-6">
          {/* Hardware Header Pill */}
          <div className="w-full flex items-center justify-between text-xs font-mono text-neutral-400 px-3">
            <div className="flex items-center gap-2 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold">M5StickC-Plus SE HARDWARE EMULATOR</span>
            </div>
            <div className="flex items-center gap-3 text-neutral-400 text-[11px]">
              <span>ST7789v2 240×135 IPS</span>
              <span className="hidden sm:inline">•</span>
              <span className="text-amber-400/90 font-bold hidden sm:inline">ESP32-PICO-D4</span>
            </div>
          </div>

          {/* Workbench Display Stage */}
          <div
            className={`w-full relative flex items-center justify-center p-6 sm:p-10 rounded-3xl border border-neutral-800/80 bg-gradient-to-b from-neutral-900/60 to-neutral-950/90 backdrop-blur-xl shadow-2xl transition-all duration-500 ${
              is3DView ? "perspective-[1000px]" : ""
            }`}
          >
            {/* Dynamic Ambient Backlight matching Translucent Orange Enclosure */}
            <div className="absolute w-72 h-40 bg-gradient-to-r from-amber-500/25 via-orange-500/20 to-amber-600/25 rounded-full blur-3xl pointer-events-none -translate-y-2 animate-pulse" />

            {/* M5Stick Device with optional 3D Tilt */}
            <div
              className={`transition-all duration-500 ${
                is3DView
                  ? "rotate-x-[12deg] rotate-y-[-6deg] rotate-[-2deg] hover:rotate-0 hover:scale-[1.02]"
                  : "rotate-0 scale-100"
              }`}
            >
              <M5StickDevice
                canvasRef={canvasRef}
                scanlines={scanlines}
                isTilted={false}
                onButtonAPress={handleBtnA}
                onButtonBPress={handleBtnB}
                isButtonAPressed={isBtnAPressed}
                isButtonBPressed={isBtnBPressed}
              />
            </div>
          </div>

          {/* Quick Keyboard & Physical Tactile Shortcuts */}
          <div className="w-full flex flex-wrap items-center justify-center gap-2.5 text-xs font-mono text-neutral-400">
            <div className="flex items-center gap-1.5 bg-neutral-900/90 px-3 py-1.5 rounded-xl border border-neutral-800 shadow-sm">
              <kbd className="px-1.5 py-0.5 bg-neutral-800 text-amber-400 rounded text-[10px] font-bold border border-neutral-700">
                Space
              </kbd>
              <span>/</span>
              <kbd className="px-1.5 py-0.5 bg-neutral-800 text-amber-400 rounded text-[10px] font-bold border border-neutral-700">
                A
              </kbd>
              <span className="text-neutral-300">Next City</span>
            </div>

            <div className="flex items-center gap-1.5 bg-neutral-900/90 px-3 py-1.5 rounded-xl border border-neutral-800 shadow-sm">
              <kbd className="px-1.5 py-0.5 bg-neutral-800 text-amber-400 rounded text-[10px] font-bold border border-neutral-700">
                B
              </kbd>
              <span className="text-neutral-300">Cycle Speed</span>
            </div>

            <div className="flex items-center gap-1.5 bg-neutral-900/90 px-3 py-1.5 rounded-xl border border-neutral-800 shadow-sm">
              <kbd className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[10px] font-bold border border-amber-500/30">
                T
              </kbd>
              <span className="text-amber-300 font-bold">10x Speed Mode</span>
            </div>

            <div className="flex items-center gap-1.5 bg-neutral-900/90 px-3 py-1.5 rounded-xl border border-neutral-800 shadow-sm">
              <kbd className="px-1.5 py-0.5 bg-neutral-800 text-amber-400 rounded text-[10px] font-bold border border-neutral-700">
                M
              </kbd>
              <span className="text-neutral-300">Audio Mute</span>
            </div>
          </div>

          {/* 10X SPEED QUICK-TESTING ENGINE & CONTROL BAR */}
          <div className="w-full bg-[#0d1326]/90 border border-neutral-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono font-bold text-white tracking-wider uppercase">
                  Time Warp Acceleration Engine
                </span>
              </div>

              {speedMultiplier >= 10 && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-black animate-pulse flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  HYPER-WARP ACTIVE
                </span>
              )}
            </div>

            {/* Speed Buttons Matrix */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {SPEED_PRESETS.map((preset) => {
                const isActive = speedMultiplier === preset.value;
                const isTenX = preset.value === 10;

                return (
                  <button
                    key={preset.value}
                    onClick={() => handleSetSpeed(preset.value)}
                    className={`py-2 px-1.5 rounded-xl font-mono text-xs transition-all flex flex-col items-center justify-center border cursor-pointer ${
                      isActive
                        ? isTenX
                          ? "bg-gradient-to-b from-amber-400 to-amber-600 text-neutral-950 font-black border-amber-300 shadow-lg shadow-amber-500/30 scale-105"
                          : "bg-emerald-600 text-white font-black border-emerald-400 shadow-md shadow-emerald-500/30 scale-105"
                        : isTenX
                        ? "bg-amber-950/40 border-amber-500/50 text-amber-300 hover:bg-amber-900/50"
                        : "bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:text-white"
                    }`}
                  >
                    <span className="text-sm font-bold">{preset.label}</span>
                    <span className="text-[9px] opacity-75 mt-0.5 truncate max-w-full">
                      {isTenX ? "★ TEST" : preset.desc.split(" ")[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Simulation Play / Pause / Jump Controls */}
            <div className="flex items-center gap-2 pt-1 font-mono text-xs">
              <button
                onClick={() => {
                  setIsPaused((prev) => !prev);
                  sfx.playClick(isMuted);
                }}
                className={`flex-1 py-2 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition cursor-pointer ${
                  isPaused
                    ? "bg-amber-600 hover:bg-amber-500 text-white border-amber-400 shadow-md shadow-amber-600/30"
                    : "bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border-neutral-700"
                }`}
              >
                {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
                <span>{isPaused ? "Resume Sim" : "Pause Sim"}</span>
              </button>

              <button
                onClick={handleBtnA}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400 font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-700/30 cursor-pointer"
              >
                <FastForward className="w-3.5 h-3.5 fill-current" />
                <span>Next City</span>
              </button>

              <button
                onClick={() => {
                  simTimeRef.current = 0;
                  sfx.playClick(isMuted);
                }}
                className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800 transition cursor-pointer"
                title="Rewind to First City"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Mission Control Telemetry HUD (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Main Sleigh Telemetry Card */}
          <div className="bg-[#0d1326]/90 border border-neutral-800/90 rounded-3xl p-6 flex flex-col gap-5 shadow-2xl backdrop-blur-xl">
            {/* Header with Flight Phase Badge */}
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4">
              <div>
                <h2 className="text-base font-bold font-mono text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-400" />
                  Sleigh Flight Telemetry
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5 font-mono">
                  Day {activeAdventDay.day} // {activeAdventDay.title}
                </p>
              </div>

              {/* Status Annunciator */}
              <div
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border flex items-center gap-1.5 ${
                  isFlightPhase
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 animate-pulse"
                    : "bg-amber-500/10 border-amber-500/40 text-amber-400"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isFlightPhase ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                />
                <span>{isFlightPhase ? "CRUISING (IN FLIGHT)" : "CHIMNEY DROP (IN CITY)"}</span>
              </div>
            </div>

            {/* Target City Intelligence Dossier */}
            <div className="bg-neutral-950/80 border border-neutral-800/90 rounded-2xl p-4 flex flex-col gap-3 font-mono">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500 font-bold uppercase tracking-wider">
                  CURRENT DESTINATION
                </span>
                <span className="text-emerald-400 text-[11px] font-bold">
                  {currentCity.region}
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">
                    {currentCity.name}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    {currentCity.country} • Local Time: {localTargetTime}
                  </p>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm font-bold text-amber-400 justify-end">
                    {currentCity.tempC <= 0 ? (
                      <CloudSnow className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <Sun className="w-4 h-4 text-amber-400" />
                    )}
                    <span>{currentCity.tempC}°C</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 block">
                    {currentCity.weather}
                  </span>
                </div>
              </div>

              {/* ETA Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-900 text-xs">
                <span className="text-neutral-400">Time to Next Waypoint:</span>
                <span className="text-amber-400 font-bold font-mono text-sm">
                  0:{String(eta).padStart(2, "0")}
                </span>
              </div>
            </div>

            {/* Live Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3.5 bg-neutral-950/70 border border-neutral-800/80 rounded-2xl flex flex-col gap-1">
                <span className="text-neutral-500 text-[10px] uppercase font-bold tracking-wider">
                  MACH VELOCITY
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-emerald-400">
                    {currentMach.toFixed(1)}
                  </span>
                  <span className="text-neutral-400 text-xs">MACH</span>
                </div>
                <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-300"
                    style={{ width: `${Math.min(100, (currentMach / 5) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-3.5 bg-neutral-950/70 border border-neutral-800/80 rounded-2xl flex flex-col gap-1">
                <span className="text-neutral-500 text-[10px] uppercase font-bold tracking-wider">
                  DISTANCE FLOWN
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-cyan-400">
                    {distanceKm.toLocaleString()}
                  </span>
                  <span className="text-neutral-400 text-xs">KM</span>
                </div>
                <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-cyan-500 transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        ((currentCityIdx + 1) / waypoints.length) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="p-3.5 bg-neutral-950/70 border border-neutral-800/80 rounded-2xl flex flex-col gap-1">
                <span className="text-neutral-500 text-[10px] uppercase font-bold tracking-wider">
                  GLOBAL GIFTS DROPPED
                </span>
                <span className="text-lg font-black text-amber-400 truncate">
                  {giftsDelivered.toLocaleString()}
                </span>
                <span className="text-[10px] text-neutral-500">Target: 2.1B worldwide</span>
              </div>

              <div className="p-3.5 bg-neutral-950/70 border border-neutral-800/80 rounded-2xl flex flex-col gap-1">
                <span className="text-neutral-500 text-[10px] uppercase font-bold tracking-wider">
                  GPS POSITION LOCK
                </span>
                <div className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                  <span>{currentCoords.lat}° N</span>
                  <span className="text-neutral-600">/</span>
                  <span>{currentCoords.lon}° E</span>
                </div>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" /> 12 SV Satellites
                </span>
              </div>
            </div>

            {/* Reindeer Life Support & Sleigh Vitals Matrix */}
            <div className="space-y-2 font-mono text-xs">
              <span className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider block">
                Sleigh Systems & Vitals
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-neutral-950/60 border border-neutral-800/60 rounded-xl flex items-center justify-between">
                  <span className="text-neutral-400 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-red-400" />
                    Rudolph Heartbeat:
                  </span>
                  <span className="text-white font-bold">78 BPM</span>
                </div>

                <div className="p-2.5 bg-neutral-950/60 border border-neutral-800/60 rounded-xl flex items-center justify-between">
                  <span className="text-neutral-400 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-cyan-400" />
                    Magic Ion Shield:
                  </span>
                  <span className="text-cyan-400 font-bold">99.8%</span>
                </div>

                <div className="p-2.5 bg-neutral-950/60 border border-neutral-800/60 rounded-xl flex items-center justify-between">
                  <span className="text-neutral-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Carrot Fuel Reserve:
                  </span>
                  <span className="text-amber-400 font-bold">88.4%</span>
                </div>

                <div className="p-2.5 bg-neutral-950/60 border border-neutral-800/60 rounded-xl flex items-center justify-between">
                  <span className="text-neutral-400 flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5 text-emerald-400" />
                    Hull Outer Temp:
                  </span>
                  <span className="text-emerald-400 font-bold">-34°C</span>
                </div>
              </div>
            </div>

            {/* Upcoming Waypoints Timeline Ribbon */}
            <div className="space-y-2 font-mono text-xs border-t border-neutral-800/80 pt-4">
              <span className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider block">
                Next Flight Legs (Day {activeAdventDay.day})
              </span>
              <div className="flex flex-col gap-1.5">
                {activeAdventDay.route.slice(currentCityIdx, currentCityIdx + 3).map((wp, idx) => {
                  const isCurrent = idx === 0;

                  return (
                    <div
                      key={wp.name}
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition ${
                        isCurrent
                          ? "bg-emerald-950/30 border-emerald-500/40 text-white"
                          : "bg-neutral-950/40 border-neutral-800/60 text-neutral-400"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isCurrent ? "bg-emerald-400 animate-pulse" : "bg-neutral-600"
                          }`}
                        />
                        <span className="font-bold text-xs">{wp.name}</span>
                        <span className="text-[10px] text-neutral-500">({wp.country})</span>
                      </div>
                      <span className="text-[11px] font-mono text-neutral-400">
                        {isCurrent ? "ACTIVE" : `LEG +${idx}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Single Source of Truth / Hardware API Box */}
          <div className="p-5 bg-[#0a0f1d]/90 border border-neutral-800 rounded-3xl flex flex-col gap-3 font-mono text-xs shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-white font-bold flex items-center gap-2">
                <Wifi className="w-4 h-4 text-emerald-400" />
                Physical M5StickC-Plus Wi-Fi Sync
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                PROGMEM READY
              </span>
            </div>

            <p className="text-neutral-400 text-[11px] leading-relaxed">
              The M5StickC-Plus SE device queries <code className="text-emerald-300">/api/journey</code> via HTTP GET over Wi-Fi. If Wi-Fi is offline, it falls back seamlessly to the hardcoded Christmas Eve journey stored in ESP32 flash memory.
            </p>

            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-300">
              <code className="text-emerald-300 truncate">curl -s https://santa-tracker-five.vercel.app/api/journey</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText("https://santa-tracker-five.vercel.app/api/journey");
                  sfx.playClick(isMuted);
                }}
                className="text-neutral-400 hover:text-white px-2 py-1 rounded bg-neutral-900 border border-neutral-700 text-[10px] shrink-0 ml-2 cursor-pointer"
                title="Copy API URL"
              >
                Copy URL
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
