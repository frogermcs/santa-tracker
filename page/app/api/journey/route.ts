import { NextRequest, NextResponse } from "next/server";
import journeyData from "@/public/journey.json";
import { getDaySchedule } from "@/lib/advent-schedule";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dayParam = searchParams.get("day");
  const modeParam = searchParams.get("mode");

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
  };

  // If requesting the full dataset
  if (modeParam === "all" || dayParam === "all") {
    return NextResponse.json(journeyData, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // If a specific day is requested
  if (dayParam) {
    const dayNum = parseInt(dayParam, 10);
    if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 24) {
      const dayData = getDaySchedule(dayNum);
      const dayRoute = dayData.stops.map((s) => ({
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
      }));

      return NextResponse.json(
        {
          version: journeyData.version,
          updatedAt: journeyData.updatedAt,
          activeDay: dayNum,
          dayTitle: dayData.title,
          date: dayData.date,
          secPerCity: journeyData.secPerCity,
          speedMultiplier: journeyData.speedMultiplier,
          route: dayRoute,
        },
        {
          status: 200,
          headers: corsHeaders,
        }
      );
    }
  }

  // Default: returns Day 24 (Grand Finale) route for seamless client & hardware compatibility
  return NextResponse.json(
    {
      version: journeyData.version,
      updatedAt: journeyData.updatedAt,
      activeDay: journeyData.activeDay,
      dayTitle: "Wielki Finał Wigilijny (Grand Finale)",
      date: "2026-12-24",
      secPerCity: journeyData.secPerCity,
      speedMultiplier: journeyData.speedMultiplier,
      route: journeyData.route,
      totalDays: 24,
    },
    {
      status: 200,
      headers: corsHeaders,
    }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
