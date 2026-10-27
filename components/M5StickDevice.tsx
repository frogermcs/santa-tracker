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
      className={`relative transition-all duration-300 select-none ${
        isTilted ? "rotate-[-4deg] scale-[1.02]" : "rotate-0 scale-100"
      }`}
    >
      {/* Top Side Button (Button B) */}
      <button
        onClick={onButtonBPress}
        title="Przycisk B (Górny przycisk akcji) - Klawisz 'B'"
        className={`absolute -top-3.5 left-24 sm:left-28 w-16 h-4 rounded-t-md z-0 flex items-center justify-center transition-all duration-75 cursor-pointer shadow-md ${
          isButtonBPressed
            ? "translate-y-1 bg-neutral-900 border-t-2 border-orange-500"
            : "bg-gradient-to-b from-neutral-700 to-neutral-900 hover:from-neutral-600 border-t border-neutral-500 hover:shadow-orange-500/20"
        }`}
      >
        <span className="text-[7.5px] font-mono font-bold tracking-tight text-amber-200/90 -mt-2.5 bg-neutral-950/90 px-1 py-0.5 rounded border border-neutral-700 shadow-inner">
          PRZYCISK B
        </span>
      </button>

      {/* Main Translucent Orange Enclosure (StickC-Plus SE) */}
      <div className="relative z-10 rounded-[28px] p-4 sm:p-5 flex items-center gap-4 sm:gap-6 border-2 border-amber-300/40 shadow-2xl bg-gradient-to-br from-amber-500/85 via-orange-600/80 to-amber-700/90 backdrop-blur-md overflow-hidden">
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
        <div className="flex flex-col items-center justify-between h-36 sm:h-44 py-1 relative z-20">
          {/* Status Red LED */}
          <div
            className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[0_0_8px_#ef4444] animate-pulse"
            title="Telemetry Status LED"
          />
          {/* Enclosure Silkscreen Branding */}
          <div
            className="text-[9px] font-black tracking-widest text-amber-950/70 uppercase select-none font-mono"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            M5StickC Plus SE
          </div>
          {/* Microphone Port & Grove Connector Accent */}
          <div className="flex flex-col items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full bg-neutral-900 border border-neutral-700/60"
              title="Mic"
            />
            <div
              className="w-3 h-5 rounded-xs bg-neutral-900/50 border border-neutral-800"
              title="Grove port"
            />
          </div>
        </div>

        {/* Center: ST7789v2 240x135 Screen Bezel */}
        <div className="bg-neutral-950/95 p-2.5 sm:p-3 rounded-2xl relative border-2 border-neutral-800 shadow-[inset_0_4px_12px_rgba(0,0,0,0.9)] z-20">
          {/* Top Bezel Metadata */}
          <div className="flex items-center justify-between px-1 mb-1.5 text-[9px] font-mono">
            <span className="text-neutral-500 tracking-wider">
              IPS 240×135 · ST7789v2
            </span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              BATERIA 98%
            </span>
          </div>

          {/* Actual 240x135 Pixel Viewport */}
          <div
            className="relative rounded-lg overflow-hidden border border-neutral-800/80 bg-black shadow-inner flex items-center justify-center"
            style={{ width: "384px", height: "216px" }}
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
        <div className="flex flex-col items-center justify-center pr-1 relative z-20">
          <button
            onClick={onButtonAPress}
            title="Przycisk A (Główny przycisk M5) - Wciśnij Spację"
            className={`w-16 h-28 sm:w-20 sm:h-32 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all duration-75 border ${
              isButtonAPressed
                ? "translate-y-1 scale-98 bg-gradient-to-b from-neutral-300 to-neutral-400 shadow-inner border-neutral-500"
                : "bg-gradient-to-b from-neutral-100 via-neutral-200 to-neutral-300 hover:from-white shadow-[0_6px_0_#4b5563,0_8px_14px_rgba(0,0,0,0.4)] border-white/60 active:translate-y-1 active:shadow-[0_2px_0_#4b5563]"
            }`}
          >
            <span className="text-lg sm:text-xl font-black text-neutral-800 tracking-tighter">
              M5
            </span>
            <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest font-mono">
              WCISKAJ
            </span>
          </button>
          <span className="text-[10px] font-bold text-amber-950/80 mt-2 tracking-wide font-mono">
            PRZYCISK A
          </span>
        </div>
      </div>
    </div>
  );
};
