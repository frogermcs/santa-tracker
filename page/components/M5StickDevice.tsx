"use client";

import React, { useState, useRef, useEffect } from "react";

interface M5StickDeviceProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onButtonAShortPress?: () => void;
  onButtonALongPress?: () => void;
  onButtonBShortPress?: () => void;
  onButtonBLongPress?: () => void;
  onButtonPWRShortPress?: () => void;
  onButtonPWRLongPress?: () => void;
  onButtonAPress?: () => void;
  onButtonBPress?: () => void;
  onButtonPWRClick?: () => void;
  isButtonAPressed?: boolean;
  isButtonBPressed?: boolean;
  isButtonPWRPressed?: boolean;
  scanlines?: boolean;
  isTilted?: boolean;
}

const LONG_PRESS_THRESHOLD_MS = 600;

export const M5StickDevice: React.FC<M5StickDeviceProps> = ({
  canvasRef,
  onButtonAShortPress,
  onButtonALongPress,
  onButtonBShortPress,
  onButtonBLongPress,
  onButtonPWRShortPress,
  onButtonPWRLongPress,
  onButtonAPress,
  onButtonBPress,
  onButtonPWRClick,
  isButtonAPressed = false,
  isButtonBPressed = false,
  isButtonPWRPressed = false,
  scanlines = true,
  isTilted = false,
}) => {
  const [isAHolding, setIsAHolding] = useState(false);
  const [isBHolding, setIsBHolding] = useState(false);
  const [isPWRHolding, setIsPWRHolding] = useState(false);

  const timerARef = useRef<NodeJS.Timeout | null>(null);
  const timerBRef = useRef<NodeJS.Timeout | null>(null);
  const timerPWRRef = useRef<NodeJS.Timeout | null>(null);

  const longTriggeredARef = useRef(false);
  const longTriggeredBRef = useRef(false);
  const longTriggeredPWRRef = useRef(false);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timerARef.current) clearTimeout(timerARef.current);
      if (timerBRef.current) clearTimeout(timerBRef.current);
      if (timerPWRRef.current) clearTimeout(timerPWRRef.current);
    };
  }, []);

  // Button A Pointer Handlers
  const handlePointerDownA = (e: React.PointerEvent) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    longTriggeredARef.current = false;
    setIsAHolding(true);

    timerARef.current = setTimeout(() => {
      longTriggeredARef.current = true;
      if (onButtonALongPress) {
        onButtonALongPress();
      } else if (onButtonAPress) {
        onButtonAPress();
      }
    }, LONG_PRESS_THRESHOLD_MS);
  };

  const handlePointerUpA = (e: React.PointerEvent) => {
    e.preventDefault();
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }
    if (timerARef.current) {
      clearTimeout(timerARef.current);
      timerARef.current = null;
    }
    setIsAHolding(false);

    if (!longTriggeredARef.current) {
      if (onButtonAShortPress) {
        onButtonAShortPress();
      } else if (onButtonAPress) {
        onButtonAPress();
      }
    }
  };

  const handlePointerCancelA = (e: React.PointerEvent) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }
    if (timerARef.current) {
      clearTimeout(timerARef.current);
      timerARef.current = null;
    }
    setIsAHolding(false);
    longTriggeredARef.current = false;
  };

  // Button B Pointer Handlers
  const handlePointerDownB = (e: React.PointerEvent) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    longTriggeredBRef.current = false;
    setIsBHolding(true);

    timerBRef.current = setTimeout(() => {
      longTriggeredBRef.current = true;
      if (onButtonBLongPress) {
        onButtonBLongPress();
      } else if (onButtonBPress) {
        onButtonBPress();
      }
    }, LONG_PRESS_THRESHOLD_MS);
  };

  const handlePointerUpB = (e: React.PointerEvent) => {
    e.preventDefault();
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }
    if (timerBRef.current) {
      clearTimeout(timerBRef.current);
      timerBRef.current = null;
    }
    setIsBHolding(false);

    if (!longTriggeredBRef.current) {
      if (onButtonBShortPress) {
        onButtonBShortPress();
      } else if (onButtonBPress) {
        onButtonBPress();
      }
    }
  };

  const handlePointerCancelB = (e: React.PointerEvent) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }
    if (timerBRef.current) {
      clearTimeout(timerBRef.current);
      timerBRef.current = null;
    }
    setIsBHolding(false);
    longTriggeredBRef.current = false;
  };

  // Button PWR Pointer Handlers (Bottom Side)
  const handlePointerDownPWR = (e: React.PointerEvent) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    longTriggeredPWRRef.current = false;
    setIsPWRHolding(true);

    timerPWRRef.current = setTimeout(() => {
      longTriggeredPWRRef.current = true;
      if (onButtonPWRLongPress) {
        onButtonPWRLongPress();
      }
    }, LONG_PRESS_THRESHOLD_MS);
  };

  const handlePointerUpPWR = (e: React.PointerEvent) => {
    e.preventDefault();
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }
    if (timerPWRRef.current) {
      clearTimeout(timerPWRRef.current);
      timerPWRRef.current = null;
    }
    setIsPWRHolding(false);

    if (!longTriggeredPWRRef.current) {
      if (onButtonPWRShortPress) {
        onButtonPWRShortPress();
      } else if (onButtonPWRClick) {
        onButtonPWRClick();
      }
    }
  };

  const handlePointerCancelPWR = (e: React.PointerEvent) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }
    if (timerPWRRef.current) {
      clearTimeout(timerPWRRef.current);
      timerPWRRef.current = null;
    }
    setIsPWRHolding(false);
    longTriggeredPWRRef.current = false;
  };

  return (
    <div
      className={`relative my-2 sm:my-3 transition-all duration-300 select-none max-w-full ${
        isTilted ? "rotate-[-4deg] scale-[1.02]" : "rotate-0 scale-100"
      }`}
    >
      {/* Top Side Button (Button B) */}
      <button
        onPointerDown={handlePointerDownB}
        onPointerUp={handlePointerUpB}
        onPointerCancel={handlePointerCancelB}
        onPointerLeave={handlePointerCancelB}
        title="Przycisk B (Górny): Klik = Następne Miasto | Przytrzymaj (>0.6s) = Przełącz Tryb (Demo / Realtime)"
        className={`absolute -top-3 sm:-top-3.5 left-16 sm:left-20 w-16 h-3.5 sm:h-4 rounded-t-md z-0 flex items-center justify-center transition-all duration-75 cursor-pointer shadow-md ${
          isButtonBPressed || isBHolding
            ? "translate-y-1 bg-neutral-900 border-t-2 border-orange-500 ring-1 ring-orange-400/50"
            : "bg-gradient-to-b from-neutral-700 to-neutral-900 hover:from-neutral-600 border-t border-neutral-500 hover:shadow-orange-500/20"
        }`}
      >
        <span className="text-[6.5px] sm:text-[7.5px] font-mono font-bold tracking-tight text-amber-200/90 -mt-2 bg-neutral-950/90 px-1 py-0.5 rounded border border-neutral-700 shadow-inner">
          {isBHolding ? "TRZYMAJ..." : "PRZYCISK B"}
        </span>
      </button>

      {/* Bottom Side Button (PWR Button - Sound Mute/Unmute & Mode Switch) */}
      <button
        onPointerDown={handlePointerDownPWR}
        onPointerUp={handlePointerUpPWR}
        onPointerCancel={handlePointerCancelPWR}
        onPointerLeave={handlePointerCancelPWR}
        title="Przycisk PWR (Dolny): Klik = Dźwięk | Przytrzymaj (>0.6s) = Przełącz Tryb (Demo / Realtime)"
        className={`absolute -bottom-3 sm:-bottom-3.5 left-16 sm:left-20 w-20 h-3.5 sm:h-4 rounded-b-md z-0 flex items-center justify-center transition-all duration-75 cursor-pointer shadow-md ${
          isButtonPWRPressed || isPWRHolding
            ? "-translate-y-0.5 bg-neutral-900 border-b-2 border-rose-500 ring-1 ring-rose-400/50"
            : "bg-gradient-to-t from-neutral-700 to-neutral-900 hover:from-neutral-600 border-b border-neutral-500 hover:shadow-rose-500/20"
        }`}
      >
        <span className="text-[6.5px] sm:text-[7.5px] font-mono font-bold tracking-tight text-rose-300/90 -mb-2 bg-neutral-950/90 px-1 py-0.5 rounded border border-neutral-700 shadow-inner">
          {isPWRHolding ? "TRZYMAJ..." : "PRZYCISK PWR"}
        </span>
      </button>

      {/* Main Translucent Orange Enclosure (StickC-Plus SE - 1x Native Hardware Scale) */}
      <div className="relative z-10 rounded-2xl sm:rounded-3xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 border-2 border-amber-300/40 shadow-2xl bg-gradient-to-br from-amber-500/85 via-orange-600/80 to-amber-700/90 backdrop-blur-md overflow-hidden max-w-full">
        {/* Subtle internal PCB Silkscreen & Trace Silhouette Layer */}
        <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="pcb-pattern"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 10 0 L 10 20 M 0 10 L 20 10"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="0.5"
                />
                <circle cx="10" cy="10" r="1.5" fill="#fff" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pcb-pattern)" />
            {/* ESP32-PICO-D4 footprint */}
            <rect
              x="50"
              y="30"
              width="60"
              height="60"
              fill="none"
              stroke="#fff"
              strokeWidth="1.5"
              strokeDasharray="2,2"
            />
            {/* 120mAh Battery outline */}
            <rect
              x="140"
              y="20"
              width="90"
              height="35"
              rx="4"
              fill="none"
              stroke="#fff"
              strokeWidth="1"
            />
          </svg>
        </div>

        {/* Left End: Infrared LED & Microphone Pinhole & Translucent Ribs */}
        <div className="flex flex-col items-center justify-between h-32 sm:h-36 py-1 relative z-20 shrink-0">
          {/* Status Red LED */}
          <div
            className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-red-600 shadow-[0_0_8px_#ef4444] animate-pulse"
            title="Telemetry Status LED"
          />
          {/* Enclosure Silkscreen Branding */}
          <div
            className="text-[7.5px] sm:text-[8.5px] font-black tracking-widest text-amber-950/70 uppercase select-none font-mono"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            M5StickC Plus SE
          </div>
          {/* Microphone Port & Grove Connector Accent */}
          <div className="flex flex-col items-center gap-1 sm:gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full bg-neutral-900 border border-neutral-700/60"
              title="Mic"
            />
            <div
              className="w-2.5 h-3.5 sm:w-3 sm:h-4 rounded-xs bg-neutral-900/50 border border-neutral-800"
              title="Grove port"
            />
          </div>
        </div>

        {/* Center: ST7789v2 240x135 Screen Bezel */}
        <div className="bg-neutral-950/95 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl relative border-2 border-neutral-800 shadow-[inset_0_4px_12px_rgba(0,0,0,0.9)] z-20 shrink-0">
          {/* Exact 1:1 240x135 Pixel Viewport */}
          <div
            className="relative rounded-lg overflow-hidden border border-neutral-800/80 bg-black shadow-inner flex items-center justify-center w-[240px] h-[135px]"
          >
            <canvas
              ref={canvasRef}
              width={240}
              height={135}
              className="w-[240px] h-[135px] block"
              style={{
                imageRendering: "pixelated",
                contain: "strict",
              }}
            />

            {/* Optional Hardware LCD Subpixel Scanline Grid */}
            {scanlines && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.04), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.04))",
                  backgroundSize: "100% 4px, 6px 100%",
                }}
              />
            )}
          </div>
        </div>

        {/* Right End: Big Tactile Button A (M5 Front Push Button) */}
        <div className="flex flex-col items-center justify-center pr-1 relative z-20 shrink-0">
          <button
            onPointerDown={handlePointerDownA}
            onPointerUp={handlePointerUpA}
            onPointerCancel={handlePointerCancelA}
            onPointerLeave={handlePointerCancelA}
            title="Przycisk A (M5): Klik = Zmień Ekran | Przytrzymaj (>0.6s) = Zmień Dzień Adwentu"
            className={`w-12 sm:w-14 h-24 sm:h-28 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all duration-75 border ${
              isButtonAPressed || isAHolding
                ? "translate-y-1 scale-98 bg-gradient-to-b from-amber-200 to-amber-300 shadow-inner border-amber-500 ring-2 ring-amber-400"
                : "bg-gradient-to-b from-neutral-100 via-neutral-200 to-neutral-300 hover:from-white shadow-[0_4px_0_#4b5563,0_6px_10px_rgba(0,0,0,0.4)] sm:shadow-[0_6px_0_#4b5563,0_8px_14px_rgba(0,0,0,0.4)] border-white/60 active:translate-y-1 active:shadow-[0_2px_0_#4b5563]"
            }`}
          >
            <span className="text-base sm:text-lg font-black text-neutral-800 tracking-tighter">
              M5
            </span>
            <span className="text-[7.5px] sm:text-[8.5px] font-bold text-neutral-600 uppercase tracking-widest font-mono">
              {isAHolding ? "TRZYMAJ..." : "EKRAN"}
            </span>
          </button>
          <span className="text-[8px] sm:text-[9px] font-bold text-amber-950/80 mt-1.5 tracking-wide font-mono">
            PRZYCISK A
          </span>
        </div>
      </div>
    </div>
  );
};
