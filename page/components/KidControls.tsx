"use client";

import React from "react";
import { Volume2, VolumeX, FastForward, RotateCw, Sparkles, MapPin, Monitor } from "lucide-react";

interface KidControlsProps {
  mode: "journey" | "action";
  currentScreen: number;
  onScreenSelect: (index: number) => void;
  // Action toy props
  santaAction?: number;
  onActionSelect?: (index: 0 | 1 | 2 | 3) => void;
  onBoostGifts?: () => void;
  // Journey props
  onSkipCity?: () => void;
  currentCityName?: string;
  // Settings
  isMuted: boolean;
  onToggleMute: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  customCity: string;
  onCustomCityChange: (city: string) => void;
  scanlines: boolean;
  onToggleScanlines: () => void;
  isTilted: boolean;
  onToggleTilt: () => void;
  autoCycle: boolean;
  onToggleAutoCycle: () => void;
}

export const KidControls: React.FC<KidControlsProps> = ({
  mode,
  currentScreen,
  onScreenSelect,
  santaAction = 0,
  onActionSelect,
  onBoostGifts,
  onSkipCity,
  currentCityName,
  isMuted,
  onToggleMute,
  speed,
  onSpeedChange,
  customCity,
  onCustomCityChange,
  scanlines,
  onToggleScanlines,
  isTilted,
  onToggleTilt,
  autoCycle,
  onToggleAutoCycle,
}) => {
  const [cityInput, setCityInput] = React.useState(customCity);

  const handleCitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cityInput.trim()) {
      onCustomCityChange(cityInput.trim().toUpperCase());
    }
  };

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col gap-5 text-neutral-200">
      {/* Screen Selector Tabs */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1.5 font-bold">
            <Monitor className="w-3.5 h-3.5 text-amber-500" />
            Aktywny Ekran (ST7789v2)
          </label>
          <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
            Ekran {currentScreen + 1} z 3
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 0, label: "1. Kamera", icon: "🛷" },
            { id: 1, label: "2. Pulpit", icon: "📊" },
            { id: 2, label: "3. Radar", icon: "🌍" },
          ].map((screen) => (
            <button
              key={screen.id}
              onClick={() => onScreenSelect(screen.id)}
              className={`py-2.5 px-2 rounded-xl text-xs font-semibold font-mono flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                currentScreen === screen.id
                  ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/30 font-bold scale-[1.02]"
                  : "bg-neutral-800/80 hover:bg-neutral-700/80 border-neutral-700 text-neutral-300"
              }`}
            >
              <span>{screen.icon}</span>
              <span className="truncate">{screen.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mode-Specific Action Panels */}
      {mode === "action" && (
        <div className="space-y-3 pt-2 border-t border-neutral-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
              Tryb Akcji Mikołaja (Przycisk B)
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">
              KROK {santaAction + 1}/4
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 0, title: "1. Lot po niebie", desc: "Sanie i renifery w gwiazdach", icon: "✨" },
              { id: 1, title: "2. Zrzut do komina", desc: "Prezent ze spadochronem", icon: "🎁" },
              { id: 2, title: "3. Ciasteczka", desc: "Mikołaj zajada słodkości", icon: "🍪" },
              { id: 3, title: "4. Hiper-prędkość", desc: "Czerwony nos i turbodoładowanie", icon: "⚡" },
            ].map((action) => (
              <button
                key={action.id}
                onClick={() => onActionSelect?.(action.id as 0 | 1 | 2 | 3)}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-0.5 cursor-pointer ${
                  santaAction === action.id
                    ? "bg-amber-500/20 border-amber-500 text-white shadow-md shadow-amber-500/10"
                    : "bg-neutral-800/50 border-neutral-700/80 text-neutral-300 hover:border-neutral-600 hover:bg-neutral-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono flex items-center gap-1">
                    <span>{action.icon}</span> {action.title}
                  </span>
                </div>
                <span className="text-[10px] text-neutral-400 leading-tight">
                  {action.desc}
                </span>
              </button>
            ))}
          </div>

          {currentScreen === 1 && onBoostGifts && (
            <button
              onClick={onBoostGifts}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs font-mono shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              Doładuj prezenty (+25 000 prezentów!)
            </button>
          )}
        </div>
      )}

      {mode === "journey" && (
        <div className="space-y-3 pt-2 border-t border-neutral-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
              Postęp Świątecznej Podróży
            </span>
            <span className="text-xs font-mono font-bold text-amber-400">
              15 Miast Świata
            </span>
          </div>

          <div className="flex items-center justify-between bg-neutral-950/60 p-3 rounded-xl border border-neutral-800">
            <div className="text-xs font-mono">
              <span className="text-neutral-400 text-[10px] block">Aktualne miasto:</span>
              <span className="font-bold text-emerald-400">{currentCityName || "AUCKLAND"}</span>
            </div>
            {onSkipCity && (
              <button
                onClick={onSkipCity}
                className="py-1.5 px-3 rounded-lg bg-red-600/90 hover:bg-red-500 text-white text-xs font-mono font-semibold transition flex items-center gap-1.5 cursor-pointer shadow"
              >
                <FastForward className="w-3.5 h-3.5" />
                Następne miasto
              </button>
            )}
          </div>
        </div>
      )}

      {/* Kid's Hometown Customizer */}
      <div className="pt-2 border-t border-neutral-800">
        <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1.5 mb-1.5 font-bold">
          <MapPin className="w-3.5 h-3.5 text-red-400" />
          Miasto dziecka (Gdzie leci Mikołaj?)
        </label>
        <form onSubmit={handleCitySubmit} className="flex gap-2">
          <input
            type="text"
            value={cityInput}
            maxLength={14}
            onChange={(e) => setCityInput(e.target.value)}
            placeholder="np. KRAKÓW, WARSZAWA"
            className="bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase w-full focus:outline-none focus:border-amber-500 tracking-wider"
          />
          <button
            type="submit"
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl font-mono shrink-0 transition cursor-pointer"
          >
            Ustaw cel
          </button>
        </form>
      </div>

      {/* Live Playback & Hardware Simulation Toggles */}
      <div className="pt-2 border-t border-neutral-800 grid grid-cols-2 gap-2">
        {/* Buzzer Sound Toggle */}
        <button
          onClick={onToggleMute}
          className={`py-2 px-3 rounded-xl border text-xs font-mono font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
            !isMuted
              ? "bg-amber-500/20 border-amber-500/60 text-amber-300"
              : "bg-neutral-800/80 border-neutral-700 text-neutral-400"
          }`}
        >
          {!isMuted ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
          <span>Dźwięk: {!isMuted ? "WŁ." : "WYŁ."}</span>
        </button>

        {/* Tilt Device Preview */}
        <button
          onClick={onToggleTilt}
          className={`py-2 px-3 rounded-xl border text-xs font-mono font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
            isTilted
              ? "bg-orange-500/20 border-orange-500 text-orange-300"
              : "bg-neutral-800/80 border-neutral-700 text-neutral-400"
          }`}
        >
          <RotateCw className="w-4 h-4 text-orange-400" />
          <span>Obróć widok</span>
        </button>

        {/* Scanlines Filter Toggle */}
        <button
          onClick={onToggleScanlines}
          className={`py-2 px-3 rounded-xl border text-xs font-mono font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
            scanlines
              ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300"
              : "bg-neutral-800/80 border-neutral-700 text-neutral-400"
          }`}
        >
          <span>Siatka CRT: {scanlines ? "WŁ." : "WYŁ."}</span>
        </button>

        {/* Auto Cycle Toggle */}
        <button
          onClick={onToggleAutoCycle}
          className={`py-2 px-3 rounded-xl border text-xs font-mono font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
            autoCycle
              ? "bg-blue-500/20 border-blue-500/60 text-blue-300"
              : "bg-neutral-800/80 border-neutral-700 text-neutral-400"
          }`}
        >
          <span>Autocykl: {autoCycle ? "WŁ." : "WYŁ."}</span>
        </button>
      </div>

      {/* Speed Slider */}
      <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-xs font-mono">
        <span className="text-neutral-400">Prędkość symulacji:</span>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="1"
            max="8"
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="w-28 accent-amber-500 cursor-pointer"
          />
          <span className="font-bold text-amber-400 w-8 text-right">×{speed}</span>
        </div>
      </div>

      {/* Physical Hardware Controls Guide */}
      <div className="bg-neutral-950/70 p-3 rounded-xl border border-neutral-800/90 text-[11px] font-mono text-neutral-400 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-neutral-300 font-bold">⌨️ Sterowanie klawiaturą:</span>
        </div>
        <div className="flex items-center justify-between">
          <span><kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-amber-400 border border-neutral-700">Spacja</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-amber-400 border border-neutral-700">A</kbd></span>
          <span>Przycisk A (Następny ekran)</span>
        </div>
        <div className="flex items-center justify-between">
          <span><kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-amber-400 border border-neutral-700">Klawisz B</kbd></span>
          <span>Przycisk B (Akcja / Doładowanie)</span>
        </div>
      </div>
    </div>
  );
};
