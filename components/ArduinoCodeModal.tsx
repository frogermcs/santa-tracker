"use client";

import React, { useState } from "react";
import { Check, Copy, X, Cpu, HardDrive, Battery, Radio } from "lucide-react";

interface ArduinoCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArduinoCodeModal: React.FC<ArduinoCodeModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sketchCode = `// ==============================================================
// M5StickC-Plus SE - Lokalizator Mikołaja (SANTA-OS v2.4)
// Sprzęt: M5StickC-Plus SE (ESP32-PICO-D4, ST7789v2 240x135 IPS)
// Obudowa: Przezroczysta pomarańczowa · Bateria 120mAh LiPo
// Wymagane biblioteki:
//   - M5GFX (lub M5StickCPlus2) przez Menedżer Bibliotek Arduino
// ==============================================================

#include <M5GFX.h>

M5GFX display;
M5Canvas canvas(&display); // Podwójny bufor pamięci (240x135x2 bajty = 64.8KB RAM)

// Piny dla M5StickC-Plus SE
#define BTN_A_PIN   37  // Główny przedni przycisk M5
#define BTN_B_PIN   39  // Górny boczny przycisk akcji
#define BUZZER_PIN   2  // Pasywny głośniczek piezo (PWM)
#define LED_PIN     10  // Czerwona dioda statusowa

int currentScreen = 0;   // 0: Kamera Mikołaja, 1: Pulpit, 2: Radar Świata
int santaAction = 0;     // 0: Lot po niebie, 1: Zrzut do komina, 2: Ciasteczka, 3: Hiper-prędkość
uint32_t kmDistance = 418920;
uint32_t giftsDelivered = 1842910;
unsigned long lastActionSwitch = 0;

void playChirp(int freq, int durationMs) {
  tone(BUZZER_PIN, freq, durationMs);
}

void setup() {
  pinMode(BTN_A_PIN, INPUT_PULLUP);
  pinMode(BTN_B_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH); // Wyłączona (active low)

  display.begin();
  display.setRotation(1); // Poziomy tryb 240x135
  canvas.setColorDepth(16); // 16-bit RGB565
  canvas.createSprite(240, 135);

  playChirp(1400, 60);
}

void loop() {
  // Przycisk A (Przedni M5) -> Przełącza ekrany
  if (digitalRead(BTN_A_PIN) == LOW) {
    currentScreen = (currentScreen + 1) % 3;
    playChirp(1200, 30);
    delay(200); // Debounce
  }

  // Przycisk B (Górny) -> Wykonuje akcję
  if (digitalRead(BTN_B_PIN) == LOW) {
    if (currentScreen == 0) {
      santaAction = (santaAction + 1) % 4;
      playChirp(1600, 40);
    } else if (currentScreen == 1) {
      giftsDelivered += 25000;
      playChirp(1800, 30);
    }
    delay(200); // Debounce
  }

  // Autocykl akcji co 4.2 sekundy
  if (currentScreen == 0 && millis() - lastActionSwitch > 4200) {
    santaAction = (santaAction + 1) % 4;
    lastActionSwitch = millis();
  }

  // Symulowane liczniki
  kmDistance += random(3, 12);
  giftsDelivered += random(80, 240);

  // Rysowanie do bufora
  canvas.fillScreen(TFT_BLACK);
  if (currentScreen == 0) {
    drawSantaCam();
  } else if (currentScreen == 1) {
    drawDashboard();
  } else {
    drawWorldRadar();
  }

  // Wypchnięcie klatki na wyświetlacz bez migotania
  canvas.pushSprite(0, 0);
  delay(33); // ~30 FPS
}

void drawSantaCam() {
  canvas.fillScreen(0x0814); // Nocne niebo
  canvas.fillRect(0, 0, 240, 18, 0x9000);
  canvas.setTextColor(TFT_WHITE);
  canvas.setTextSize(1);
  canvas.setCursor(6, 5);
  const char* titles[] = {"1/4 LOT PO NIEBIE", "2/4 ZRZUT DO KOMINA", "3/4 CIASTKA I MLEKO", "4/4 HIPER-PREDKOSC!"};
  canvas.print(titles[santaAction]);

  int bob = sin(millis() / 150.0) * 3;
  canvas.fillRoundRect(70, 56 + bob, 48, 18, 4, TFT_RED);
  canvas.drawFastHLine(64, 76 + bob, 60, TFT_GOLD);
  canvas.fillRect(86, 44 + bob, 14, 14, TFT_RED);
  canvas.fillRect(88, 40 + bob, 10, 6, TFT_WHITE); // Broda
  canvas.fillRect(140, 54 - bob, 20, 12, 0x8200);   // Renifer
  canvas.fillCircle(162, 54 - bob, 3, TFT_RED);    // Świecący nos
}

void drawDashboard() {
  canvas.fillRect(0, 0, 240, 19, 0x03E0);
  canvas.setTextColor(TFT_WHITE);
  canvas.setCursor(8, 6);
  canvas.print("PULPIT MIKOLAJA");

  canvas.setTextColor(TFT_YELLOW);
  canvas.setCursor(8, 28); canvas.print("DYSTANS KM:");
  canvas.setTextSize(2); canvas.setCursor(8, 40); canvas.printf("%lu KM", kmDistance);

  canvas.setTextSize(1); canvas.setTextColor(TFT_CYAN);
  canvas.setCursor(8, 66); canvas.print("PREZENTY:");
  canvas.setTextSize(2); canvas.setCursor(8, 78); canvas.printf("%lu", giftsDelivered);

  canvas.setTextSize(1); canvas.setTextColor(TFT_GREEN);
  canvas.setCursor(8, 106); canvas.print("CEL: KRAKOW, PL");
}

void drawWorldRadar() {
  canvas.fillScreen(0x0022);
  for (int x = 0; x < 240; x += 30) canvas.drawFastVLine(x, 0, 135, 0x0165);
  for (int y = 0; y < 135; y += 27) canvas.drawFastHLine(0, y, 240, 0x0165);
  int r = (millis() / 120) % 12;
  canvas.drawCircle(124, 46, r, TFT_RED);
  canvas.fillCircle(124, 46, 3, TFT_RED);
}
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sketchCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold font-mono text-white flex items-center gap-2">
              <span className="text-amber-500">⚡</span>
              Szkic Arduino / C++ dla M5StickC-Plus SE
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Kod źródłowy dla procesora ESP32-PICO-D4 z kolorowym ekranem 240×135 IPS ST7789v2
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs font-mono transition flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Skopiowano!" : "Kopiuj .ino"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hardware specs summary banner */}
        <div className="bg-neutral-950/80 px-5 py-3 border-b border-neutral-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-neutral-300">
            <Cpu className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-[10px] text-neutral-500">Procesor</div>
              <div className="font-bold">ESP32-PICO</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-neutral-300">
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-[10px] text-neutral-500">Ekran</div>
              <div className="font-bold">240×135 IPS</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-neutral-300">
            <Battery className="w-4 h-4 text-yellow-400" />
            <div>
              <div className="text-[10px] text-neutral-500">Bateria</div>
              <div className="font-bold">120mAh LiPo</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-neutral-300">
            <Radio className="w-4 h-4 text-blue-400" />
            <div>
              <div className="text-[10px] text-neutral-500">Obudowa</div>
              <div className="font-bold text-orange-400">Pomarańczowa</div>
            </div>
          </div>
        </div>

        {/* Code Content */}
        <div className="p-5 overflow-y-auto bg-neutral-950">
          <pre className="text-xs font-mono text-emerald-300 leading-relaxed selection:bg-emerald-800 selection:text-white">
            <code>{sketchCode}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
