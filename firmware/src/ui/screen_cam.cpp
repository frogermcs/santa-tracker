#include "screen_cam.h"
#include <math.h>
#include <stdio.h>
#include <string.h>

// ============================================================================
// ScreenCam Color Palette (RGB565 16-bit format)
// ============================================================================
#define COLOR_BG_DARK        0x0000  // #000000 Pitch black
#define COLOR_SKY_MIDNIGHT   0x0825  // Deep polar night navy (#080c1a)
#define COLOR_HEADER_BG      0x0821  // Avionics glass header (#080c14)
#define COLOR_BORDER         0x2124  // Graphite titanium divider (#20242c)
#define COLOR_CYAN_BRIGHT    0x07ff  // Electric ice cyan (#00f0ff)
#define COLOR_AMBER_BRIGHT   0xfde0  // High-visibility aviation amber (#fbbf24)
#define COLOR_EMERALD_NEON   0x07e0  // Vivid emerald (#00ff00)
#define COLOR_GOLD           0xffe0  // Pure golden yellow (#ffff00)
#define COLOR_SANTA_RED      0xd800  // Crimson Santa suit (#dc2626)
#define COLOR_SANTA_FACE     0xfde0  // Peach face tone
#define COLOR_SLEIGH_RUNNER  0xfde0  // Sleigh runner gold
#define COLOR_SLEIGH_HULL    0x8800  // Mahogany crimson sleigh hull
#define COLOR_REINDEER_BROWN 0x92c2  // Chestnut brown
#define COLOR_REINDEER_DARK  0x5180  // Hooves and shadow brown
#define COLOR_ANTLERS        0xce55  // Bone antlers
#define COLOR_NOSE_RED       0xf800  // Rudolph nose bright red
#define COLOR_NOSE_GLOW      0xfc00  // Rudolph nose strobe flare
#define COLOR_ROOF_SLATE     0x2128  // Slate tile roof
#define COLOR_SNOW           0xffff  // Crisp white snow
#define COLOR_BRICK          0x99a3  // Brick red chimney
#define COLOR_WARM_WINDOW    0xffa0  // Warm amber incandescent light
#define COLOR_COOKIE_BASE    0xfc80  // Baked cookie amber
#define COLOR_COOKIE_CHIP    0x3940  // Chocolate chip
#define COLOR_MOUNTAIN_DARK  0x0926  // Mountain silhouette
#define COLOR_MOUNTAIN_CAP   0x7be0  // Icy mountain peak
#define COLOR_SPIRE          0x18c5  // Bazylika Mariacka silhouette navy
#define COLOR_EARTH_ATMOS    0x3dff  // Glowing outer atmospheric cyan-white
#define COLOR_EARTH_OCEAN    0x08c8  // Deep satellite oceanic navy (#081940)
#define COLOR_EARTH_LAND     0x1406  // Nocturnal continent landmass dark olive/green (#142010)
#define COLOR_EARTH_CLOUD    0x9537  // High stratospheric wispy clouds (#90a4b8)
#define COLOR_CITY_LIGHT     0xfe64  // Twinkling nighttime city lights (#fbbf24)
#define COLOR_PINE_NEEDLE    0x13c3  // Festive dark pine tree green (#107c18)

ScreenCam::ScreenCam() : _canvas(nullptr) {}

void ScreenCam::init(M5Canvas* canvas) {
  _canvas = canvas;
}

void ScreenCam::drawBatteryIcon(int x, int y, uint16_t color) {
  if (!_canvas) return;
  _canvas->drawRect(x, y + 1, 10, 6, color);
  _canvas->fillRect(x + 10, y + 2, 2, 4, color);
  _canvas->fillRect(x + 2, y + 2, 6, 4, color);
}

void ScreenCam::drawSantaSleigh(int x, int y) {
  if (!_canvas) return;
  _canvas->fillRect(x + 5, y + 1, 3, 2, COLOR_SANTA_RED);
  _canvas->drawPixel(x + 8, y + 1, COLOR_SNOW);
  _canvas->fillRect(x + 4, y + 3, 5, 1, COLOR_SNOW);

  _canvas->fillRect(x + 4, y + 4, 3, 1, COLOR_SANTA_FACE);
  _canvas->drawPixel(x + 5, y + 4, TFT_BLACK);
  _canvas->fillRect(x + 4, y + 5, 4, 2, COLOR_SNOW);

  _canvas->fillRect(x + 3, y + 6, 5, 3, COLOR_SANTA_RED);
  _canvas->drawFastHLine(x + 3, y + 8, 5, TFT_BLACK);
  _canvas->drawPixel(x + 5, y + 8, COLOR_GOLD);

  _canvas->fillRect(x + 8, y + 5, 4, 4, COLOR_EMERALD_NEON);
  _canvas->drawFastVLine(x + 10, y + 5, 4, COLOR_GOLD);
  _canvas->drawFastHLine(x + 8, y + 7, 4, COLOR_GOLD);

  _canvas->fillRect(x + 2, y + 9, 14, 2, COLOR_SLEIGH_HULL);
  _canvas->fillRect(x + 1, y + 10, 16, 2, COLOR_SLEIGH_HULL);
  _canvas->drawPixel(x, y + 9, COLOR_SLEIGH_RUNNER);

  _canvas->drawFastHLine(x + 2, y + 13, 16, COLOR_SLEIGH_RUNNER);
  _canvas->drawPixel(x + 18, y + 12, COLOR_SLEIGH_RUNNER);
  _canvas->drawPixel(x + 19, y + 11, COLOR_SLEIGH_RUNNER);
  _canvas->drawFastVLine(x + 4, y + 12, 1, COLOR_SLEIGH_RUNNER);
  _canvas->drawFastVLine(x + 14, y + 12, 1, COLOR_SLEIGH_RUNNER);
}

void ScreenCam::drawSleighJetFlames(int sleighX, int sleighY, unsigned long nowMs) {
  if (!_canvas) return;

  // 1. Primary Sleigh Hull Plasma Thruster (y + 10)
  int pulse1 = ((nowMs / 30) % 5);
  int flameLen1 = 8 + pulse1; // 8..12 px

  _canvas->drawFastHLine(sleighX - flameLen1, sleighY + 10, (flameLen1 * 4) / 10, COLOR_NOSE_RED);
  _canvas->drawFastHLine(sleighX - (flameLen1 * 7) / 10, sleighY + 10, (flameLen1 * 4) / 10, COLOR_AMBER_BRIGHT);
  _canvas->drawFastHLine(sleighX - 3, sleighY + 10, 3, TFT_WHITE);

  int midLen = flameLen1 / 2;
  if (midLen > 1) {
    _canvas->drawFastHLine(sleighX - midLen, sleighY + 9, midLen - 1, COLOR_AMBER_BRIGHT);
    _canvas->drawFastHLine(sleighX - midLen, sleighY + 11, midLen - 1, COLOR_AMBER_BRIGHT);
  }

  // 2. Runner Skid Turbo Flame (y + 13)
  int pulse2 = ((nowMs / 45) % 4);
  int flameLen2 = 6 + pulse2; // 6..9 px
  _canvas->drawFastHLine(sleighX - flameLen2, sleighY + 13, 3, COLOR_NOSE_RED);
  _canvas->drawFastHLine(sleighX - (flameLen2 * 7) / 10, sleighY + 13, 3, COLOR_AMBER_BRIGHT);
  _canvas->drawFastHLine(sleighX - 2, sleighY + 13, 2, COLOR_CYAN_BRIGHT);

  int sparkY = sleighY + 10 + ((int)((nowMs / 60) % 3) - 1);
  _canvas->drawPixel(sleighX - flameLen1 - 3, sparkY, COLOR_GOLD);
}

void ScreenCam::drawReindeer(int x, int y, int legFrame, bool noseGlow) {
  if (!_canvas) return;
  _canvas->drawPixel(x + 5, y, COLOR_ANTLERS);
  _canvas->drawPixel(x + 7, y, COLOR_ANTLERS);
  _canvas->drawPixel(x + 5, y + 1, COLOR_ANTLERS);
  _canvas->drawPixel(x + 6, y + 1, COLOR_ANTLERS);
  _canvas->drawPixel(x + 8, y + 1, COLOR_ANTLERS);

  _canvas->fillRect(x + 6, y + 2, 5, 3, COLOR_REINDEER_BROWN);
  _canvas->drawPixel(x + 8, y + 2, TFT_BLACK);
  _canvas->fillRect(x + 7, y + 4, 5, 2, COLOR_REINDEER_BROWN);

  _canvas->drawFastVLine(x + 6, y + 5, 2, COLOR_GOLD);

  // Rudolph's Glowing Red Nose (2x2 px, clean natural shape)
  _canvas->fillRect(x + 12, y + 4, 2, 2, COLOR_NOSE_RED);
  if (noseGlow) {
    _canvas->drawPixel(x + 13, y + 4, COLOR_NOSE_GLOW);
  }

  _canvas->fillRect(x + 2, y + 6, 8, 4, COLOR_REINDEER_BROWN);
  _canvas->drawPixel(x + 1, y + 6, COLOR_SNOW);

  if (legFrame == 0) {
    _canvas->drawFastVLine(x + 2, y + 10, 3, COLOR_REINDEER_BROWN);
    _canvas->drawPixel(x + 1, y + 13, COLOR_REINDEER_DARK);
    _canvas->drawFastVLine(x + 8, y + 10, 3, COLOR_REINDEER_BROWN);
    _canvas->drawPixel(x + 9, y + 13, COLOR_REINDEER_DARK);
  } else {
    _canvas->drawFastVLine(x + 3, y + 10, 2, COLOR_REINDEER_BROWN);
    _canvas->drawPixel(x + 4, y + 12, COLOR_REINDEER_DARK);
    _canvas->drawFastVLine(x + 7, y + 10, 2, COLOR_REINDEER_BROWN);
    _canvas->drawPixel(x + 6, y + 12, COLOR_REINDEER_DARK);
  }
}

void ScreenCam::drawReins(int sleighX, int sleighY, int deerX, int deerY) {
  if (!_canvas) return;
  int x0 = sleighX + 17;
  int y0 = sleighY + 8;
  int x1 = deerX + 6;
  int y1 = deerY + 5;
  int midX = (x0 + x1) / 2;
  int midY = (y0 + y1) / 2 + 1;

  _canvas->drawLine(x0, y0, midX, midY, COLOR_GOLD);
  _canvas->drawLine(midX, midY, x1, y1, COLOR_GOLD);
}

void ScreenCam::drawParachuteGift(int x, int y) {
  if (!_canvas) return;
  _canvas->fillRect(x + 2, y, 6, 1, COLOR_SNOW);
  _canvas->fillRect(x + 1, y + 1, 8, 2, COLOR_SNOW);
  _canvas->drawPixel(x, y + 3, COLOR_SNOW);
  _canvas->drawPixel(x + 9, y + 3, COLOR_SNOW);

  _canvas->drawLine(x + 1, y + 3, x + 3, y + 6, COLOR_SNOW);
  _canvas->drawLine(x + 8, y + 3, x + 6, y + 6, COLOR_SNOW);

  _canvas->fillRect(x + 2, y + 6, 6, 5, COLOR_EMERALD_NEON);
  _canvas->drawFastVLine(x + 4, y + 6, 5, COLOR_GOLD);
  _canvas->drawFastHLine(x + 2, y + 8, 6, COLOR_GOLD);
}

bool ScreenCam::drawChimneyGiftDrop(int sleighY, int chimCenterX, int chimY) {
  if (!_canvas) return false;
  const int releaseX = 70; // Santa's gift sack is at x = 70
  const int dropDist = 24; // Distance chimney scrolls while present falls (approx 0.86s at 28 px/s)

  if (chimCenterX > releaseX || chimCenterX < releaseX - (int)(dropDist * 1.35f)) {
    return false;
  }

  float progress = (float)(releaseX - chimCenterX) / (float)dropDist;
  if (progress >= 0.0f && progress < 1.0f) {
    // Parachute descent directly aligned with chimney opening with subtle sway
    int sway = (int)(sinf(progress * 3.14159f * 4.0f) * 1.5f);
    int gx = chimCenterX - 5 + sway;
    int startY = sleighY + 11;
    int targetY = chimY - 8; // Bottom of gift box enters chimney mouth
    int gy = startY + (int)(progress * (float)(targetY - startY));
    drawParachuteGift(gx, gy);
    return true;
  } else if (progress >= 1.0f && progress <= 1.35f) {
    // Delivery hit sparkle bursting directly at the chimney mouth!
    int sparkX = chimCenterX;
    int sparkY = chimY - 1;
    _canvas->drawPixel(sparkX, sparkY, COLOR_GOLD);
    _canvas->drawPixel(sparkX + 2, sparkY - 2, COLOR_GOLD);
    _canvas->drawPixel(sparkX - 2, sparkY - 2, COLOR_GOLD);
    _canvas->drawPixel(sparkX, sparkY - 4, COLOR_GOLD);
    _canvas->drawPixel(sparkX, sparkY - 2, TFT_WHITE);
    return true;
  }
  return false;
}

void ScreenCam::drawDroppingGift(int sleighX, int sleighY, float dropProgress) {
  if (!_canvas) return;
  // Retained for backward compatibility
  int sway = (int)(sinf(dropProgress * 3.14159f * 3.0f) * 2.0f);
  int gx = sleighX + 8 - (int)(dropProgress * 12.0f) + sway;
  int gy = sleighY + 12 + (int)(dropProgress * 38.0f);

  if (gy < 72) {
    drawParachuteGift(gx, gy);
  }
}

// ============================================================================
// Scrolling City Skyline: Distinct Separate Buildings, Alleys & Chimneys
// ============================================================================

struct BuildingDef {
  int16_t x;
  int16_t w;
  int16_t roofY;
  uint16_t wallColor;
  int16_t chimRelX;
  int16_t chimW;
  int16_t chimH;
  int16_t winRelX;
  int16_t winRelY;
  int16_t winW;
  int16_t winH;
  int16_t alleyType; // 0: Lamppost, 1: Pine tree
};

static const BuildingDef BUILDINGS[4] = {
  { 0,   46, 82, COLOR_ROOF_SLATE, 32, 10, 12, 8,  14, 12, 12, 0 },
  { 62,  44, 88, 0x31a6,           6,  10, 11, 20, 12, 14, 10, 1 },
  { 122, 48, 78, 0x2148,           34, 10, 13, 8,  12, 12, 14, 0 },
  { 184, 42, 84, COLOR_ROOF_SLATE, 14, 10, 11, 8,  14, 12, 11, 1 },
};

void ScreenCam::drawScrollingRooftops(float nowSec, int sleighY, bool enableDrops) {
  if (!_canvas) return;
  const int cycleW = 240;
  int scrollOffset = (((int)(nowSec * 28.0f) % cycleW) + cycleW) % cycleW;

  // 1. Street Ground Level Snow Blanket across bottom (y = 114..119)
  _canvas->fillRect(0, 114, SCREEN_WIDTH, 2, 0x18c4);
  _canvas->fillRect(0, 116, SCREEN_WIDTH, 4, COLOR_SNOW);

  // 2. Render 2 instances of the 240px cycle to smoothly cover viewport with wrapping
  for (int cycle = 0; cycle < 2; cycle++) {
    int cycleBaseX = cycle * cycleW - scrollOffset;

    for (int b = 0; b < 4; b++) {
      const BuildingDef& bldg = BUILDINGS[b];
      int bx = cycleBaseX + bldg.x;

      // Skip if building + alley is completely off-screen
      if (bx + bldg.w + 18 < 0 || bx > SCREEN_WIDTH) continue;

      // --- Draw Building Wall (Individual separate structure from roofY down to street y=114) ---
      int wallH = 114 - bldg.roofY;
      _canvas->fillRect(bx, bldg.roofY, bldg.w, wallH, bldg.wallColor);

      // Building Outline / Edges (gives depth and clear visual separation between buildings)
      _canvas->drawFastVLine(bx, bldg.roofY, wallH, TFT_BLACK);
      _canvas->drawFastVLine(bx + bldg.w - 1, bldg.roofY, wallH, TFT_BLACK);

      // --- Snowy Roof Cap with Icicles ---
      _canvas->fillRect(bx - 1, bldg.roofY - 2, bldg.w + 2, 3, COLOR_SNOW);
      _canvas->drawFastVLine(bx + 8, bldg.roofY + 1, 3, COLOR_SNOW);
      _canvas->drawFastVLine(bx + (bldg.w * 6 / 10), bldg.roofY + 1, 2, COLOR_SNOW);

      // --- Brick Chimney with Smoke Puff & Gift Drop ---
      int chimX = bx + bldg.chimRelX;
      int chimY = bldg.roofY - bldg.chimH;
      int chimCenterX = chimX + (bldg.chimW / 2);

      // Chimney body
      _canvas->fillRect(chimX, chimY, bldg.chimW, bldg.chimH, COLOR_BRICK);
      _canvas->drawFastHLine(chimX, chimY + (bldg.chimH / 2), bldg.chimW, TFT_BLACK);
      // Chimney snow cap
      _canvas->fillRect(chimX - 1, chimY - 2, bldg.chimW + 2, 3, COLOR_SNOW);

      // Check if gift is dropping directly into this chimney
      bool isDropping = enableDrops ? drawChimneyGiftDrop(sleighY, chimCenterX, chimY) : false;

      // Chimney smoke puffs (drifting up when not actively receiving a gift)
      if (!isDropping) {
        int smokeOffset = ((int)(nowSec * 14.0f) + b * 6) % 18;
        int smokeY = chimY - 3 - smokeOffset;
        int smokeX = chimX + (bldg.chimW / 2) - (int)(smokeOffset * 0.35f);
        if (smokeY >= 20 && smokeY < chimY) {
          _canvas->fillCircle(smokeX, smokeY, 2, COLOR_SNOW);
        }
      }

      // --- Cozy Glowing Window ---
      int winX = bx + bldg.winRelX;
      int winY = bldg.roofY + bldg.winRelY;
      _canvas->fillRect(winX, winY, bldg.winW, bldg.winH, COLOR_WARM_WINDOW);
      _canvas->drawRect(winX, winY, bldg.winW, bldg.winH, TFT_BLACK);
      _canvas->drawFastHLine(winX, winY + (bldg.winH / 2), bldg.winW, TFT_BLACK);
      _canvas->drawFastVLine(winX + (bldg.winW / 2), winY, bldg.winH, TFT_BLACK);

      // --- Alley Elements (In the open space between this building and the next) ---
      int alleyX = bx + bldg.w;
      if (bldg.alleyType == 0) {
        // Victorian Street Lamppost
        int postX = alleyX + 7;
        _canvas->drawFastVLine(postX, 96, 18, 0x4208); // Dark iron post
        _canvas->fillRect(postX - 2, 93, 5, 4, COLOR_GOLD); // Glowing lantern
        _canvas->drawPixel(postX, 92, 0x4208); // Finial top
        // Warm amber glow on ground snow
        _canvas->fillRect(postX - 4, 114, 9, 2, COLOR_AMBER_BRIGHT);
      } else {
        // Snow-Dusted Evergreen Pine Tree
        int treeX = alleyX + 8;
        // Trunk
        _canvas->fillRect(treeX - 1, 108, 3, 6, 0x4180);
        // Foliage triangles (bottom to top)
        _canvas->fillRect(treeX - 5, 103, 11, 5, COLOR_PINE_NEEDLE);
        _canvas->drawFastHLine(treeX - 4, 103, 9, COLOR_SNOW);
        _canvas->fillRect(treeX - 3, 97, 7, 6, COLOR_PINE_NEEDLE);
        _canvas->drawFastHLine(treeX - 2, 97, 5, COLOR_SNOW);
        _canvas->fillRect(treeX - 1, 92, 3, 5, COLOR_PINE_NEEDLE);
        _canvas->drawPixel(treeX, 91, COLOR_SNOW); // Snow star on top
      }
    }
  }
}

void ScreenCam::drawStationarySnowyRooftop(float chimneySmokeY) {
  if (!_canvas) return;
  _canvas->fillRect(0, 88, SCREEN_WIDTH, 31, COLOR_ROOF_SLATE);

  _canvas->fillRect(0, 85, SCREEN_WIDTH, 4, COLOR_SNOW);
  for (int x = 10; x < SCREEN_WIDTH; x += 18) {
    _canvas->drawFastVLine(x, 89, 2, COLOR_SNOW);
  }

  _canvas->fillRect(175, 72, 18, 16, COLOR_BRICK);
  _canvas->drawFastHLine(175, 77, 18, TFT_BLACK);
  _canvas->drawFastHLine(175, 82, 18, TFT_BLACK);
  _canvas->drawFastVLine(183, 72, 5, TFT_BLACK);
  _canvas->drawFastVLine(179, 77, 5, TFT_BLACK);
  _canvas->drawFastVLine(187, 77, 5, TFT_BLACK);

  _canvas->fillRect(173, 69, 22, 3, COLOR_SNOW);

  int smokeY1 = 64 - ((int)chimneySmokeY % 24);
  int smokeX1 = 184 + (int)(sinf(chimneySmokeY * 0.1f) * 3.0f);
  if (smokeY1 >= 25 && smokeY1 < 70) {
    _canvas->fillCircle(smokeX1, smokeY1, 2, COLOR_SNOW);
  }

  _canvas->fillRect(70, 94, 16, 14, COLOR_WARM_WINDOW);
  _canvas->drawRect(70, 94, 16, 14, TFT_BLACK);
  _canvas->drawFastHLine(70, 101, 16, TFT_BLACK);
  _canvas->drawFastVLine(78, 94, 14, TFT_BLACK);
}

void ScreenCam::drawKrakowBasilica(int x, int baseY) {
  if (!_canvas) return;
  _canvas->fillRect(x + 4, baseY - 36, 12, 36, COLOR_SPIRE);
  _canvas->fillRect(x + 6, baseY - 46, 8, 10, COLOR_SPIRE);
  _canvas->fillRect(x + 8, baseY - 54, 4, 8, COLOR_SPIRE);
  _canvas->drawFastVLine(x + 9, baseY - 58, 4, COLOR_GOLD);
  _canvas->drawPixel(x + 9, baseY - 59, COLOR_GOLD);

  _canvas->drawFastVLine(x + 3, baseY - 42, 6, COLOR_SPIRE);
  _canvas->drawFastVLine(x + 16, baseY - 42, 6, COLOR_SPIRE);

  _canvas->fillRect(x + 8, baseY - 28, 4, 7, COLOR_WARM_WINDOW);
  _canvas->drawPixel(x + 9, baseY - 29, COLOR_WARM_WINDOW);

  _canvas->fillRect(x + 20, baseY - 30, 12, 30, COLOR_SPIRE);
  _canvas->fillRect(x + 22, baseY - 38, 8, 8, COLOR_SPIRE);
  _canvas->fillRect(x + 24, baseY - 44, 4, 6, COLOR_SPIRE);
  _canvas->drawFastVLine(x + 25, baseY - 47, 3, COLOR_GOLD);

  _canvas->fillRect(x + 24, baseY - 24, 4, 6, COLOR_WARM_WINDOW);
}

void ScreenCam::drawBigSantaCookieBreak(float nowSec, unsigned long nowMs) {
  if (!_canvas) return;

  // 1. Cozy Fireplace Atmosphere on Left (x = 6..64, y = 32..118, safely below description text)
  _canvas->fillRect(4, 32, 60, 5, 0x6180);      // Dark wooden mantel shelf
  _canvas->fillRect(6, 37, 56, 81, COLOR_BRICK);
  _canvas->fillRect(14, 58, 40, 60, TFT_BLACK); // Hearth opening
  _canvas->drawFastHLine(6, 58, 56, TFT_BLACK);

  // --- 1. Wooden Logs & Glowing Charcoal Embers at Hearth Floor (y = 112..118) ---
  // Glowing ember bed
  _canvas->fillRect(18, 116, 32, 2, 0x4800);
  for (int ex = 20; ex <= 48; ex += 4) {
    uint16_t emberColor = ((((int)(nowSec * 8.0f) + ex) % 3) == 0) ? COLOR_AMBER_BRIGHT : COLOR_SANTA_RED;
    _canvas->drawPixel(ex, 116, emberColor);
    _canvas->drawPixel(ex + 1, 117, 0x99a3);
  }

  // Cross Firewood Logs
  _canvas->fillRect(18, 114, 32, 3, 0x4180); // Dark oak log
  _canvas->drawFastHLine(20, 114, 28, 0x6200); // Bark highlight
  _canvas->drawPixel(18, 115, 0x2940);
  _canvas->drawPixel(49, 115, 0x2940);

  // Top angled support logs
  _canvas->drawLine(22, 115, 34, 110, 0x51c0);
  _canvas->drawLine(23, 115, 35, 110, 0x3140);
  _canvas->drawLine(46, 115, 36, 110, 0x51c0);
  _canvas->drawLine(45, 115, 35, 110, 0x3140);

  // --- 2. Dancing Fireplace Flame Tongues (Licking, Tapered, Organic Pixel Fire) ---
  struct FlameTongue {
    int baseCenterX;
    int tipH;
    float speed;
    float phase;
    int baseW;
  };
  static const FlameTongue FLAME_TONGUES[3] = {
    { 28, 15, 15.0f, 0.0f, 5 },
    { 34, 24, 18.0f, 1.8f, 7 },
    { 40, 16, 16.0f, 3.5f, 5 }
  };

  for (int i = 0; i < 3; i++) {
    const FlameTongue& t = FLAME_TONGUES[i];
    int flickH = t.tipH + (int)(sinf(nowSec * t.speed + t.phase) * 3.0f);
    int topY = 113 - flickH;
    if (topY < 68) topY = 68;
    int baseY = 113;

    int span = baseY - topY;
    if (span < 1) span = 1;

    for (int y = baseY; y >= topY; y--) {
      float prog = (float)(baseY - y) / (float)span;
      int sway = (int)(sinf(nowSec * (t.speed * 0.8f) + (float)y * 0.25f + t.phase) * (1.8f * prog));
      int fcx = t.baseCenterX + sway;
      int halfW = (int)((float)t.baseW * (1.0f - prog * 0.95f) + 0.5f);
      if (halfW < 0) halfW = 0;

      // Outer crimson flame mantle
      _canvas->drawFastHLine(fcx - halfW, y, halfW * 2 + 1, COLOR_SANTA_RED);

      // Warm amber / gold flame interior
      if (halfW >= 1 && prog < 0.85f) {
        int midW = halfW - 1;
        _canvas->drawFastHLine(fcx - midW, y, midW * 2 + 1, COLOR_AMBER_BRIGHT);
      }

      // Hot golden-white core near base
      if (halfW >= 2 && prog < 0.55f) {
        int coreW = halfW - 2;
        _canvas->drawFastHLine(fcx - coreW, y, coreW * 2 + 1, (y > 108) ? TFT_WHITE : COLOR_GOLD);
      }
    }

    // Flame tip flickering spark
    int tipSway = (int)(sinf(nowSec * t.speed + t.phase) * 2.0f);
    _canvas->drawPixel(t.baseCenterX + tipSway, topY - 1, (i == 1) ? COLOR_GOLD : COLOR_AMBER_BRIGHT);
  }

  // --- 3. Rising Fireplace Sparks / Glowing Embers ---
  for (int s = 0; s < 4; s++) {
    int sSpeed = 18 + s * 4;
    int sOffset = ((int)(nowSec * (float)sSpeed + (float)(s * 7))) % 35;
    int sy = 100 - sOffset;
    if (sy >= 62 && sy < 100) {
      int sx = 34 + (int)(sinf(nowSec * 5.0f + (float)(s * 2) + (float)sy * 0.15f) * (float)(4 + s));
      uint16_t sColor = (s % 2 == 0) ? COLOR_GOLD : COLOR_AMBER_BRIGHT;
      _canvas->drawPixel(sx, sy, sColor);
    }
  }

  // 2. Table with Milk on Right (x = 170..236, y = 70..118)
  _canvas->fillRect(170, 92, 66, 6, 0x8280);
  _canvas->fillRect(176, 98, 8, 20, 0x6180);
  _canvas->fillRect(224, 98, 8, 20, 0x6180);

  _canvas->fillRect(182, 68, 14, 24, TFT_WHITE);
  _canvas->drawRect(181, 67, 16, 25, 0x9efb);
  _canvas->fillRect(183, 78, 12, 5, COLOR_CYAN_BRIGHT);

  // Straw
  for (int dy = 0; dy < 16; dy++) {
    uint16_t strawColor = ((dy / 3) % 2 == 0) ? COLOR_SANTA_RED : TFT_WHITE;
    _canvas->drawPixel(190 - (int)(dy * 0.25f), 66 - dy, strawColor);
    _canvas->drawPixel(191 - (int)(dy * 0.25f), 66 - dy, strawColor);
  }

  // Plate with cookies
  _canvas->fillRect(206, 88, 20, 4, TFT_WHITE);
  _canvas->fillCircle(212, 85, 4, COLOR_COOKIE_BASE);
  _canvas->drawPixel(212, 84, COLOR_COOKIE_CHIP);
  _canvas->fillCircle(220, 85, 4, COLOR_COOKIE_BASE);
  _canvas->drawPixel(220, 85, COLOR_COOKIE_CHIP);

  // 3. Centerpiece: JOLLY SANTA CLAUS EATING COOKIES (cx = 118, y = 35..118)
  int cx = 118;

  // Body & Coat
  _canvas->fillRect(cx - 28, 84, 56, 34, COLOR_SANTA_RED);
  _canvas->fillRect(cx - 4, 84, 8, 34, COLOR_SNOW);
  _canvas->drawFastHLine(cx - 20, 114, 40, TFT_BLACK);
  _canvas->drawRect(cx - 5, 111, 10, 7, COLOR_GOLD);

  // Big Beard
  _canvas->fillRect(cx - 20, 64, 40, 24, COLOR_SNOW);
  _canvas->fillCircle(cx - 15, 82, 8, COLOR_SNOW);
  _canvas->fillCircle(cx + 15, 82, 8, COLOR_SNOW);
  _canvas->fillCircle(cx, 86, 10, COLOR_SNOW);
  _canvas->drawFastHLine(cx - 12, 76, 24, 0xce79);
  _canvas->drawFastHLine(cx - 8, 82, 16, 0xce79);

  // Face
  _canvas->fillRect(cx - 16, 50, 32, 16, COLOR_SANTA_FACE);
  _canvas->fillCircle(cx - 11, 58, 3, 0xfbe4);
  _canvas->fillCircle(cx + 11, 58, 3, 0xfbe4);
  _canvas->fillCircle(cx, 58, 3, 0xf9a0); // Button nose

  // Eyes
  _canvas->drawFastHLine(cx - 10, 53, 5, TFT_BLACK);
  _canvas->drawPixel(cx - 8, 52, TFT_BLACK);
  _canvas->drawFastHLine(cx + 6, 53, 5, TFT_BLACK);
  _canvas->drawPixel(cx + 8, 52, TFT_BLACK);

  // Eyebrows
  _canvas->fillRect(cx - 11, 50, 6, 2, COLOR_SNOW);
  _canvas->fillRect(cx + 5, 50, 6, 2, COLOR_SNOW);

  // Red Hat (y = 35..49, safely below top text)
  _canvas->fillRect(cx - 18, 35, 36, 11, COLOR_SANTA_RED);
  _canvas->fillRect(cx - 28, 39, 12, 8, COLOR_SANTA_RED);
  _canvas->fillRect(cx - 34, 44, 8, 7, COLOR_SANTA_RED);
  _canvas->fillCircle(cx - 36, 51, 5, COLOR_SNOW);
  _canvas->fillRect(cx - 20, 45, 40, 5, COLOR_SNOW);

  // Mouth & Chewing
  bool isChewing = ((nowMs / 250) % 2 == 1);
  if (isChewing) {
    _canvas->fillCircle(cx, 63, 3, 0x6000);
  } else {
    _canvas->drawFastHLine(cx - 4, 63, 8, TFT_BLACK);
    _canvas->drawPixel(cx - 5, 62, TFT_BLACK);
    _canvas->drawPixel(cx + 4, 62, TFT_BLACK);
  }

  // Cookie in Hand (Diameter 14px)
  _canvas->fillRect(cx + 14, 66, 12, 10, COLOR_SANTA_RED);
  _canvas->fillRect(cx + 12, 64, 5, 14, COLOR_SNOW);

  _canvas->fillCircle(cx + 13, 62, 7, COLOR_COOKIE_BASE);
  _canvas->drawPixel(cx + 11, 59, COLOR_COOKIE_CHIP);
  _canvas->drawPixel(cx + 15, 60, COLOR_COOKIE_CHIP);
  _canvas->drawPixel(cx + 12, 64, COLOR_COOKIE_CHIP);
  _canvas->drawPixel(cx + 16, 65, COLOR_COOKIE_CHIP);
  _canvas->drawPixel(cx + 13, 62, COLOR_COOKIE_CHIP);

  _canvas->fillCircle(cx + 8, 62, 3, COLOR_SANTA_FACE); // Bite mark

  int crumbOffset = ((int)(nowSec * 16.0f)) % 18;
  _canvas->drawPixel(cx + 8, 66 + crumbOffset, COLOR_COOKIE_CHIP);
  _canvas->drawPixel(cx + 10, 68 + (crumbOffset % 12), COLOR_COOKIE_BASE);

  // Speech bubble (safely below description text at y = 34)
  _canvas->fillRect(162, 34, 52, 15, TFT_WHITE);
  _canvas->drawRect(162, 34, 52, 15, TFT_BLACK);
  _canvas->drawPixel(160, 43, TFT_WHITE);
  _canvas->drawPixel(161, 43, TFT_WHITE);
  _canvas->drawPixel(159, 44, TFT_BLACK);

  _canvas->setTextDatum(top_center);
  _canvas->setTextSize(1);
  _canvas->setTextColor(TFT_BLACK, TFT_WHITE);
  _canvas->drawString("MNIAM! *", 188, 38);

  float heartFloat = sinf(nowSec * 4.0f);
  if (heartFloat > 0.0f) {
    _canvas->drawPixel(cx + 22, 42, COLOR_GOLD);
    _canvas->drawPixel(cx + 21, 41, COLOR_GOLD);
    _canvas->drawPixel(cx + 23, 41, COLOR_GOLD);
    _canvas->drawPixel(cx + 22, 43, COLOR_GOLD);
  }
}

void ScreenCam::drawParallaxStars(float nowSec) {
  if (!_canvas) return;
  for (int i = 0; i < 24; i++) {
    int seedX = (i * 37 + 13) % 240;
    int seedY = 16 + ((i * 47) % 64);
    int starX = (seedX - (int)(nowSec * 5.0f) + 480) % 240;
    bool twinkle = (sinf(nowSec * 4.0f + (float)i) > 0.3f);
    uint16_t color = twinkle ? COLOR_AMBER_BRIGHT : TFT_WHITE;
    _canvas->drawPixel(starX, seedY, color);
  }
}

void ScreenCam::drawStratosphericStars(float nowSec) {
  if (!_canvas) return;

  // 1. Cosmic Starfield (48 stars across upper stratospheric space)
  for (int i = 0; i < 48; i++) {
    int seedX = (i * 31 + 17) % SCREEN_WIDTH;
    int seedY = 16 + ((i * 43 + 7) % 68);

    // Ensure star is in space above the curved Earth horizon
    int dx = seedX - 120;
    int horizonY = 88 + (dx * dx * 18) / 14400;
    if (seedY >= horizonY - 2) continue;

    int speed = (i % 3 == 0) ? 3 : (i % 2 == 0) ? 5 : 8;
    int starX = (((seedX - (int)(nowSec * (float)speed)) % SCREEN_WIDTH) + SCREEN_WIDTH) % SCREEN_WIDTH;

    float twinkleVal = sinf(nowSec * 5.0f + (float)i * 1.7f);
    if (twinkleVal > -0.4f) {
      uint16_t color = (i % 5 == 0) ? COLOR_CYAN_BRIGHT : (i % 3 == 0) ? COLOR_GOLD : TFT_WHITE;
      _canvas->drawPixel(starX, seedY, color);

      // Prominent bright cross stars (when twinkle peaks)
      if (i % 7 == 0 && twinkleVal > 0.6f) {
        _canvas->drawPixel(starX - 1, seedY, COLOR_CYAN_BRIGHT);
        _canvas->drawPixel(starX + 1, seedY, COLOR_CYAN_BRIGHT);
        _canvas->drawPixel(starX, seedY - 1, COLOR_CYAN_BRIGHT);
        _canvas->drawPixel(starX, seedY + 1, COLOR_CYAN_BRIGHT);
      }
    }
  }

  // 2. Occasional graceful cosmic shooting star streak (every ~4 seconds)
  float meteorCycle = fmodf(nowSec * 0.25f, 1.0f);
  if (meteorCycle < 0.25f) {
    float mProg = meteorCycle / 0.25f;
    int mx = (int)(200.0f - mProg * 90.0f);
    int my = (int)(18.0f + mProg * 26.0f);
    _canvas->drawLine(mx, my, mx + 7, my - 2, COLOR_CYAN_BRIGHT);
    _canvas->drawPixel(mx, my, TFT_WHITE);
  }
}

void ScreenCam::drawCurvedEarthGlobe(float nowSec) {
  if (!_canvas) return;

  // 1. Draw Globe Curvature & Glowing Atmosphere Limb
  for (int x = 0; x < SCREEN_WIDTH; x++) {
    int dx = x - 120;
    int horizonY = 88 + (dx * dx * 18) / 14400;

    _canvas->drawPixel(x, horizonY - 1, COLOR_CYAN_BRIGHT);
    _canvas->drawPixel(x, horizonY, COLOR_EARTH_ATMOS);

    int oceanHeight = 119 - horizonY;
    if (oceanHeight > 0) {
      _canvas->drawFastVLine(x, horizonY + 1, oceanHeight, COLOR_EARTH_OCEAN);
    }
  }

  // 2. Continents Drifting Beneath Santa (Westward scroll as Santa speeds east at M4.8)
  int scrollLon = ((int)(nowSec * 16.0f)) % 360;
  for (int x = 0; x < SCREEN_WIDTH; x++) {
    int dx = x - 120;
    int horizonY = 88 + (dx * dx * 18) / 14400;
    int lon = (x + scrollLon) % 360;

    bool isLand = (lon >= 25 && lon <= 85) ||
                  (lon >= 135 && lon <= 210) ||
                  (lon >= 265 && lon <= 325);

    if (isLand) {
      int landTop = horizonY + 3 + ((lon * 7) % 5);
      int landBottom = horizonY + 18 + ((lon * 11) % 7);
      if (landBottom > 118) landBottom = 118;
      int landH = landBottom - landTop;
      if (landH > 0) {
        _canvas->drawFastVLine(x, landTop, landH, COLOR_EARTH_LAND);

        int citySeed = (lon * 23 + x * 17) % 29;
        if (citySeed < 3 && landH > 4) {
          int cityY = landTop + 2 + ((citySeed * 5) % (landH - 4));
          bool twinkle = sinf(nowSec * 6.0f + (float)citySeed) > 0.0f;
          _canvas->drawPixel(x, cityY, twinkle ? COLOR_CITY_LIGHT : COLOR_AMBER_BRIGHT);
        }
      }
    }

    // 3. High-altitude wispy cloud bands
    int cloudLon = (x + (int)(nowSec * 22.0f)) % 260;
    if ((cloudLon >= 40 && cloudLon <= 75) || (cloudLon >= 150 && cloudLon <= 190)) {
      int cloudY = horizonY + 2 + ((cloudLon * 3) % 4);
      if (cloudY < 118) {
        _canvas->drawPixel(x, cloudY, COLOR_EARTH_CLOUD);
      }
    }
  }
}

// ============================================================================
// Mode 3: Gliding Descent ("Zniżanie") & Christmas Tree Forest
// ============================================================================

void ScreenCam::drawFestiveChristmasTree(int baseX, int baseY, int treeH, int seed, float nowSec) {
  if (!_canvas) return;
  if (baseX < -15 || baseX > SCREEN_WIDTH + 15) return;

  // 1. Wood Trunk
  int trunkW = (treeH > 14) ? 3 : 1;
  int trunkH = (int)(treeH * 0.2f);
  if (trunkH < 2) trunkH = 2;
  _canvas->fillRect(baseX - (trunkW / 2), baseY - trunkH, trunkW, trunkH, 0x4180);

  // 2. Evergreen Pine Boughs with Snow Rim
  int foliageH = treeH - trunkH;
  int topY = baseY - treeH;
  int numTiers = (treeH > 14) ? 3 : 2;
  int tierH = foliageH / numTiers;

  for (int t = 0; t < numTiers; t++) {
    int tierTop = topY + t * (tierH - 1);
    int tierBottom = tierTop + tierH + 1;
    float progress = (float)(t + 1) / (float)numTiers;
    int maxHalfW = (int)((float)treeH * 0.38f * progress);
    if (maxHalfW < 2) maxHalfW = 2;

    for (int y = tierTop; y <= tierBottom; y++) {
      float rowProgress = (float)(y - tierTop) / (float)(tierBottom - tierTop);
      int halfW = (int)((float)maxHalfW * rowProgress + 0.5f);
      if (halfW < 1) halfW = 1;
      int rowX = baseX - halfW;
      int rowW = halfW * 2 + 1;

      _canvas->drawFastHLine(rowX, y, rowW, COLOR_PINE_NEEDLE);

      if (y == tierTop || y == tierTop + 1) {
        _canvas->drawPixel(rowX, y, COLOR_SNOW);
        _canvas->drawPixel(rowX + rowW - 1, y, COLOR_SNOW);
      }
    }
  }

  // 3. Golden Star on Top
  _canvas->drawPixel(baseX, topY, COLOR_GOLD);
  if (treeH > 12) {
    _canvas->drawPixel(baseX, topY - 1, COLOR_GOLD);
    _canvas->drawPixel(baseX - 1, topY, COLOR_AMBER_BRIGHT);
    _canvas->drawPixel(baseX + 1, topY, COLOR_AMBER_BRIGHT);
  }

  // 4. Twinkling Multi-Color Christmas Fairy Lights!
  static const uint16_t LIGHT_COLORS[5] = {
    COLOR_SANTA_RED,
    COLOR_GOLD,
    COLOR_CYAN_BRIGHT,
    COLOR_EMERALD_NEON,
    COLOR_AMBER_BRIGHT
  };

  int numLights = (treeH > 16) ? 6 : (treeH > 10 ? 4 : 2);
  for (int l = 0; l < numLights; l++) {
    int lightSeed = seed * 7 + l * 13;
    float lProg = (float)(l + 0.6f) / (float)numLights;
    int ly = (int)((float)topY + 3.0f + lProg * (float)(foliageH - 5) + 0.5f);
    int tierSpread = (int)((float)treeH * 0.32f * lProg);
    int side = (l % 2 == 0) ? 1 : -1;
    int lx = baseX + side * (int)((float)tierSpread * 0.7f);

    bool twinkle = (sinf(nowSec * 7.0f + (float)lightSeed) > -0.2f);
    if (twinkle) {
      uint16_t color = LIGHT_COLORS[(l + seed) % 5];
      _canvas->drawPixel(lx, ly, color);
    }
  }
}

void ScreenCam::drawDescendingWinterLandscape(float nowSec, float descentP) {
  if (!_canvas) return;

  int groundBaseY = (int)(118.0f - descentP * 6.0f + 0.5f);

  // 1. Layer 1: Distant Rolling Snowdrifts with Small Christmas Trees (Slow scroll: v = 10 px/s)
  const int distCycleW = 240;
  int distScroll = ((int)(nowSec * 10.0f)) % distCycleW;
  int distTreeH = (int)(7.0f + descentP * 4.0f + 0.5f);

  for (int x = 0; x < SCREEN_WIDTH; x += 2) {
    int wx = (x + distScroll) % distCycleW;
    int ridgeY = (int)((float)groundBaseY - 14.0f - sinf((float)wx * 0.04f) * 4.0f + 0.5f);
    _canvas->drawFastVLine(x, ridgeY, 119 - ridgeY, 0x18c4);
    _canvas->drawFastVLine(x + 1, ridgeY, 119 - ridgeY, 0x18c4);
    _canvas->drawPixel(x, ridgeY, COLOR_SNOW);
    _canvas->drawPixel(x + 1, ridgeY, COLOR_SNOW);
  }

  static const int DIST_TREES[5] = { 24, 76, 134, 182, 218 };
  for (int cycle = 0; cycle < 2; cycle++) {
    int baseX = cycle * distCycleW - distScroll;
    for (int i = 0; i < 5; i++) {
      int tx = baseX + DIST_TREES[i];
      if (tx < -15 || tx > SCREEN_WIDTH + 15) continue;
      int wx = DIST_TREES[i] % distCycleW;
      int ridgeY = (int)((float)groundBaseY - 14.0f - sinf((float)wx * 0.04f) * 4.0f + 0.5f);
      drawFestiveChristmasTree(tx, ridgeY, distTreeH, i + 3, nowSec);
    }
  }

  // 2. Layer 2: Foreground Snowy Rolling Hills with BIGGER Christmas Trees (Medium scroll: v = 24 px/s)
  const int fgCycleW = 240;
  int fgScroll = ((int)(nowSec * 24.0f)) % fgCycleW;
  int fgTreeH = (int)(13.0f + descentP * 11.0f + 0.5f);

  for (int x = 0; x < SCREEN_WIDTH; x++) {
    int wx = (x + fgScroll) % fgCycleW;
    int hillY = (int)((float)groundBaseY - sinf((float)wx * 0.035f) * 5.0f + 0.5f);
    _canvas->drawFastVLine(x, hillY, 119 - hillY, 0x2128);
    _canvas->drawPixel(x, hillY, COLOR_SNOW);
    _canvas->drawPixel(x, hillY + 1, COLOR_SNOW);
  }

  static const int FG_TREES[5] = { 16, 58, 108, 154, 198 };
  for (int cycle = 0; cycle < 2; cycle++) {
    int baseX = cycle * fgCycleW - fgScroll;
    for (int i = 0; i < 5; i++) {
      int tx = baseX + FG_TREES[i];
      if (tx < -20 || tx > SCREEN_WIDTH + 20) continue;
      int wx = FG_TREES[i] % fgCycleW;
      int hillY = (int)((float)groundBaseY - sinf((float)wx * 0.035f) * 5.0f + 0.5f);
      int varH = fgTreeH + ((i % 3) - 1) * 2;
      drawFestiveChristmasTree(tx, hillY, varH, i, nowSec);
    }
  }

  // 3. Gentle falling snow flurries
  for (int s = 0; s < 14; s++) {
    int sx = (((s * 37 + 13) - (int)(nowSec * 18.0f) + 480) % SCREEN_WIDTH);
    int sy = 16 + (((s * 23) + (int)(nowSec * 16.0f)) % 90);
    _canvas->drawPixel(sx, sy, COLOR_SNOW);
  }
}

void ScreenCam::render(
  const JourneyData& journey,
  const TelemetryState& telemetry,
  unsigned long nowMs
) {
  (void)journey;
  if (!_canvas) return;

  float nowSec = (float)nowMs / 1000.0f;

  SantaCockpitMetrics metrics;
  computeSantaMetrics(
    telemetry.activeDay,
    telemetry.safeIdx,
    telemetry.u,
    nowSec,
    telemetry.nextCityName,
    telemetry.isDay24Finale,
    metrics
  );

  bool isFlight = (metrics.flightPhase != PHASE_DACH && metrics.flightPhase != PHASE_FINAL);
  bool isFinale = (metrics.flightPhase == PHASE_FINAL);
  float flightProgress = telemetry.u / 15.0f;

  // 1. Clear Screen with Deep Night Polar Navy (y = 14..119)
  _canvas->fillScreen(COLOR_BG_DARK);
  _canvas->fillRect(0, 14, SCREEN_WIDTH, 105, COLOR_SKY_MIDNIGHT);

  // --------------------------------------------------------------------------
  // 2. Viewport Scene Dispatch
  // --------------------------------------------------------------------------

  if (isFinale) {
    // MODE 7: Kraków Grand Finale Hold (Bazylika Mariacka & Fireworks)
    drawParallaxStars(nowSec * 0.2f);
    drawStationarySnowyRooftop(nowSec * 20.0f);
    drawKrakowBasilica(15, 86);

    // Landed Sleigh on Kraków rooftop
    drawSantaSleigh(95, 72);
    drawReindeer(126, 70, 0, true);
    drawReins(95, 72, 126, 70);

    // Multi-color Celebratory Fireworks Bursts
    float fPhase = fmodf(nowSec * 1.5f, 2.0f);
    if (fPhase < 1.0f) {
      int radius = (int)(fPhase * 16.0f);
      _canvas->drawCircle(80, 40, radius, COLOR_GOLD);
      _canvas->drawCircle(170, 35, (radius * 8) / 10, COLOR_CYAN_BRIGHT);
      _canvas->drawCircle(125, 28, (radius * 9) / 10, COLOR_SANTA_RED);
    }

    _canvas->setTextDatum(top_center);
    _canvas->setTextSize(1);
    _canvas->setTextColor(COLOR_AMBER_BRIGHT, COLOR_SKY_MIDNIGHT);
    _canvas->drawString("WESOLYCH SWIAT!", 120, 18);

  } else if (isFlight) {
    // IN TRANSIT: HIGH FLIGHT MODES
    if (flightProgress < 0.3f) {
      // MODE 1: Hyper-Warp
      int wrapW = SCREEN_WIDTH + 60;
      for (int i = 0; i < 22; i++) {
        int lineY = 18 + ((i * 29) % 95);
        int lineSpeed = 250 + (i * 35);
        int lineLen = 20 + ((i * 13) % 40);
        int offset = ((int)(nowSec * lineSpeed)) % wrapW;
        int rawX = SCREEN_WIDTH + (i * 47) - offset;
        int lineX = (((rawX % wrapW) + wrapW) % wrapW) - 30;
        uint16_t color = (i % 3 == 0) ? COLOR_AMBER_BRIGHT : (i % 2 == 0) ? COLOR_CYAN_BRIGHT : TFT_WHITE;
        _canvas->drawFastHLine(lineX, lineY, lineLen, color);
      }

      int shakeY = ((int)(nowMs / 40) % 3) - 1;
      int sleighX = 65;
      int sleighY = 52 + shakeY;
      int deerX = 101;
      int deerY = 50 + shakeY;

      drawSleighJetFlames(sleighX, sleighY, nowMs);
      drawSantaSleigh(sleighX, sleighY);
      drawReindeer(deerX, deerY, 0, true);
      drawReins(sleighX, sleighY, deerX, deerY);

      _canvas->setTextDatum(top_center);
      _canvas->setTextColor(COLOR_AMBER_BRIGHT, COLOR_SKY_MIDNIGHT);
      _canvas->drawString("TRYB HYPER-WARP", 120, 18);

    } else if (flightProgress < 0.8f) {
      // MODE 2: Cruising Sky (Curved Globe & Night City Lights)
      drawStratosphericStars(nowSec);
      drawCurvedEarthGlobe(nowSec);

      int bobY = (int)(sinf(nowSec * 3.5f) * 4.0f);
      int legFrame = ((int)(nowMs / 120)) % 2;
      int sleighX = 65;
      int sleighY = 48 + bobY;
      int deerX = 101;
      int deerY = 46 + bobY;

      for (int t = 0; t < 5; t++) {
        int trailX = sleighX - 4 - t * 4;
        int trailY = sleighY + 12 + (int)(sinf(nowSec * 8.0f + (float)t) * 2.0f);
        _canvas->drawPixel(trailX, trailY, COLOR_GOLD);
      }

      drawSantaSleigh(sleighX, sleighY);
      drawReindeer(deerX, deerY, legFrame, true);
      drawReins(sleighX, sleighY, deerX, deerY);

      _canvas->setTextDatum(top_center);
      _canvas->setTextColor(COLOR_CYAN_BRIGHT, COLOR_SKY_MIDNIGHT);
      _canvas->drawString("PRZELOT STRATOSFERYCZNY", 120, 18);

    } else {
      // MODE 3: Gliding Descent ("Zniżanie")
      drawParallaxStars(nowSec * 0.3f);

      float descentP = (flightProgress - 0.8f) / 0.2f;
      if (descentP < 0.0f) descentP = 0.0f;
      if (descentP > 1.0f) descentP = 1.0f;

      drawDescendingWinterLandscape(nowSec, descentP);

      int glideY = (int)(22.0f + descentP * 32.0f + sinf(nowSec * 3.0f) * 1.5f);
      int legFrame = ((int)(nowMs / 140)) % 2;
      int sleighX = 60;
      int deerX = 96;

      for (int t = 0; t < 5; t++) {
        int trailX = sleighX - 4 - t * 4;
        int trailY = glideY + 12 + (int)(sinf(nowSec * 8.0f + (float)t) * 2.0f);
        _canvas->drawPixel(trailX, trailY, COLOR_GOLD);
      }

      drawSantaSleigh(sleighX, glideY);
      drawReindeer(deerX, glideY - 1, legFrame, true);
      drawReins(sleighX, glideY, deerX, glideY - 1);

      _canvas->setTextDatum(top_center);
      _canvas->setTextColor(COLOR_AMBER_BRIGHT, COLOR_SKY_MIDNIGHT);
      _canvas->drawString("ZNIZANIE", 120, 18);
    }

  } else {
    // ========================================================================
    // CITY STAY: ROOFTOP CHIMNEY CRUISE & BIG SANTA COOKIE BREAK
    // ========================================================================
    int legFrame = ((int)(nowMs / 120)) % 2;
    float landedU = telemetry.u - 15.0f;
    int citySubPhase = landedU < 6.0f ? 0 : landedU < 12.0f ? 1 : 2; // 0: Drop (0-6s), 1: Cookie (6-12s), 2: Climb (12-15s)

    if (citySubPhase == 0) {
      // MODE 4: Rooftop Chimney Cruise & Active Gift Drops
      drawParallaxStars(nowSec * 0.2f);

      for (int s = 0; s < 12; s++) {
        int sx = ((s * 39 + 11) - (int)(nowSec * 24.0f) + 480) % SCREEN_WIDTH;
        int sy = 16 + (((s * 19) + (int)(nowSec * 20.0f)) % 70);
        _canvas->drawPixel(sx, sy, COLOR_SNOW);
      }

      int bobY = (int)(sinf(nowSec * 3.5f) * 3.0f);
      int sleighX = 60;
      int sleighY = 32 + bobY;
      int deerX = 96;
      int deerY = 30 + bobY;

      // Rooftops with active presents dropped straight into passing chimneys
      drawScrollingRooftops(nowSec, sleighY, true);

      drawSantaSleigh(sleighX, sleighY);
      drawReindeer(deerX, deerY, legFrame, true);
      drawReins(sleighX, sleighY, deerX, deerY);

      _canvas->setTextDatum(top_center);
      _canvas->setTextColor(COLOR_EMERALD_NEON, COLOR_SKY_MIDNIGHT);
      _canvas->drawString("ZRZUT PREZENTOW", 120, 18);

    } else if (citySubPhase == 1) {
      // MODE 5: Dedicated Scene — BIGGER SIZE SANTA CLAUS EATING COOKIES!
      drawBigSantaCookieBreak(nowSec, nowMs);

      _canvas->setTextDatum(top_center);
      _canvas->setTextColor(COLOR_AMBER_BRIGHT, COLOR_SKY_MIDNIGHT);
      _canvas->drawString("PRZERWA NA CIASTKA I MLEKO", 120, 18);

    } else {
      // MODE 6: Takeoff Climb ("Wznoszenie")
      drawParallaxStars(nowSec * 0.3f);

      float climbP = (telemetry.u - 27.0f) / 3.0f;
      if (climbP < 0.0f) climbP = 0.0f;
      if (climbP > 1.0f) climbP = 1.0f;

      // As Santa climbs higher into the sky, trees and ground shrink in perspective (1.0f -> 0.0f)
      drawDescendingWinterLandscape(nowSec, 1.0f - climbP);

      int climbY = (int)(54.0f - climbP * 32.0f + sinf(nowSec * 3.0f) * 1.5f);
      int legFrame = ((int)(nowMs / 100)) % 2;
      int sleighX = 60;
      int deerX = 96;
      int deerY = climbY - 3;

      for (int t = 0; t < 6; t++) {
        int trailX = sleighX - 4 - t * 4;
        int trailY = climbY + 12 + t * 2 + (int)(sinf(nowSec * 8.0f + (float)t) * 2.0f);
        _canvas->drawPixel(trailX, trailY, COLOR_GOLD);
      }

      bool strobe = (sinf(nowSec * 12.0f) > -0.3f);

      drawSantaSleigh(sleighX, climbY);
      drawReindeer(deerX, deerY, legFrame, strobe);
      drawReins(sleighX, climbY, deerX, deerY);

      _canvas->setTextDatum(top_center);
      _canvas->setTextColor(COLOR_CYAN_BRIGHT, COLOR_SKY_MIDNIGHT);
      _canvas->drawString("WZNOSZENIE", 120, 18);
    }
  }

  // --------------------------------------------------------------------------
  // 3. Top Header Bar (y: 0..13)
  // --------------------------------------------------------------------------
  _canvas->fillRect(0, 0, SCREEN_WIDTH, 13, COLOR_HEADER_BG);
  _canvas->drawFastHLine(0, 13, SCREEN_WIDTH, COLOR_BORDER);

  drawBatteryIcon(4, 3, COLOR_EMERALD_NEON);
  _canvas->setTextSize(1);
  _canvas->setTextDatum(top_left);
  _canvas->setTextColor(TFT_WHITE, COLOR_HEADER_BG);
  _canvas->drawString("98%", 18, 3);

  char dayBuf[16];
  snprintf(dayBuf, sizeof(dayBuf), "DZIEN %02d", telemetry.activeDay);
  _canvas->setTextDatum(top_right);
  _canvas->setTextColor(COLOR_AMBER_BRIGHT, COLOR_HEADER_BG);
  _canvas->drawString(dayBuf, SCREEN_WIDTH - 4, 3);

  // --------------------------------------------------------------------------
  // 4. Bottom Navigation HUD Bar (y: 120..134)
  // --------------------------------------------------------------------------
  _canvas->fillRect(0, 120, SCREEN_WIDTH, 15, COLOR_HEADER_BG);
  _canvas->drawFastHLine(0, 119, SCREEN_WIDTH, COLOR_BORDER);

  _canvas->setTextDatum(top_left);
  uint16_t prefixColor = isFinale ? COLOR_AMBER_BRIGHT : (isFlight ? COLOR_CYAN_BRIGHT : COLOR_EMERALD_NEON);
  const char* prefixText = isFinale ? "FINAL: " : (isFlight ? "CEL: " : "POSTOJ: ");
  _canvas->setTextColor(prefixColor, COLOR_HEADER_BG);
  _canvas->drawString(prefixText, 4, 123);

  int prefixWidth = strlen(prefixText) * 6;
  _canvas->setTextColor(TFT_WHITE, COLOR_HEADER_BG);
  _canvas->drawString(metrics.targetCity, 4 + prefixWidth, 123);

  _canvas->setTextDatum(top_right);
  _canvas->setTextColor(COLOR_AMBER_BRIGHT, COLOR_HEADER_BG);
  if (isFinale && metrics.etaSeconds == 0) {
    _canvas->drawString("WIGILIA!", SCREEN_WIDTH - 4, 123);
  } else {
    char etaBuf[16];
    snprintf(etaBuf, sizeof(etaBuf), "CZAS 0:%02d", metrics.etaSeconds);
    _canvas->drawString(etaBuf, SCREEN_WIDTH - 4, 123);
  }
}
