import type { Metadata } from "next";
import {
  Barlow_Condensed,
  Bricolage_Grotesque,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageContext";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin", "latin-ext"],
  weight: ["700", "800"],
  variable: "--font-poster",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SANTA-OS · Kieszonkowy Lokalizator Mikołaja",
  description:
    "Wgraj radar Świętego Mikołaja na M5StickC-Plus SE i śledź jego lot od 1 grudnia do Wigilii w Krakowie!",
  icons: {
    icon: [{ url: "/santa-icon.svg", type: "image/svg+xml" }],
    shortcut: "/santa-icon.svg",
    apple: "/santa-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pl"
      className={`dark ${barlowCondensed.variable} ${bricolage.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <link rel="icon" href="/santa-icon.svg" type="image/svg+xml" />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />
      </head>
      <body className="font-sans min-h-screen bg-[#0e1116] text-white flex flex-col justify-between selection:bg-amber-500 selection:text-neutral-950">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
