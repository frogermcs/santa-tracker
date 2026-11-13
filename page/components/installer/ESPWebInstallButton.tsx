"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Usb, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { checkWebSerialSupport } from "@/lib/installer/browser-support";
import { useLanguage } from "@/components/LanguageContext";

interface ESPWebInstallButtonProps {
  manifestUrl?: string;
  className?: string;
  size?: "default" | "hero";
  label?: string;
}

export function ESPWebInstallButton({
  manifestUrl = "/firmware/manifest.json",
  className = "",
  size = "default",
  label,
}: ESPWebInstallButtonProps) {
  const { lang, t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [supportInfo, setSupportInfo] = useState({ isSupported: false, recommendation: "" });

  const resolvedLabel = label ?? t.install.installButtonDefaultLabel;

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
  }, [loadTools]);

  useEffect(() => {
    setSupportInfo(checkWebSerialSupport(undefined, undefined, undefined, lang));
  }, [lang]);

  if (hasError) {
    return (
      <div className="flex items-center justify-between gap-3 p-3 px-4 rounded-xl bg-[#fde8e8] border-2 border-[#c81e1e] text-[#7f1d1d] text-xs font-mono">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#c81e1e] shrink-0" />
          <span>{t.install.webSerialLoadError}</span>
        </div>
        <button
          onClick={loadTools}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#c81e1e] hover:bg-[#991b1b] text-[#fffaf0] text-xs font-bold transition cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          <span>{t.install.retry}</span>
        </button>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div
        className={
          size === "hero"
            ? "inline-flex items-center justify-center gap-3 px-8 sm:px-10 py-4 sm:py-5 rounded-xl bg-[#f2e4cb] text-[#0d3b26] font-mono font-bold text-sm sm:text-base border-2 border-[#d5c19e]"
            : "flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#f2e4cb] text-[#0d3b26] font-mono text-xs border-2 border-[#d5c19e]"
        }
      >
        <Loader2 className="w-5 h-5 animate-spin text-[#c81e1e]" />
        <span>{t.install.webSerialInit}</span>
      </div>
    );
  }

  const buttonClasses =
    size === "hero"
      ? "inline-flex items-center justify-center gap-4 pl-6 pr-3 py-3 rounded-xl bg-[#ea580c] hover:bg-[#dc4c05] active:translate-y-0.5 text-[#fffaf0] font-extrabold text-xl sm:text-2xl tracking-tight shadow-[0_4px_12px_rgba(153,27,27,0.35)] transition cursor-pointer focus-visible:outline-2 focus-visible:outline-[#0d3b26]"
      : "w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-[#ea580c] hover:bg-[#dc4c05] text-[#fffaf0] font-bold text-sm shadow-sm transition cursor-pointer";

  return (
    <div className={className}>
      <esp-web-install-button manifest={manifestUrl}>
        <button slot="activate" className={buttonClasses}>
          <span>{resolvedLabel}</span>
          <span
            className={
              size === "hero"
                ? "w-11 h-11 rounded-lg bg-[#991b1b] flex items-center justify-center shrink-0"
                : "w-7 h-7 rounded-md bg-[#991b1b] flex items-center justify-center shrink-0"
            }
          >
            <Usb className={size === "hero" ? "w-6 h-6 text-[#fffaf0]" : "w-4 h-4 text-[#fffaf0]"} />
          </span>
        </button>

        {!supportInfo.isSupported && (
          <div
            slot="unsupported"
            className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#fde8e8] border-2 border-[#c81e1e] text-[#7f1d1d] text-xs font-mono text-left max-w-md mx-auto mt-3"
          >
            <AlertCircle className="w-4 h-4 text-[#c81e1e] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-[#7f1d1d]">{t.install.unsupportedBrowserHeading}</span>
              <span>{supportInfo.recommendation}</span>
            </div>
          </div>
        )}
      </esp-web-install-button>
    </div>
  );
}
