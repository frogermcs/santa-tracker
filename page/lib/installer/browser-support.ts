export interface BrowserSupportInfo {
  isSupported: boolean;
  isDesktop: boolean;
  browserName: string;
  recommendation: string;
}

/**
 * Checks whether the current runtime environment supports the Web Serial API.
 * @param userAgent Optional custom user-agent string (useful for testing and SSR)
 * @param hasSerialOverride Optional boolean override for navigator.serial existence check
 * @param maxTouchPointsOverride Optional number override for navigator.maxTouchPoints check
 */
export function checkWebSerialSupport(
  userAgent?: string,
  hasSerialOverride?: boolean,
  maxTouchPointsOverride?: number
): BrowserSupportInfo {
  const ua = userAgent || (typeof navigator !== "undefined" ? navigator.userAgent : "");
  const hasSerial =
    typeof hasSerialOverride === "boolean"
      ? hasSerialOverride
      : typeof navigator !== "undefined" && "serial" in navigator;

  const maxTouchPoints =
    typeof maxTouchPointsOverride === "number"
      ? maxTouchPointsOverride
      : typeof navigator !== "undefined"
      ? navigator.maxTouchPoints || 0
      : 0;

  // Modern iPadOS (iOS 13+) reports as "Macintosh" desktop user-agent, but has touch points
  const isIPadOS = /Macintosh/.test(ua) && maxTouchPoints > 1;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || isIPadOS;
  const isAndroid = /Android/.test(ua);
  const isMobile = isIOS || isAndroid;
  const isDesktop = !isMobile;

  let browserName = "Inna przeglądarka";
  if (/Edg\//.test(ua)) browserName = "Microsoft Edge";
  else if (/OPR\//.test(ua)) browserName = "Opera";
  else if (/Chrome\//.test(ua)) browserName = "Google Chrome";
  else if (/Firefox\//.test(ua)) browserName = "Mozilla Firefox";
  else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) browserName = "Apple Safari";

  if (hasSerial) {
    return {
      isSupported: true,
      isDesktop,
      browserName,
      recommendation: "Twoja przeglądarka w pełni obsługuje instalację przez Web Serial!",
    };
  }

  // Not supported recommendations
  if (isIOS) {
    return {
      isSupported: false,
      isDesktop: false,
      browserName: isIPadOS ? "Apple iPadOS (Safari)" : browserName,
      recommendation:
        "System iOS/iPadOS nie obsługuje połączeń USB przez przeglądarkę. Uruchom tę stronę na komputerze (Mac, Windows, Linux) w przeglądarce Google Chrome lub Microsoft Edge.",
    };
  }

  if (browserName === "Apple Safari") {
    return {
      isSupported: false,
      isDesktop: true,
      browserName,
      recommendation:
        "Apple Safari nie obsługuje standardu Web Serial. Otwórz tę stronę w przeglądarce Google Chrome, Microsoft Edge, Brave lub Opera na swoim komputerze.",
    };
  }

  if (browserName === "Mozilla Firefox") {
    return {
      isSupported: false,
      isDesktop: true,
      browserName,
      recommendation:
        "Mozilla Firefox nie obsługuje standardu Web Serial. Użyj przeglądarki Google Chrome, Microsoft Edge lub Brave.",
    };
  }

  return {
    isSupported: false,
    isDesktop,
    browserName,
    recommendation:
      "Aby wgrać Santa-OS na M5StickC-Plus, otwórz tę stronę na komputerze w przeglądarce Google Chrome, Microsoft Edge lub Brave.",
  };
}
