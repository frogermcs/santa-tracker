"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Wifi, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { checkWebSerialSupport } from "@/lib/installer/browser-support";

interface ImprovWifiButtonProps {
  className?: string;
  label?: string;
}

export function ImprovWifiButton({
  className = "",
  label = "Skonfiguruj Wi-Fi",
}: ImprovWifiButtonProps) {
  const [mounted, setMounted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [supportInfo, setSupportInfo] = useState({ isSupported: false, recommendation: "" });

  const loadTools = useCallback(() => {
    setHasError(false);
    // Dynamically load pre-bundled improv-wifi-serial-sdk on client side only
    // @ts-expect-error - dist/web is the standalone pre-bundled web distribution
    import("improv-wifi-serial-sdk/dist/web/serial-launch-button.js")
      .then(() => {
        setMounted(true);
      })
      .catch((err) => {
        console.error("Failed to load improv-wifi-serial-sdk:", err);
        setHasError(true);
      });
  }, []);

  useEffect(() => {
    loadTools();
    setSupportInfo(checkWebSerialSupport());
  }, [loadTools]);

  if (hasError) {
    return (
      <button
        onClick={loadTools}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-mono border border-rose-500/30 transition cursor-pointer"
        title="Ponów ładowanie modułu Wi-Fi"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Błąd Wi-Fi (Ponów)</span>
      </button>
    );
  }

  if (!mounted) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#091326] text-slate-400 font-mono text-xs border border-white/10">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
        <span>Inicjalizacja Wi-Fi...</span>
      </div>
    );
  }

  return (
    <div className={`inline-block ${className}`}>
      <improv-wifi-serial-launch-button>
        <button
          slot="activate"
          type="button"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 active:bg-sky-500/30 border border-sky-500/40 hover:border-sky-400/60 text-sky-200 hover:text-white font-mono text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          <Wifi className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span>{label}</span>
        </button>

        {!supportInfo.isSupported && (
          <div
            slot="unsupported"
            className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs font-mono text-left max-w-xs"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Wymaga Chrome lub Edge.</span>
          </div>
        )}
      </improv-wifi-serial-launch-button>
    </div>
  );
}
