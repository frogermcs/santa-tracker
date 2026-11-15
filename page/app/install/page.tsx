"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Compass,
  Gauge,
  Camera,
  HelpCircle,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { ESPWebInstallButton } from "@/components/installer/ESPWebInstallButton";
import { ImprovWifiButton } from "@/components/installer/ImprovWifiButton";
import { FestivePaperBackdrop } from "@/components/FestivePaperBackdrop";
import { FestiveGarlandGreeting } from "@/components/FestiveGarlandGreeting";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/components/LanguageContext";
import { checkWebSerialSupport, BrowserSupportInfo } from "@/lib/installer/browser-support";

export default function InstallPage() {
  const { lang, t } = useLanguage();
  const [support, setSupport] = useState<BrowserSupportInfo | null>(null);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  useEffect(() => {
    setSupport(checkWebSerialSupport(undefined, undefined, undefined, lang));
  }, [lang]);

  return (
    <div className="min-h-screen bg-[#fbf3e4] text-[#0d3b26] flex flex-col relative overflow-x-clip selection:bg-[#c81e1e] selection:text-[#fbf3e4]">
      <FestivePaperBackdrop />
      {/* Masthead */}
      <header className="max-w-6xl w-full mx-auto px-5 sm:px-10 pt-5 pb-4 border-b border-[#dfd0b4] grid grid-cols-3 items-center gap-4 relative z-20">
        <div className="flex justify-start">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-sans text-sm font-bold text-[#0d3b26] hover:text-[#c81e1e] transition focus-visible:outline-2 focus-visible:outline-[#c81e1e]"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>{t.install.backHome}</span>
          </Link>
        </div>

        <div className="flex items-center justify-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#f3e5cb] border-2 border-[#3b2316] flex items-center justify-center p-1 shrink-0">
            <Image
              src="/santa-icon.svg"
              alt="Santa OS"
              width={24}
              height={24}
              className="w-6 h-6"
              priority
            />
          </div>
          <span className="font-poster text-2xl font-extrabold tracking-tight text-[#3b2316]">
            Santa OS
          </span>
        </div>

        <div className="flex justify-end">
          <LanguageSelector />
        </div>
      </header>

      {/* Main Install Stage */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-5 sm:px-8 py-10 sm:py-16 max-w-3xl mx-auto space-y-8 relative z-10 w-full">
        {/* Title & Subcopy */}
        <div className="space-y-3">
          <h1 className="font-poster text-5xl sm:text-6xl font-extrabold uppercase tracking-[-0.02em] leading-[0.95] text-[#c81e1e] text-balance">
            {t.install.title}
          </h1>
          <p className="text-lg sm:text-xl font-bold text-[#0d3b26] max-w-xl mx-auto leading-snug text-pretty">
            {t.install.subtitle}
          </p>
        </div>

        {/* Primary Flasher & Wi-Fi Setup */}
        <div className="space-y-4 w-full flex flex-col items-center">
          <ESPWebInstallButton size="hero" label={t.install.installButtonLabel} />

          <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs pt-1">
            <span className="font-bold text-[#4a3525]">{t.install.alreadyHavePrompt}</span>
            <ImprovWifiButton label={t.install.configureWifiLabel} />
          </div>

          {support && (
            <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold pt-1">
              {support.isSupported ? (
                <div className="flex items-center gap-1.5 text-[#0d3b26]">
                  <CheckCircle2 className="w-4 h-4 text-[#15803d] shrink-0" />
                  <span>{t.install.webSerialReady(support.browserName)}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[#c81e1e]">
                  <AlertTriangle className="w-4 h-4 text-[#c81e1e] shrink-0" />
                  <span>{support.recommendation}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3 Screens Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 w-full border-t border-b border-[#dfd0b4] divide-y sm:divide-y-0 sm:divide-x divide-[#dfd0b4] text-left">
          <div className="py-4 sm:px-5 space-y-1">
            <div className="flex items-center gap-2 text-[#0d3b26] font-mono font-bold text-xs uppercase">
              <Compass className="w-4 h-4 text-[#15803d] shrink-0" />
              <span>{t.install.featureRadarTitle}</span>
            </div>
            <p className="text-sm text-[#4a3525] leading-snug">
              {t.install.featureRadarDesc}
            </p>
          </div>

          <div className="py-4 sm:px-5 space-y-1">
            <div className="flex items-center gap-2 text-[#0d3b26] font-mono font-bold text-xs uppercase">
              <Gauge className="w-4 h-4 text-[#ea580c] shrink-0" />
              <span>{t.install.featureCockpitTitle}</span>
            </div>
            <p className="text-sm text-[#4a3525] leading-snug">
              {t.install.featureCockpitDesc}
            </p>
          </div>

          <div className="py-4 sm:px-5 space-y-1">
            <div className="flex items-center gap-2 text-[#0d3b26] font-mono font-bold text-xs uppercase">
              <Camera className="w-4 h-4 text-[#c81e1e] shrink-0" />
              <span>{t.install.featureCamTitle}</span>
            </div>
            <p className="text-sm text-[#4a3525] leading-snug">
              {t.install.featureCamDesc}
            </p>
          </div>
        </div>

        {/* Expandable USB Troubleshooting */}
        <div className="w-full pt-1">
          <button
            type="button"
            onClick={() => setShowTroubleshooting((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#4a3525] hover:text-[#c81e1e] transition cursor-pointer focus-visible:outline-2 focus-visible:outline-[#c81e1e]"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#c81e1e]" />
            <span>
              {showTroubleshooting
                ? t.install.hideTroubleshooting
                : t.install.showTroubleshooting}
            </span>
          </button>

          {showTroubleshooting && (
            <div className="mt-4 p-5 rounded-xl bg-[#f2e4cb] border-2 border-[#d5c19e] text-left space-y-3 font-mono text-xs text-[#3b2316]">
              <p className="leading-relaxed text-pretty">
                {t.install.uartExplanation}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <a
                  href="https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-lg bg-[#fbf3e4] border border-[#d5c19e] hover:border-[#0d3b26] flex items-center justify-between text-[#0d3b26] transition"
                >
                  <div>
                    <span className="font-bold block text-xs">
                      CP2104 (Silicon Labs)
                    </span>
                    <span className="text-xs text-[#5c3d28]">
                      {t.install.forM5StickCPlus}
                    </span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-[#c81e1e] shrink-0 ml-2" />
                </a>

                <a
                  href="https://www.wch-ic.com/downloads/CH343SER_ZIP.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-lg bg-[#fbf3e4] border border-[#d5c19e] hover:border-[#0d3b26] flex items-center justify-between text-[#0d3b26] transition"
                >
                  <div>
                    <span className="font-bold block text-xs">
                      CH9102 (WCH)
                    </span>
                    <span className="text-xs text-[#5c3d28]">
                      {t.install.forM5StickCPlusSE}
                    </span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-[#0d3b26] shrink-0 ml-2" />
                </a>
              </div>

              <div className="pt-2 border-t border-[#d5c19e] text-xs space-y-1">
                <span className="font-bold text-[#c81e1e] block">{t.install.tipsHeading}</span>
                <ul className="space-y-1 list-disc list-inside text-[#3b2316] text-pretty">
                  <li>
                    {t.install.tipDataCable}
                  </li>
                  <li>
                    {t.install.tipWifi24}
                  </li>
                  <li>
                    {t.install.tipGpio0}
                  </li>
                  <li>
                    {t.install.tipLinuxPrefix}{" "}
                    <code>sudo usermod -a -G dialout $USER</code>.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Festive Christmas Garland Footer */}
      <footer className="max-w-6xl w-full mx-auto px-5 sm:px-10 py-4 border-t border-[#dfd0b4] flex flex-wrap items-center justify-between gap-3 relative z-10">
        <FestiveGarlandGreeting />
        <Link
          href="/debugger"
          className="text-xs font-bold text-[#0d3b26] hover:text-[#c81e1e] underline underline-offset-4 transition focus-visible:outline-2 focus-visible:outline-[#c81e1e]"
        >
          {t.install.footerDebuggerLink}
        </Link>
      </footer>
    </div>
  );
}
