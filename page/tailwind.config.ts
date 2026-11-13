import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        pixel: ["'Press Start 2P'", "monospace"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ["var(--font-display)", "system-ui", "-apple-system", "sans-serif"],
        poster: ["var(--font-poster)", "var(--font-display)", "system-ui", "sans-serif"],
      },
      colors: {
        m5: {
          orange: "#ff6a00",
          amber: "#e65100",
          translucent: "rgba(255, 106, 0, 0.72)",
          dark: "#bf360c",
          bezel: "#0d0f12",
        },
      },
    },
  },
  plugins: [],
};

export default config;
