import type { ColorKey } from "@/store/types";

/**
 * Цветовые схемы. Единый источник правды: из этих данных генерируется CSS
 * (переменные на <html data-theme>) и рисуются превью в настройках.
 * Смена схемы = смена одного атрибута, без ререндера React.
 */

export type ThemeKey = "auto" | "milk" | "paper" | "mist" | "matcha" | "graphite" | "ink";

interface TaskTone {
  solid: string;
  tint: string;
  ink: string;
}

export interface ThemeDef {
  label: string;
  dark: boolean;
  ui: {
    bg: string; // фон приложения
    surface: string; // шторки, поднятые карточки
    text: string;
    strong: string;
    muted: string;
    faint: string;
    line: string;
    hover: string;
    accent: string;
    spine: string;
    dash: string;
    shade: string; // цвет тени и затемнения под шторкой
  };
  tasks: Record<ColorKey, TaskTone>;
}

// Приглушённые «карандашные» цвета задач для светлых схем
const LIGHT_TASKS: Record<ColorKey, TaskTone> = {
  rose: { solid: "#E08E7B", tint: "#F8E6E0", ink: "#B8604D" },
  clay: { solid: "#C27A56", tint: "#F3E5DB", ink: "#9A5534" },
  sand: { solid: "#D2A45A", tint: "#F6EDDC", ink: "#A07630" },
  sage: { solid: "#8FAA7E", tint: "#E7EEE2", ink: "#5F7D4F" },
  sky: { solid: "#7596B8", tint: "#E3EBF3", ink: "#4B6E93" },
  lavender: { solid: "#9A7FA8", tint: "#EEE7F1", ink: "#6F5480" },
  mist: { solid: "#4F5A6B", tint: "#E6E8EB", ink: "#3A4452" },
};

// Для тёмных схем: заливка приглушена, иконка светлее
const DARK_TASKS: Record<ColorKey, TaskTone> = {
  rose: { solid: "#D98A78", tint: "#3A2A26", ink: "#F0B4A6" },
  clay: { solid: "#C58162", tint: "#372A21", ink: "#E6B292" },
  sand: { solid: "#CFA35E", tint: "#362F1F", ink: "#EACB8E" },
  sage: { solid: "#8FAB7E", tint: "#29321F", ink: "#B9D0AA" },
  sky: { solid: "#779AC0", tint: "#232F3E", ink: "#AAC4E0" },
  lavender: { solid: "#A185B1", tint: "#30283A", ink: "#C8B0D6" },
  mist: { solid: "#8792A3", tint: "#2B2F37", ink: "#BCC5D2" },
};

export const THEMES: Record<Exclude<ThemeKey, "auto">, ThemeDef> = {
  milk: {
    label: "Молоко",
    dark: false,
    ui: { bg: "#F7F5F0", surface: "#FFFEFB", text: "#232220", strong: "#3A3936", muted: "#8C8984", faint: "#B9B6B0", line: "#E8E5DF", hover: "#EFECE6", accent: "#C4704F", spine: "#E3DFD8", dash: "#D6D2CA", shade: "#232220" },
    tasks: LIGHT_TASKS,
  },
  paper: {
    label: "Бумага",
    dark: false,
    ui: { bg: "#F2EBDD", surface: "#FAF5EA", text: "#2E261C", strong: "#4A3F31", muted: "#8D7F6B", faint: "#B8AB95", line: "#E3D8C4", hover: "#E9E0CE", accent: "#B5653C", spine: "#DDD0B9", dash: "#CDBFA6", shade: "#2E261C" },
    tasks: LIGHT_TASKS,
  },
  mist: {
    label: "Туман",
    dark: false,
    ui: { bg: "#F3F5F7", surface: "#FFFFFF", text: "#1F2328", strong: "#363C44", muted: "#838B96", faint: "#B3BAC3", line: "#E3E7EC", hover: "#EAEEF2", accent: "#4F7CAC", spine: "#DDE2E8", dash: "#CDD3DB", shade: "#1F2328" },
    tasks: LIGHT_TASKS,
  },
  matcha: {
    label: "Матча",
    dark: false,
    ui: { bg: "#F1F3EC", surface: "#FBFCF8", text: "#20261E", strong: "#39412F", muted: "#838C79", faint: "#B3BAA8", line: "#E0E5D7", hover: "#E7EBDF", accent: "#6F8F4E", spine: "#D9DFCE", dash: "#C8D0BB", shade: "#20261E" },
    tasks: LIGHT_TASKS,
  },
  graphite: {
    label: "Графит",
    dark: true,
    ui: { bg: "#1B1A18", surface: "#262523", text: "#EEEBE5", strong: "#D6D2CA", muted: "#8F8A82", faint: "#5E5A54", line: "#34322F", hover: "#2E2C29", accent: "#E08E6B", spine: "#3A3835", dash: "#4A4743", shade: "#000000" },
    tasks: DARK_TASKS,
  },
  ink: {
    label: "Чернила",
    dark: true,
    ui: { bg: "#131A23", surface: "#1C2531", text: "#E6ECF3", strong: "#C9D3DE", muted: "#7E8B9B", faint: "#4F5B6A", line: "#2A3441", hover: "#243040", accent: "#8FB3E0", spine: "#2E3947", dash: "#3D4958", shade: "#000000" },
    tasks: DARK_TASKS,
  },
};

export const THEME_OPTIONS: { key: ThemeKey; label: string }[] = [
  { key: "auto", label: "Как в системе" },
  { key: "milk", label: THEMES.milk.label },
  { key: "paper", label: THEMES.paper.label },
  { key: "mist", label: THEMES.mist.label },
  { key: "matcha", label: THEMES.matcha.label },
  { key: "graphite", label: THEMES.graphite.label },
  { key: "ink", label: THEMES.ink.label },
];

/** Схемы, которые «Как в системе» берёт для светлого и тёмного режима */
export const AUTO_LIGHT = "milk" as const;
export const AUTO_DARK = "graphite" as const;

export function resolveTheme(key: ThemeKey, systemDark: boolean): Exclude<ThemeKey, "auto"> {
  if (key === "auto") return systemDark ? AUTO_DARK : AUTO_LIGHT;
  return key in THEMES ? (key as Exclude<ThemeKey, "auto">) : AUTO_LIGHT;
}

/** "#F7F5F0" → "247 245 240" — формат каналов для Tailwind `rgb(var(--x) / <alpha>)` */
function channels(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) + " " + ((n >> 8) & 255) + " " + (n & 255);
}

function themeVars(t: ThemeDef): string {
  const u = t.ui;
  let css =
    "color-scheme:" + (t.dark ? "dark" : "light") + ";" +
    "--c-bg:" + channels(u.bg) + ";--c-surface:" + channels(u.surface) + ";" +
    "--c-text:" + channels(u.text) + ";--c-strong:" + channels(u.strong) + ";" +
    "--c-muted:" + channels(u.muted) + ";--c-faint:" + channels(u.faint) + ";" +
    "--c-line:" + channels(u.line) + ";--c-hover:" + channels(u.hover) + ";" +
    "--c-accent:" + channels(u.accent) + ";--c-shade:" + channels(u.shade) + ";" +
    "--c-spine:" + u.spine + ";--c-dash:" + u.dash + ";" +
    "--shade-a:" + (t.dark ? "0.55" : "0.35") + ";";
  for (const key in t.tasks) {
    const tone = t.tasks[key as ColorKey];
    css += "--t-" + key + "-solid:" + tone.solid + ";--t-" + key + "-tint:" + tone.tint + ";--t-" + key + "-ink:" + tone.ink + ";";
  }
  return css;
}

/** CSS всех схем. «Как в системе» — через prefers-color-scheme, без JS. */
export function buildThemeCss(): string {
  let css = ":root,[data-theme=auto]{" + themeVars(THEMES[AUTO_LIGHT]) + "}";
  css += "@media (prefers-color-scheme: dark){:root:not([data-theme]),[data-theme=auto]{" + themeVars(THEMES[AUTO_DARK]) + "}}";
  for (const key in THEMES) {
    css += "[data-theme=" + key + "]{" + themeVars(THEMES[key as Exclude<ThemeKey, "auto">]) + "}";
  }
  return css;
}
