#pragma once
#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#if defined(ARDUINO)
  #include <Arduino.h>
#else
  #include <string.h>
  #include <stdio.h>
  #include <math.h>
#endif

// ============================================================================
// SantaCockpitMetrics - Core Aerospace & Demographic Telemetry Model
// ============================================================================
// Educational Notes:
// - Deterministic memory model: strictly zero dynamic heap allocations.
// - Fixed char buffers for all formatted strings.
// - Rzeczywisty model matematyczny oparty o globalną demografię populacji dzieci:
//   ~2.20 Mld dzieci na świecie w Wigilię (Dzień 24).
// ============================================================================

enum FlightPhase {
  PHASE_START = 0,
  PHASE_PRZELOT = 1,
  PHASE_ZNIZANIE = 2,
  PHASE_DACH = 3,
  PHASE_FINAL = 4
};

struct SantaCockpitMetrics {
  // Flight dynamics
  float machSpeed;
  char machDisplay[12];        // e.g. "M 4.8", "M 0.0"
  int altitudeM;
  char altitudeDisplay[16];    // e.g. "11.5k M", "65 M"
  FlightPhase flightPhase;

  // Gift payload (Rzeczywiste liczby globalne)
  uint64_t giftsDelivered;
  char giftsDeliveredDisplay[24]; // e.g. "2.20B", "110.0M"
  uint32_t giftRatePerSec;
  char giftRateDisplay[24];       // e.g. "+105.6k/s", "0/s"
  int payloadPct;                 // 1..10 segments (8..100%)

  // Sustenance (Ciastka i Mleko)
  uint64_t cookiesEaten;
  char cookiesEatenDisplay[24];   // e.g. "330.0M"
  uint64_t milkLiters;
  char milkLitersDisplay[24];     // e.g. "25.3M L"

  // Tactical mission phase
  char stageTitle[48];            // Headline in tactical box
  char targetCity[24];            // Target or current city name uppercase
  int etaSeconds;                 // Countdown seconds (overall)
  int stepEtaSeconds;             // Countdown seconds to next subphase
  char nextStepName[16];          // Next subphase short label (e.g. "PRZELOT")
};

// Formats a number with compact suffixes ("2.20B", "110.0M", "105.6k", "42")
void formatCompact(uint64_t num, char* out, size_t outLen);

// Computes real-time telemetry metrics matching page/lib/telemetry/santa-metrics.ts
void computeSantaMetrics(
  int dayNum,
  int activeIdx,
  float u,
  float nowSec,
  const char* targetName,
  bool isDay24Finale,
  SantaCockpitMetrics& outMetrics,
  float flightDuration = 15.0f,
  float totalDuration = 30.0f,
  bool isOffSeason = false
);
