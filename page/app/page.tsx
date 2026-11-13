"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Usb,
  Compass,
  Gauge,
  Camera,
  Sparkles,
  Star,
} from "lucide-react";
import { M5StickDevice } from "@/components/M5StickDevice";
import { FestivePaperBackdrop } from "@/components/FestivePaperBackdrop";
import { FestiveGarlandGreeting } from "@/components/FestiveGarlandGreeting";
import { M5CanvasSim } from "@/lib/simulator/M5CanvasSim";
import {
  setup as setupSimulator,
  update as updateSimulator,
  render as renderSimulator,
  setDay,
  setActiveScreen as setSimActiveScreen,
  FLIGHT_DURATION_REAL,
  SimulatorAppState,
  ButtonEventState,
} from "@/lib/simulator/iotAppLogic";

const SCREEN_TABS = [
  { id: 0 as const, label: "MikoRadar", icon: Compass },
  { id: 1 as const, label: "Kokpit Misji", icon: Gauge },
  { id: 2 as const, label: "Santa Cam", icon: Camera },
];

export default function LandingPage() {
  const [activeScreen, setActiveScreen] = useState<0 | 1 | 2>(2);
  const [isBtnAPressed, setIsBtnAPressed] = useState<boolean>(false);
  const [isBtnBPressed, setIsBtnBPressed] = useState<boolean>(false);
  const [isBtnPWRPressed, setIsBtnPWRPressed] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasSimRef = useRef<M5CanvasSim | null>(null);
  const simStateRef = useRef<SimulatorAppState | null>(null);
  const pendingButtonsRef = useRef<ButtonEventState>({
    wasPressedA: false,
    wasHoldA: false,
    wasPressedB: false,
    wasHoldB: false,
    wasPressedPWR: false,
    wasHoldPWR: false,
  });
  const lastSyncedScreenRef = useRef<0 | 1 | 2>(2);

  useEffect(() => {
    const initialSim = setupSimulator(0);
    initialSim.activeScreen = 2; // Default to Santa Cam
    initialSim.journeyMode = "real"; // Default to Real-Time mode
    const now = new Date();
    if (now.getMonth() === 11 && now.getDate() >= 1 && now.getDate() <= 24) {
      setDay(initialSim, now.getDate(), true);
      initialSim.simTime =
        now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    } else {
      initialSim.simTime = FLIGHT_DURATION_REAL;
    }
    simStateRef.current = initialSim;

    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 240;
    canvas.height = 135;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    canvasSimRef.current = new M5CanvasSim(ctx, canvas);
    canvasSimRef.current.setRotation(1);
  }, []);

  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dtMs = Math.min(now - lastTime, 100);
      lastTime = now;

      const btns: ButtonEventState = { ...pendingButtonsRef.current };
      pendingButtonsRef.current.wasPressedA = false;
      pendingButtonsRef.current.wasHoldA = false;
      pendingButtonsRef.current.wasPressedB = false;
      pendingButtonsRef.current.wasHoldB = false;
      pendingButtonsRef.current.wasPressedPWR = false;
      pendingButtonsRef.current.wasHoldPWR = false;

      if (!simStateRef.current) return;
      updateSimulator(simStateRef.current, btns, dtMs, now);
      if (canvasSimRef.current) {
        renderSimulator(canvasSimRef.current, simStateRef.current, now);
      }

      const scr = simStateRef.current.activeScreen as 0 | 1 | 2;
      if (scr !== lastSyncedScreenRef.current) {
        lastSyncedScreenRef.current = scr;
        setActiveScreen(scr);
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleBtnAShort = useCallback(() => {
    setIsBtnAPressed(true);
    setTimeout(() => setIsBtnAPressed(false), 180);
    pendingButtonsRef.current.wasPressedA = true;
  }, []);

  const handleBtnALong = useCallback(() => {
    setIsBtnAPressed(true);
    setTimeout(() => setIsBtnAPressed(false), 300);
    pendingButtonsRef.current.wasHoldA = true;
  }, []);

  const handleBtnBShort = useCallback(() => {
    setIsBtnBPressed(true);
    setTimeout(() => setIsBtnBPressed(false), 180);
    pendingButtonsRef.current.wasPressedB = true;
  }, []);

  const handleBtnBLong = useCallback(() => {
    setIsBtnBPressed(true);
    setTimeout(() => setIsBtnBPressed(false), 300);
    pendingButtonsRef.current.wasHoldB = true;
  }, []);

  const handleBtnPWRLong = useCallback(() => {
    setIsBtnPWRPressed(true);
    setTimeout(() => setIsBtnPWRPressed(false), 300);
    pendingButtonsRef.current.wasHoldPWR = true;
  }, []);

  const handleSelectScreen = useCallback((screenId: 0 | 1 | 2) => {
    if (simStateRef.current) {
      setSimActiveScreen(simStateRef.current, screenId);
    }
    lastSyncedScreenRef.current = screenId;
    setActiveScreen(screenId);
  }, []);

  return (
    <div className="min-h-screen overscroll-y-none bg-[#fbf3e4] text-[#0d3b26] flex flex-col relative overflow-x-hidden selection:bg-[#c81e1e] selection:text-[#fbf3e4]">
      <FestivePaperBackdrop />
      {/* Top Masthead */}
      <header className="max-w-6xl w-full mx-auto px-5 sm:px-10 pt-5 pb-4 border-b border-[#dfd0b4] flex items-center justify-center relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#f3e5cb] border-2 border-[#3b2316] flex items-center justify-center p-1.5 shrink-0">
            <Image
              src="/santa-icon.svg"
              alt="Santa OS"
              width={28}
              height={28}
              className="w-7 h-7"
              priority
            />
          </div>
          <span className="font-poster text-2xl font-extrabold tracking-tight text-[#3b2316]">
            Santa OS
          </span>
        </div>
      </header>

      {/* Main Holiday Poster Stage */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-5 sm:px-10 py-8 sm:py-12 flex items-center relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center w-full">
          {/* Left Column: Tabloid Headline & Install CTA */}
          <section className="lg:col-span-7 space-y-6">
            <h1 className="font-poster text-[3.35rem] sm:text-[4.6rem] lg:text-[5.25rem] font-extrabold uppercase leading-[0.93] tracking-[-0.02em] text-[#c81e1e]">
              ŚLEDŹ LOT
              <br />
              MIKOŁAJA
              <br />
              PRZEZ CAŁY ADWENT!
            </h1>

            <p className="text-xl sm:text-2xl font-bold text-[#0d3b26] max-w-xl leading-snug text-pretty">
              Od 1 grudnia aż po Wigilię sprawdzaj na kieszonkowym M5Sticku,
              dokąd lecą sanie, co słychać w kokpicie i jak Mikołaj radzi sobie
              w trasie.
            </p>

            {/* Primary Install CTA */}
            <div className="pt-2">
              <Link
                href="/install"
                className="inline-flex items-center gap-4 pl-6 pr-3 py-3 rounded-xl bg-[#ea580c] hover:bg-[#dc4c05] active:translate-y-0.5 text-[#fffaf0] font-extrabold text-xl sm:text-2xl tracking-tight shadow-[0_4px_12px_rgba(153,27,27,0.35)] transition cursor-pointer focus-visible:outline-2 focus-visible:outline-[#0d3b26]"
              >
                <span>Zainstaluj na M5Stick</span>
                <span className="w-11 h-11 rounded-lg bg-[#991b1b] flex items-center justify-center shrink-0">
                  <Usb className="w-6 h-6 text-[#fffaf0]" />
                </span>
              </Link>
            </div>
          </section>

          {/* Right Column: Live Interactive M5StickC-Plus SE */}
          <section className="lg:col-span-5 flex flex-col items-center gap-5 relative">
            {/* Festive Accent Marks around Device */}
            <div className="relative flex items-center justify-center py-2">
              <Star
                aria-hidden="true"
                className="hidden sm:block absolute -top-2 right-2 w-7 h-7 text-[#ea580c] fill-[#ea580c] rotate-12 pointer-events-none"
              />
              <Sparkles
                aria-hidden="true"
                className="hidden sm:block absolute bottom-6 -left-3 w-6 h-6 text-[#c81e1e] pointer-events-none"
              />

              <div className="sm:-rotate-2 transition-transform">
                <M5StickDevice
                  canvasRef={canvasRef}
                  onButtonAShortPress={handleBtnAShort}
                  onButtonALongPress={handleBtnALong}
                  onButtonBShortPress={handleBtnBShort}
                  onButtonBLongPress={handleBtnBLong}
                  onButtonPWRLongPress={handleBtnPWRLong}
                  isButtonAPressed={isBtnAPressed}
                  isButtonBPressed={isBtnBPressed}
                  isButtonPWRPressed={isBtnPWRPressed}
                  scanlines={true}
                />
              </div>
            </div>

            {/* Tactile Screen Switcher */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 bg-[#f2e4cb] border-2 border-[#d5c19e] p-1.5 rounded-xl">
              {SCREEN_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeScreen === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => handleSelectScreen(tab.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-bold cursor-pointer focus-visible:outline-2 focus-visible:outline-[#c81e1e] ${
                      isActive
                        ? "bg-[#c81e1e] text-[#fffaf0]"
                        : "text-[#0d3b26] hover:bg-[#e7d5b6]"
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        isActive ? "text-[#fde68a]" : "text-[#0d3b26]"
                      }`}
                    />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <p className="text-xs font-mono font-bold text-[#4a3525] text-center max-w-xs leading-relaxed">
              Kliknij <span className="text-[#c81e1e]">M5</span>, aby przełączyć ekran · przytrzymaj boczny przycisk <span className="text-[#c81e1e]">B</span>, aby włączyć tryb demo.
            </p>
          </section>
        </div>
      </main>

      {/* Festive Christmas Garland Footer */}
      <footer className="max-w-6xl w-full mx-auto px-5 sm:px-10 py-4 border-t border-[#dfd0b4] flex items-center justify-center relative z-10">
        <FestiveGarlandGreeting />
      </footer>
    </div>
  );
}
