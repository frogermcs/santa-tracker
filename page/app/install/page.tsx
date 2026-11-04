"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Usb,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Layers,
  Terminal,
  HelpCircle,
} from "lucide-react";
import { ESPWebInstallButton } from "@/components/installer/ESPWebInstallButton";
import { SnowEffect } from "@/components/SnowEffect";
import { checkWebSerialSupport, BrowserSupportInfo } from "@/lib/installer/browser-support";
import { APP_VERSION } from "@/lib/version";

const MEMORY_PARTITIONS = [
  { offset: "0x001000", file: "bootloader.bin", desc: "ESP32 Second Stage Bootloader" },
  { offset: "0x008000", file: "partitions.bin", desc: "Układ partycji Flash (huge_app 3MB)" },
  { offset: "0x00E000", file: "boot_app0.bin", desc: "Rejestr stanu partycji OTA" },
  { offset: "0x010000", file: "firmware.bin", desc: `SANTA-OS v${APP_VERSION} (Aplikacja i dane)` },
];

export default function InstallPage() {
  const [support, setSupport] = useState<BrowserSupportInfo | null>(null);

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

      {/* Navigation Top Header (Strict parity with main radar view) */}
      <header className="border-b border-white/10 bg-[#070e1c]/75 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-center justify-center p-1 shadow-sm shrink-0">
            <Image src="/santa-icon.svg" alt="Santa" width={24} height={24} className="w-6 h-6" priority />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold font-mono tracking-tight text-white">
              SANTA-OS
            </h1>
            <span className="text-xs font-mono text-slate-400 border-l border-white/10 pl-2 hidden sm:inline">
              Flasher Firmware M5Stick
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-xs font-mono">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/80 border border-white/10 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>v{APP_VERSION}</span>
          </div>

          <Link
            href="/"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition font-bold cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>Powrót do Radaru</span>
          </Link>
        </div>
      </header>

      {/* Main Tactical Workbench */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6 relative z-10">
        {/* Title and Context */}
        <div className="border-b border-white/10 pb-4">
          <h2 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <span>Instalator Firmware M5Stick</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Bezpośrednie programowanie pamięci Flash mikrokontrolera przez interfejs Web Serial (USB-UART).
          </p>
        </div>

        {/* Browser Support Status Banner */}
        {support && (
          <div
            className={`p-4 rounded-xl border font-mono text-xs transition-all ${
              support.isSupported
                ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-200"
                : "bg-rose-950/40 border-rose-500/40 text-rose-200"
            }`}
          >
            <div className="flex items-start sm:items-center gap-3">
              {support.isSupported ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white">
                    {support.isSupported ? "Web Serial API aktywny" : "Brak obsługi Web Serial"}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-slate-300">
                    {support.browserName}
                  </span>
                </div>
                <p className="mt-1 opacity-90 leading-relaxed">{support.recommendation}</p>
              </div>
            </div>
          </div>
        )}

        {/* 12-Column Workbench Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Flasher Terminal & Memory Map (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Hardware Target & Flashing Specifications */}
            <div className="rounded-2xl bg-[#0c162b]/90 border border-white/10 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-amber-400" />
                  <span className="font-mono font-bold text-sm text-white">Parametry platformy docelowej</span>
                </div>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  ESP32-PICO-D4
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                <div className="p-2.5 rounded-lg bg-[#081224] border border-white/5">
                  <span className="text-slate-400 block text-[10px] uppercase">Urządzenie</span>
                  <span className="text-white font-bold">M5StickC-Plus / SE</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#081224] border border-white/5">
                  <span className="text-slate-400 block text-[10px] uppercase">Wyświetlacz</span>
                  <span className="text-white font-bold">ST7789v2 240×135</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#081224] border border-white/5">
                  <span className="text-slate-400 block text-[10px] uppercase">Prędkość UART</span>
                  <span className="text-emerald-400 font-bold">1 500 000 bps</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#081224] border border-white/5">
                  <span className="text-slate-400 block text-[10px] uppercase">Rozmiar ROM</span>
                  <span className="text-amber-300 font-bold">4 MB Flash</span>
                </div>
              </div>

              {/* Memory Partition Layout */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300">
                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                  <span className="font-bold">Układ partycji Flash (manifest.json)</span>
                </div>
                <div className="overflow-x-auto rounded-lg border border-white/10 bg-[#081224]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="border-b border-white/10 bg-slate-900/60 text-slate-400 text-[11px]">
                      <tr>
                        <th className="py-2 px-3">Adres offsetu</th>
                        <th className="py-2 px-3">Plik binarny</th>
                        <th className="py-2 px-3">Rola w pamięci Flash</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      {MEMORY_PARTITIONS.map((part) => (
                        <tr key={part.offset} className="hover:bg-white/[0.02]">
                          <td className="py-2 px-3 text-amber-300 font-bold">{part.offset}</td>
                          <td className="py-2 px-3 text-white">{part.file}</td>
                          <td className="py-2 px-3 text-slate-400">{part.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Trigger Card */}
              <div className="pt-2 border-t border-white/10 space-y-3">
                <ESPWebInstallButton />
                <p className="text-[11px] font-mono text-slate-400 text-center">
                  Przeglądarka wyświetli natywny selektor portów szeregowych. Wybierz podłączony moduł M5Stick.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Operational Checklist & Diagnostics (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* 3-Step Procedure */}
            <div className="rounded-2xl bg-[#0c162b]/90 border border-white/10 p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <Usb className="w-4 h-4 text-emerald-400" />
                <h3 className="font-mono font-bold text-sm text-white">Procedura instalacji</h3>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div className="flex gap-3 items-start p-3 rounded-lg bg-[#081224] border border-white/5">
                  <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 shrink-0">
                    1
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-bold text-white block">Podłączenie USB-C</span>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Połącz M5Stick kablem USB-C z komputerem. Upewnij się, że przewód posiada linie danych D+/D- (nie jest kablem wyłącznie ładującym).
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start p-3 rounded-lg bg-[#081224] border border-white/5">
                  <div className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400 shrink-0">
                    2
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-bold text-white block">Wybór portu szeregowego</span>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      W oknie wyboru wskaż port zawierający w nazwie <code>CP2104</code> lub <code>CH9102 USB to UART</code> i zatwierdź połączenie.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start p-3 rounded-lg bg-[#081224] border border-white/5">
                  <div className="w-6 h-6 rounded-md bg-sky-500/10 border border-sky-500/30 flex items-center justify-center font-bold text-sky-400 shrink-0">
                    3
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-bold text-white block">Zapis Flash i automatyczny restart</span>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Wgrywanie 4 partycji trwa ok. 35 sekund. Po weryfikacji sumy kontrolnej ESP32 zrestartuje się bezpośrednio do ekranu radaru.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Drivers and Hardware Diagnostics */}
            <div className="rounded-2xl bg-[#0c162b]/90 border border-white/10 p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <HelpCircle className="w-4 h-4 text-sky-400" />
                <h3 className="font-mono font-bold text-sm text-white">Sterowniki USB-UART i diagnostyka</h3>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Nowsze systemy operacyjne (macOS, Windows 11) posiadają wbudowane sterowniki. Jeśli port szeregowy nie pojawia się na liście, pobierz sterownik odpowiedni dla Twojego egzemplarza:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <a
                    href="https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-lg bg-[#081224] hover:bg-slate-800/80 border border-white/10 flex items-center justify-between text-sky-300 transition"
                  >
                    <div>
                      <span className="font-bold block text-white text-xs">CP2104 (Silicon Labs)</span>
                      <span className="text-[10px] text-slate-400">Dla M5StickC-Plus</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  </a>

                  <a
                    href="https://www.wch-ic.com/downloads/CH343SER_ZIP.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-lg bg-[#081224] hover:bg-slate-800/80 border border-white/10 flex items-center justify-between text-emerald-300 transition"
                  >
                    <div>
                      <span className="font-bold block text-white text-xs">CH9102 (WCH)</span>
                      <span className="text-[10px] text-slate-400">Dla M5StickC-Plus SE</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  </a>
                </div>

                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200 text-[11px] space-y-1">
                  <span className="font-bold block text-amber-100">Wymuszenie trybu Download (Bootloader):</span>
                  <p className="leading-relaxed">
                    W rzadkich przypadkach, gdy ESP32 nie odpowiada na automatyczny impuls resetu (DTR/RTS), odłącz kabel USB, wciśnij i przytrzymaj przedni przycisk M5 (GPIO0), a następnie podłącz kabel USB i kliknij instalację.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/60 border border-white/5 text-slate-400 text-[11px] space-y-1">
                  <span className="font-bold block text-slate-300">Użytkownicy systemu Linux:</span>
                  <p className="leading-relaxed">
                    Upewnij się, że Twoje konto należy do grupy uprawnień portów szeregowych: <code>sudo usermod -a -G dialout $USER</code>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Tactical Footer */}
      <footer className="border-t border-white/10 py-5 text-center text-xs font-mono text-slate-500 relative z-10">
        SANTA-OS v{APP_VERSION} • ESP32-PICO-D4 • Web Serial API
      </footer>
    </div>
  );
}
