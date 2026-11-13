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
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#fde8e8] hover:bg-[#fbd5d5] text-[#991b1b] text-xs font-mono font-bold border border-[#c81e1e] transition cursor-pointer"
        title="Ponów ładowanie modułu Wi-Fi"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Błąd Wi-Fi (Ponów)</span>
      </button>
    );
  }

  if (!mounted) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f2e4cb] text-[#4a3525] font-mono text-xs border border-[#d5c19e]">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#c81e1e]" />
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
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#f2e4cb] hover:bg-[#e7d4b3] border-2 border-[#0d3b26] text-[#0d3b26] font-mono text-xs font-bold transition cursor-pointer"
        >
          <Wifi className="w-3.5 h-3.5 text-[#0d3b26] shrink-0" />
          <span>{label}</span>
        </button>

        {!supportInfo.isSupported && (
          <div
            slot="unsupported"
            className="flex items-center gap-2 p-2.5 rounded-lg bg-[#fde8e8] border border-[#c81e1e] text-[#7f1d1d] text-xs font-mono text-left max-w-xs mt-2"
          >
            <AlertCircle className="w-4 h-4 text-[#c81e1e] shrink-0" />
            <span>Wymaga Chrome lub Edge.</span>
          </div>
        )}
      </improv-wifi-serial-launch-button>
    </div>
  );
}
