#include "santa_metrics.h"
#include <ctype.h>
#include <math.h>
#include <stdio.h>
#include <string.h>

// Regional gift distribution for Day 24 (Suma = 2,200,000,000 gifts worldwide)
static const uint32_t REGIONAL_GIFTS_DAY24[12] = {
  15000000,   // Stop 1: Gisborne (Oceania / Pacific)
  110000000,  // Stop 2: Bethlehem (Middle East)
  85000000,   // Stop 3: Nicosia (Eastern Mediterranean)
  240000000,  // Stop 4: Khartoum (East Africa)
  220000000,  // Stop 5: Nouakchott (West Africa)
  130000000,  // Stop 6: Cayenne (South America - North)
  150000000,  // Stop 7: Easter Island (South America - South / Andes)
  20000000,   // Stop 8: Kiritimati (Polynesia)
  380000000,  // Stop 9: Honolulu (North America - West Coast)
  280000000,  // Stop 10: Nuuk (North America - East / Arctic)
  190000000,  // Stop 11: North Pole (Scandinavia / Northern Europe)
  380000000   // Stop 12: Kraków (Central & Western Europe - Grand Finale)
};

void formatCompact(uint64_t num, char* out, size_t outLen) {
  if (!out || outLen == 0) return;

  if (num >= 1000000000ULL) {
    double val = (double)num / 1000000000.0;
    snprintf(out, outLen, "%.2fB", val);
  } else if (num >= 1000000ULL) {
    double val = (double)num / 1000000.0;
    snprintf(out, outLen, "%.1fM", val);
  } else if (num >= 1000ULL) {
    double val = (double)num / 1000.0;
    snprintf(out, outLen, "%.1fk", val);
  } else {
    snprintf(out, outLen, "%llu", (unsigned long long)num);
  }
}

void computeSantaMetrics(
  int dayNum,
  int activeIdx,
  float u,
  float nowSec,
  const char* targetName,
  bool isDay24Finale,
  SantaCockpitMetrics& outMetrics
) {
  bool isFlight = !isDay24Finale && (u < 12.0f);

  // 1. Flight dynamics (Mach speed and altitude)
  float machSpeed = 0.0f;
  int altitudeM = 65; // Average rooftop height
  FlightPhase flightPhase = PHASE_DACH;

  if (isDay24Finale) {
    machSpeed = 0.0f;
    altitudeM = 219; // Kraków Main Square elevation above sea level
    flightPhase = PHASE_FINAL;
  } else if (isFlight) {
    float flightProgress = u / 12.0f; // 0.0 .. 1.0
    if (flightProgress < 0.2f) {
      flightPhase = PHASE_START;
      float p = flightProgress / 0.2f;
      machSpeed = p * 4.2f;
      altitudeM = (int)(65.0f + p * 10500.0f);
    } else if (flightProgress < 0.8f) {
      flightPhase = PHASE_PRZELOT;
      machSpeed = 4.8f + 0.3f * sinf(nowSec * 3.0f);
      altitudeM = (int)(11500.0f + 120.0f * sinf(nowSec * 1.5f));
    } else {
      flightPhase = PHASE_ZNIZANIE;
      float p = (1.0f - flightProgress) / 0.2f;
      machSpeed = p * 4.8f;
      if (machSpeed < 0.0f) machSpeed = 0.0f;
      altitudeM = (int)(65.0f + p * 11500.0f);
    }
  }

  outMetrics.machSpeed = machSpeed;
  outMetrics.altitudeM = altitudeM;
  outMetrics.flightPhase = flightPhase;

  if (isFlight) {
    snprintf(outMetrics.machDisplay, sizeof(outMetrics.machDisplay), "M %.1f", machSpeed);
  } else {
    strncpy(outMetrics.machDisplay, "M 0.0", sizeof(outMetrics.machDisplay));
  }

  if (altitudeM >= 1000) {
    snprintf(outMetrics.altitudeDisplay, sizeof(outMetrics.altitudeDisplay), "%.1fk M", altitudeM / 1000.0f);
  } else {
    snprintf(outMetrics.altitudeDisplay, sizeof(outMetrics.altitudeDisplay), "%d M", altitudeM);
  }

  // 2. Gift payload demographics
  uint64_t giftsDelivered = 0;
  uint32_t giftRatePerSec = 0;
  uint64_t currentStopGifts = 0;

  if (dayNum == 24) {
    int safeIdx = (activeIdx < 0) ? 0 : (activeIdx >= 12 ? 11 : activeIdx);
    currentStopGifts = REGIONAL_GIFTS_DAY24[safeIdx];

    uint64_t previousStopsGifts = 0;
    for (int i = 0; i < safeIdx; i++) {
      previousStopsGifts += REGIONAL_GIFTS_DAY24[i];
    }

    if (isDay24Finale) {
      // Kraków arrived: 100% of 2.20B delivered!
      giftsDelivered = 2200000000ULL;
      giftRatePerSec = 0;
    } else if (isFlight) {
      giftsDelivered = previousStopsGifts;
      giftRatePerSec = 0;
    } else {
      float progress = (u - 12.0f) / 12.0f;
      if (progress < 0.0f) progress = 0.0f;
      if (progress > 1.0f) progress = 1.0f;
      giftsDelivered = previousStopsGifts + (uint64_t)(currentStopGifts * progress);
      giftRatePerSec = (uint32_t)(currentStopGifts / 3600);
    }
  } else {
    // Days 1..23: Advent buildup
    float dayFraction = (float)dayNum / 24.0f;
    uint64_t dayTarget = 2500000ULL + (uint64_t)(powf(dayFraction, 2.0f) * 450000000.0f);
    currentStopGifts = dayTarget / 12;
    uint64_t previousStopsGifts = (uint64_t)activeIdx * currentStopGifts;

    if (isFlight) {
      giftsDelivered = previousStopsGifts;
      giftRatePerSec = 0;
    } else {
      float progress = (u - 12.0f) / 12.0f;
      if (progress < 0.0f) progress = 0.0f;
      if (progress > 1.0f) progress = 1.0f;
      giftsDelivered = previousStopsGifts + (uint64_t)(currentStopGifts * progress);
      giftRatePerSec = (uint32_t)(currentStopGifts / 3600);
    }
  }

  outMetrics.giftsDelivered = giftsDelivered;
  formatCompact(giftsDelivered, outMetrics.giftsDeliveredDisplay, sizeof(outMetrics.giftsDeliveredDisplay));

  outMetrics.giftRatePerSec = giftRatePerSec;
  if (giftRatePerSec > 0) {
    char rateCompact[20];
    formatCompact(giftRatePerSec, rateCompact, sizeof(rateCompact));
    snprintf(outMetrics.giftRateDisplay, sizeof(outMetrics.giftRateDisplay), "+%s/s", rateCompact);
  } else {
    strncpy(outMetrics.giftRateDisplay, "0/s", sizeof(outMetrics.giftRateDisplay));
  }

  // Payload progress percentage (1..10 segments)
  float stopFraction = isFlight ? 0.0f : ((u - 12.0f) / 12.0f);
  if (stopFraction > 1.0f) stopFraction = 1.0f;
  int dayProgressPct = isDay24Finale
    ? 100
    : (int)(((activeIdx + stopFraction) / 12.0f) * 100.0f);
  if (dayProgressPct < 8) dayProgressPct = 8;
  if (dayProgressPct > 100) dayProgressPct = 100;
  outMetrics.payloadPct = dayProgressPct;

  // 3. Sustenance (Cookies and Milk)
  // ~1 plate of cookies for 6-7 gifts (factor 0.15)
  // ~1 glass of milk (200ml) for 17 gifts (0.0115 liters per gift)
  outMetrics.cookiesEaten = (uint64_t)(giftsDelivered * 0.15);
  formatCompact(outMetrics.cookiesEaten, outMetrics.cookiesEatenDisplay, sizeof(outMetrics.cookiesEatenDisplay));

  outMetrics.milkLiters = (uint64_t)(giftsDelivered * 0.0115);
  char milkCompact[16];
  formatCompact(outMetrics.milkLiters, milkCompact, sizeof(milkCompact));
  snprintf(outMetrics.milkLitersDisplay, sizeof(outMetrics.milkLitersDisplay), "%s L", milkCompact);

  // 4. Mission Phase Tactical Title
  if (isDay24Finale) {
    strncpy(outMetrics.stageTitle, "FINAL WIGILII: KRAKOW!", sizeof(outMetrics.stageTitle));
  } else if (flightPhase == PHASE_START) {
    strncpy(outMetrics.stageTitle, "START // HYPER-ROZPEDZANIE", sizeof(outMetrics.stageTitle));
  } else if (flightPhase == PHASE_PRZELOT) {
    strncpy(outMetrics.stageTitle, "PRZELOT HIPERSONICZNY (M4.8)", sizeof(outMetrics.stageTitle));
  } else if (flightPhase == PHASE_ZNIZANIE) {
    strncpy(outMetrics.stageTitle, "HAMOWANIE I ZNIZANIE", sizeof(outMetrics.stageTitle));
  } else {
    // Rooftop stay (u >= 12.0f)
    int subPhase = (int)((u - 12.0f) / 4.0f);
    if (subPhase == 0) {
      strncpy(outMetrics.stageTitle, "BEZPIECZNY DACH // ZRZUT PREZENTOW", sizeof(outMetrics.stageTitle));
    } else if (subPhase == 1) {
      strncpy(outMetrics.stageTitle, "PRZERWA NA CIASTKA I MLEKO", sizeof(outMetrics.stageTitle));
    } else {
      strncpy(outMetrics.stageTitle, "DACH ZALICZONY // START ZA CHWILE", sizeof(outMetrics.stageTitle));
    }
  }

  // 5. Target City & ETA
  if (targetName) {
    size_t i = 0;
    while (targetName[i] && i < sizeof(outMetrics.targetCity) - 1) {
      outMetrics.targetCity[i] = (char)toupper((unsigned char)targetName[i]);
      i++;
    }
    outMetrics.targetCity[i] = '\0';
  } else {
    strncpy(outMetrics.targetCity, "KRAKOW", sizeof(outMetrics.targetCity));
  }

  if (isDay24Finale) {
    outMetrics.etaSeconds = 0;
  } else if (isFlight) {
    outMetrics.etaSeconds = (int)ceilf(12.0f - u);
  } else {
    outMetrics.etaSeconds = (int)ceilf(24.0f - u);
  }
}
