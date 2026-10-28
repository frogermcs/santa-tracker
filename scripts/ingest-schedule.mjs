import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const csvPath = path.join(rootDir, "Harmonogram Santa Tracker 2026 - Harmonogram_Lotow.csv");

const rawCsv = fs.readFileSync(csvPath, "utf-8");

// Simple CSV parser supporting quotes
function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const headerLine = lines[0];
  const headers = parseLine(headerLine);

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseLine(lines[i]);
    if (vals.length < headers.length) continue;
    const row = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = vals[idx]?.trim() ?? "";
    });
    rows.push(row);
  }
  return rows;
}

function parseLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function toRadarName(name) {
  const overrides = {
    "Wyspa Bożego Narodzenia (Kiritimati)": "KIRITIMATI",
    "Baza na Biegunie Północnym": "BIEGUN POLNOCNY",
    "Wyspa Wielkanocna (Hanga Roa)": "WYSPA WIELKANOCNA",
    "Pole Lodowe Patagonii (Punta Arenas)": "PUNTA ARENAS",
    "Galapagos (Puerto Ayora)": "GALAPAGOS",
  };
  if (overrides[name]) {
    name = overrides[name];
  } else {
    name = name.replace(/\s*\([A-Z]{2}\)/g, "");
    name = name.replace(/\s*\(.*?\)/g, "");
  }

  const diacritics = {
    ą: "A", ć: "C", ę: "E", ł: "L", ń: "N", ó: "O", ś: "S", ź: "Z", ż: "Z",
    Ą: "A", Ć: "C", Ę: "E", Ł: "L", Ń: "N", Ó: "O", Ś: "S", Ź: "Z", Ż: "Z",
  };
  for (const [k, v] of Object.entries(diacritics)) {
    name = name.replaceAll(k, v);
  }
  return name.trim().toUpperCase();
}

const rows = parseCsv(rawCsv);
console.log(`Parsed ${rows.length} rows from CSV.`);

if (rows.length !== 288) {
  throw new Error(`Expected 288 rows, but parsed ${rows.length}`);
}

const daysMap = {};

for (const r of rows) {
  const stopTotal = parseInt(r["Nr przystanku (ogółem)"], 10);
  const date = r["Data"];
  const day = parseInt(r["Dzień miesiąca"], 10);
  const stopOfDay = parseInt(r["Nr przystanku w danym dniu"], 10);
  const arrivalWindow = r["Przylot i postój (UTC)"];
  const transitWindow = r["Kolejny lot tranzytowy (UTC)"];
  const continent = r["Kontynent"];
  const country = r["Kraj"];
  const localName = r["Miasto / Lokalizacja"];
  const lat = parseFloat(r["Szerokość geograficzna (Lat)"]);
  const lon = parseFloat(r["Długość geograficzna (Lng)"]);
  const activity = r["Ciekawostka / Zadanie Mikołaja"];
  const radarName = toRadarName(localName);

  if (!daysMap[day]) {
    daysMap[day] = {
      day,
      date,
      stops: [],
    };
  }

  daysMap[day].stops.push({
    stopTotal,
    day,
    stopOfDay,
    name: localName,
    radarName,
    country,
    continent,
    lat,
    lon,
    arrivalWindow,
    transitWindow,
    activity,
  });
}

// Validation
for (let d = 1; d <= 24; d++) {
  if (!daysMap[d] || daysMap[d].stops.length !== 12) {
    throw new Error(`Day ${d} does not have exactly 12 stops! Found: ${daysMap[d]?.stops.length}`);
  }
}

// 1. Output page/public/journey.json
const journeyJson = {
  version: 2,
  updatedAt: new Date().toISOString(),
  activeDay: 24,
  secPerCity: 12, // 6s flight + 6s stay (1:1 simulated ratio for 1hr flight + 1hr stop)
  speedMultiplier: 1,
  // Default route is Dec 24 for instant radar compatibility
  route: daysMap[24].stops.map((s) => ({
    name: s.radarName,
    localName: s.name,
    lon: s.lon,
    lat: s.lat,
    country: s.country,
    continent: s.continent,
    arrivalWindow: s.arrivalWindow,
    transitWindow: s.transitWindow,
    activity: s.activity,
    stopOfDay: s.stopOfDay,
    stopTotal: s.stopTotal,
  })),
  days: Object.values(daysMap).map((d) => ({
    day: d.day,
    date: d.date,
    stops: d.stops.map((s) => ({
      name: s.radarName,
      localName: s.name,
      lon: s.lon,
      lat: s.lat,
      country: s.country,
      continent: s.continent,
      arrivalWindow: s.arrivalWindow,
      transitWindow: s.transitWindow,
      activity: s.activity,
      stopOfDay: s.stopOfDay,
      stopTotal: s.stopTotal,
    })),
  })),
};

const jsonOutPath = path.join(rootDir, "page/public/journey.json");
fs.writeFileSync(jsonOutPath, JSON.stringify(journeyJson, null, 2), "utf-8");
console.log(`Generated ${jsonOutPath}`);

// 2. Output page/lib/advent-schedule.ts
const tsLines = [
  `// SANTA-OS Master Advent Calendar Journey Schedule (Dec 01 - Dec 24)`,
  `// Generated automatically from Harmonogram Santa Tracker 2026 - Harmonogram_Lotow.csv`,
  `// Total 288 stops (12 cities per day x 24 days)`,
  ``,
  `export interface AdventWaypoint {`,
  `  stopTotal: number;`,
  `  day: number;`,
  `  stopOfDay: number;`,
  `  name: string;`,
  `  radarName: string;`,
  `  country: string;`,
  `  continent: string;`,
  `  lat: number;`,
  `  lon: number;`,
  `  arrivalWindow: string;`,
  `  transitWindow: string;`,
  `  activity: string;`,
  `}`,
  ``,
  `export interface AdventDay {`,
  `  day: number;`,
  `  date: string;`,
  `  title: string;`,
  `  continents: string[];`,
  `  stops: AdventWaypoint[];`,
  `}`,
  ``,
  `export const DEFAULT_ADVENT_DAY = 24;`,
  ``,
  `export const ADVENT_DAYS: Record<number, AdventDay> = {`,
];

for (let d = 1; d <= 24; d++) {
  const dayData = daysMap[d];
  const continents = Array.from(new Set(dayData.stops.map((s) => s.continent)));
  const title = d === 24
    ? "Wielki Finał Wigilijny (Grand Finale)"
    : d === 6
    ? "Mikołajki (St. Nicholas Day)"
    : `Etap Dnia ${d}`;

  tsLines.push(`  ${d}: {`);
  tsLines.push(`    day: ${d},`);
  tsLines.push(`    date: ${JSON.stringify(dayData.date)},`);
  tsLines.push(`    title: ${JSON.stringify(title)},`);
  tsLines.push(`    continents: ${JSON.stringify(continents)},`);
  tsLines.push(`    stops: [`);
  for (const s of dayData.stops) {
    tsLines.push(`      {`);
    tsLines.push(`        stopTotal: ${s.stopTotal},`);
    tsLines.push(`        day: ${s.day},`);
    tsLines.push(`        stopOfDay: ${s.stopOfDay},`);
    tsLines.push(`        name: ${JSON.stringify(s.name)},`);
    tsLines.push(`        radarName: ${JSON.stringify(s.radarName)},`);
    tsLines.push(`        country: ${JSON.stringify(s.country)},`);
    tsLines.push(`        continent: ${JSON.stringify(s.continent)},`);
    tsLines.push(`        lat: ${s.lat},`);
    tsLines.push(`        lon: ${s.lon},`);
    tsLines.push(`        arrivalWindow: ${JSON.stringify(s.arrivalWindow)},`);
    tsLines.push(`        transitWindow: ${JSON.stringify(s.transitWindow)},`);
    tsLines.push(`        activity: ${JSON.stringify(s.activity)},`);
    tsLines.push(`      },`);
  }
  tsLines.push(`    ],`);
  tsLines.push(`  },`);
}

tsLines.push(`};`);
tsLines.push(``);
tsLines.push(`export function getDaySchedule(day: number): AdventDay {`);
tsLines.push(`  return ADVENT_DAYS[day] ?? ADVENT_DAYS[DEFAULT_ADVENT_DAY];`);
tsLines.push(`}`);
tsLines.push(``);
tsLines.push(`export function getAllDays(): AdventDay[] {`);
tsLines.push(`  return Object.values(ADVENT_DAYS);`);
tsLines.push(`}`);
tsLines.push(``);

const tsOutPath = path.join(rootDir, "page/lib/advent-schedule.ts");
fs.writeFileSync(tsOutPath, tsLines.join("\n"), "utf-8");
console.log(`Generated ${tsOutPath}`);
