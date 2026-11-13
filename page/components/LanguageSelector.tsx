"use client";

import React from "react";
import { useLanguage } from "@/components/LanguageContext";
import { Language } from "@/lib/i18n/translations";

const LANGUAGES: readonly { code: Language; label: string }[] = [
  { code: "pl", label: "PL" },
  { code: "en", label: "EN" },
];

export const LanguageSelector: React.FC = () => {
  const { lang, setLang, t } = useLanguage();

  return (
    <div
      role="group"
      aria-label={t.langSelectorAria}
      className="inline-flex items-center gap-1 bg-[#f2e4cb] border-2 border-[#d5c19e] p-1 rounded-xl"
    >
      {LANGUAGES.map(({ code, label }) => {
        const isActive = lang === code;
        return (
          <button
            key={code}
            type="button"
            lang={code}
            aria-pressed={isActive}
            onClick={() => setLang(code)}
            className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition cursor-pointer focus-visible:outline-2 focus-visible:outline-[#c81e1e] ${
              isActive
                ? "bg-[#c81e1e] text-[#fffaf0]"
                : "text-[#0d3b26] hover:bg-[#e7d5b6]"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};
