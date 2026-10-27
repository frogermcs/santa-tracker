"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { M5StickDevice } from "@/components/M5StickDevice";
import { KidControls } from "@/components/KidControls";
import { ArduinoCodeModal } from "@/components/ArduinoCodeModal";
import { JourneyEngine, JOURNEY_CITIES } from "@/lib/canvas/journey-engine";
import { ActionToyEngine } from "@/lib/canvas/action-toy-engine";
import { buzzer } from "@/lib/audio/buzzer";
import { Code, Sparkles, Compass } from "lucide-react";

type TrackerMode = "journey" | "action";

export default function Home() {
  const [mode, setMode] = useState<TrackerMode>("action");
  const [currentScreen, setCurrentScreen] = useState<number>(0);
  const [santaAction, setSantaAction] = useState<number>(0);
  const [currentCityName, setCurrentCityName] = useState<string>("AUCKLAND");
  const [customCity, setCustomCity] = useState<string>("KRAKOW, PL");
  const [speed, setSpeed] = useState<number>(3);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [scanlines, setScanlines] = useState<boolean>(true);
  const [isTilted, setIsTilted] = useState<boolean>(false);
  const [autoCycle, setAutoCycle] = useState<boolean>(true);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState<boolean>(false);

  // Button pressed visual animation states
  const [isBtnAPressed, setIsBtnAPressed] = useState<boolean>(false);
  const [isBtnBPressed, setIsBtnBPressed] = useState<boolean>(false);

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const journeyEngineRef = useRef<JourneyEngine | null>(null);
  const actionEngineRef = useRef<ActionToyEngine | null>(null);

  // Initialize or reconfigure engine when mode or canvas changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Cleanup previous engines
    if (journeyEngineRef.current) {
      journeyEngineRef.current.destroy();
      journeyEngineRef.current = null;
    }
    if (actionEngineRef.current) {
      actionEngineRef.current.destroy();
      actionEngineRef.current = null;
    }

    if (mode === "journey") {
      const engine = new JourneyEngine(canvas, {
        onCityChange: (cityName) => setCurrentCityName(cityName),
        onScreenChange: (screenIdx) => setCurrentScreen(screenIdx),
      });
      engine.currentScreen = (currentScreen % 3) as 0 | 1 | 2;
      engine.speed = speed;
      engine.autoCycle = autoCycle;
      engine.customCityOverride = customCity;
      engine.start();
      journeyEngineRef.current = engine;
    } else {
      const engine = new ActionToyEngine(canvas, {
        onActionChange: (action) => setSantaAction(action),
        onScreenChange: (screenIdx) => setCurrentScreen(screenIdx),
      });
      engine.currentScreen = (currentScreen % 3) as 0 | 1 | 2;
      engine.santaAction = (santaAction % 4) as 0 | 1 | 2 | 3;
      engine.speedMultiplier = speed;
      engine.autoCycle = autoCycle;
      engine.customNextStop = customCity;
      engine.start();
      actionEngineRef.current = engine;
    }

    return () => {
      journeyEngineRef.current?.destroy();
      actionEngineRef.current?.destroy();
    };
  }, [mode]);

  // Sync settings with active engine
  useEffect(() => {
    if (mode === "journey" && journeyEngineRef.current) {
      journeyEngineRef.current.speed = speed;
      journeyEngineRef.current.autoCycle = autoCycle;
      journeyEngineRef.current.customCityOverride = customCity;
    } else if (mode === "action" && actionEngineRef.current) {
      actionEngineRef.current.speedMultiplier = speed;
      actionEngineRef.current.autoCycle = autoCycle;
      actionEngineRef.current.setCustomCity(customCity);
    }
  }, [speed, autoCycle, customCity, mode]);

  // Handle Screen Switch (Button A / Front M5 Button)
  const handleButtonAPress = useCallback(() => {
    setIsBtnAPressed(true);
    setTimeout(() => setIsBtnAPressed(false), 120);
    buzzer.screenSwitch();

    setCurrentScreen((prev) => {
      const next = (prev + 1) % 3;
      if (mode === "journey" && journeyEngineRef.current) {
        journeyEngineRef.current.setScreen(next as 0 | 1 | 2);
      } else if (mode === "action" && actionEngineRef.current) {
        actionEngineRef.current.setScreen(next as 0 | 1 | 2);
      }
      return next;
    });
  }, [mode]);

  // Handle Action Trigger (Button B / Top Side Button)
  const handleButtonBPress = useCallback(() => {
    setIsBtnBPressed(true);
    setTimeout(() => setIsBtnBPressed(false), 120);

    if (mode === "action") {
      if (currentScreen === 0) {
        // Cycle Santa Cam action
        buzzer.actionTrigger();
        setSantaAction((prev) => {
          const next = ((prev + 1) % 4) as 0 | 1 | 2 | 3;
          actionEngineRef.current?.setSantaAction(next);
          if (next === 2) buzzer.cookieMunch();
          if (next === 3) buzzer.warpSpeed();
          return next;
        });
      } else if (currentScreen === 1) {
        // Boost gifts
        buzzer.giftBoost();
        actionEngineRef.current?.boostGifts(25000);
      } else {
        // Advance radar waypoint
        buzzer.actionTrigger();
        actionEngineRef.current?.advanceWaypoint();
      }
    } else {
      // In journey mode: Button B skips to next city
      buzzer.actionTrigger();
      journeyEngineRef.current?.skipToNextCity();
    }
  }, [mode, currentScreen]);

  // Screen selection via tabs
  const handleScreenSelect = (idx: number) => {
    setCurrentScreen(idx);
    buzzer.screenSwitch();
    if (mode === "journey") {
      journeyEngineRef.current?.setScreen(idx as 0 | 1 | 2);
    } else {
      actionEngineRef.current?.setScreen(idx as 0 | 1 | 2);
    }
  };

  // Action selection in action mode
  const handleActionSelect = (act: 0 | 1 | 2 | 3) => {
    setSantaAction(act);
    buzzer.actionTrigger();
    if (act === 2) buzzer.cookieMunch();
    if (act === 3) buzzer.warpSpeed();
    actionEngineRef.current?.setSantaAction(act);
  };

  const handleBoostGifts = () => {
    buzzer.giftBoost();
    actionEngineRef.current?.boostGifts(25000);
  };

  const handleSkipCity = () => {
    buzzer.actionTrigger();
    journeyEngineRef.current?.skipToNextCity();
  };

  const handleToggleMute = () => {
    const nextMuted = buzzer.toggleMute();
    setIsMuted(nextMuted);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.code === "Space" || e.code === "KeyA") {
        e.preventDefault();
        handleButtonAPress();
      } else if (e.code === "KeyB") {
        e.preventDefault();
        handleButtonBPress();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleButtonAPress();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        setCurrentScreen((prev) => {
          const next = (prev + 2) % 3;
          handleScreenSelect(next);
          return next;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleButtonAPress, handleButtonBPress]);

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Top Header & Navigation */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-neutral-800/80 pb-5">
        <div className="flex items-center gap-3">
          {/* M5 Translucent Orange Icon */}
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-neutral-950 font-black text-xl shadow-lg shadow-orange-600/30 border border-amber-300/60 shrink-0">
            M5
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
              Lokalizator Mikołaja · M5StickC-Plus SE
            </h1>
          </div>
        </div>

        {/* Prototype Mode Switcher & Maker Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Mode Tabs */}
          <div className="bg-neutral-900 p-1 rounded-2xl border border-neutral-800 flex items-center gap-1 shadow-inner">
            <button
              onClick={() => {
                setMode("action");
                buzzer.actionTrigger();
              }}
              className={`py-1.5 px-3 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                mode === "action"
                  ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-600/30"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Zabawka + Dźwięki</span>
            </button>
            <button
              onClick={() => {
                setMode("journey");
                buzzer.actionTrigger();
              }}
              className={`py-1.5 px-3 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                mode === "journey"
                  ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/30"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Podróż przez 15 Miast</span>
            </button>
          </div>

          {/* Arduino Code Button */}
          <button
            onClick={() => setIsCodeModalOpen(true)}
            className="py-2 px-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition cursor-pointer"
          >
            <Code className="w-4 h-4" />
            <span>Kod Arduino .ino</span>
          </button>
        </div>
      </header>

      {/* Main Interactive Stage */}
      <main className="my-auto py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Virtual M5StickC-Plus SE Hardware (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center">
          {/* Active Mode Banner */}
          <div className="mb-4 text-center">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 bg-neutral-900/90 px-3.5 py-1.5 rounded-full border border-neutral-800">
              Aktywny tryb:{" "}
              <strong className="text-orange-400">
                {mode === "action"
                  ? "Interaktywna zabawka 4 akcji + dźwięki retro"
                  : "Świąteczna podróż przez 15 miast i telemetria"}
              </strong>
            </span>
          </div>

          {/* Physical Device Enclosure */}
          <div className="overflow-x-auto max-w-full p-2 flex justify-center">
            <M5StickDevice
              canvasRef={canvasRef}
              onButtonAPress={handleButtonAPress}
              onButtonBPress={handleButtonBPress}
              isButtonAPressed={isBtnAPressed}
              isButtonBPressed={isBtnBPressed}
              scanlines={scanlines}
              isTilted={isTilted}
            />
          </div>

          {/* Device Controls Hint */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs font-mono text-neutral-400">
            <div className="flex items-center gap-2 bg-neutral-900/90 px-3 py-1.5 rounded-xl border border-neutral-800">
              <kbd className="px-2 py-0.5 bg-neutral-800 text-amber-400 rounded font-bold border border-neutral-700">
                PRZYCISK A (M5)
              </kbd>
              <span>Następny ekran (1 → 2 → 3)</span>
            </div>
            <div className="flex items-center gap-2 bg-neutral-900/90 px-3 py-1.5 rounded-xl border border-neutral-800">
              <kbd className="px-2 py-0.5 bg-neutral-800 text-amber-400 rounded font-bold border border-neutral-700">
                PRZYCISK B
              </kbd>
              <span>{mode === "action" ? "Następna akcja / Doładowanie" : "Następne miasto"}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Kid's Mission Control & Customizer (5 Cols) */}
        <div className="lg:col-span-5">
          <KidControls
            mode={mode}
            currentScreen={currentScreen}
            onScreenSelect={handleScreenSelect}
            santaAction={santaAction}
            onActionSelect={handleActionSelect}
            onBoostGifts={handleBoostGifts}
            onSkipCity={handleSkipCity}
            currentCityName={currentCityName}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            speed={speed}
            onSpeedChange={setSpeed}
            customCity={customCity}
            onCustomCityChange={setCustomCity}
            scanlines={scanlines}
            onToggleScanlines={() => setScanlines((prev) => !prev)}
            isTilted={isTilted}
            onToggleTilt={() => setIsTilted((prev) => !prev)}
            autoCycle={autoCycle}
            onToggleAutoCycle={() => setAutoCycle((prev) => !prev)}
          />
        </div>
      </main>

      {/* Funny Santa Footer */}
      <footer className="border-t border-neutral-800/80 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-neutral-400 gap-3">
        <div className="flex items-center gap-2.5">
          <img src="/santa-icon.svg" alt="Święty Mikołaj" className="w-5 h-5 shrink-0" />
          <span>Renifery nakarmione marchewkami 🥕 · Żaden elf nie ucierpiał podczas testów radaru! 🎅</span>
        </div>
        <div className="flex items-center gap-2 text-neutral-500">
          <span>Ho, ho, ho! Poziom zapasów ciastek: 100% 🥛🍪</span>
        </div>
      </footer>

      {/* Maker Arduino Sketch Modal */}
      <ArduinoCodeModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
      />
    </div>
  );
}
