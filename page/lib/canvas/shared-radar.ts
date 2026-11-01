/**
 * CANONICAL LIVING SPECIFICATION: Retro Aviation World Radar
 * Exact 1:1 Reference Implementation for M5StickC-Plus firmware (`firmware/src/ui/screen_radar.cpp`).
 *
 * Physical & Render Specifications:
 * - Display: 240 x 135 ST7789v2 IPS (RGB565 on device, 24-bit canvas in web)
 * - Map Projection: projectCoordinates(lon, lat) -> [x: 0..240, y: 12..120]
 * - World Dot Matrix: 912 green dots (2x2 px, step 3)
 * - Radar Center: (120, 68), concentric rings at r=32, 64, 96 px
 * - Sweep Ray: 3.2s period ((nowMs % 3200) * 2π / 3200), length 110 px
 * - Top HUD (y: 0..12): BAT (left, x: 4), "RADAR MIKOLAJA" (center, x: 120), "DZIEN <N>" (right, x: 236)
 * - Bottom HUD (y: 121..135): "CEL: <CITY>" / "FINAŁ: KRAKOW" (left, x: 4), "CZAS 0:<ETA>" / "WIGILIA!" (right, x: 236)
 * - Font: 5x7 ASCII GlcdFont (Font 0 from M5GFX) rendered pixel-by-pixel with no antialiasing
 */

import { drawBitmapText } from "./glcd-font";

export interface RadarWaypoint {
  name: string;
  lon: number;
  lat: number;
  localName?: string;
  country?: string;
  continent?: string;
  arrivalWindow?: string;
  transitWindow?: string;
  activity?: string;
  stopOfDay?: number;
  stopTotal?: number;
}

export const SEC_PER_CITY = 30; // 15s flight + 15s stop (scaled 1:1 from 1hr flight + 1hr stop)

export const JOURNEY_CITIES: RadarWaypoint[] = [
  { name: "GISBORNE",          lon: 178.0,  lat: -38.7, country: "Nowa Zelandia", continent: "Oceania" },
  { name: "BETHLEHEM",         lon: 35.2,   lat: 31.7,  country: "Palestyna",     continent: "Azja" },
  { name: "NICOSIA",           lon: 33.4,   lat: 35.2,  country: "Cypr",          continent: "Azja" },
  { name: "KHARTOUM",          lon: 32.5,   lat: 15.5,  country: "Sudan",         continent: "Afryka" },
  { name: "NOUAKCHOTT",        lon: -16.0,  lat: 18.1,  country: "Mauretania",    continent: "Afryka" },
  { name: "CAYENNE",           lon: -52.3,  lat: 4.9,   country: "Gujana Fr.",    continent: "Ameryki" },
  { name: "WYSPA WIELKANOCNA", lon: -109.3, lat: -27.1, country: "Chile",         continent: "Ameryki" },
  { name: "KIRITIMATI",        lon: -157.4, lat: 1.9,   country: "Kiribati",      continent: "Pacyfik" },
  { name: "HONOLULU",          lon: -157.8, lat: 21.3,  country: "USA",           continent: "Ameryki" },
  { name: "NUUK",              lon: -51.7,  lat: 64.2,  country: "Grenlandia",    continent: "Ameryki" },
  { name: "BIEGUN POLNOCNY",   lon: 0.0,    lat: 90.0,  country: "Arktyka",       continent: "Biegun" },
  { name: "KRAKOW",            lon: 19.9,   lat: 50.1,  country: "Polska",        continent: "Europa" }
];

const W = 240;
const H = 135;
const RADAR_CX = 120;
const RADAR_CY = 68;

const RAW_LAND: number[][] = [
  [-168,66,-125,72,-80,73,-60,62,-55,48,-70,42,-76,35,-80,25,-83,30,-90,30,-97,27,-97,21,-90,21,-87,21,-88,16,-83,9,-78,8,-86,11,-92,14,-105,20,-110,24,-117,32,-124,40,-125,49,-140,60,-165,60],
  [-55,60,-45,60,-20,70,-20,82,-60,82,-70,76],
  [-78,8,-60,10,-50,0,-35,-6,-40,-22,-48,-28,-58,-38,-65,-42,-68,-55,-74,-50,-72,-30,-70,-18,-81,-5],
  [-10,36,-9,43,-2,48,5,52,10,57,5,62,15,70,30,71,60,70,100,77,140,72,170,68,180,66,160,58,155,50,140,45,130,35,122,30,120,22,108,18,105,10,100,2,98,10,92,22,80,10,73,18,66,25,57,26,50,30,56,24,44,12,35,28,32,31,26,36,20,40,14,40,10,44,3,43,-5,36],
  [-17,15,-10,35,10,37,32,31,43,12,51,11,40,-5,40,-15,33,-26,20,-35,12,-18,9,0,-8,4],
  [114,-22,130,-12,142,-11,153,-26,147,-38,135,-35,115,-34],
  [130,32,140,36,142,44,137,37],
  [-5,50,2,52,-3,58],
  [109,1,118,7,118,-3],
  [172,-35,178,-38,174,-41],
  [95,5,106,-6,101,-2],
];

let landBuffer: HTMLCanvasElement | null = null;

function getLandBuffer(): HTMLCanvasElement | null {
  if (landBuffer) return landBuffer;
  if (typeof document === "undefined") return null;

  landBuffer = document.createElement("canvas");
  landBuffer.width = W;
  landBuffer.height = H;
  const lx = landBuffer.getContext("2d");
  if (!lx) return null;

  const polygons = RAW_LAND.map((coords) => {
    const poly: [number, number][] = [];
    for (let i = 0; i < coords.length; i += 2) {
      poly.push([coords[i], coords[i + 1]]);
    }
    return poly;
  });

  const pip = (px: number, py: number, poly: [number, number][]) => {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i];
      const b = poly[j];
      if (
        a[1] > py !== b[1] > py &&
        px < ((b[0] - a[0]) * (py - a[1])) / (b[1] - a[1]) + a[0]
      ) {
        inside = !inside;
      }
    }
    return inside;
  };

  lx.fillStyle = "#1f8a4a";
  for (let gx = 0; gx < 80; gx++) {
    for (let gy = 4; gy < 41; gy++) {
      const px = gx * 3 + 1;
      const py = gy * 3 + 1;
      const lo = (px / W) * 360 - 180;
      const la = 80 - ((py - 12) / 108) * 138;
      if (polygons.some((p) => pip(lo, la, p))) {
        lx.fillRect(px - 1, py - 1, 2, 2);
      }
    }
  }

  return landBuffer;
}

export function projectCoordinates(lon: number, lat: number): [number, number] {
  return [((lon + 180) / 360) * W, 12 + ((80 - lat) / 138) * 108];
}

export function renderSharedRadar(
  ctx: CanvasRenderingContext2D,
  timeSeconds: number,
  waypoints: RadarWaypoint[],
  currentWaypointIndex: number,
  santaLon: number,
  santaLat: number,
  nextCityName: string,
  etaSeconds: number,
  isFlightPhase = true,
  isGrandFinale = false,
  dayNumber = 24
) {
  ctx.save();

  const rect = (col: string, x: number, y: number, w: number, h: number) => {
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  };

  const text = (
    str: string,
    x: number,
    y: number,
    col = "#fff",
    al: "left" | "right" | "center" = "left",
    scale = 1
  ) => {
    drawBitmapText(ctx, str, x, y, col, al, scale);
  };

  // 1. Deep CRT green background
  rect("#02110a", 0, 0, W, H);

  // 2. Fixed Center Radar: Concentric Range Rings & Crosshairs
  ctx.strokeStyle = "#073018";
  ctx.lineWidth = 1;
  [32, 64, 96].forEach((radius) => {
    ctx.beginPath();
    ctx.arc(RADAR_CX, RADAR_CY, radius, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.beginPath();
  ctx.moveTo(0, RADAR_CY);
  ctx.lineTo(W, RADAR_CY);
  ctx.moveTo(RADAR_CX, 12);
  ctx.lineTo(RADAR_CX, 120);
  ctx.stroke();

  // 3. Realistic coastline dot matrix (912 dots)
  const lb = getLandBuffer();
  if (lb) {
    ctx.drawImage(lb, 0, 0);
  }

  // 4. Fixed Center Rotating Radar Sweep Beam (Sweeping Whole Screen)
  const nowMs = timeSeconds * 1000;
  const beamAngle = (nowMs % 3200) * (2 * Math.PI / 3200);
  const beamLen = 110;
  const beamEndX = RADAR_CX + Math.cos(beamAngle) * beamLen;
  const beamEndY = RADAR_CY + Math.sin(beamAngle) * beamLen;

  ctx.strokeStyle = "#5aff8c";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(RADAR_CX, RADAR_CY);
  ctx.lineTo(beamEndX, beamEndY);
  ctx.stroke();

  // Faint secondary trailing ray
  const trailAngle = beamAngle - 0.08;
  const trailEndX = RADAR_CX + Math.cos(trailAngle) * (beamLen - 10);
  const trailEndY = RADAR_CY + Math.sin(trailAngle) * (beamLen - 10);
  ctx.strokeStyle = "#073018";
  ctx.beginPath();
  ctx.moveTo(RADAR_CX, RADAR_CY);
  ctx.lineTo(trailEndX, trailEndY);
  ctx.stroke();

  // 5. Calculate Santa position on screen
  const santaPt = projectCoordinates(santaLon, santaLat);

  // 6. Dotted Breadcrumb Line connecting visited cities
  const drawDottedLine = (p: [number, number], q: [number, number], col: string, spacing = 3) => {
    const dx = q[0] - p[0];
    const dy = q[1] - p[1];
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return;
    const ux = dx / dist;
    const uy = dy / dist;
    for (let d = 0; d <= dist; d += spacing) {
      rect(col, Math.round(p[0] + ux * d), Math.round(p[1] + uy * d), 1, 1);
    }
  };

  const safeIdx = Math.min(waypoints.length - 1, Math.max(0, currentWaypointIndex));
  for (let i = 1; i <= safeIdx; i++) {
    const A = waypoints[i - 1];
    const B = waypoints[i];
    drawDottedLine(
      projectCoordinates(A.lon, A.lat),
      i < safeIdx || !isFlightPhase ? projectCoordinates(B.lon, B.lat) : santaPt,
      "#ffd54a",
      3
    );
  }

  // 7. City dots on map
  const nextIdx = isFlightPhase ? safeIdx : (safeIdx + 1) % waypoints.length;
  const blink = Math.floor(timeSeconds * 4.5) % 2 === 0;

  waypoints.forEach((wp, i) => {
    const p = projectCoordinates(wp.lon, wp.lat);
    if (i === nextIdx) {
      rect(blink ? "#fff" : "#7dff9b", p[0] - 1, p[1] - 1, 3, 3);
    } else if (i < safeIdx || (i === safeIdx && !isFlightPhase)) {
      rect("#7dff9b", p[0] - 1, p[1] - 1, 3, 3);
    } else {
      rect("#4fd68a", p[0], p[1], 1, 1);
    }
  });

  // 8. Santa: Red Flashing Contact Dot Traveling Through World
  // Expanding radar ping circle around Santa
  const pulseRadius = Math.floor(nowMs / 40) % 20;
  if (pulseRadius > 2) {
    ctx.strokeStyle = "#ff5a5a";
    ctx.beginPath();
    ctx.arc(santaPt[0], santaPt[1], pulseRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Faint red aura box
  rect("rgba(255,59,59,.35)", santaPt[0] - 3, santaPt[1] - 3, 7, 7);

  // Red/White flashing core dot
  rect(blink ? "#ff3b3b" : "#fff", santaPt[0] - 1, santaPt[1] - 1, 3, 3);

  // 9. Top Radar HUD Bar
  rect("rgba(2,17,10,.85)", 0, 0, W, 12);
  rect("#073018", 0, 12, W, 1);
  text("BAT 98%", 4, 2, "#7dff9b", "left");
  text("MIKORADAR", RADAR_CX, 2, "#7dff9b", "center");
  const dayText = "DZIEN " + dayNumber;
  text(dayText, W - 4, 2, isGrandFinale ? "#ffd54a" : "#7dff9b", "right");

  // 10. Bottom HUD bar: Next stop & ETA
  rect("rgba(2,17,10,.85)", 0, 121, W, 14);
  rect("#073018", 0, 120, W, 1);
  const isFinalArrival = isGrandFinale && currentWaypointIndex >= waypoints.length - 1 && !isFlightPhase;
  const targetLabel = isFinalArrival ? "FINAŁ: " + nextCityName : isFlightPhase ? "CEL: " + nextCityName : "POSTÓJ: " + nextCityName;
  text(targetLabel, 4, 124, isFinalArrival ? "#ffd54a" : "#7dff9b");
  text(
    isFinalArrival ? "WIGILIA!" : "CZAS 0:" + String(Math.max(0, etaSeconds)).padStart(2, "0"),
    W - 4,
    124,
    "#ffd54a",
    "right"
  );

  ctx.restore();
}
