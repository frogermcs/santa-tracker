"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Usb, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
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
  const [hasError, setHasError] = useState(false);
  const [supportInfo, setSupportInfo] = useState({ isSupported: false, recommendation: "" });

  const loadTools = useCallback(() => {
    setHasError(false);
    // Dynamically load pre-bundled esp-web-tools on client side only
    // @ts-expect-error - dist/web is the standalone pre-bundled web distribution
    import("esp-web-tools/dist/web/install-button.js")
      .then(() => {
        setMounted(true);
      })
      .catch((err) => {
        console.error("Failed to load esp-web-tools:", err);
        setHasError(true);
      });
  }, []);

  useEffect(() => {
    loadTools();
    setSupportInfo(checkWebSerialSupport());
  }, [loadTools]);

  if (hasError) {
    return (
      <div className="flex items-center justify-between gap-3 p-3 px-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs font-mono">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>Błąd ładowania modułu Web Serial.</span>
        </div>
        <button
          onClick={loadTools}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-900/60 hover:bg-rose-800 text-white text-xs font-bold transition border border-rose-400/30 cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Ponów</span>
        </button>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#091326] text-slate-400 font-mono text-xs border border-white/10">
        <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
        <span>Inicjalizacja modułu Web Serial...</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <esp-web-install-button manifest={manifestUrl}>
        <button
          slot="activate"
          className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-mono font-bold text-sm border border-emerald-400/50 shadow-md shadow-emerald-950/40 transition cursor-pointer"
        >
          <Usb className="w-4 h-4 text-emerald-200" />
          <span>Wgraj oprogramowanie do pamięci Flash</span>
        </button>

        <div
          slot="unsupported"
          className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs font-mono text-left"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-rose-100">Przeglądarka nieobsługiwana:</span>
            <span className="text-rose-200/90">{supportInfo.recommendation}</span>
          </div>
        </div>

        <div
          slot="not-allowed"
          className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs font-mono text-left"
        >
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-amber-100">Wymagany bezpieczny kontekst:</span>
            <span className="text-amber-200/90">Web Serial wymaga protokołu HTTPS lub uruchomienia na localhost.</span>
          </div>
        </div>
      </esp-web-install-button>
    </div>
  );
}
