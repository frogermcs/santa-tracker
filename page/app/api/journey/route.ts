import { NextResponse } from "next/server";
import journeyData from "@/public/journey.json";

export async function GET() {
  return NextResponse.json(journeyData, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
