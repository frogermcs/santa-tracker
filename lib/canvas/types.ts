export type ScreenIndex = 0 | 1 | 2;

export interface CityWaypoint {
  name: string;
  lon: number;
  lat: number;
  x?: number;
  y?: number;
}

export interface TelemetryData {
  currentScreen: ScreenIndex;
  distanceKm: number;
  giftsDelivered: number;
  currentCityIndex: number;
  nextCity: string;
  etaSeconds: number;
  machSpeed: number;
  progressPercent: number;
}

export interface CanvasEngineCallbacks {
  onTelemetryUpdate?: (data: Partial<TelemetryData>) => void;
  onScreenChange?: (newScreen: ScreenIndex) => void;
}
