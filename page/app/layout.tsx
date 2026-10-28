import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lokalizator Mikołaja · M5StickC-Plus SE",
  description: "Lokalizator Świętego Mikołaja w czasie rzeczywistym! Ho, ho, ho!",
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
    <html lang="pl" className="dark">
      <head>
        <link rel="icon" href="/santa-icon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&family=Press+Start+2P&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </head>
      <body className="font-sans min-h-screen bg-[#07090e] text-neutral-100 flex flex-col justify-between selection:bg-orange-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
