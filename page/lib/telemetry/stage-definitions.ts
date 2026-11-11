/**
 * Canonical Mission Stage & Santa Cam Scene Definitions
 *
 * Single Source of Knowledge for all 7 dynamic sub-phase scenes across:
 * - Santa Cam (Screen 3)
 * - Cockpit Dashboard Tactical Box (Screen 2)
 * - Web Companion Telemetry Sidebar
 * - C++ Firmware LovyanGFX screens (1:1 Parity)
 */

export type CamSceneMode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface CamSceneInfo {
  mode: CamSceneMode;
  name: string;
  badge: string;
  description: string;
  timing: string;
}

export const CAM_SCENE_DEFINITIONS: CamSceneInfo[] = [
  {
    mode: 1,
    name: "Tryb 1: Hyper-Warp",
    badge: "TRYB HYPER-WARP",
    description: "Naddźwiękowe przyspieszenie, poziome smugi prędkości, wibracje kadłuba i rozbłyski nosa Rudolfa.",
    timing: "Lot 0% – 30% (0.0s – 4.5s)",
  },
  {
    mode: 2,
    name: "Tryb 2: Przelot Stratosferyczny",
    badge: "PRZELOT STRATOSFERYCZNY",
    description: "Lot ponad krzywizną kuli ziemskiej, świecąca linia atmosfery, nocne kontynenty i rozgwieżdżony kosmos.",
    timing: "Lot 30% – 80% (4.5s – 12.0s)",
  },
  {
    mode: 3,
    name: "Tryb 3: Zniżanie",
    badge: "ZNIZANIE",
    description: "Łagodne opadanie z pułapu ku ośnieżonym choinkom rosnącym w perspektywie, rozświetlonym kolorowymi lampkami świątecznymi.",
    timing: "Lot 80% – 100% (12.0s – 15.0s)",
  },
  {
    mode: 4,
    name: "Tryb 4: Zrzut Prezentów",
    badge: "ZRZUT PREZENTOW",
    description: "Sanie płyną nisko nad przesuwanymi dachami, aktywne zrzucanie prezentów na spadochronach do kominów.",
    timing: "Postój 0s – 6s (15.0s – 21.0s)",
  },
  {
    mode: 5,
    name: "Tryb 5: Przerwa na Ciastka i Mleko",
    badge: "PRZERWA NA CIASTKA I MLEKO",
    description: "Zbliżenie: powiększony Mikołaj przy ciepłym kominku, jedzenie ciastka z czekoladą, szklanka mleka i okruchy.",
    timing: "Postój 6s – 12s (21.0s – 27.0s)",
  },
  {
    mode: 6,
    name: "Tryb 6: Wznoszenie",
    badge: "WZNOSZENIE",
    description: "Start i wznoszenie ponad ośnieżone choinki, które maleją w perspektywie, ku rozgwieżdżonemu niebu.",
    timing: "Postój 12s – 15s (27.0s – 30.0s)",
  },
  {
    mode: 7,
    name: "Tryb 7: Wesołych Świąt!",
    badge: "WESOŁYCH ŚWIĄT!",
    description: "Permanentna celebracja 24 grudnia: sanie na dachu z widokiem na wieże Bazyliki Mariackiej i fajerwerki.",
    timing: "Dzień 24 / Stop 12 (Blokada Przybycia)",
  },
  {
    mode: 8,
    name: "Tryb 8: Urlop na Biegunie",
    badge: "POZA SEZONEM",
    description: "Odpoczynek przed startem: Mikołaj w fotelu z parującym kubkiem, śpiący Rudolf z migającym nosem i odliczanie do 1 grudnia.",
    timing: "Poza sezonem (styczeń–listopad, po 24 grudnia)",
  },
];

/**
 * Resolves the canonical mission phase info for a given city simulation progress `u`
 * (0..30s in demo mode, or 0..7200s in real mode) or grand finale lock state.
 */
export function getMissionPhaseInfo(
  u: number,
  isDay24Finale: boolean,
  flightDuration = 15.0,
  totalDuration = 30.0
): CamSceneInfo {
  if (isDay24Finale) {
    return CAM_SCENE_DEFINITIONS[6]; // Mode 7: Wesołych Świąt!
  }

  if (u < flightDuration) {
    const flightProgress = flightDuration > 0 ? u / flightDuration : 1.0;
    if (flightProgress < 0.3) {
      return CAM_SCENE_DEFINITIONS[0]; // Mode 1: Hyper-Warp (0..30%)
    } else if (flightProgress < 0.8) {
      return CAM_SCENE_DEFINITIONS[1]; // Mode 2: Przelot Stratosferyczny (30..80%)
    } else {
      return CAM_SCENE_DEFINITIONS[2]; // Mode 3: Zniżanie (80..100%)
    }
  } else {
    const landedDuration = Math.max(1, totalDuration - flightDuration);
    const landedProgress = Math.min(1.0, (u - flightDuration) / landedDuration);
    if (landedProgress < 0.4) {
      return CAM_SCENE_DEFINITIONS[3]; // Mode 4: Zrzut Prezentów (0..40%)
    } else if (landedProgress < 0.8) {
      return CAM_SCENE_DEFINITIONS[4]; // Mode 5: Przerwa na Ciastka i Mleko (40..80%)
    } else {
      return CAM_SCENE_DEFINITIONS[5]; // Mode 6: Wznoszenie (80..100%)
    }
  }
}
