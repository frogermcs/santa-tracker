"use client";

import React, { useEffect, useState } from "react";
import { Zap, AlertCircle } from "lucide-react";
import { checkWebSerialSupport } from "@/lib/installer/browser-support";

interface ESPWebInstallButtonProps {
  manifestUrl?: string;
  className?: string;
}

export function ESPWebInstallButton({
  manifestUrl = "/firmware/manifest.json",
  className = "",
}: ESPWebInstallButtonProps) {
  const [mounted, setMounted] = useState(false);
  const [supportInfo, setSupportInfo] = useState({ isSupported: false, recommendation: "" });

  useEffect(() => {
    // Dynamically load pre-bundled esp-web-tools on client side only
    // @ts-expect-error - dist/web is the standalone pre-bundled web distribution
    import("esp-web-tools/dist/web/install-button.js")
      .then(() => {
        setMounted(true);
      })
      .catch((err) => {
        console.error("Failed to load esp-web-tools:", err);
      });

    setSupportInfo(checkWebSerialSupport());
  }, []);

  if (!mounted) {
    return (
      <div className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900/80 text-slate-400 font-mono text-sm border border-white/10 animate-pulse">
        <Zap className="w-4 h-4 text-slate-500" />
        <span>Inicjalizacja instalatora Web Serial...</span>
      </div>
    );
  }

  return (
    <div className={`inline-block ${className}`}>
      <esp-web-install-button manifest={manifestUrl}>
        <button
          slot="activate"
          className="group relative inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-mono font-bold text-sm sm:text-base shadow-xl shadow-emerald-950/70 border border-emerald-400/40 hover:border-emerald-300 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          <span className="p-1 rounded-lg bg-black/20 group-hover:scale-110 transition-transform">
            <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
          </span>
          <div className="flex flex-col text-left">
            <span>⚡ Zainstaluj Santa-OS</span>
            <span className="text-[11px] text-emerald-200/90 font-normal">
              Wgraj firmware przez kabel USB
            </span>
          </div>
        </button>

        <div
          slot="unsupported"
          className="inline-flex items-start gap-2.5 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs font-mono max-w-md text-left"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Przeglądarka nieobsługiwana:</span>
            <span>{supportInfo.recommendation}</span>
          </div>
        </div>

        <div
          slot="not-allowed"
          className="inline-flex items-start gap-2.5 p-3 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs font-mono max-w-md text-left"
        >
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Wymagane bezpieczne połączenie:</span>
            <span>Web Serial wymaga protokołu HTTPS lub uruchomienia na localhost.</span>
          </div>
        </div>
      </esp-web-install-button>
    </div>
  );
}
