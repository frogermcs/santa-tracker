import { getDaySchedule, getAllDays } from "../page/lib/advent-schedule.ts";
import journeyJson from "../page/public/journey.json" with { type: "json" };

console.log("=== Testing Advent Schedule & Journey Data ===");

// Test 1: Day 1
const day1 = getDaySchedule(1);
console.log(`Day 1 has ${day1.stops.length} stops. First stop: ${day1.stops[0].name} (${day1.stops[0].radarName}), Country: ${day1.stops[0].country}`);
if (day1.stops.length !== 12) throw new Error("Day 1 should have 12 stops");
if (day1.stops[0].radarName !== "AUCKLAND") throw new Error("Day 1 first stop should be AUCKLAND");

// Test 2: Day 24 (Grand Finale)
const day24 = getDaySchedule(24);
console.log(`Day 24 has ${day24.stops.length} stops. First stop: ${day24.stops[0].name} (${day24.stops[0].radarName})`);
console.log(`Day 24 Last stop: ${day24.stops[11].name} (${day24.stops[11].radarName})`);
const northPoleStop = day24.stops.find((s) => s.radarName === "BIEGUN POLNOCNY");
if (!northPoleStop) throw new Error("Day 24 should include BIEGUN POLNOCNY");
if (day24.stops[0].radarName !== "GISBORNE") throw new Error("Day 24 first stop should be GISBORNE");
if (day24.stops[11].radarName !== "KRAKOW") throw new Error("Day 24 last stop should be KRAKOW");

// Test 3: Total stops across all 24 days
const allDays = getAllDays();
console.log(`Total days: ${allDays.length}`);
const totalStops = allDays.reduce((acc, d) => acc + d.stops.length, 0);
console.log(`Total stops: ${totalStops}`);
if (totalStops !== 288) throw new Error(`Expected 288 stops, found ${totalStops}`);

// Test 4: Check journey.json structure
console.log(`journey.json activeDay: ${journeyJson.activeDay}, route length: ${journeyJson.route.length}, days count: ${journeyJson.days.length}`);
if (journeyJson.route.length !== 12) throw new Error("Default route should have 12 cities");
if (journeyJson.days.length !== 24) throw new Error("Days array should have 24 days");

console.log(" All data & schedule tests passed successfully!");
