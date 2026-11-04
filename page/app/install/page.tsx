"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Usb,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Radio,
  Sparkles,
} from "lucide-react";
import { ESPWebInstallButton } from "@/components/installer/ESPWebInstallButton";
import { checkWebSerialSupport, BrowserSupportInfo } from "@/lib/installer/browser-support";
import { APP_VERSION } from "@/lib/version";

export default function InstallPage() {
  const [support, setSupport] = useState<BrowserSupportInfo | null>(null);
  const [isDriversOpen, setIsDriversOpen] = useState(false);

  useEffect(() => {
    setSupport(checkWebSerialSupport());
  }, []);

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Header Bar */}
      <header className="border-b border-white/10 bg-[#060a16]/80 backdrop-blur-md px-4 sm:px-8 py-3.5 sticky top-0 z-50 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-mono font-bold text-slate-300 hover:text-white transition group"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400 group-hover:-translate-x-1 transition-transform" />
          <span>Powrót do symulatora radaru</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
            Web Installer v{APP_VERSION}
          </span>
        </div>
      </header>

      {/* Main Content Hub */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 space-y-10">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>M5StickC-Plus & Plus SE • In-Browser Flasher</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white font-mono">
            Wgraj <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-emerald-400">SANTA-OS</span> na swoje urządzenie
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-400 leading-relaxed">
            Zainstaluj oprogramowanie bezpośrednio z przeglądarki przez kabel USB. Bez instalacji PlatformIO, bez kompilatora C++ i bez aplikacji na telefon.
          </p>
        </div>

        {/* Browser Support Status Banner */}
        {support && (
          <div
            className={`p-4 sm:p-5 rounded-2xl border transition-all ${
              support.isSupported
                ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-200"
                : "bg-rose-950/30 border-rose-500/30 text-rose-200"
            }`}
          >
            <div className="flex items-start sm:items-center gap-3">
              {support.isSupported ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-sm sm:text-base text-white">
                    {support.isSupported ? "Web Serial: Obsługiwany" : "Web Serial: Brak obsługi"}
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-black/40 border border-white/10 text-slate-300">
                    {support.browserName}
                  </span>
                </div>
                <p className="text-xs sm:text-sm mt-1 opacity-90">{support.recommendation}</p>
              </div>
            </div>
          </div>
        )}

        {/* Central Flashing Action Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#0c162b] to-[#070d1a] border border-white/10 shadow-2xl relative overflow-hidden text-center space-y-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-2 relative z-10">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center justify-center gap-1.5">
              <Usb className="w-4 h-4 text-emerald-400" />
              Jedno kliknięcie przez USB
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-mono text-white">
              Gotowy do instalacji?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
              Upewnij się, że urządzenie jest podłączone do komputera, a następnie kliknij poniższy przycisk, aby rozpocząć proces wgrywania.
            </p>
          </div>

          {/* Web Installer Component */}
          <div className="pt-2 pb-2 relative z-10">
            <ESPWebInstallButton />
          </div>

          <div className="flex items-center justify-center gap-4 text-[11px] font-mono text-slate-400 pt-2 border-t border-white/5">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              100% bezpieczne wgranie do pamięci Flash
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 text-sky-400" />
              Działa od razu offline
            </span>
          </div>
        </div>

        {/* 3-Step Preparation Guide */}
        <div className="space-y-4">
          <h3 className="text-base font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-amber-400" />
            Jak przebiega instalacja? (3 proste kroki)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#091122]/80 border border-white/10 space-y-2.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xs font-mono font-bold text-emerald-400">
                1
              </div>
              <h4 className="font-bold text-sm text-white">Podłącz M5Stick do USB</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Podłącz M5StickC-Plus lub SE kablem USB-C do portu w komputerze. Ważne: upewnij się, że kabel przesyła dane (nie jest kablem wyłącznie do ładowania).
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#091122]/80 border border-white/10 space-y-2.5">
              <div className="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xs font-mono font-bold text-amber-400">
                2
              </div>
              <h4 className="font-bold text-sm text-white">Wybierz port szeregowy</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Po kliknięciu przycisku przeglądarka wyświetli okienko wyboru portu. Wybierz port z nazwą <code>CP2104</code> lub <code>CH9102 USB to UART</code> i kliknij <i>Połącz</i>.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#091122]/80 border border-white/10 space-y-2.5">
              <div className="w-7 h-7 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-xs font-mono font-bold text-sky-400">
                3
              </div>
              <h4 className="font-bold text-sm text-white">Gotowe w 40 sekund</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Flasher automatycznie wgra system z paskiem postępu. Po zakończeniu urządzenie natychmiast zrestartuje się i uruchomi radar Świętego Mikołaja!
              </p>
            </div>
          </div>
        </div>

        {/* Troubleshooting & Drivers Dropdown */}
        <div className="p-5 rounded-2xl bg-[#060d1b] border border-white/10 space-y-3">
          <button
            onClick={() => setIsDriversOpen((prev) => !prev)}
            className="w-full flex items-center justify-between text-left font-mono text-sm font-bold text-slate-300 hover:text-white transition cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-sky-400" />
              Urządzenie nie pojawia się na liście portów? Sprawdź sterowniki
            </span>
            <span className="text-xs text-slate-400">{isDriversOpen ? "Zwiń ▲" : "Rozwiń ▼"}</span>
          </button>

          {isDriversOpen && (
            <div className="pt-3 border-t border-white/10 space-y-4 text-xs text-slate-300 font-mono">
              <p className="leading-relaxed">
                M5StickC-Plus oraz M5StickC-Plus SE wykorzystują układy konwertera USB-UART <b>CP2104 (Silicon Labs)</b> lub <b>CH9102F (WCH)</b>. Większość systemów macOS i Windows 11 posiada wbudowane sterowniki, jednak starsze wersje mogą wymagać instalacji:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <a
                  href="https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 flex items-center justify-between text-sky-300 transition"
                >
                  <div>
                    <span className="font-bold block text-white">Sterowniki CP2104 (Silicon Labs)</span>
                    <span className="text-[10px] text-slate-400">Dla klasycznego M5StickC-Plus</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-sky-400 shrink-0" />
                </a>

                <a
                  href="https://www.wch-ic.com/downloads/CH343SER_ZIP.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 flex items-center justify-between text-emerald-300 transition"
                >
                  <div>
                    <span className="font-bold block text-white">Sterowniki CH9102 (WCH)</span>
                    <span className="text-[10px] text-slate-400">Dla M5StickC-Plus SE</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-emerald-400 shrink-0" />
                </a>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-[11px] space-y-1">
                <span className="font-bold block">💡 Wskazówka dotycząca kabla USB:</span>
                <span>
                  Bardzo częstą przyczyną braku wykrywania urządzenia jest używanie kabla ładującego bez linii danych (D+/D-). Sprawdź urządzenie z innym przewodem USB-C.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Feature Highlights on Hardware */}
        <div className="p-6 rounded-2xl bg-[#091122]/60 border border-white/10 space-y-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 block">
            Co zyskujesz na urządzeniu fizycznym?
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span><b>Ekran 1: MikoRadar</b> — 912 punktów linii brzegowych, wirujący promień radaru, pulsujący kontakt i złote okruchy gwiezdnego pyłu.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">✓</span>
              <span><b>Ekran 2: Kokpit Misji</b> — prędkościomierz Mach 4.8, zliczanie miliardów prezentów, zapasy ciastek i mleka.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-sky-400 font-bold">✓</span>
              <span><b>Ekran 3: Santa Cam</b> — 7 kontekstowych scen pixel-art (od lotu stratosferycznego po zrzut prezentów i finał w Krakowie).</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-rose-400 font-bold">✓</span>
              <span><b>100% Gotowość Offline</b> — cała 24-dniowa trasa (288 miast) jest prekompilowana w pamięci Flash ROM. Działa od razu po podłączeniu zasilania!</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-xs font-mono text-slate-500">
        SANTA-OS • Autonomiczny system śledzenia Świętego Mikołaja • M5StickC-Plus
      </footer>
    </div>
  );
}
