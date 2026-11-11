"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Compass, Volume2, VolumeX, RefreshCw, Map, Calendar, Gauge, Layers, Sparkles, Camera, Usb, Wifi, WifiOff, Zap, Clock } from "lucide-react";
import { M5StickDevice } from "@/components/M5StickDevice";
import { SnowEffect } from "@/components/SnowEffect";
import { computeSantaMetrics, SantaCockpitMetrics } from "@/lib/telemetry/santa-metrics";
import { buzzer } from "@/lib/audio/buzzer";
import { getDaySchedule, DEFAULT_ADVENT_DAY } from "@/lib/advent-schedule";
import { M5CanvasSim } from "@/lib/simulator/M5CanvasSim";
import {
  setup as setupSimulator,
  update as updateSimulator,
  render as renderSimulator,
  getTelemetry,
  setDay,
  setCityIndex,
  setActiveScreen as setSimActiveScreen,
  simulateWifiConnect,
  simulateWifiDisconnect,
  formatEta,
  FLIGHT_DURATION_DEMO,
  FLIGHT_DURATION_REAL,
  SEC_PER_CITY_DEMO,
  SEC_PER_CITY_REAL,
  SimulatorAppState,
  ButtonEventState,
} from "@/lib/simulator/iotAppLogic";

export default function RadarPage() {
  const [selectedDay, setSelectedDay] = useState<number>(DEFAULT_ADVENT_DAY);
  const [isLiveApi, setIsLiveApi] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [scanlines, setScanlines] = useState<boolean>(true);

  // Screen Selection (Screen 1: MikoRadar, Screen 2: Kokpit Misji, Screen 3: Santa Cam)
  const [activeScreen, setActiveScreen] = useState<"radar" | "cockpit" | "cam">("radar");
  const [liveMetrics, setLiveMetrics] = useState<SantaCockpitMetrics | null>(null);

  // Active telemetry states
  const [currentCityName, setCurrentCityName] = useState<string>("GISBORNE");
  const [nextCityName, setNextCityName] = useState<string>("BETHLEHEM");
  const [activeStopIndex, setActiveStopIndex] = useState<number>(0);
  const [eta, setEta] = useState<number>(12);
  const [coords, setCoords] = useState<{ lat: string; lon: string }>({ lat: "-38.7", lon: "178.0" });
  const [isFlightPhase, setIsFlightPhase] = useState<boolean>(false);
  const [wifiStatus, setWifiStatus] = useState<string>("offline");

  // Button visual states
  const [isBtnAPressed, setIsBtnAPressed] = useState<boolean>(false);
  const [isBtnBPressed, setIsBtnBPressed] = useState<boolean>(false);
  const [isBtnPWRPressed, setIsBtnPWRPressed] = useState<boolean>(false);
  const [journeyMode, setJourneyMode] = useState<"demo" | "real">("demo");
  const [realDatePreset, setRealDatePreset] = useState<"live" | "dec1" | "dec15" | "dec24">("live");

  // 1:1 Hardware Simulator Core
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasSimRef = useRef<M5CanvasSim | null>(null);
  const simStateRef = useRef<SimulatorAppState>(setupSimulator(0));
  const pendingButtonsRef = useRef<ButtonEventState>({
    wasPressedA: false,
    wasHoldA: false,
    wasPressedB: false,
    wasHoldB: false,
    wasPressedPWR: false,
    wasHoldPWR: false,
  });
  const lastReactUpdateRef = useRef<number>(0);

  // Current day stops for sidebar
  const currentStops = getDaySchedule(selectedDay).stops;

  // Initialize Canvas and M5CanvasSim
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = 240;
    canvas.height = 135;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    canvasSimRef.current = new M5CanvasSim(ctx, canvas);
    canvasSimRef.current.setRotation(1); // Exact 240x135 Landscape LCD
  }, []);

  // 1. Button Handlers (1:1 Hardware Parity with M5StickC-Plus firmware)
  // Button A Short Press (Front M5): Cycle screen (Radar <-> Kokpit)
  const handleButtonAShortPress = useCallback(() => {
    setIsBtnAPressed(true);
    setTimeout(() => setIsBtnAPressed(false), 200);
    pendingButtonsRef.current.wasPressedA = true;
    if (!isMuted) buzzer.playTone(1600, 35);
  }, [isMuted]);

  // Button A Long Press (Front M5, >0.6s): Advance Advent Day (1 -> 24 -> 1 in Demo Mode)
  const handleButtonALongPress = useCallback(() => {
    setIsBtnAPressed(true);
    setTimeout(() => setIsBtnAPressed(false), 300);
    pendingButtonsRef.current.wasHoldA = true;
    if (simStateRef.current.journeyMode === "demo") {
      if (!isMuted) buzzer.playTone(1900, 70);
    } else {
      if (!isMuted) buzzer.playTone(400, 60);
    }
  }, [isMuted]);

  // Button B Short Press (Top Side): Advance to next city on active day (0 -> 11 -> 0 in Demo Mode)
  const handleButtonBShortPress = useCallback(() => {
    setIsBtnBPressed(true);
    setTimeout(() => setIsBtnBPressed(false), 200);
    pendingButtonsRef.current.wasPressedB = true;
    if (simStateRef.current.journeyMode === "demo") {
      if (!isMuted) buzzer.playTone(1400, 35);
    } else {
      if (!isMuted) buzzer.playTone(400, 60);
    }
  }, [isMuted]);

  // Mode Toggle: Demo Mode (30s) vs Real Advent Mode (2h)
  const handleToggleMode = useCallback(
    (mode: "demo" | "real") => {
      const sim = simStateRef.current;
      if (sim.journeyMode !== mode) {
        if (mode === "real") {
          sim.simTime *= SEC_PER_CITY_REAL / SEC_PER_CITY_DEMO;
        } else {
          sim.simTime /= SEC_PER_CITY_REAL / SEC_PER_CITY_DEMO;
        }
        sim.journeyMode = mode;
        sim.toastType = "connected";
        sim.toastTimer = 2500;
        sim.lastAction = `TRYB: ${mode === "demo" ? "DEMO (30s)" : "CZAS RZECZYWISTY"}`;
        setJourneyMode(mode);
        if (!isMuted) buzzer.playTone(mode === "real" ? 2100 : 1700, 60);
      }
    },
    [isMuted]
  );

  // Quick Date Preset for Real-Time Mode Simulation
  const handleSelectDatePreset = useCallback((preset: "live" | "dec1" | "dec15" | "dec24") => {
    setRealDatePreset(preset);
    const sim = simStateRef.current;
    if (preset === "live") {
      sim.simulatedRealDate = null;
      sim.lastAction = "CZAS RZECZYWISTY: ZEGAR LIVE";
    } else if (preset === "dec1") {
      sim.simulatedRealDate = new Date(2026, 11, 1, 14, 30, 0);
      sim.lastAction = "CZAS RZECZYWISTY: 01 GRUDNIA 14:30";
    } else if (preset === "dec15") {
      sim.simulatedRealDate = new Date(2026, 11, 15, 18, 0, 0);
      sim.lastAction = "CZAS RZECZYWISTY: 15 GRUDNIA 18:00";
    } else if (preset === "dec24") {
      sim.simulatedRealDate = new Date(2026, 11, 24, 22, 15, 0);
      sim.lastAction = "CZAS RZECZYWISTY: 24 GRUDNIA (KRAKOW)";
    }
    sim.toastType = "connected";
    sim.toastTimer = 2000;
  }, []);

  // Button B Long Press (Top Side, >0.6s): Toggle Operating Mode (Demo <-> Real-Time)
  const handleButtonBLongPress = useCallback(() => {
    setIsBtnBPressed(true);
    setTimeout(() => setIsBtnBPressed(false), 300);
    pendingButtonsRef.current.wasHoldB = true;
    const sim = simStateRef.current;
    const nextMode = sim.journeyMode === "demo" ? "real" : "demo";
    handleToggleMode(nextMode);
  }, [handleToggleMode]);

  // Button PWR Short Press (Bottom Side): Toggle Sound (Mute / Unmute)
  const handleButtonPWRShortPress = useCallback(() => {
    setIsBtnPWRPressed(true);
    setTimeout(() => setIsBtnPWRPressed(false), 200);
    pendingButtonsRef.current.wasPressedPWR = true;
    setIsMuted((prev) => {
      const next = !prev;
      if (!next) buzzer.playTone(2200, 80);
      return next;
    });
  }, []);

  // Button PWR Long Press (Bottom Side, >0.6s): Toggle Operating Mode (Demo <-> Real-Time)
  const handleButtonPWRLongPress = useCallback(() => {
    setIsBtnPWRPressed(true);
    setTimeout(() => setIsBtnPWRPressed(false), 300);
    pendingButtonsRef.current.wasHoldPWR = true;
    const sim = simStateRef.current;
    const nextMode = sim.journeyMode === "demo" ? "real" : "demo";
    handleToggleMode(nextMode);
  }, [handleToggleMode]);

  // Wi-Fi Simulator Toggle: Exercise hardware connection & Burst & Sleep states
  const handleToggleWifi = useCallback(() => {
    const sim = simStateRef.current;
    if (sim.wifiState === "offline") {
      simulateWifiConnect(sim);
      if (!isMuted) buzzer.playTone(2000, 70);
    } else {
      simulateWifiDisconnect(sim);
      if (!isMuted) buzzer.playTone(600, 90);
    }
  }, [isMuted]);

  // Day Selector Click
  const handleSelectDay = useCallback((dayNum: number) => {
    if (simStateRef.current.journeyMode === "demo") {
      const validDay = Math.max(1, Math.min(24, dayNum));
      setDay(simStateRef.current, validDay);
      setSelectedDay(validDay);
      if (!isMuted) buzzer.playTone(1700, 40);
    } else {
      if (!isMuted) buzzer.playTone(400, 60);
    }
  }, [isMuted]);

  // City Selector Click (Jump to city on current day)
  const handleSelectCity = useCallback((targetIdx: number) => {
    if (simStateRef.current.journeyMode === "demo") {
      setCityIndex(simStateRef.current, targetIdx);
      if (!isMuted) buzzer.playTone(1300 + targetIdx * 50, 40);
    } else {
      if (!isMuted) buzzer.playTone(400, 60);
    }
  }, [isMuted]);

  // Screen Switcher Tabs
  const handleSwitchScreen = useCallback((screen: "radar" | "cockpit" | "cam") => {
    setActiveScreen(screen);
    const simScreen = screen === "radar" ? 0 : screen === "cockpit" ? 1 : 2;
    setSimActiveScreen(simStateRef.current, simScreen);
    if (!isMuted) buzzer.playTone(screen === "radar" ? 1500 : screen === "cockpit" ? 1700 : 1900, 30);
  }, [isMuted]);

  // 2. 1:1 Hardware Simulation Loop (Driven by LovyanGFX M5CanvasSim)
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dtMs = Math.min(now - lastTime, 100);
      lastTime = now;
      const nowSec = now / 1000;

      // Extract pending button events
      const buttons: ButtonEventState = { ...pendingButtonsRef.current };
      pendingButtonsRef.current = {
        wasPressedA: false,
        wasHoldA: false,
        wasPressedB: false,
        wasHoldB: false,
        wasPressedPWR: false,
      };

      // 1. Advance firmware logic state
      updateSimulator(simStateRef.current, buttons, dtMs, now);

      // 2. Render frame via M5CanvasSim (1:1 with screen_radar.cpp)
      if (canvasSimRef.current) {
        renderSimulator(canvasSimRef.current, simStateRef.current, now);
      }

      // 3. Decouple high-frequency 60 FPS canvas rendering from React DOM tree reconciliation
      // Throttle React state updates to ~6 Hz (every 150ms) to eliminate React re-render thrashing
      if (now - lastReactUpdateRef.current >= 150) {
        lastReactUpdateRef.current = now;
        const t = getTelemetry(simStateRef.current);
        setSelectedDay((prev) => (prev !== t.activeDay ? t.activeDay : prev));
        setActiveScreen((prev) => {
          const scr = simStateRef.current.activeScreen;
          const next: "radar" | "cockpit" | "cam" =
            scr === 0 ? "radar" : scr === 1 ? "cockpit" : "cam";
          return prev !== next ? next : prev;
        });
        setActiveStopIndex((prev) => (prev !== t.safeIdx ? t.safeIdx : prev));
        const curCity = simStateRef.current.cities[t.safeIdx]?.name || "";
        setCurrentCityName((prev) => (prev !== curCity ? curCity : prev));
        setNextCityName((prev) => (prev !== t.nextCityName ? t.nextCityName : prev));
        setEta((prev) => (prev !== t.etaSeconds ? t.etaSeconds : prev));
        setIsFlightPhase((prev) => (prev !== t.isFlightPhase ? t.isFlightPhase : prev));

        const newLat = t.santaLat.toFixed(1);
        const newLon = t.santaLon.toFixed(1);
        setCoords((prev) => (prev.lat !== newLat || prev.lon !== newLon ? { lat: newLat, lon: newLon } : prev));
        setWifiStatus((prev) => (prev !== simStateRef.current.wifiState ? simStateRef.current.wifiState : prev));
        setJourneyMode((prev) => (prev !== simStateRef.current.journeyMode ? simStateRef.current.journeyMode : prev));

        // Compute festive cockpit metrics for the right panel
        const flightDur =
          simStateRef.current.journeyMode === "demo"
            ? FLIGHT_DURATION_DEMO
            : FLIGHT_DURATION_REAL;
        const totalDur =
          simStateRef.current.journeyMode === "demo"
            ? SEC_PER_CITY_DEMO
            : SEC_PER_CITY_REAL;
        const metrics = computeSantaMetrics(
          t.activeDay,
          t.safeIdx,
          t.u,
          nowSec,
          t.nextCityName,
          t.isDay24Finale,
          flightDur,
          totalDur,
          t.isOffSeason
        );
        setLiveMetrics(metrics);
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

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
      <header className="border-b border-white/10 bg-[#070e1c]/75 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          {/* Santa Icon Badge */}
          <div className="w-8 h-8 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-center justify-center p-1 shadow-sm shrink-0">
            <Image src="/santa-icon.svg" alt="Santa" width={24} height={24} className="w-6 h-6" priority />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold font-mono tracking-tight text-white">
              SANTA-OS
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-xs font-mono">
          <Link
            href="/scene-debugging"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition font-bold cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Scene Debugger</span>
          </Link>

          <Link
            href="/map-debugger"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 transition font-bold cursor-pointer"
          >
            <Map className="w-3.5 h-3.5 text-sky-400" />
            <span>Map Debugger</span>
          </Link>

          <Link
            href="/install"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 transition font-bold cursor-pointer shadow-sm shadow-emerald-950/40"
          >
            <Usb className="w-3.5 h-3.5 text-emerald-400" />
            <span>Instalator M5Stick</span>
          </Link>

          <button
            onClick={() => setIsMuted((prev) => !prev)}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 transition cursor-pointer"
            title="Toggle Audio"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-500" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* Interactive Advent Day Selector Bar */}
      <section className="border-b border-white/10 bg-[#060a16]/85 backdrop-blur-sm px-4 sm:px-8 py-2.5 overflow-x-auto scrollbar-thin relative z-10">
        <div className="flex items-center gap-1.5 max-w-6xl mx-auto">
          <span className="text-[11px] font-mono font-bold text-amber-300/90 uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            Dzień grudnia:
          </span>
          {Array.from({ length: 24 }, (_, i) => i + 1).map((d) => {
            const isSelected = selectedDay === d;
            const isFinale = d === 24;

            return (
              <button
                key={d}
                onClick={() => handleSelectDay(d)}
                className={`px-2 py-0.5 rounded text-xs font-mono font-bold transition shrink-0 border cursor-pointer flex items-center gap-0.5 ${
                  isSelected
                    ? isFinale
                      ? "bg-rose-600 text-white border-rose-300 shadow-md shadow-rose-950 font-bold ring-1 ring-amber-300/60"
                      : "bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-950 font-bold"
                    : isFinale
                    ? "bg-rose-950/40 hover:bg-rose-900/50 text-rose-200 border-rose-500/40"
                    : "bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border-white/10"
                }`}
              >
                <span className="text-[10px] opacity-75">D</span>
                <span>{String(d).padStart(2, "0")}</span>
                {isFinale && <span className="text-[10px] text-amber-300">★</span>}
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        {/* Left Column: M5StickC-Plus SE Hardware Emulator (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center gap-4 w-full max-w-full overflow-x-auto sm:overflow-visible py-1">
          {/* Dual Operating Mode Switcher Bar */}
          <div className="flex items-center justify-center gap-2 bg-[#081224]/90 border border-white/10 rounded-2xl p-1.5 px-2.5 shadow-lg">
            <button
              onClick={() => handleToggleMode("demo")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                journeyMode === "demo"
                  ? "bg-amber-500/25 text-amber-300 border-amber-500/60 shadow-sm ring-1 ring-amber-400/30"
                  : "bg-slate-900/50 text-slate-400 border-white/5 hover:bg-slate-800/70"
              }`}
              title="Tryb Demo: 15s lot + 15s postój (30s na miasto), ręczny wybór dni i miast"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Tryb Demo (30s)</span>
            </button>

            <button
              onClick={() => handleToggleMode("real")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                journeyMode === "real"
                  ? "bg-emerald-500/25 text-emerald-300 border-emerald-500/60 shadow-sm ring-1 ring-emerald-400/30"
                  : "bg-slate-900/50 text-slate-400 border-white/5 hover:bg-slate-800/70"
              }`}
              title="Czas Rzeczywisty: 1h lot + 1h postój (2h na miasto), zgodny z zegarem RTC/NTP"
            >
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Czas Rzeczywisty (2h)</span>
            </button>
          </div>

          {/* Quick Date Simulation Presets (Only visible in Real-Time Mode) */}
          {journeyMode === "real" && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 bg-[#081224]/90 border border-emerald-500/30 rounded-2xl p-1.5 px-2.5 shadow-lg text-xs font-mono">
              <span className="text-emerald-400 font-bold mr-1 text-[11px]">Kalendarz:</span>
              <button
                onClick={() => handleSelectDatePreset("live")}
                className={`px-2.5 py-1 rounded-xl border cursor-pointer transition flex items-center gap-1 ${
                  realDatePreset === "live"
                    ? "bg-emerald-500/30 text-emerald-200 border-emerald-400 font-bold shadow-sm ring-1 ring-emerald-400/30"
                    : "bg-slate-900/60 text-slate-400 border-white/5 hover:bg-slate-800"
                }`}
                title="Dzisiejsza data z zegara (Poza sezonem -> Santa odpoczywa)"
              >
                <span>🏝️ Dzisiaj (Urlop)</span>
              </button>
              <button
                onClick={() => handleSelectDatePreset("dec1")}
                className={`px-2.5 py-1 rounded-xl border cursor-pointer transition flex items-center gap-1 ${
                  realDatePreset === "dec1"
                    ? "bg-amber-500/30 text-amber-200 border-amber-400 font-bold shadow-sm ring-1 ring-amber-400/30"
                    : "bg-slate-900/60 text-slate-400 border-white/5 hover:bg-slate-800"
                }`}
                title="Symuluj 1 grudnia: Start wielkiej podróży"
              >
                <span>🚀 01 Gru (Start)</span>
              </button>
              <button
                onClick={() => handleSelectDatePreset("dec15")}
                className={`px-2.5 py-1 rounded-xl border cursor-pointer transition flex items-center gap-1 ${
                  realDatePreset === "dec15"
                    ? "bg-sky-500/30 text-sky-200 border-sky-400 font-bold shadow-sm ring-1 ring-sky-400/30"
                    : "bg-slate-900/60 text-slate-400 border-white/5 hover:bg-slate-800"
                }`}
                title="Symuluj 15 grudnia: Półmetek Adwentu"
              >
                <span>🗺️ 15 Gru (Trasa)</span>
              </button>
              <button
                onClick={() => handleSelectDatePreset("dec24")}
                className={`px-2.5 py-1 rounded-xl border cursor-pointer transition flex items-center gap-1 ${
                  realDatePreset === "dec24"
                    ? "bg-rose-500/30 text-rose-200 border-rose-400 font-bold shadow-sm ring-1 ring-rose-400/30"
                    : "bg-slate-900/60 text-slate-400 border-white/5 hover:bg-slate-800"
                }`}
                title="Symuluj 24 grudnia: Wigilia i Finał Kraków"
              >
                <span>🎁 24 Gru (Wigilia)</span>
              </button>
            </div>
          )}

          {/* Tactical Screen Selector Bar */}
          <div className="flex items-center justify-center gap-2 bg-[#081224]/80 border border-white/10 rounded-2xl p-1.5 px-2.5 shadow-lg">
            <button
              onClick={() => handleSwitchScreen("radar")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                activeScreen === "radar"
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm"
                  : "bg-slate-900/50 text-slate-400 border-white/5 hover:bg-slate-800/70"
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span>1: MikoRadar</span>
            </button>

            <button
              onClick={() => handleSwitchScreen("cockpit")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                activeScreen === "cockpit"
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm ring-1 ring-amber-400/30"
                  : "bg-slate-900/50 text-slate-400 border-white/5 hover:bg-slate-800/70"
              }`}
            >
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
              <span>2: Kokpit Misji</span>
            </button>

            <button
              onClick={() => handleSwitchScreen("cam")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                activeScreen === "cam"
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm ring-1 ring-rose-400/30"
                  : "bg-slate-900/50 text-slate-400 border-white/5 hover:bg-slate-800/70"
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-rose-400" />
              <span>3: Santa Cam</span>
            </button>
          </div>

          {/* Interactive Hardware Shell (Scale 1x native 240x135 display) */}
          <div className="pt-2 sm:pt-4 pb-6 sm:pb-8">
            <M5StickDevice
              canvasRef={canvasRef}
              scanlines={scanlines}
              isTilted={false}
              onButtonAShortPress={handleButtonAShortPress}
              onButtonALongPress={handleButtonALongPress}
              onButtonBShortPress={handleButtonBShortPress}
              onButtonBLongPress={handleButtonBLongPress}
              onButtonPWRShortPress={handleButtonPWRShortPress}
              onButtonPWRLongPress={handleButtonPWRLongPress}
              isButtonAPressed={isBtnAPressed}
              isButtonBPressed={isBtnBPressed}
              isButtonPWRPressed={isBtnPWRPressed}
            />
          </div>

          {/* Pure Hardware Simulator Legend */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2 bg-[#0c162b]/80 px-3 py-1.5 rounded-lg border border-white/10 shadow-sm">
              <span className="text-amber-400 font-bold">Przycisk M5 (Front):</span>
              <span className="text-slate-200">Klik = Ekran</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">
                {journeyMode === "demo" ? "Przytrzymaj (>0.6s) = Dzień" : "Dzień = Zegar"}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-[#0c162b]/80 px-3 py-1.5 rounded-lg border border-white/10 shadow-sm">
              <span className="text-amber-400 font-bold">Przycisk B (Góra):</span>
              <span className="text-slate-200">
                {journeyMode === "demo" ? "Klik = Miasto" : "Klik = Zablokowane"}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-[#0c162b]/80 px-3 py-1.5 rounded-lg border border-white/10 shadow-sm">
              <span className="text-rose-400 font-bold">Przycisk PWR (Dół):</span>
              <span className="text-slate-200">Klik = Dźwięk</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">Przytrzymaj (&gt;0.6s) = Tryb (Demo/Real)</span>
            </div>
            <button
              onClick={handleToggleWifi}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition cursor-pointer shadow-sm ${
                wifiStatus === "connected"
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                  : wifiStatus === "sleep"
                  ? "bg-teal-500/20 text-teal-300 border-teal-500/40"
                  : "bg-slate-900/80 text-slate-400 border-white/10 hover:bg-slate-800"
              }`}
              title="Symuluj połączenie Wi-Fi i synchronizację czasu NTP"
            >
              {wifiStatus === "offline" ? (
                <WifiOff className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>
                {wifiStatus === "connected"
                  ? "Wi-Fi: Połączono (Burst)"
                  : wifiStatus === "sleep"
                  ? "Wi-Fi: Uśpione (RTC OK)"
                  : "Symuluj Wi-Fi"}
              </span>
            </button>
          </div>

          {/* Web Installer Hardware CTA */}
          <Link
            href="/install"
            className="w-full max-w-lg p-3 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#0c162b] to-teal-950/40 border border-emerald-500/30 hover:border-emerald-400/60 transition group flex items-center justify-between gap-3 text-xs font-mono shadow-lg cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 group-hover:scale-105 transition-transform">
                <Usb className="w-4 h-4 text-emerald-400" />
              </span>
              <div>
                <span className="font-bold text-white block">Posiadasz fizyczny M5StickC-Plus?</span>
                <span className="text-[11px] text-emerald-300/80">Wgraj system lub skonfiguruj Wi-Fi przez kabel USB</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 group-hover:bg-emerald-500/30 transition text-[11px] shrink-0">
              Instaluj →
            </span>
          </Link>
        </div>

        {/* Right Column: Mission Telemetry & Waypoints List (5 cols) */}
        <div className="lg:col-span-5 w-full space-y-4">
          {/* Header Card */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h2 className="text-base font-bold font-mono text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-400" />
                Telemetria Lotu Mikołaja
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold border bg-amber-500/10 border-amber-400/30 text-amber-300">
              DZIEŃ {selectedDay}/24
            </span>
          </div>

          {/* Telemetry Cards */}
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 bg-[#0c162b]/70 border border-white/5 rounded-xl">
              <span className="text-slate-400 text-[10px] block">
                {selectedDay === 24 && activeStopIndex === currentStops.length - 1
                  ? "FINAŁ WIGILII 🎁"
                  : isFlightPhase
                  ? "AKTUALNY CEL"
                  : "AKTUALNY POSTÓJ"}
              </span>
              <span className="text-white font-bold text-sm block mt-0.5 truncate">
                {selectedDay === 24 && activeStopIndex === currentStops.length - 1
                  ? "KRAKÓW (PL)"
                  : isFlightPhase
                  ? nextCityName
                  : currentCityName}
              </span>
            </div>
            <div className="p-3 bg-[#0c162b]/70 border border-white/5 rounded-xl">
              <span className="text-slate-400 text-[10px] block">ODLICZANIE ETAPU</span>
              <span className="text-amber-400 font-bold text-sm block mt-0.5">
                {selectedDay === 24 && activeStopIndex === currentStops.length - 1 && eta === 0
                  ? "WIGILIA!"
                  : liveMetrics
                  ? `${formatEta(liveMetrics.stepEtaSeconds)} (${liveMetrics.nextStepName})`
                  : formatEta(eta)}
              </span>
            </div>
            <div className="p-3 bg-[#0c162b]/70 border border-white/5 rounded-xl">
              <span className="text-slate-400 text-[10px] block">PRĘDKOŚĆ / FAZA</span>
              <span className="text-amber-300 font-bold text-sm block mt-0.5">
                {liveMetrics ? liveMetrics.machDisplay : isFlightPhase ? "M 4.8 (Lot)" : "M 0.0 (Dach)"}
              </span>
            </div>
            <div className="p-3 bg-[#0c162b]/70 border border-white/5 rounded-xl">
              <span className="text-slate-400 text-[10px] block">PUŁAP LOTU</span>
              <span className="text-sky-300 font-bold text-sm block mt-0.5 truncate">
                {liveMetrics ? liveMetrics.altitudeDisplay : isFlightPhase ? "11.5k M" : "65 M"}
              </span>
            </div>
          </div>

          {/* Festive Cockpit Telemetry Highlights */}
          {liveMetrics && (
            <div className="p-3.5 bg-[#0b172d]/80 border border-amber-500/20 rounded-2xl space-y-2.5 text-xs font-mono">
              <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                <span className="text-amber-300 font-bold flex items-center gap-1.5 text-[11px]">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  Parametry Kokpitu Misji:
                </span>
                <span className="text-[10px] text-amber-300 font-bold">
                  Przystanek {activeStopIndex + 1}/{currentStops.length}
                </span>
              </div>

              {/* Faza Misji Box */}
              <div className="bg-black/40 border border-sky-500/30 rounded-xl p-2.5 text-center space-y-1">
                <div className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">Aktualna Faza Misji:</div>
                <div className="text-amber-300 font-bold text-xs">{liveMetrics.stageTitle}</div>
                {liveMetrics.stageDescription && (
                  <div className="text-[11px] text-slate-300 leading-relaxed font-normal">
                    {liveMetrics.stageDescription}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center justify-between bg-black/30 p-2 rounded-lg px-2.5 border border-white/5">
                  <span className="text-slate-400">Ciastka 🍪:</span>
                  <span className="text-amber-300 font-bold">{liveMetrics.cookiesEatenDisplay}</span>
                </div>
                <div className="flex items-center justify-between bg-black/30 p-2 rounded-lg px-2.5 border border-white/5">
                  <span className="text-slate-400">Mleko 🥛:</span>
                  <span className="text-sky-300 font-bold">{liveMetrics.milkLitersDisplay}</span>
                </div>
                <div className="flex items-center justify-between bg-black/30 p-2 rounded-lg px-2.5 border border-white/5">
                  <span className="text-slate-400">Dostarczono 🎁:</span>
                  <span className="text-emerald-300 font-bold">{liveMetrics.giftsDeliveredDisplay}</span>
                </div>
                <div className="flex items-center justify-between bg-black/30 p-2 rounded-lg px-2.5 border border-white/5">
                  <span className="text-slate-400">Zrzut ⏱️:</span>
                  <span className="text-emerald-400 font-bold">{liveMetrics.giftRateDisplay}</span>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Route Stop Sequence */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 font-bold uppercase tracking-wider">
                Trasa Dnia {selectedDay}
              </span>
              <span className="text-[11px] text-amber-300 font-bold">
                {activeStopIndex + 1}/{currentStops.length}
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
              {currentStops.map((wp, idx) => {
                const isActive = activeStopIndex === idx;
                const isFinal = idx === currentStops.length - 1 && selectedDay === 24;
                const isFirst = idx === 0;

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectCity(idx)}
                    className={`w-full text-left p-2 rounded-xl text-xs font-mono transition flex items-center justify-between border cursor-pointer ${
                      isActive
                        ? isFinal
                          ? "bg-rose-500/25 border-rose-400 text-amber-200 font-bold shadow-md shadow-rose-950/50 ring-1 ring-amber-400/40"
                          : "bg-amber-500/15 border-amber-400/60 text-amber-100 font-bold shadow-md shadow-amber-950/40"
                        : "bg-[#0c162b]/50 hover:bg-[#12203d]/70 border-white/5 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center shrink-0 border font-bold ${
                          isActive
                            ? isFinal
                              ? "bg-amber-400 text-black border-amber-300"
                              : "bg-amber-400 text-black border-amber-300"
                            : "bg-[#060d1b] text-slate-400 border-white/10"
                        }`}
                      >
                        {isFirst ? "⭐" : isFinal ? "🎁" : idx + 1}
                      </span>
                      <span className="truncate">
                        {wp.name}
                        {isFinal && " (FINAŁ)"}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {wp.country || wp.continent}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
