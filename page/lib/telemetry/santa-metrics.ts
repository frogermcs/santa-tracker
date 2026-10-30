/**
 * SANTA-OS Cockpit Telemetry Engine (Wersja Polska)
 * Rzeczywisty model matematyczny oparty o globalną demografię populacji dzieci:
 * - Całkowita liczba dzieci na świecie (0-14 lat / obdarowywanych): ~2.20 Mld (2.20B)
 * - Średnia waga ładunku: ~1.10 Mln ton metrycznych
 * - Podział na 12 regionów w Wigilię (Dzień 24): od Oceanii (Gisborne), przez Azję,
 *   Afrykę, obie Ameryki, aż po wielki finał w Europie (Kraków)
 * - Rzeczywiste tempo zrzutu w oknie 1 godziny miejskiej: od 4.2k/s do 105.6k/s (w tranzycie: 0/s)
 * - Ciasteczka: ~330 Mln sztuk (1 talerzyk na ~6-7 prezentów)
 * - Mleko: ~25.3 Mln litrów (1 szklanka 200ml na ~17 prezentów)
 */

export interface SantaCockpitMetrics {
  // Dynamika lotu
  machSpeed: number;
  machDisplay: string;
  altitudeM: number;
  altitudeDisplay: string;
  flightPhase: "START" | "PRZELOT" | "ZNIZANIE" | "DACH" | "FINAL";

  // Ładunek prezentów (Rzeczywiste liczby globalne)
  giftsDelivered: number;
  giftsDeliveredDisplay: string;
  giftRatePerSec: number;
  giftRateDisplay: string;
  payloadPct: number;

  // Ciasteczka i Mleko
  cookiesEaten: number;
  cookiesEatenDisplay: string;
  milkLiters: number;
  milkLitersDisplay: string;

  // Faza misji i status (po polsku)
  stageTitle: string;
  stageDetail: string;
  targetCity: string;
  etaSeconds: number;
}

// Rozkład demograficzny prezentów dla 12 regionów Dnia 24 (Suma = dokładnie 2.200.000.000 prezentów)
const REGIONAL_GIFTS_DAY24 = [
  15_000_000,   // Stop 1: Gisborne (Oceania / Pacyfik)
  110_000_000,  // Stop 2: Bethlehem (Bliski Wschód / Lewant)
  85_000_000,   // Stop 3: Nicosia (Wsch. Morze Śródziemne)
  240_000_000,  // Stop 4: Khartoum (Afryka Wschodnia)
  220_000_000,  // Stop 5: Nouakchott (Afryka Zachodnia)
  130_000_000,  // Stop 6: Cayenne (Ameryka Płd. - Północ / Karaiby)
  150_000_000,  // Stop 7: Wyspa Wielkanocna (Ameryka Płd. - Południe / Andy)
  20_000_000,   // Stop 8: Kiritimati (Polinezja / Mikronezja)
  380_000_000,  // Stop 9: Honolulu (Ameryka Płn. - Wybrzeże Zachodnie)
  280_000_000,  // Stop 10: Nuuk (Ameryka Płn. - Wschód / Arktyka)
  190_000_000,  // Stop 11: Biegun Północny (Skandynawia / Północna Europa)
  380_000_000,  // Stop 12: Kraków (Europa Środkowa i Zachodnia - Finał Wigilii)
];

export function computeSantaMetrics(
  dayNum: number,
  activeIdx: number,
  u: number, // cykl 0..24s (0..12s przelot, 12..24s pobyt w mieście)
  nowSec: number,
  targetName: string,
  isDay24Finale: boolean
): SantaCockpitMetrics {
  const isFlight = !isDay24Finale && u < 12.0;

  // 1. Dynamika lotu (Prędkość Mach i Pułap w metrach)
  let machSpeed = 0.0;
  let altitudeM = 65; // Średnia wysokość dachów miejskich
  let flightPhase: SantaCockpitMetrics["flightPhase"] = "DACH";

  if (isDay24Finale) {
    machSpeed = 0.0;
    altitudeM = 219; // Wysokość n.p.m. krakowskiego Rynku
    flightPhase = "FINAL";
  } else if (isFlight) {
    const flightProgress = u / 12.0; // 0..1
    if (flightProgress < 0.2) {
      flightPhase = "START";
      const p = flightProgress / 0.2;
      machSpeed = p * 4.2;
      altitudeM = Math.round(65 + p * 10500);
    } else if (flightProgress < 0.8) {
      flightPhase = "PRZELOT";
      machSpeed = 4.8 + 0.3 * Math.sin(nowSec * 3);
      altitudeM = Math.round(11500 + 120 * Math.sin(nowSec * 1.5));
    } else {
      flightPhase = "ZNIZANIE";
      const p = (1.0 - flightProgress) / 0.2;
      machSpeed = Math.max(0.0, p * 4.8);
      altitudeM = Math.round(65 + p * 11500);
    }
  }

  // 2. Ładunek prezentów (Matematycznie rzeczywisty model demograficzny)
  let giftsDelivered = 0;
  let giftRatePerSec = 0;
  let currentStopGifts = 0;

  if (dayNum === 24) {
    // Dzień 24: Globalna misja wigilijna (cel: 2.20 Mld prezentów)
    const safeIdx = Math.min(activeIdx, REGIONAL_GIFTS_DAY24.length - 1);
    currentStopGifts = REGIONAL_GIFTS_DAY24[safeIdx];

    // Suma prezentów z poprzednich ukończonych miast
    let previousStopsGifts = 0;
    for (let i = 0; i < safeIdx; i++) {
      previousStopsGifts += REGIONAL_GIFTS_DAY24[i];
    }

    if (isDay24Finale) {
      // Kraków po lądowaniu: 100% z 2.20 Mld prezentów dostarczone!
      giftsDelivered = 2_200_000_000;
      giftRatePerSec = 0;
    } else if (isFlight) {
      // W trakcie lotu: luki ładunkowe zamknięte, tempo = 0/s
      giftsDelivered = previousStopsGifts;
      giftRatePerSec = 0;
    } else {
      // Podczas postoju na dachu: zrzut paczek dla bieżącego regionu
      const progress = Math.min(1.0, (u - 12.0) / 12.0);
      giftsDelivered = previousStopsGifts + Math.floor(currentStopGifts * progress);
      // Rzeczywiste tempo: liczba paczek regionu podzielona przez 1 godzinę (3600 sekund)
      giftRatePerSec = Math.round(currentStopGifts / 3600);
    }
  } else {
    // Dni 1-23: Wczesne etapy adwentowe i Mikołajki (skala od 2.5M do 450M)
    const dayTarget = 2_500_000 + Math.round(Math.pow(dayNum / 24, 2) * 450_000_000);
    currentStopGifts = Math.round(dayTarget / 12);
    const previousStopsGifts = activeIdx * currentStopGifts;

    if (isFlight) {
      giftsDelivered = previousStopsGifts;
      giftRatePerSec = 0;
    } else {
      const progress = Math.min(1.0, (u - 12.0) / 12.0);
      giftsDelivered = previousStopsGifts + Math.floor(currentStopGifts * progress);
      giftRatePerSec = Math.round(currentStopGifts / 3600);
    }
  }

  // Pasek postępu dostaw danego dnia (1..10 segmentów)
  const stopFraction = isFlight ? 0 : Math.min(1.0, (u - 12.0) / 12.0);
  const dayProgressPct = isDay24Finale
    ? 100
    : Math.min(100, Math.round(((activeIdx + stopFraction) / 12.0) * 100));
  const payloadPct = Math.max(8, dayProgressPct);

  // 3. Ciasteczka i Mleko (Proporcjonalne do liczby odwiedzonych domów)
  // ~1 talerzyk ciastek na 6-7 prezentów (współczynnik 0.15)
  // ~1 szklanka mleka (200ml) na 17 prezentów = ~0.0115 litra na prezent
  const cookiesEaten = Math.floor(giftsDelivered * 0.15);
  const milkLiters = Math.floor(giftsDelivered * 0.0115);

  // 4. Aktualna faza misji (Teksty w języku polskim)
  let stageTitle = "PRZELOT HIPERSONICZNY (M4.8)";
  let stageDetail = "KORYTARZ STRATOSFERYCZNY";

  if (isDay24Finale) {
    stageTitle = "FINAL WIGILII: KRAKOW!";
    stageDetail = "MISJA ZAKONCZONA // WESOLYCH SWIAT";
  } else if (flightPhase === "START") {
    stageTitle = "START // HYPER-ROZPEDZANIE";
    stageDetail = "MOC CIAGU 100% // WZNOSZENIE";
  } else if (flightPhase === "PRZELOT") {
    stageTitle = "PRZELOT HIPERSONICZNY (M4.8)";
    stageDetail = "KORYTARZ POLARNY // AUTOPILOT ON";
  } else if (flightPhase === "ZNIZANIE") {
    stageTitle = "HAMOWANIE I ZNIZANIE";
    stageDetail = "PODEJSCIE DO LADOWANIA NA DACHU";
  } else {
    // Postój na dachu (u >= 12s, 12 sekund na dachu)
    const subPhase = Math.floor((u - 12.0) / 4.0);
    if (subPhase === 0) {
      stageTitle = "BEZPIECZNY DACH // ZRZUT PREZENTOW";
      stageDetail = "KOMIN OTWARTY // ZRZUT W TOKU";
    } else if (subPhase === 1) {
      stageTitle = "PRZERWA NA CIASTKA I MLEKO";
      stageDetail = "UZUPELNIANIE PALIWA MIKOLAJA";
    } else {
      stageTitle = "DACH ZALICZONY // START ZA CHWILE";
      stageDetail = "SYNCHRONIZACJA ZAPRZEGU RENIFEROW";
    }
  }

  const etaSeconds = isDay24Finale ? 0 : Math.ceil(isFlight ? 12.0 - u : 24.0 - u);

  return {
    machSpeed,
    machDisplay: isFlight ? `M ${machSpeed.toFixed(1)}` : "M 0.0",
    altitudeM,
    altitudeDisplay: altitudeM >= 1000 ? `${(altitudeM / 1000).toFixed(1)}k M` : `${altitudeM} M`,
    flightPhase,
    giftsDelivered,
    giftsDeliveredDisplay: formatCompact(giftsDelivered),
    giftRatePerSec,
    giftRateDisplay: giftRatePerSec > 0 ? `+${formatCompact(giftRatePerSec)}/s` : "0/s",
    payloadPct,
    cookiesEaten,
    cookiesEatenDisplay: formatCompact(cookiesEaten),
    milkLiters,
    milkLitersDisplay: `${formatCompact(milkLiters)} L`,
    stageTitle,
    stageDetail,
    targetCity: targetName.toUpperCase(),
    etaSeconds,
  };
}

function formatCompact(num: number): string {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}k`;
  }
  return num.toString();
}
