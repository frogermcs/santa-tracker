"use client";

import React from "react";

interface M5StickDeviceProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onButtonAPress: () => void;
  onButtonBPress: () => void;
  isButtonAPressed?: boolean;
  isButtonBPressed?: boolean;
  scanlines?: boolean;
  isTilted?: boolean;
}

export const M5StickDevice: React.FC<M5StickDeviceProps> = ({
  canvasRef,
  onButtonAPress,
  onButtonBPress,
  isButtonAPressed = false,
  isButtonBPressed = false,
  scanlines = true,
  isTilted = false,
}) => {
  return (
    <div
      className={`relative transition-all duration-300 select-none max-w-full ${
        isTilted ? "rotate-[-4deg] scale-[1.02]" : "rotate-0 scale-100"
      }`}
    >
      {/* Top Side Button (Button B) */}
      <button
        onClick={onButtonBPress}
        title="Przycisk B (Górny przycisk akcji) - Klawisz 'B'"
        className={`absolute -top-3 sm:-top-3.5 left-14 sm:left-24 md:left-28 w-12 sm:w-16 h-3.5 sm:h-4 rounded-t-md z-0 flex items-center justify-center transition-all duration-75 cursor-pointer shadow-md ${
          isButtonBPressed
            ? "translate-y-1 bg-neutral-900 border-t-2 border-orange-500"
            : "bg-gradient-to-b from-neutral-700 to-neutral-900 hover:from-neutral-600 border-t border-neutral-500 hover:shadow-orange-500/20"
        }`}
      >
        <span className="text-[6.5px] sm:text-[7.5px] font-mono font-bold tracking-tight text-amber-200/90 -mt-2 bg-neutral-950/90 px-1 py-0.5 rounded border border-neutral-700 shadow-inner">
          PRZYCISK B
        </span>
      </button>

      {/* Main Translucent Orange Enclosure (StickC-Plus SE) */}
      <div className="relative z-10 rounded-2xl sm:rounded-[28px] p-2.5 sm:p-4 md:p-5 flex items-center gap-2 sm:gap-4 md:gap-6 border-2 border-amber-300/40 shadow-2xl bg-gradient-to-br from-amber-500/85 via-orange-600/80 to-amber-700/90 backdrop-blur-md overflow-hidden max-w-full">
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
        <div className="flex flex-col items-center justify-between h-28 sm:h-36 md:h-44 py-0.5 sm:py-1 relative z-20 shrink-0">
          {/* Status Red LED */}
          <div
            className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-red-600 shadow-[0_0_8px_#ef4444] animate-pulse"
            title="Telemetry Status LED"
          />
          {/* Enclosure Silkscreen Branding */}
          <div
            className="text-[7px] sm:text-[9px] font-black tracking-widest text-amber-950/70 uppercase select-none font-mono"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            M5StickC Plus SE
          </div>
          {/* Microphone Port & Grove Connector Accent */}
          <div className="flex flex-col items-center gap-1 sm:gap-1.5">
            <div
              className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-neutral-900 border border-neutral-700/60"
              title="Mic"
            />
            <div
              className="w-2.5 h-3.5 sm:w-3 sm:h-5 rounded-xs bg-neutral-900/50 border border-neutral-800"
              title="Grove port"
            />
          </div>
        </div>

        {/* Center: ST7789v2 240x135 Screen Bezel */}
        <div className="bg-neutral-950/95 p-1.5 sm:p-2.5 md:p-3 rounded-xl sm:rounded-2xl relative border-2 border-neutral-800 shadow-[inset_0_4px_12px_rgba(0,0,0,0.9)] z-20 shrink-0">
          {/* Actual 240x135 Pixel Viewport */}
          <div
            className="relative rounded-lg overflow-hidden border border-neutral-800/80 bg-black shadow-inner flex items-center justify-center w-[200px] h-[112.5px] min-[380px]:w-[224px] min-[380px]:h-[126px] sm:w-[288px] sm:h-[162px] md:w-[384px] md:h-[216px]"
          >
            <canvas
              ref={canvasRef}
              width={240}
              height={135}
              className="w-full h-full block"
              style={{
                imageRendering: "pixelated",
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
        <div className="flex flex-col items-center justify-center pr-0.5 sm:pr-1 relative z-20 shrink-0">
          <button
            onClick={onButtonAPress}
            title="Przycisk A (Główny przycisk M5) - Wciśnij Spację"
            className={`w-10 h-20 sm:w-16 sm:h-28 md:w-20 md:h-32 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center gap-0.5 sm:gap-1 cursor-pointer transition-all duration-75 border ${
              isButtonAPressed
                ? "translate-y-1 scale-98 bg-gradient-to-b from-neutral-300 to-neutral-400 shadow-inner border-neutral-500"
                : "bg-gradient-to-b from-neutral-100 via-neutral-200 to-neutral-300 hover:from-white shadow-[0_4px_0_#4b5563,0_6px_10px_rgba(0,0,0,0.4)] sm:shadow-[0_6px_0_#4b5563,0_8px_14px_rgba(0,0,0,0.4)] border-white/60 active:translate-y-1 active:shadow-[0_2px_0_#4b5563]"
            }`}
          >
            <span className="text-sm sm:text-lg md:text-xl font-black text-neutral-800 tracking-tighter">
              M5
            </span>
            <span className="text-[7px] sm:text-[9px] font-bold text-neutral-600 uppercase tracking-widest font-mono">
              WCISKAJ
            </span>
          </button>
          <span className="text-[8px] sm:text-[10px] font-bold text-amber-950/80 mt-1 sm:mt-2 tracking-wide font-mono">
            PRZYCISK A
          </span>
        </div>
      </div>
    </div>
  );
};
