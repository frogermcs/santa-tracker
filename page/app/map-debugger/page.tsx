"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Compass,
  Navigation2,
  RefreshCw,
  Play,
  Square,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { DEFAULT_ADVENT_DAY, AdventDay, AdventWaypoint, getDaySchedule, getAllDays } from "@/lib/advent-schedule";
import { calculateDistanceKm, calculateTotalDistanceKm } from "@/lib/geo-utils";
import { buzzer } from "@/lib/audio/buzzer";

// Leaflet CDN URLs
const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

const OSM_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

declare global {
  interface Window {
    L: any;
  }
}

export default function MapDebuggerPage() {
  const [selectedDay, setSelectedDay] = useState<number | "all">(DEFAULT_ADVENT_DAY);
  const [selectedStopIndex, setSelectedStopIndex] = useState<number | null>(null);
  const [isLeafletReady, setIsLeafletReady] = useState<boolean>(false);

  // Santa Flight Simulation (Flyby)
  const [isSimulatingFlight, setIsSimulatingFlight] = useState<boolean>(false);
  const [simStep, setSimStep] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const routesLayerRef = useRef<any>(null);
  const sleighMarkerRef = useRef<any>(null);
  const simTimerRef = useRef<any>(null);

  // Active day schedule (or all days)
  const currentStops: AdventWaypoint[] = useMemo(() => {
    if (selectedDay === "all") {
      const allDays = getAllDays();
      return allDays.flatMap((d) => d.stops);
    }
    return getDaySchedule(selectedDay).stops;
  }, [selectedDay]);

  const activeDayData: AdventDay | null = useMemo(() => {
    if (selectedDay === "all") return null;
    return getDaySchedule(selectedDay);
  }, [selectedDay]);

  // Route metrics: total distance
  const totalDistance = useMemo(() => calculateTotalDistanceKm(currentStops), [currentStops]);

  // 1. Dynamically load Leaflet JS & CSS
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.L) {
      setIsLeafletReady(true);
      return;
    }

    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }

    if (!document.querySelector(`script[src="${LEAFLET_JS}"]`)) {
      const script = document.createElement("script");
      script.src = LEAFLET_JS;
      script.async = true;
      script.onload = () => {
        setIsLeafletReady(true);
      };
      document.body.appendChild(script);
    } else {
      const checkInterval = setInterval(() => {
        if (window.L) {
          clearInterval(checkInterval);
          setIsLeafletReady(true);
        }
      }, 50);
      return () => clearInterval(checkInterval);
    }
  }, []);

  // 2. Initialize Leaflet Map (OSM Standard)
  useEffect(() => {
    if (!isLeafletReady || !mapContainerRef.current || mapInstanceRef.current) return;

    const L = window.L;

    const map = L.map(mapContainerRef.current, {
      center: [20, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 18,
      worldCopyJump: true,
      zoomControl: false,
    });

    L.control.zoom({ position: "topright" }).addTo(map);

    L.tileLayer(OSM_TILE_URL, {
      attribution: OSM_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);

    routesLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 150);
    setTimeout(() => {
      map.invalidateSize();
    }, 450);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [isLeafletReady]);

  // 3. Update Map Markers and Routes when Day or Stops change
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L || currentStops.length === 0) return;

    const L = window.L;
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const routesLayer = routesLayerRef.current;

    markersLayer.clearLayers();
    routesLayer.clearLayers();

    if (sleighMarkerRef.current) {
      map.removeLayer(sleighMarkerRef.current);
      sleighMarkerRef.current = null;
    }

    const bounds: [number, number][] = [];

    // Helper: Draw antimeridian-safe polyline with magical flowing stardust
    const addSafePolyline = (
      p1: [number, number],
      p2: [number, number],
      color = "#059669",
      weight = 3.5
    ) => {
      const lat1 = p1[0];
      const lon1 = p1[1];
      const lat2 = p2[0];
      const lon2 = p2[1];

      // Check if this is a true Pacific Date Line crossing (between Far East > 100° and Far West < -100°)
      const isPacificCrossing =
        (lon1 > 100 && lon2 < -100) || (lon1 < -100 && lon2 > 100);

      if (isPacificCrossing) {
        // Split cleanly at 180° / -180° so the line reaches the map edge and resumes on the other edge
        if (lon1 > 0) {
          const totalD = (180 - lon1) + (lon2 - (-180));
          const frac = (180 - lon1) / totalD;
          const midLat = lat1 + (lat2 - lat1) * frac;

          L.polyline([[lat1, lon1], [midLat, 180]], {
            color,
            weight,
            opacity: 0.9,
            className: "stardust-flight-path",
          }).addTo(routesLayer);

          L.polyline([[midLat, -180], [lat2, lon2]], {
            color,
            weight,
            opacity: 0.9,
            className: "stardust-flight-path",
          }).addTo(routesLayer);
        } else {
          const totalD = (lon1 - (-180)) + (180 - lon2);
          const frac = (lon1 - (-180)) / totalD;
          const midLat = lat1 + (lat2 - lat1) * frac;

          L.polyline([[lat1, lon1], [midLat, -180]], {
            color,
            weight,
            opacity: 0.9,
            className: "stardust-flight-path",
          }).addTo(routesLayer);

          L.polyline([[midLat, 180], [lat2, lon2]], {
            color,
            weight,
            opacity: 0.9,
            className: "stardust-flight-path",
          }).addTo(routesLayer);
        }
      } else {
        // Normal flight (e.g. Atlantic flight from Africa to North America) stays within [-180, 180]
        L.polyline([[lat1, lon1], [lat2, lon2]], {
          color,
          weight,
          opacity: 0.9,
          className: "stardust-flight-path",
        }).addTo(routesLayer);
      }
    };

    // Draw route segments
    for (let i = 0; i < currentStops.length - 1; i++) {
      const s1 = currentStops[i];
      const s2 = currentStops[i + 1];

      if (selectedDay === "all" && s1.day !== s2.day) continue;

      addSafePolyline([s1.lat, s1.lon], [s2.lat, s2.lon]);
    }

    // Draw numbered markers with Santa accents ("Bubbles")
    currentStops.forEach((stop, idx) => {
      bounds.push([stop.lat, stop.lon]);

      const isFirst = idx === 0;
      const isLast = idx === currentStops.length - 1;
      const isSelected = selectedStopIndex === idx;

      // Special Santa Accent Badges
      const badgeContent = isFirst ? "⭐" : isLast ? "🎁" : (selectedDay === "all" ? stop.stopTotal : stop.stopOfDay);

      const bubbleBg = isFirst
        ? "bg-emerald-600 text-white border-emerald-200 shadow-emerald-500/50"
        : isLast
        ? "bg-rose-600 text-white border-rose-200 shadow-rose-500/50"
        : isSelected
        ? "bg-amber-400 text-neutral-950 border-white scale-125 rudolph-beacon shadow-xl"
        : "bg-neutral-900 text-amber-300 border-white shadow-md";

      const customIcon = L.divIcon({
        className: "custom-stop-bubble",
        html: `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="w-6 h-6 rounded-full ${bubbleBg} font-mono font-bold text-[10px] flex items-center justify-center border-2 shadow-md transition-all">
              ${badgeContent}
            </div>
            <div class="absolute -bottom-5 whitespace-nowrap bg-neutral-950/95 text-white font-mono text-[10px] px-1.5 py-0.2 rounded border border-neutral-700 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg">
              ${stop.radarName}
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([stop.lat, stop.lon], { icon: customIcon }).addTo(markersLayer);

      const popupHtml = `
        <div class="font-sans text-neutral-100 p-1 min-w-[220px]">
          <div class="flex items-center justify-between border-b border-neutral-700 pb-1 mb-1.5">
            <span class="font-mono text-xs font-bold text-emerald-400 flex items-center gap-1">
              ${isFirst ? "⭐ Start Dnia" : isLast ? "🎁 Finał Dnia" : `Postój ${stop.stopOfDay} / 12`}
            </span>
            <span class="text-[10px] font-mono text-neutral-400">#${stop.stopTotal}</span>
          </div>
          <h4 class="font-bold text-sm text-white leading-tight mb-0.5">${stop.name}</h4>
          <p class="text-xs text-neutral-400 mb-1.5 font-mono">${stop.country}, ${stop.continent}</p>
          
          <div class="bg-neutral-800/90 p-1.5 rounded text-xs mb-1.5 space-y-0.5 font-mono text-neutral-200 border border-neutral-700/50">
            <div><span class="text-neutral-400">Pobyt (UTC):</span> ${stop.arrivalWindow}</div>
            <div><span class="text-neutral-400">Lot (UTC):</span> ${stop.transitWindow}</div>
          </div>

          <div class="bg-amber-950/40 border border-amber-500/30 p-1.5 rounded text-xs text-amber-200 leading-snug">
            <strong class="text-amber-400 font-mono text-[10px] uppercase block mb-0.5">🎅 Zadanie Mikołaja:</strong>
            ${stop.activity}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 280 });

      marker.on("click", () => {
        setSelectedStopIndex(idx);
        if (!isMuted) buzzer.playTone(1200 + idx * 80, 40, "sine", 0.05);
      });
    });

    if (bounds.length > 0 && !isSimulatingFlight) {
      if (selectedDay === "all") {
        map.setView([20, 0], 2);
      } else {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 });
      }
    }
  }, [currentStops, selectedDay, selectedStopIndex, isMuted, isSimulatingFlight]);

  // Focus a specific stop
  const handleFocusStop = useCallback(
    (stop: AdventWaypoint, index: number) => {
      setSelectedStopIndex(index);
      if (!isMuted) buzzer.playTone(1300 + index * 60, 45, "sine", 0.04);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([stop.lat, stop.lon], 6, { duration: 1.0 });
      }
    },
    [isMuted]
  );

  // Santa Flight Simulation (Flyby)
  const startFlightSimulation = useCallback(() => {
    if (currentStops.length === 0 || !mapInstanceRef.current || !window.L) return;

    const L = window.L;
    const map = mapInstanceRef.current;

    setIsSimulatingFlight(true);
    setSimStep(0);
    setSelectedStopIndex(0);

    if (!isMuted) buzzer.playSleighChime();

    // Create or move animated Sleigh marker
    if (sleighMarkerRef.current) {
      map.removeLayer(sleighMarkerRef.current);
    }

    const sleighIcon = L.divIcon({
      className: "custom-sleigh-blip",
      html: `
        <div class="relative flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-50">
          <div class="w-9 h-9 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-xl border-2 border-white rudolph-beacon">
            <span class="text-base select-none">🛷</span>
          </div>
          <span class="absolute -top-1 -right-1 text-xs select-none">✨</span>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    sleighMarkerRef.current = L.marker([currentStops[0].lat, currentStops[0].lon], {
      icon: sleighIcon,
      zIndexOffset: 1000,
    }).addTo(map);

    let cur = 0;
    if (simTimerRef.current) clearInterval(simTimerRef.current);

    simTimerRef.current = setInterval(() => {
      cur += 1;
      if (cur >= currentStops.length) {
        clearInterval(simTimerRef.current);
        setIsSimulatingFlight(false);
        if (!isMuted) buzzer.playSleighChime();
        return;
      }

      setSimStep(cur);
      setSelectedStopIndex(cur);

      const targetStop = currentStops[cur];
      if (sleighMarkerRef.current) {
        sleighMarkerRef.current.setLatLng([targetStop.lat, targetStop.lon]);
      }

      map.panTo([targetStop.lat, targetStop.lon], { animate: true, duration: 1.2 });

      if (!isMuted) {
        buzzer.playTone(1100 + cur * 90, 50, "sine", 0.05);
      }
    }, 1800);
  }, [currentStops, isMuted]);

  const stopFlightSimulation = useCallback(() => {
    if (simTimerRef.current) {
      clearInterval(simTimerRef.current);
      simTimerRef.current = null;
    }
    setIsSimulatingFlight(false);
  }, []);

  useEffect(() => {
    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#060913] text-neutral-100 flex flex-col font-sans selection:bg-emerald-800 selection:text-white">
      {/* 1. Header with Santa Mission Control Accents */}
      <header className="shrink-0 border-b border-neutral-800 bg-[#0b1021]/95 backdrop-blur-md px-4 py-2 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition text-xs font-mono font-bold cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Wróć do Radaru</span>
          </Link>

          <h1 className="text-xs sm:text-sm font-bold font-mono text-emerald-400 tracking-wider uppercase flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-400" />
            SANTA-OS Route & Flightpath Debugger
          </h1>
        </div>

        {/* Santa Tactical Flight Indicators */}
        <div className="flex items-center gap-2.5 text-xs font-mono">
          <div className="hidden sm:flex items-center gap-2 bg-neutral-900 px-2 py-0.5 rounded-md border border-neutral-800 text-[11px] text-amber-300">
            <span>🦌 Zaprzęg: 9/9 Nominal</span>
            <span className="text-neutral-600">•</span>
            <span>🍪 Paliwo: 100%</span>
          </div>

          <button
            onClick={() => {
              const muted = buzzer.toggleMute();
              setIsMuted(muted);
            }}
            className="p-1 rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition cursor-pointer"
            title="Dźwięki zaprzęgu"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-neutral-500" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* 2. Interactive Advent Day Selector */}
      <section className="shrink-0 bg-[#0b1021]/60 border-b border-neutral-800 px-4 py-1.5">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin">
          <button
            onClick={() => {
              stopFlightSimulation();
              setSelectedDay("all");
              setSelectedStopIndex(null);
            }}
            className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition shrink-0 border cursor-pointer ${
              selectedDay === "all"
                ? "bg-amber-500 text-neutral-950 border-amber-400 shadow-sm"
                : "bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border-neutral-800"
            }`}
          >
            Wszystkie 24 Dni
          </button>

          {Array.from({ length: 24 }, (_, i) => i + 1).map((day) => {
            const isSelected = selectedDay === day;
            const isFinale = day === 24;

            return (
              <button
                key={day}
                onClick={() => {
                  stopFlightSimulation();
                  setSelectedDay(day);
                  setSelectedStopIndex(null);
                }}
                className={`px-2 py-0.5 rounded-md text-xs font-mono transition shrink-0 border cursor-pointer flex items-center gap-0.5 ${
                  isSelected
                    ? isFinale
                      ? "bg-amber-500 text-neutral-950 font-bold border-amber-400 shadow-sm"
                      : "bg-emerald-500 text-neutral-950 font-bold border-emerald-400 shadow-sm"
                    : "bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-neutral-800"
                }`}
              >
                <span className="text-[10px] opacity-75">D</span>
                <span className="tabular-nums font-bold">{String(day).padStart(2, "0")}</span>
                {isFinale && <span className="text-[9px]">★</span>}
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Diagnostic & Sleigh Simulation Control Banner */}
      <div className="shrink-0 bg-neutral-950 border-b border-neutral-800/80 px-4 py-1.5 text-xs font-mono">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Day & Metrics */}
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-xs sm:text-sm flex items-center gap-1.5">
              <span>🎅</span>
              <span>{selectedDay === "all" ? "Pełna Siatka Globalna (288)" : `Dzień ${selectedDay}: ${activeDayData?.title}`}</span>
            </span>
            <span className="text-neutral-500">•</span>
            <span className="text-emerald-400 font-bold">
              {totalDistance.toLocaleString()} km
            </span>

            {/* Test Flight Simulator Play Button */}
            {selectedDay !== "all" && (
              <button
                onClick={isSimulatingFlight ? stopFlightSimulation : startFlightSimulation}
                className={`ml-2 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold flex items-center gap-1 transition cursor-pointer border ${
                  isSimulatingFlight
                    ? "bg-rose-500 text-white border-rose-400 animate-pulse"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-sm"
                }`}
              >
                {isSimulatingFlight ? (
                  <>
                    <Square className="w-3 h-3 fill-current" />
                    <span>Zatrzymaj Oblot (Etap {simStep + 1}/12)</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-current" />
                    <span>Symulacja Oblotu Zaprzęgu</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Main View: Map (lg:col-span-9) + Compact Sidebar (lg:col-span-3) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Map Container (9 cols) */}
        <div className="lg:col-span-9 relative h-full w-full bg-neutral-950 overflow-hidden flex flex-col">
          {!isLeafletReady && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#060913] z-20">
              <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
              <p className="font-mono text-xs text-neutral-400">Ładowanie mapy OSM...</p>
            </div>
          )}
          <div ref={mapContainerRef} className="w-full h-full flex-1 z-10" />

          {/* Minimal Trajectory & Stardust Legend */}
          <div className="absolute bottom-3 left-3 z-20 bg-neutral-950/85 backdrop-blur-md border border-neutral-800 rounded-lg px-2.5 py-1.5 text-[11px] font-mono shadow-md flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-emerald-500 inline-block" />
            <span className="text-emerald-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Gwiezdny pył (wektor lotu)
            </span>
          </div>
        </div>

        {/* Compact Right Sidebar (3 cols) with INDEPENDENT SCROLL */}
        <div className="lg:col-span-3 h-full overflow-y-auto bg-[#0b1021]/90 border-t lg:border-t-0 lg:border-l border-neutral-800 flex flex-col">
          <div className="shrink-0 px-3 py-2 border-b border-neutral-800 bg-[#060913] sticky top-0 z-10 flex items-center justify-between">
            <h3 className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
              <Navigation2 className="w-3.5 h-3.5 text-emerald-400" />
              Przystanki ({currentStops.length})
            </h3>
            <span className="text-[10px] font-mono text-neutral-400">Kliknij aby zbliżyć</span>
          </div>

          <div className="p-2 space-y-1.5 text-xs font-mono">
            {currentStops.map((stop, idx) => {
              const isSelected = selectedStopIndex === idx;
              const isFirst = idx === 0;
              const isLast = idx === currentStops.length - 1;

              const legDist =
                idx > 0
                  ? calculateDistanceKm(
                      currentStops[idx - 1].lat,
                      currentStops[idx - 1].lon,
                      stop.lat,
                      stop.lon
                    )
                  : 0;

              return (
                <div
                  key={idx}
                  onClick={() => handleFocusStop(stop, idx)}
                  className={`p-2 rounded-lg border transition cursor-pointer flex flex-col gap-1 ${
                    isSelected
                      ? "bg-emerald-950/60 border-emerald-400 shadow-md shadow-emerald-500/20"
                      : "bg-neutral-900/70 hover:bg-neutral-800 border-neutral-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`w-5 h-5 rounded-full font-bold text-[10px] flex items-center justify-center shrink-0 border ${
                          isFirst
                            ? "bg-emerald-600 text-white border-white"
                            : isLast
                            ? "bg-rose-600 text-white border-white"
                            : isSelected
                            ? "bg-amber-400 text-black border-white rudolph-beacon"
                            : "bg-neutral-800 text-amber-300 border-neutral-700"
                        }`}
                      >
                        {isFirst ? "⭐" : isLast ? "🎁" : (selectedDay === "all" ? stop.stopTotal : stop.stopOfDay)}
                      </span>
                      <span className="font-bold text-white text-xs truncate">{stop.name}</span>
                    </div>

                    {idx > 0 && (
                      <span className="text-[10px] text-emerald-400 shrink-0">
                        +{legDist}km
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-neutral-400 pl-6">
                    <span className="truncate">{stop.country}</span>
                    <span className="shrink-0">{stop.arrivalWindow}</span>
                  </div>

                  {/* Task in small compact text */}
                  <div className="text-[10px] text-amber-200/90 bg-amber-500/10 px-1.5 py-0.5 rounded leading-tight font-sans line-clamp-2 border border-amber-500/20">
                    <span className="text-amber-400 font-bold font-mono">🎅 </span>
                    {stop.activity}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
