"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Compass, Radio, Wifi, Volume2, VolumeX, FastForward, Play, RefreshCw, Cpu, HardDrive } from "lucide-react";
import { M5StickDevice } from "@/components/M5StickDevice";
import { renderSharedRadar, RadarWaypoint } from "@/lib/canvas/shared-radar";
import { buzzer } from "@/lib/audio/buzzer";

interface JourneyApiResponse {
  version: number;
  updatedAt: string;
  secPerCity: number;
  speedMultiplier: number;
  route: RadarWaypoint[];
}

const FALLBACK_ROUTE: RadarWaypoint[] = [
  { name: "AUCKLAND",    lon: 174.8,  lat: -36.8 },
  { name: "SYDNEY",      lon: 151.2,  lat: -33.9 },
  { name: "TOKYO",       lon: 139.7,  lat: 35.7 },
  { name: "BEIJING",     lon: 116.4,  lat: 39.9 },
  { name: "DELHI",        lon: 77.2,   lat: 28.6 },
  { name: "DUBAI",        lon: 55.3,   lat: 25.2 },
  { name: "NAIROBI",      lon: 36.8,   lat: -1.3 },
  { name: "CAIRO",        lon: 31.2,   lat: 30.0 },
  { name: "KRAKOW",       lon: 19.9,   lat: 50.1 },
  { name: "LONDON",       lon: -0.1,   lat: 51.5 },
  { name: "RIO",         lon: -43.2,  lat: -22.9 },
  { name: "NEW YORK",    lon: -74.0,  lat: 40.7 },
  { name: "MEXICO CITY", lon: -99.1,  lat: 19.4 },
  { name: "LOS ANGELES", lon: -118.2, lat: 34.0 },
  { name: "HONOLULU",    lon: -157.8, lat: 21.3 }
];

export default function RadarPage() {
  const [route, setRoute] = useState<RadarWaypoint[]>(FALLBACK_ROUTE);
  const [secPerCity, setSecPerCity] = useState<number>(16);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [isLiveApi, setIsLiveApi] = useState<boolean>(false);
  const [apiTimestamp, setApiTimestamp] = useState<string>("");
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [scanlines, setScanlines] = useState<boolean>(true);

  // Active telemetry states
  const [currentCityName, setCurrentCityName] = useState<string>("AUCKLAND");
  const [nextCityName, setNextCityName] = useState<string>("SYDNEY");
  const [eta, setEta] = useState<number>(16);
  const [coords, setCoords] = useState<{ lat: string; lon: string }>({ lat: "0.0", lon: "0.0" });

  // Button visual states
  const [isBtnAPressed, setIsBtnAPressed] = useState<boolean>(false);
  const [isBtnBPressed, setIsBtnBPressed] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const simTimeRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // 1. Fetch live journey from API endpoint
  const fetchJourney = useCallback(async () => {
    try {
      const res = await fetch("/api/journey");
      if (res.ok) {
        const data: JourneyApiResponse = await res.json();
        if (data.route && data.route.length > 0) {
          setRoute(data.route);
          setSecPerCity(data.secPerCity || 16);
          setIsLiveApi(true);
          setApiTimestamp(data.updatedAt || new Date().toISOString());
        }
      }
    } catch {
      setIsLiveApi(false);
    }
  }, []);

  useEffect(() => {
    fetchJourney();
  }, [fetchJourney]);

  // 2. Interactive Handlers
  const handleBtnA = useCallback(() => {
    setIsBtnAPressed(true);
    setTimeout(() => setIsBtnAPressed(false), 200);
    if (!isMuted) buzzer.playTone(1600, 40);

    // Jump to next city
    const curIdx = Math.floor(simTimeRef.current / secPerCity);
    simTimeRef.current = (curIdx + 1) * secPerCity;
  }, [secPerCity, isMuted]);

  const handleBtnB = useCallback(() => {
    setIsBtnBPressed(true);
    setTimeout(() => setIsBtnBPressed(false), 200);

    setSpeedMultiplier((prev) => {
      const next = prev === 1 ? 2 : prev === 2 ? 4 : prev === 4 ? 8 : 1;
      if (!isMuted) buzzer.playTone(1200 + next * 100, 30);
      return next;
    });
  }, [isMuted]);

  // Keyboard controls
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
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleBtnA, handleBtnB]);

  // 3. Render Loop matching firmware exactly
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

      simTimeRef.current += clampedDt * speedMultiplier;
      const totalSimTime = route.length * secPerCity;
      if (simTimeRef.current >= totalSimTime) {
        simTimeRef.current -= totalSimTime;
      }

      const totalTime = simTimeRef.current;
      const cityIdx = Math.floor(totalTime / secPerCity);
      const u = totalTime - cityIdx * secPerCity;
      const safeIdx = cityIdx % route.length;
      const prevIdx = safeIdx > 0 ? safeIdx - 1 : 0;

      const isFlight = u < 6;
      const p = isFlight ? (u / 6 < 0.5 ? 2 * (u / 6) ** 2 : 1 - (-2 * (u / 6) + 2) ** 2 / 2) : 1;

      const prev = route[prevIdx];
      const curr = route[safeIdx];

      const sLon = prev.lon + (curr.lon - prev.lon) * p;
      const sLat = prev.lat + (curr.lat - prev.lat) * p;

      const nextName = u < 6 ? curr.name : safeIdx < route.length - 1 ? route[safeIdx + 1].name : "NORTH POLE";
      const etaSec = Math.ceil(u < 6 ? 6 - u : secPerCity - u + 6);

      setCurrentCityName(curr.name);
      setNextCityName(nextName);
      setEta(etaSec);
      setCoords({ lat: sLat.toFixed(1), lon: sLon.toFixed(1) });

      // Draw the exact shared radar
      renderSharedRadar(
        ctx,
        now / 1000,
        route,
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
  }, [route, secPerCity, speedMultiplier]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-emerald-800 selection:text-white">
      {/* Navigation Top Header */}
      <header className="border-b border-neutral-800/80 bg-neutral-900/60 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition flex items-center gap-1.5 text-xs font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to Hub</span>
          </Link>
          <div className="h-4 w-px bg-neutral-800" />
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <h1 className="text-sm font-bold font-mono tracking-tight text-white">
              SANTA-OS <span className="text-emerald-400">// GLOBAL RADAR MVP</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-800/80 border border-neutral-700/60 text-neutral-300">
            <Wifi className={`w-3.5 h-3.5 ${isLiveApi ? "text-emerald-400" : "text-amber-400"}`} />
            <span className="hidden md:inline">{isLiveApi ? "Synced: /api/journey" : "Demo Mode"}</span>
          </div>

          <button
            onClick={() => setIsMuted((prev) => !prev)}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition"
            title="Toggle Audio"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-neutral-500" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: M5StickC-Plus SE Hardware Emulator (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center gap-6">
          <div className="w-full flex items-center justify-between text-xs font-mono text-neutral-400 px-2">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              LIVE RADAR SIMULATOR
            </span>
            <span>240 × 135 IPS DISPLAY</span>
          </div>

          {/* Interactive Hardware Shell */}
          <M5StickDevice
            canvasRef={canvasRef}
            scanlines={scanlines}
            isTilted={false}
            onButtonAPress={handleBtnA}
            onButtonBPress={handleBtnB}
            isButtonAPressed={isBtnAPressed}
            isButtonBPressed={isBtnBPressed}
          />

          {/* Keyboard Helper Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-mono text-neutral-400">
            <div className="flex items-center gap-1.5 bg-neutral-900 px-2.5 py-1 rounded border border-neutral-800">
              <kbd className="px-1.5 py-0.5 bg-neutral-800 text-amber-400 rounded text-[10px]">Space</kbd>
              <span>/</span>
              <kbd className="px-1.5 py-0.5 bg-neutral-800 text-amber-400 rounded text-[10px]">A</kbd>
              <span className="text-neutral-300">Jump City</span>
            </div>
            <div className="flex items-center gap-1.5 bg-neutral-900 px-2.5 py-1 rounded border border-neutral-800">
              <kbd className="px-1.5 py-0.5 bg-neutral-800 text-amber-400 rounded text-[10px]">B</kbd>
              <span className="text-neutral-300">Speed (1x/2x/4x/8x)</span>
            </div>
            <div className="flex items-center gap-1.5 bg-neutral-900 px-2.5 py-1 rounded border border-neutral-800">
              <kbd className="px-1.5 py-0.5 bg-neutral-800 text-amber-400 rounded text-[10px]">M</kbd>
              <span className="text-neutral-300">Mute</span>
            </div>
          </div>
        </div>

        {/* Right Column: Mission Control & Telemetry Panel (5 cols) */}
        <div className="lg:col-span-5 bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 flex flex-col gap-5 shadow-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div>
              <h2 className="text-base font-bold font-mono text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-400" />
                Live Sleigh Telemetry
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">Real-time GPS lock & tracking metrics</p>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
              {speedMultiplier}x SPEED
            </span>
          </div>

          {/* Telemetry Cards */}
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-xl">
              <span className="text-neutral-500 text-[10px] block">CURRENT TARGET</span>
              <span className="text-white font-bold text-sm block mt-0.5">{nextCityName}</span>
            </div>
            <div className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-xl">
              <span className="text-neutral-500 text-[10px] block">ETA COUNTDOWN</span>
              <span className="text-amber-400 font-bold text-sm block mt-0.5">0:{String(eta).padStart(2, "0")}</span>
            </div>
            <div className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-xl">
              <span className="text-neutral-500 text-[10px] block">LATITUDE</span>
              <span className="text-emerald-400 font-bold text-sm block mt-0.5">{coords.lat}° N</span>
            </div>
            <div className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-xl">
              <span className="text-neutral-500 text-[10px] block">LONGITUDE</span>
              <span className="text-emerald-400 font-bold text-sm block mt-0.5">{coords.lon}° E</span>
            </div>
          </div>

          {/* Interactive Fast Controls */}
          <div className="space-y-2.5">
            <span className="text-xs font-mono text-neutral-400 font-bold uppercase tracking-wider block">
              Device Controls
            </span>
            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <button
                onClick={handleBtnA}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>Next City</span>
              </button>
              <button
                onClick={handleBtnB}
                className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold transition flex items-center justify-center gap-1.5 border border-neutral-700 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-amber-400" />
                <span>Cycle Speed</span>
              </button>
            </div>
          </div>

          {/* JSON Endpoint Info Box */}
          <div className="p-4 bg-neutral-950/90 border border-neutral-800/80 rounded-2xl flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-400 font-bold flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                Single Source of Truth
              </span>
              <button
                onClick={fetchJourney}
                className="text-neutral-500 hover:text-neutral-300 flex items-center gap-1 text-[11px] cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                Reload
              </button>
            </div>
            <div className="bg-neutral-900 px-3 py-2 rounded-lg font-mono text-[11px] text-emerald-300 border border-neutral-800 flex items-center justify-between">
              <code>GET /api/journey</code>
              <span className="text-neutral-500">{route.length} waypoints</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed font-mono">
              Both this web simulator and the physical M5StickC-Plus SE fetch this exact JSON endpoint. If Wi-Fi is unreachable, both fall back to the embedded demo schedule.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
