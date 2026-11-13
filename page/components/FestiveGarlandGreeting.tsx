"use client";

import React from "react";
import { Snowflake, TreePine, Gift, Star } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

/**
 * Symmetrical Christmas garland and festive greeting used in the
 * warm holiday poster footers (`/` and `/install`).
 */
export const FestiveGarlandGreeting: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="inline-flex items-center gap-2.5 sm:gap-3">
      <span
        aria-hidden="true"
        className="inline-flex items-center gap-1.5 sm:gap-2"
      >
        <Snowflake className="w-4 h-4 text-[#0d3b26]/70" />
        <TreePine className="w-4 h-4 text-[#0d3b26]" />
        <Gift className="w-4 h-4 text-[#c81e1e]" />
        <Star className="w-3.5 h-3.5 text-[#d97706] fill-[#d97706]" />
      </span>
      <span className="font-poster text-base sm:text-lg font-extrabold uppercase tracking-wider text-[#c81e1e]">
        {t.garlandGreeting}
      </span>
      <span
        aria-hidden="true"
        className="inline-flex items-center gap-1.5 sm:gap-2"
      >
        <Star className="w-3.5 h-3.5 text-[#d97706] fill-[#d97706]" />
        <Gift className="w-4 h-4 text-[#c81e1e]" />
        <TreePine className="w-4 h-4 text-[#0d3b26]" />
        <Snowflake className="w-4 h-4 text-[#0d3b26]/70" />
      </span>
    </div>
  );
};
