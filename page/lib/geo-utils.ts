// Geographic and route analysis utilities for SANTA-OS

export interface GeoPoint {
  lat: number;
  lon: number;
}

// Great-circle distance between two points using Haversine formula (km)
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Total distance across an array of waypoints
export function calculateTotalDistanceKm(points: GeoPoint[]): number {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += calculateDistanceKm(points[i].lat, points[i].lon, points[i + 1].lat, points[i + 1].lon);
  }
  return total;
}

// 2D line segment intersection on equirectangular projection
function ccw(A: [number, number], B: [number, number], C: [number, number]): boolean {
  return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0]);
}

export function segmentsIntersect(
  p1: GeoPoint,
  p2: GeoPoint,
  p3: GeoPoint,
  p4: GeoPoint
): boolean {
  const A: [number, number] = [p1.lon, p1.lat];
  const B: [number, number] = [p2.lon, p2.lat];
  const C: [number, number] = [p3.lon, p3.lat];
  const D: [number, number] = [p4.lon, p4.lat];

  return ccw(A, C, D) !== ccw(B, C, D) && ccw(A, B, C) !== ccw(A, B, D);
}

export interface RouteCrossing {
  legAIndex: number; // 0-based
  legBIndex: number; // 0-based
  legAFrom: string;
  legATo: string;
  legBFrom: string;
  legBTo: string;
}

export function findRouteCrossings(
  stops: { name: string; lat: number; lon: number }[]
): RouteCrossing[] {
  const crossings: RouteCrossing[] = [];
  const n = stops.length;

  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 2; j < n - 1; j++) {
      // Don't test adjacent segments sharing a vertex
      if (segmentsIntersect(stops[i], stops[i + 1], stops[j], stops[j + 1])) {
        crossings.push({
          legAIndex: i,
          legBIndex: j,
          legAFrom: stops[i].name,
          legATo: stops[i + 1].name,
          legBFrom: stops[j].name,
          legBTo: stops[j + 1].name,
        });
      }
    }
  }

  return crossings;
}
