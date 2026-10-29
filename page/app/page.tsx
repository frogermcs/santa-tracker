"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Compass, Wifi, Volume2, VolumeX, RefreshCw, Map, Calendar } from "lucide-react";
import { M5StickDevice } from "@/components/M5StickDevice";
import { SnowEffect } from "@/components/SnowEffect";
import { renderSharedRadar, RadarWaypoint, SEC_PER_CITY } from "@/lib/canvas/shared-radar";
import { buzzer } from "@/lib/audio/buzzer";
import { getDaySchedule, DEFAULT_ADVENT_DAY } from "@/lib/advent-schedule";

interface JourneyApiResponse {
  version: number;
  updatedAt: string;
  secPerCity: number;
  speedMultiplier: number;
  route: RadarWaypoint[];
}

const FALLBACK_ROUTE: RadarWaypoint[] = [
  { name: "GISBORNE",          lon: 178.0,  lat: -38.7, country: "Nowa Zelandia", continent: "Oceania" },
  { name: "BETHLEHEM",         lon: 35.2,   lat: 31.7,  country: "Palestyna",     continent: "Azja" },
  { name: "NICOSIA",           lon: 33.4,   lat: 35.2,  country: "Cypr",          continent: "Azja" },
  { name: "KHARTOUM",          lon: 32.5,   lat: 15.5,  country: "Sudan",         continent: "Afryka" },
  { name: "NOUAKCHOTT",        lon: -16.0,  lat: 18.1,  country: "Mauretania",    continent: "Afryka" },
  { name: "CAYENNE",           lon: -52.3,  lat: 4.9,   country: "Gujana Fr.",    continent: "Ameryki" },
  { name: "WYSPA WIELKANOCNA", lon: -109.3, lat: -27.1, country: "Chile",         continent: "Ameryki" },
  { name: "KIRITIMATI",        lon: -157.4, lat: 1.9,   country: "Kiribati",      continent: "Pacyfik" },
  { name: "HONOLULU",          lon: -157.8, lat: 21.3,  country: "USA",           continent: "Ameryki" },
  { name: "NUUK",              lon: -51.7,  lat: 64.2,  country: "Grenlandia",    continent: "Ameryki" },
  { name: "BIEGUN POLNOCNY",   lon: 0.0,    lat: 90.0,  country: "Arktyka",       continent: "Biegun" },
  { name: "KRAKOW",            lon: 19.9,   lat: 50.1,  country: "Polska",        continent: "Europa" }
];

export default function RadarPage() {
  const [selectedDay, setSelectedDay] = useState<number>(DEFAULT_ADVENT_DAY);
  const [route, setRoute] = useState<RadarWaypoint[]>(FALLBACK_ROUTE);
  const [isLiveApi, setIsLiveApi] = useState<boolean>(false);
  const [apiTimestamp, setApiTimestamp] = useState<string>("");
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [scanlines, setScanlines] = useState<boolean>(true);

  // Timing: 6s journey + 6s stop = 12s per city (hardcoded 1x scale matching 1hr flight + 1hr stop)
  const secPerCity = SEC_PER_CITY; // 12 seconds
  const speedMultiplier = 1;

  // Active telemetry states
  const [currentCityName, setCurrentCityName] = useState<string>("GISBORNE");
  const [nextCityName, setNextCityName] = useState<string>("BETHLEHEM");
  const [activeStopIndex, setActiveStopIndex] = useState<number>(0);
  const [eta, setEta] = useState<number>(12);
  const [coords, setCoords] = useState<{ lat: string; lon: string }>({ lat: "-38.7", lon: "178.0" });
  const [isFlightPhase, setIsFlightPhase] = useState<boolean>(false);

  // Button visual states
  const [isBtnAPressed, setIsBtnAPressed] = useState<boolean>(false);
  const [isBtnBPressed, setIsBtnBPressed] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const simTimeRef = useRef<number>(6); // Start landed at Stop 1
  const lastTimeRef = useRef<number>(0);

  // Helper to load route for any day
  const applyDayRoute = useCallback((dayNum: number) => {
    const schedule = getDaySchedule(dayNum);
    const newRoute: RadarWaypoint[] = schedule.stops.map((s) => ({
      name: s.radarName,
      localName: s.name,
      lon: s.lon,
      lat: s.lat,
      country: s.country,
      continent: s.continent,
      arrivalWindow: s.arrivalWindow,
      transitWindow: s.transitWindow,
      activity: s.activity,
      stopOfDay: s.stopOfDay,
      stopTotal: s.stopTotal,
    }));
    setRoute(newRoute);
    simTimeRef.current = 6; // Start landed at first city
  }, []);

  // 1. Fetch live journey from API endpoint on mount
  const fetchJourney = useCallback(async () => {
    try {
      const res = await fetch(`/api/journey?day=${selectedDay}`);
      if (res.ok) {
        const data: JourneyApiResponse = await res.json();
        if (data.route && data.route.length > 0) {
          setRoute(data.route);
          setIsLiveApi(true);
          setApiTimestamp(data.updatedAt || new Date().toISOString());
        }
      }
    } catch {
      setIsLiveApi(false);
    }
  }, [selectedDay]);

  useEffect(() => {
    fetchJourney();
  }, [fetchJourney]);

  // 2. Interactive Handlers
  // Big Button A (Front M5 / Space / A): JUMPS BETWEEN DAYS (1 -> 24 -> 1)
  const handleBtnA = useCallback(() => {
    setIsBtnAPressed(true);
    setTimeout(() => setIsBtnAPressed(false), 200);
    if (!isMuted) buzzer.playTone(1800, 50);

    setSelectedDay((prevDay) => {
      const nextDay = (prevDay % 24) + 1;
      applyDayRoute(nextDay);
      return nextDay;
    });
  }, [applyDayRoute, isMuted]);

  // Top Button B (Side / B): JUMPS BETWEEN CITIES on the active day
  const handleBtnB = useCallback(() => {
    setIsBtnBPressed(true);
    setTimeout(() => setIsBtnBPressed(false), 200);
    if (!isMuted) buzzer.playTone(1400, 35);

    if (!route || route.length === 0) return;
    const curIdx = Math.floor(simTimeRef.current / secPerCity);
    const nextIdx = ((curIdx + 1) % route.length + route.length) % route.length;
    // +6 seconds lands Santa directly at that city (6s stop begins)
    simTimeRef.current = nextIdx * secPerCity + 6;
  }, [route, secPerCity, isMuted]);

  const handleSelectDay = useCallback((dayNum: number) => {
    const validDay = Math.max(1, Math.min(24, dayNum));
    setSelectedDay(validDay);
    applyDayRoute(validDay);
    if (!isMuted) buzzer.playTone(1700, 40);
  }, [applyDayRoute, isMuted]);

  const handleSelectCity = useCallback((targetIdx: number) => {
    if (!route || route.length === 0) return;
    const safeTarget = Math.max(0, Math.min(route.length - 1, targetIdx));
    simTimeRef.current = safeTarget * secPerCity + 6;
    if (!isMuted) buzzer.playTone(1300 + safeTarget * 50, 40);
  }, [route, secPerCity, isMuted]);

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

    if (!route || route.length === 0 || secPerCity <= 0) return;

    lastTimeRef.current = performance.now();

    const render = (now: number) => {
      if (!route || route.length === 0) return;

      const rawDt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      const clampedDt = Math.max(0, Math.min(rawDt, 0.1));

      simTimeRef.current += clampedDt * speedMultiplier;
      const totalSimTime = route.length * secPerCity;
      if (totalSimTime <= 0) return;

      // Give a celebration hold at the final city (Kraków on Day 24) before looping
      const holdDuration = selectedDay === 24 ? 16 : 0;
      const cycleTotal = totalSimTime + holdDuration;
      if (simTimeRef.current >= cycleTotal || simTimeRef.current < 0) {
        simTimeRef.current = 0;
      }

      // Clamp simulation time during the grand finale hold
      const effectiveSimTime = Math.min(simTimeRef.current, totalSimTime - 0.001);
      const cityIdx = Math.floor(effectiveSimTime / secPerCity);
      const u = Math.max(0, effectiveSimTime - cityIdx * secPerCity);
      const safeIdx = ((cityIdx % route.length) + route.length) % route.length;
      const prevIdx = safeIdx > 0 ? safeIdx - 1 : 0;

      const isLastCity = safeIdx === route.length - 1;
      const isDay24Finale = selectedDay === 24 && isLastCity && (u >= 6 || simTimeRef.current >= totalSimTime);

      const isFlight = !isDay24Finale && u < 6;
      const p = isFlight ? (u / 6 < 0.5 ? 2 * (u / 6) ** 2 : 1 - (-2 * (u / 6) + 2) ** 2 / 2) : 1;

      const curr = route[safeIdx] ?? route[0];
      const prev = route[prevIdx] ?? curr;
      if (!curr || !prev) return;

      const sLon = prev.lon + (curr.lon - prev.lon) * p;
      const sLat = prev.lat + (curr.lat - prev.lat) * p;

      const nextIdx = (safeIdx + 1) % route.length;
      const nextName = isDay24Finale
        ? curr.name
        : u < 6
        ? curr.name
        : (route[nextIdx]?.name || curr.name);

      const etaSec = isDay24Finale ? 0 : Math.ceil(u < 6 ? 6 - u : secPerCity - u);

      setCurrentCityName(curr.name);
      setNextCityName(nextName);
      setActiveStopIndex(safeIdx);
      setIsFlightPhase(isFlight);
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
        isFlight,
        selectedDay === 24,
        selectedDay
      );

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [route, secPerCity, speedMultiplier, selectedDay]);

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
            href="/map-debugger"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 transition font-bold cursor-pointer"
          >
            <Map className="w-3.5 h-3.5 text-sky-400" />
            <span>Map Debugger</span>
          </Link>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/80 border border-white/10 text-slate-300">
            <Wifi className={`w-3.5 h-3.5 ${isLiveApi ? "text-emerald-400" : "text-amber-400"}`} />
            <span className="hidden md:inline">{isLiveApi ? "Synced: /api/journey" : "Demo Mode"}</span>
            {isLiveApi && (
              <button
                onClick={fetchJourney}
                className="ml-1 p-0.5 rounded text-slate-400 hover:text-white transition cursor-pointer"
                title="Przeładuj trasę"
              >
                <RefreshCw className="w-3 h-3 hover:rotate-180 transition-transform duration-300" />
              </button>
            )}
          </div>

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
        <div className="lg:col-span-7 flex flex-col items-center justify-center gap-6 w-full max-w-full overflow-x-auto sm:overflow-visible py-1">
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
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1.5 bg-[#0c162b]/80 px-2.5 py-1 rounded border border-white/10 shadow-sm">
              <kbd className="px-1.5 py-0.5 bg-slate-800 text-amber-400 rounded text-[10px]">Space</kbd>
              <span>/</span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 text-amber-400 rounded text-[10px]">A</kbd>
              <span className="text-slate-200 font-bold">Następny Dzień (Przycisk M5)</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#0c162b]/80 px-2.5 py-1 rounded border border-white/10 shadow-sm">
              <kbd className="px-1.5 py-0.5 bg-slate-800 text-amber-400 rounded text-[10px]">B</kbd>
              <span className="text-slate-200 font-bold">Następne Miasto (Przycisk Górny)</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#0c162b]/80 px-2.5 py-1 rounded border border-white/10 shadow-sm">
              <kbd className="px-1.5 py-0.5 bg-slate-800 text-amber-400 rounded text-[10px]">M</kbd>
              <span className="text-slate-300">Dźwięk</span>
            </div>
          </div>
        </div>

        {/* Right Column: Mission Control & Telemetry Panel (5 cols) */}
        <div className="lg:col-span-5 bg-[#091122]/75 border border-white/10 rounded-3xl p-6 flex flex-col gap-5 shadow-2xl shadow-black/50 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h2 className="text-base font-bold font-mono text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-400" />
                Live Sleigh Telemetry
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
                {selectedDay === 24 && activeStopIndex === route.length - 1 ? "FINAŁ WIGILII 🎁" : "AKTUALNY CEL"}
              </span>
              <span className="text-white font-bold text-sm block mt-0.5 truncate">
                {selectedDay === 24 && activeStopIndex === route.length - 1 ? "KRAKÓW (PL)" : nextCityName}
              </span>
            </div>
            <div className="p-3 bg-[#0c162b]/70 border border-white/5 rounded-xl">
              <span className="text-slate-400 text-[10px] block">ETA COUNTDOWN</span>
              <span className="text-amber-400 font-bold text-sm block mt-0.5">
                {selectedDay === 24 && activeStopIndex === route.length - 1 && eta === 0
                  ? "WIGILIA!"
                  : `0:${String(eta).padStart(2, "0")}`}
              </span>
            </div>
            <div className="p-3 bg-[#0c162b]/70 border border-white/5 rounded-xl">
              <span className="text-slate-400 text-[10px] block">STATUS RUCHU</span>
              <span className="text-amber-300 font-bold text-sm block mt-0.5">
                {isFlightPhase ? "Tranzyt" : "Miasto"}
              </span>
            </div>
            <div className="p-3 bg-[#0c162b]/70 border border-white/5 rounded-xl">
              <span className="text-slate-400 text-[10px] block">POZYCJA GPS</span>
              <span className="text-sky-300 font-bold text-sm block mt-0.5 truncate">
                {coords.lat}° N, {coords.lon}° E
              </span>
            </div>
          </div>

          {/* Interactive Route Stop Sequence */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 font-bold uppercase tracking-wider">
                Trasa Dnia {selectedDay}
              </span>
              <span className="text-[11px] text-amber-300 font-bold">
                {activeStopIndex + 1}/{route.length}
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
              {route.map((wp, idx) => {
                const isActive = activeStopIndex === idx;
                const isFinal = idx === route.length - 1 && selectedDay === 24;
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
                        {wp.localName || wp.name}
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
