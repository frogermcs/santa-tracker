export type Language = "pl" | "en";

export const DEFAULT_LANGUAGE: Language = "pl";
export const LANGUAGE_STORAGE_KEY = "santa-os-lang";

export interface TranslationSchema {
  langSelectorAria: string;
  garlandGreeting: string;
  landing: {
    headlineLine1: string;
    headlineLine2: string;
    headlineLine3: string;
    subtitle: string;
    installCta: string;
    tabs: {
      radar: string;
      cockpit: string;
      cam: string;
    };
    deviceHintPrefix: string;
    deviceHintMid: string;
    deviceHintSuffix: string;
  };
  device: {
    holdLabel: string;
    screenLabel: string;
    buttonALabel: string;
    buttonBLabel: string;
    buttonPWRLabel: string;
    buttonATitle: string;
    buttonBTitle: string;
    buttonPWRTitle: string;
  };
  install: {
    backHome: string;
    title: string;
    subtitle: string;
    installButtonLabel: string;
    installButtonDefaultLabel: string;
    alreadyHavePrompt: string;
    configureWifiLabel: string;
    webSerialReady: (browserName: string) => string;
    webSerialLoadError: string;
    retry: string;
    webSerialInit: string;
    unsupportedBrowserHeading: string;
    wifiRetryTitle: string;
    wifiErrorRetry: string;
    wifiInit: string;
    requiresChromeOrEdge: string;
    featureRadarTitle: string;
    featureRadarDesc: string;
    featureCockpitTitle: string;
    featureCockpitDesc: string;
    featureCamTitle: string;
    featureCamDesc: string;
    hideTroubleshooting: string;
    showTroubleshooting: string;
    uartExplanation: string;
    forM5StickCPlus: string;
    forM5StickCPlusSE: string;
    tipsHeading: string;
    tipDataCable: string;
    tipWifi24: string;
    tipGpio0: string;
    tipLinuxPrefix: string;
    footerDebuggerLink: string;
  };
}

export const TRANSLATIONS: Record<Language, TranslationSchema> = {
  pl: {
    langSelectorAria: "Wybór języka",
    garlandGreeting: "Wesołych Świąt!",
    landing: {
      headlineLine1: "ŚLEDŹ LOT",
      headlineLine2: "MIKOŁAJA",
      headlineLine3: "PRZEZ CAŁY ADWENT!",
      subtitle:
        "Od 1 grudnia aż po Wigilię sprawdzaj na kieszonkowym M5Sticku, dokąd lecą sanie, co słychać w kokpicie i jak Mikołaj radzi sobie w trasie.",
      installCta: "Zainstaluj na M5Stick",
      tabs: {
        radar: "MikoRadar",
        cockpit: "Kokpit Misji",
        cam: "Santa Cam",
      },
      deviceHintPrefix: "Kliknij",
      deviceHintMid: ", aby przełączyć ekran · przytrzymaj boczny przycisk",
      deviceHintSuffix: ", aby włączyć tryb demo.",
    },
    device: {
      holdLabel: "TRZYMAJ...",
      screenLabel: "EKRAN",
      buttonALabel: "PRZYCISK A",
      buttonBLabel: "PRZYCISK B",
      buttonPWRLabel: "PRZYCISK PWR",
      buttonATitle:
        "Przycisk A (M5): Klik = Zmień Ekran | Przytrzymaj (>0.6s) = Zmień Dzień Adwentu",
      buttonBTitle:
        "Przycisk B (Górny): Klik = Następne Miasto | Przytrzymaj (>0.6s) = Przełącz Tryb (Demo / Realtime)",
      buttonPWRTitle:
        "Przycisk PWR (Dolny): Klik = Dźwięk | Przytrzymaj (>0.6s) = Przełącz Tryb (Demo / Realtime)",
    },
    install: {
      backHome: "Strona główna",
      title: "ZAINSTALUJ SANTA-OS",
      subtitle:
        "Podłącz M5StickC-Plus SE kablem USB do komputera i wgraj system bezpośrednio z przeglądarki.",
      installButtonLabel: "Zainstaluj na M5Stick",
      installButtonDefaultLabel: "Zainstaluj SANTA-OS",
      alreadyHavePrompt: "Masz już SANTA-OS?",
      configureWifiLabel: "Skonfiguruj Wi-Fi",
      webSerialReady: (browserName: string) =>
        `Web Serial API gotowy (${browserName})`,
      webSerialLoadError: "Błąd ładowania modułu Web Serial.",
      retry: "Ponów",
      webSerialInit: "Inicjalizacja modułu Web Serial...",
      unsupportedBrowserHeading: "Przeglądarka nieobsługiwana:",
      wifiRetryTitle: "Ponów ładowanie modułu Wi-Fi",
      wifiErrorRetry: "Błąd Wi-Fi (Ponów)",
      wifiInit: "Inicjalizacja Wi-Fi...",
      requiresChromeOrEdge: "Wymaga Chrome lub Edge.",
      featureRadarTitle: "MikoRadar",
      featureRadarDesc:
        "Śledź trasę sań Mikołaja na żywo przez 24 dni Adwentu.",
      featureCockpitTitle: "Kokpit Misji",
      featureCockpitDesc:
        "Prędkość Mach, wysokość i licznik zjedzonych ciastek.",
      featureCamTitle: "Santa Cam",
      featureCamDesc:
        "Pikselowa kamera z lotu, kominów i przerwy przy kominku.",
      hideTroubleshooting: "Ukryj pomoc i sterowniki USB ▲",
      showTroubleshooting: "Potrzebujesz pomocy ze sterownikami USB? ▼",
      uartExplanation:
        "M5Stick wykorzystuje konwerter USB-UART (CP2104 lub CH9102). Jeśli port nie pojawia się w oknie wyboru:",
      forM5StickCPlus: "Dla M5StickC-Plus",
      forM5StickCPlusSE: "Dla M5StickC-Plus SE",
      tipsHeading: "Wskazówki:",
      tipDataCable:
        "Użyj kabla USB-C z liniami danych (nie tylko do ładowania).",
      tipWifi24:
        "Wi-Fi: M5Stick wymaga sieci 2.4 GHz (pasmo 5 GHz nie jest obsługiwane przez ESP32).",
      tipGpio0:
        "W razie braku reakcji przytrzymaj przedni przycisk M5 (GPIO0) podczas wpinania kabla.",
      tipLinuxPrefix: "W Linuksie dodaj uprawnienia:",
      footerDebuggerLink: "Debuger i Symulator",
    },
  },
  en: {
    langSelectorAria: "Language selector",
    garlandGreeting: "Merry Christmas!",
    landing: {
      headlineLine1: "TRACK SANTA'S",
      headlineLine2: "FLIGHT ALL",
      headlineLine3: "THROUGH ADVENT!",
      subtitle:
        "From December 1st right through Christmas Eve, check your pocket M5Stick to see where the sleigh is flying, what's happening in the cockpit, and how Santa is doing on his route.",
      installCta: "Install on M5Stick",
      tabs: {
        radar: "SantaRadar",
        cockpit: "Mission Cockpit",
        cam: "Santa Cam",
      },
      deviceHintPrefix: "Click",
      deviceHintMid: " to switch screen · hold side button",
      deviceHintSuffix: " to toggle demo mode.",
    },
    device: {
      holdLabel: "HOLD...",
      screenLabel: "SCREEN",
      buttonALabel: "BUTTON A",
      buttonBLabel: "BUTTON B",
      buttonPWRLabel: "PWR BUTTON",
      buttonATitle:
        "Button A (M5): Click = Switch Screen | Hold (>0.6s) = Next Advent Day",
      buttonBTitle:
        "Button B (Top): Click = Next City | Hold (>0.6s) = Toggle Mode (Demo / Realtime)",
      buttonPWRTitle:
        "Button PWR (Bottom): Click = Sound | Hold (>0.6s) = Toggle Mode (Demo / Realtime)",
    },
    install: {
      backHome: "Home",
      title: "INSTALL SANTA-OS",
      subtitle:
        "Connect your M5StickC-Plus SE via USB cable to your computer and flash the system directly from your browser.",
      installButtonLabel: "Install on M5Stick",
      installButtonDefaultLabel: "Install SANTA-OS",
      alreadyHavePrompt: "Already have SANTA-OS?",
      configureWifiLabel: "Configure Wi-Fi",
      webSerialReady: (browserName: string) =>
        `Web Serial API ready (${browserName})`,
      webSerialLoadError: "Failed to load Web Serial module.",
      retry: "Retry",
      webSerialInit: "Initializing Web Serial module...",
      unsupportedBrowserHeading: "Unsupported browser:",
      wifiRetryTitle: "Retry loading Wi-Fi module",
      wifiErrorRetry: "Wi-Fi Error (Retry)",
      wifiInit: "Initializing Wi-Fi...",
      requiresChromeOrEdge: "Requires Chrome or Edge.",
      featureRadarTitle: "SantaRadar",
      featureRadarDesc:
        "Track Santa's sleigh route live across all 24 days of Advent.",
      featureCockpitTitle: "Mission Cockpit",
      featureCockpitDesc:
        "Mach speed, altitude, and eaten cookies counter.",
      featureCamTitle: "Santa Cam",
      featureCamDesc:
        "Pixel-art camera of the flight, chimneys, and fireplace break.",
      hideTroubleshooting: "Hide help & USB drivers ▲",
      showTroubleshooting: "Need help with USB drivers? ▼",
      uartExplanation:
        "M5Stick uses a USB-UART converter (CP2104 or CH9102). If the port does not appear in the selection dialog:",
      forM5StickCPlus: "For M5StickC-Plus",
      forM5StickCPlusSE: "For M5StickC-Plus SE",
      tipsHeading: "Tips:",
      tipDataCable: "Use a USB-C cable with data lines (not charge-only).",
      tipWifi24:
        "Wi-Fi: M5Stick requires a 2.4 GHz network (5 GHz band is not supported by ESP32).",
      tipGpio0:
        "If unresponsive, hold the front M5 button (GPIO0) while plugging in the cable.",
      tipLinuxPrefix: "On Linux, grant serial permissions:",
      footerDebuggerLink: "Debugger & Simulator",
    },
  },
};
