import type { Config } from "tailwindcss";

// Tailwind v3 намеренно: v4 опирается на @property, color-mix() и oklch,
// которых нет в Safari iOS 15 — стили бы «поехали».
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        milk: "#F7F5F0",
        paper: "#FFFEFB",
        ink: "#232220",
        graphite: "#3A3936",
        muted: "#8C8984",
        faint: "#B9B6B0",
        line: "#E8E5DF",
        hover: "#EFECE6",
        accent: "#C4704F",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Text"',
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      borderRadius: {
        "4xl": "28px",
      },
      transitionTimingFunction: {
        sheet: "cubic-bezier(0.32, 0.72, 0, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
