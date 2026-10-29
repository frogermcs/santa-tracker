import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const journeyJsonPath = path.join(rootDir, "page/public/journey.json");
const outHeaderPath = path.join(rootDir, "firmware/include/advent_schedule.h");

const rawJson = fs.readFileSync(journeyJsonPath, "utf-8");
const data = JSON.parse(rawJson);

if (!data.days || data.days.length !== 24) {
  console.error("Error: journey.json does not contain 24 days!");
  process.exit(1);
}

const lines = [
  "// ============================================================================",
  "// SANTA-OS - Embedded Advent Calendar Route Schedule (Auto-Generated)",
  "// Source: page/public/journey.json via scripts/export-firmware-schedule.mjs",
  "// ============================================================================",
  "// Educational Note on Memory Architecture:",
  "// This 24-day itinerary contains 288 stops total (12 stops/day).",
  "// Instead of allocating a 130KB JSON string in SRAM (which would exceed the",
  "// 25% SRAM budget < 56KB), this entire table is compiled into PROGMEM (Flash ROM).",
  "//",
  "// Flash ROM consumption: 288 * 28 bytes = ~8.0 KB (~0.27% of 3MB partition)",
  "// Dynamic Heap RAM:      0 bytes",
  "// ============================================================================",
  "",
  "#pragma once",
  "#include \"types.h\"",
  "",
  "#ifndef PROGMEM",
  "  #define PROGMEM",
  "#endif",
  "",
  "#define ADVENT_TOTAL_DAYS      24",
  "#define ADVENT_STOPS_PER_DAY   12",
  "#define ADVENT_TOTAL_STOPS     (ADVENT_TOTAL_DAYS * ADVENT_STOPS_PER_DAY)",
  "",
  "// Compact waypoint record stored in Flash ROM",
  "struct AdventWaypoint {",
  "  char name[20]; // Truncated uppercase ASCII label for 5x7 GLCD bitmap font",
  "  float lon;     // GPS Longitude (-180.0 .. +180.0)",
  "  float lat;     // GPS Latitude  (-90.0 .. +90.0)",
  "};",
  "",
  "// Static table stored in PROGMEM",
  "const AdventWaypoint ADVENT_SCHEDULE[ADVENT_TOTAL_DAYS][ADVENT_STOPS_PER_DAY] PROGMEM = {",
];

for (let d = 0; d < 24; d++) {
  const dayObj = data.days[d];
  const dayNum = d + 1;
  const title = dayNum === 24 ? "Wielki Finał Wigilijny" : dayNum === 6 ? "Mikołajki" : `Etap Dnia ${dayNum}`;
  lines.push(`  // --- Day ${dayNum}: ${dayObj.date} | ${title} ---`);
  lines.push("  {");
  for (let s = 0; s < dayObj.stops.length; s++) {
    const stop = dayObj.stops[s];
    const rawName = stop.name.toUpperCase().substring(0, 19);
    const lon = Number(stop.lon).toFixed(4);
    const lat = Number(stop.lat).toFixed(4);
    lines.push(`    { ${JSON.stringify(rawName)}, ${lon}f, ${lat}f }, // Stop ${s + 1}: ${stop.localName || stop.name}`);
  }
  lines.push("  },");
}

lines.push("};");
lines.push("");
lines.push("// Helper to load an active Advent Day's 12 stops into the active JourneyData buffer");
lines.push("inline bool loadAdventDay(int dayNumber, JourneyData& outData) {");
lines.push("  if (dayNumber < 1 || dayNumber > ADVENT_TOTAL_DAYS) return false;");
lines.push("  int dayIdx = dayNumber - 1;");
lines.push("  outData.version = 2;");
lines.push("  outData.activeDay = dayNumber;");
lines.push("  outData.secPerCity = 12.0f; // 6s flight + 6s landed");
lines.push("  outData.speedMultiplier = 1.0f;");
lines.push("  outData.cityCount = ADVENT_STOPS_PER_DAY;");
lines.push("");
lines.push("  for (int i = 0; i < ADVENT_STOPS_PER_DAY; i++) {");
lines.push("#if defined(ARDUINO)");
lines.push("    strncpy_P(outData.cities[i].name, ADVENT_SCHEDULE[dayIdx][i].name, sizeof(outData.cities[i].name) - 1);");
lines.push("    outData.cities[i].name[sizeof(outData.cities[i].name) - 1] = '\\0';");
lines.push("    outData.cities[i].lon = pgm_read_float(&ADVENT_SCHEDULE[dayIdx][i].lon);");
lines.push("    outData.cities[i].lat = pgm_read_float(&ADVENT_SCHEDULE[dayIdx][i].lat);");
lines.push("#else");
lines.push("    strncpy(outData.cities[i].name, ADVENT_SCHEDULE[dayIdx][i].name, sizeof(outData.cities[i].name) - 1);");
lines.push("    outData.cities[i].name[sizeof(outData.cities[i].name) - 1] = '\\0';");
lines.push("    outData.cities[i].lon = ADVENT_SCHEDULE[dayIdx][i].lon;");
lines.push("    outData.cities[i].lat = ADVENT_SCHEDULE[dayIdx][i].lat;");
lines.push("#endif");
lines.push("  }");
lines.push("  return true;");
lines.push("}");
lines.push("");

fs.writeFileSync(outHeaderPath, lines.join("\n"), "utf-8");
console.log(`Generated ${outHeaderPath} with ${data.days.length} days (288 stops).`);
