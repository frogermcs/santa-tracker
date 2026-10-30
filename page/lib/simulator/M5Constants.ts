// ============================================================================
// M5Constants.ts — LovyanGFX / M5Canvas C++ Constant Parity
// ============================================================================

// 16-bit RGB565 Color Constants (matching LovyanGFX / TFT_eSPI)
export const TFT_BLACK = 0x0000;
export const TFT_NAVY = 0x000f;
export const TFT_DARKGREEN = 0x03e0;
export const TFT_DARKCYAN = 0x03ef;
export const TFT_MAROON = 0x7800;
export const TFT_PURPLE = 0x780f;
export const TFT_OLIVE = 0x7be0;
export const TFT_LIGHTGREY = 0xc618;
export const TFT_DARKGREY = 0x7bef;
export const TFT_BLUE = 0x001f;
export const TFT_GREEN = 0x07e0;
export const TFT_CYAN = 0x07ff;
export const TFT_RED = 0xf800;
export const TFT_MAGENTA = 0xf81f;
export const TFT_YELLOW = 0xffe0;
export const TFT_WHITE = 0xffff;
export const TFT_ORANGE = 0xfda0;
export const TFT_GREENYELLOW = 0xb7e0;
export const TFT_PINK = 0xfc9f;

// Santa Tracker Phosphor CRT Theme Colors (RGB565)
export const COLOR_BG = 0x00a1;           // #02110a Deep CRT phosphor green
export const COLOR_GRID = 0x0183;         // #073018 Faint green radar grid & rings
export const COLOR_LAND = 0x1c49;         // #1f8a4a Coastline dot matrix
export const COLOR_BREADCRUMB = 0xfea9;   // #ffd54a Sleigh route breadcrumbs
export const COLOR_CITY_VISITED = 0x7ff3; // #7dff9b Visited city waypoint
export const COLOR_CITY_FUTURE = 0x4eb1;  // #4fd68a Upcoming city waypoint
export const COLOR_RADAR_BEAM = 0x5fe1;   // #5aff8c Rotating green radar beam
export const COLOR_BEACON_PULSE = 0xfa8b; // #ff5a5a Expanding pulse ring around Santa
export const COLOR_BEACON_CORE = 0xf9c7;  // #ff3b3b Santa bright red beacon
export const COLOR_HUD_BG = 0x00c1;       // Top & bottom HUD bars
export const COLOR_TEXT_GREEN = 0x7ff3;   // #7dff9b Radar HUD text
export const COLOR_TEXT_GOLD = 0xfea9;    // #ffd54a ETA countdown text

// Text Alignment Datums (LovyanGFX textdatum_t)
export const TL_DATUM = 0; // Top-Left
export const TC_DATUM = 1; // Top-Center
export const TR_DATUM = 2; // Top-Right
export const ML_DATUM = 3; // Middle-Left
export const MC_DATUM = 4; // Middle-Center
export const MR_DATUM = 5; // Middle-Right
export const BL_DATUM = 6; // Bottom-Left
export const BC_DATUM = 7; // Bottom-Center
export const BR_DATUM = 8; // Bottom-Right

// LovyanGFX datum aliases
export const top_left = TL_DATUM;
export const top_center = TC_DATUM;
export const top_right = TR_DATUM;
export const middle_left = ML_DATUM;
export const middle_center = MC_DATUM;
export const middle_right = MR_DATUM;
export const bottom_left = BL_DATUM;
export const bottom_center = BC_DATUM;
export const bottom_right = BR_DATUM;

/**
 * Packs 8-bit RGB channels into a standard 16-bit RGB565 integer.
 */
export function color565(r: number, g: number, b: number): number {
  return ((r & 0xf8) << 8) | ((g & 0xfc) << 3) | (b >> 3);
}

/**
 * Converts RGB565, 24-bit 0xRRGGBB, or string color into a CSS hex/rgb string.
 */
export function toCssColor(color: number | string): string {
  if (typeof color === "string") return color;

  // 16-bit RGB565 integer (0x0000 - 0xFFFF)
  if (color <= 0xffff) {
    const r = Math.round(((color >> 11) & 0x1f) * 255 / 31);
    const g = Math.round(((color >> 5) & 0x3f) * 255 / 63);
    const b = Math.round((color & 0x1f) * 255 / 31);
    return `rgb(${r}, ${g}, ${b})`;
  }

  // 24-bit 0xRRGGBB
  const hex = (color & 0xffffff).toString(16).padStart(6, "0");
  return `#${hex}`;
}
