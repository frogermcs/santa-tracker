"use client";

import React from "react";
import { Snowflake, TreePine, Star, Gift } from "lucide-react";

/**
 * Subtle, non-interactive Christmas background accents tailored for the
 * warm gingerbread-cream ("Kurier Bieguna Północnego") paper aesthetic.
 */
export const FestivePaperBackdrop: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
    >
      {/* Top festive Nordic-inspired ribbon bar */}
      <div className="h-2 w-full bg-[repeating-linear-gradient(90deg,#c81e1e_0px,#c81e1e_24px,#fbf3e4_24px,#fbf3e4_30px,#0d3b26_30px,#0d3b26_54px,#fbf3e4_54px,#fbf3e4_60px)] opacity-90" />

      {/* Soft warm candlelight radial glow behind the right-hand gadget stage */}
      <div className="absolute -right-24 top-1/4 w-[34rem] h-[34rem] rounded-full bg-[radial-gradient(circle,rgba(234,88,12,0.12)_0%,rgba(251,191,36,0.08)_40%,transparent_70%)]" />

      {/* Subtle corner & margin Christmas icons at low contrast */}
      <Snowflake className="absolute top-20 left-[4%] w-10 h-10 text-[#0d3b26]/10 rotate-12" />
      <Snowflake className="absolute top-36 right-[6%] w-8 h-8 text-[#c81e1e]/12 -rotate-12" />
      <Star className="hidden sm:block absolute top-24 left-[28%] w-5 h-5 text-[#d97706]/20 fill-[#d97706]/15 rotate-6" />
      <Star className="hidden md:block absolute bottom-28 left-[46%] w-6 h-6 text-[#c81e1e]/12 fill-[#c81e1e]/10 -rotate-12" />
      <Snowflake className="hidden sm:block absolute bottom-20 left-[8%] w-12 h-12 text-[#0d3b26]/10 rotate-45" />
      <Gift className="hidden md:block absolute bottom-24 right-[8%] w-10 h-10 text-[#c81e1e]/12 rotate-6" />
      <TreePine className="hidden lg:block absolute bottom-14 right-[22%] w-14 h-14 text-[#0d3b26]/10 -rotate-3" />
      <TreePine className="hidden lg:block absolute top-[55%] left-[2%] w-11 h-11 text-[#0d3b26]/10 rotate-3" />
    </div>
  );
};
