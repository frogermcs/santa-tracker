"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Compass,
  Gauge,
  Sparkles,
  HelpCircle,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { ESPWebInstallButton } from "@/components/installer/ESPWebInstallButton";
import { SnowEffect } from "@/components/SnowEffect";
import { checkWebSerialSupport, BrowserSupportInfo } from "@/lib/installer/browser-support";

export default function InstallPage() {
  const [support, setSupport] = useState<BrowserSupportInfo | null>(null);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  useEffect(() => {
    setSupport(checkWebSerialSupport());
  }, []);

  return (
    <div className="min-h-screen bg-[#060a16] text-slate-100 flex flex-col relative overflow-x-hidden">
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
          <div className="w-8 h-8 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-center justify-center p-1 shadow-sm shrink-0">
            <Image src="/santa-icon.svg" alt="Santa" width={24} height={24} className="w-6 h-6" priority />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold font-mono tracking-tight text-white">
              SANTA-OS
            </h1>
          </div>
        </div>

        <Link
          href="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition font-bold font-mono text-xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
          <span>Powrót do Radaru</span>
        </Link>
      </header>

      {/* Hero Component */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 py-12 sm:py-20 max-w-3xl mx-auto space-y-8 relative z-10 w-full">
        {/* Santa-OS Badge */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-rose-950/40 border border-rose-500/30 flex items-center justify-center p-3 shadow-lg">
          <Image
            src="/santa-icon.svg"
            alt="Santa-OS"
            width={72}
            height={72}
            className="w-14 h-14 sm:w-16 sm:h-16"
            priority
          />
        </div>

        {/* Hero Title & Description */}
        <div className="space-y-3">
          <h2 className="text-3xl sm:text-5xl font-black font-mono tracking-tight text-white text-balance">
            Zainstaluj SANTA-OS
          </h2>
          <p className="text-base sm:text-lg text-slate-300 max-w-lg mx-auto font-sans leading-relaxed text-pretty">
            Podłącz M5Stick kablem USB do komputera i uruchom radar Świętego Mikołaja bezpośrednio z przeglądarki.
          </p>
        </div>

        {/* Big Install Button */}
        <div className="space-y-3 w-full flex flex-col items-center">
          <ESPWebInstallButton size="hero" label="Zainstaluj na M5Stick" />

          {/* Browser / Protocol Status */}
          {support && (
            <div className="flex items-center justify-center gap-2 text-xs font-mono">
              {support.isSupported ? (
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Web Serial API gotowy ({support.browserName})</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-rose-300">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                  <span>{support.recommendation}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fancy Santa-OS Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full pt-4">
          <div className="p-4 rounded-2xl bg-[#0c162b]/80 border border-white/10 text-left space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-xs">
              <Compass className="w-4 h-4 shrink-0" />
              <span>MikoRadar</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed text-pretty">
              Śledź trasę Mikołaja na żywo.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#0c162b]/80 border border-white/10 text-left space-y-1">
            <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-xs">
              <Gauge className="w-4 h-4 shrink-0" />
              <span>Kokpit Misji</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed text-pretty">
              Sprawdź telemetrię misji Mikołaja.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#0c162b]/80 border border-white/10 text-left space-y-1">
            <div className="flex items-center gap-2 text-rose-400 font-mono font-bold text-xs">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Santa Cam</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed text-pretty">
              Zobacz Mikołaja w akcji.
            </p>
          </div>
        </div>

        {/* Minimal Expandable Troubleshooting */}
        <div className="w-full pt-4">
          <button
            onClick={() => setShowTroubleshooting((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
            <span>{showTroubleshooting ? "Ukryj pomoc i sterowniki USB ▲" : "Potrzebujesz pomocy ze sterownikami USB? ▼"}</span>
          </button>

          {showTroubleshooting && (
            <div className="mt-4 p-5 rounded-2xl bg-[#0c162b]/90 border border-white/10 text-left space-y-3 font-mono text-xs">
              <p className="text-slate-300 leading-relaxed text-pretty">
                M5Stick wykorzystuje konwerter USB-UART (CP2104 lub CH9102). Jeśli port nie pojawia się w oknie wyboru:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <a
                  href="https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-lg border border-white/15 hover:border-white/30 hover:bg-white/[0.03] flex items-center justify-between text-sky-300 transition"
                >
                  <div>
                    <span className="font-bold block text-white text-xs">CP2104 (Silicon Labs)</span>
                    <span className="text-xs text-slate-400">Dla M5StickC-Plus</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-sky-400 shrink-0 ml-2" />
                </a>

                <a
                  href="https://www.wch-ic.com/downloads/CH343SER_ZIP.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-lg border border-white/15 hover:border-white/30 hover:bg-white/[0.03] flex items-center justify-between text-emerald-300 transition"
                >
                  <div>
                    <span className="font-bold block text-white text-xs">CH9102 (WCH)</span>
                    <span className="text-xs text-slate-400">Dla M5StickC-Plus SE</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                </a>
              </div>

              <div className="pt-2 border-t border-white/10 text-xs text-slate-300 space-y-1">
                <span className="font-bold text-amber-300 block">Wskazówki:</span>
                <ul className="space-y-1 list-disc list-inside text-slate-300 text-pretty">
                  <li>Użyj kabla USB-C z liniami danych (nie tylko do ładowania).</li>
                  <li>W razie braku reakcji przytrzymaj przedni przycisk M5 (GPIO0) podczas wpinania kabla.</li>
                  <li>W Linuksie dodaj uprawnienia: <code>sudo usermod -a -G dialout $USER</code>.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-white/10 py-5 text-center text-xs font-mono text-slate-400 relative z-10">
        SANTA-OS • Autonomiczny radar Świętego Mikołaja na M5StickC-Plus
      </footer>
    </div>
  );
}
