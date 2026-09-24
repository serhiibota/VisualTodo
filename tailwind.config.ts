import type { Config } from "tailwindcss";

// Tailwind v3 намеренно: v4 опирается на @property, color-mix() и oklch,
// которых нет в Safari iOS 15 — стили бы «поехали».
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Цвета — CSS-переменные текущей схемы (см. lib/themes.ts).
      // Формат каналов сохраняет модификаторы прозрачности: bg-paper/70.
      colors: {
        milk: "rgb(var(--c-bg) / <alpha-value>)",
        paper: "rgb(var(--c-surface) / <alpha-value>)",
        ink: "rgb(var(--c-text) / <alpha-value>)",
        graphite: "rgb(var(--c-strong) / <alpha-value>)",
        muted: "rgb(var(--c-muted) / <alpha-value>)",
        faint: "rgb(var(--c-faint) / <alpha-value>)",
        line: "rgb(var(--c-line) / <alpha-value>)",
        hover: "rgb(var(--c-hover) / <alpha-value>)",
        accent: "rgb(var(--c-accent) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-ui)"],
        display: ["var(--font-display)"],
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
