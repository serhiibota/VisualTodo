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
    danger: string; // удаление
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


// ---------- Тона капсул под «температуру» схемы ----------

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const h = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0");
  return "#" + (h(r) + h(g) + h(b)).toUpperCase();
}

/** Смесь двух цветов: amount — доля первого */
function mix(a: string, b: string, amount: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return rgbToHex(r1 * amount + r2 * (1 - amount), g1 * amount + g2 * (1 - amount), b1 * amount + b2 * (1 - amount));
}

function toHsl(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  return [h, s, l];
}

function fromHsl(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

interface Temperature {
  /** Оттенок, к которому подтягиваются цвета (0–360) */
  hue: number;
  /** Сила подтягивания: 0.15 = на 15% пути (не больше 10°) — цвета остаются различимыми */
  pull: number;
  /** Множитель насыщенности */
  sat: number;
}

/** Сдвигает насыщенный цвет к температуре схемы */
function temper(hex: string, t: Temperature): string {
  const [h, s, l] = toHsl(hex);
  const diff = ((t.hue - h + 540) % 360) - 180;
  // Сдвигаем только соседние оттенки и не больше чем на 10°: иначе охра в холодной
  // схеме уходит в салатовый, а небо в тёплой — в бирюзу. Противоположные цвета
  // и почти серые (графит) только приглушаются — температуру им даёт фон в tint.
  const shift = s < 0.15 || Math.abs(diff) > 120 ? 0 : Math.max(-10, Math.min(10, diff * t.pull));
  const hue = (h + shift + 360) % 360;
  return fromHsl(hue, Math.min(1, s * t.sat), l);
}

/**
 * Тона капсул для схемы: solid — сдвинутый к температуре схемы,
 * tint — solid, растворённый в поверхности (светлые) или фоне (тёмные) схемы — заливка «в родстве» с ней,
 * ink — solid, притемнённый цветом текста схемы (контраст иконки на tint).
 */
function tasksFor(base: Record<ColorKey, TaskTone>, ui: ThemeDef["ui"], t: Temperature, dark: boolean): Record<ColorKey, TaskTone> {
  const out = {} as Record<ColorKey, TaskTone>;
  for (const key in base) {
    const solid = temper(base[key as ColorKey].solid, t);
    out[key as ColorKey] = dark
      ? { solid, tint: mix(solid, ui.bg, 0.2), ink: mix(solid, "#FFFFFF", 0.7) }
      : // Светлым — от поверхности (светлее фона): синий на бежевом фоне «Бумаги» иначе даёт серый
        { solid, tint: mix(solid, ui.surface, 0.2), ink: mix(solid, ui.text, 0.62) };
  }
  return out;
}

// «Молоко» и «Графит» — эталонные, с вручную подобранными тонами.
// Остальные схемы получают тона капсул из эталона под свою температуру.
const UI = {
  paper: { bg: "#F2EBDD", surface: "#FAF5EA", text: "#2E261C", strong: "#4A3F31", muted: "#8D7F6B", faint: "#B8AB95", line: "#E3D8C4", hover: "#E9E0CE", accent: "#B5653C", danger: "#9C4A32", spine: "#DDD0B9", dash: "#CDBFA6", shade: "#2E261C" },
  mist: { bg: "#F3F5F7", surface: "#FFFFFF", text: "#1F2328", strong: "#363C44", muted: "#838B96", faint: "#B3BAC3", line: "#E3E7EC", hover: "#EAEEF2", accent: "#4F7CAC", danger: "#A04B5A", spine: "#DDE2E8", dash: "#CDD3DB", shade: "#1F2328" },
  matcha: { bg: "#F1F3EC", surface: "#FBFCF8", text: "#20261E", strong: "#39412F", muted: "#838C79", faint: "#B3BAA8", line: "#E0E5D7", hover: "#E7EBDF", accent: "#6F8F4E", danger: "#A0503E", spine: "#D9DFCE", dash: "#C8D0BB", shade: "#20261E" },
  ink: { bg: "#131A23", surface: "#1C2531", text: "#E6ECF3", strong: "#C9D3DE", muted: "#7E8B9B", faint: "#4F5B6A", line: "#2A3441", hover: "#243040", accent: "#8FB3E0", danger: "#E8909A", spine: "#2E3947", dash: "#3D4958", shade: "#000000" },
} satisfies Record<string, ThemeDef["ui"]>;

export const THEMES: Record<Exclude<ThemeKey, "auto">, ThemeDef> = {
  milk: {
    label: "Молоко",
    dark: false,
    ui: { bg: "#F7F5F0", surface: "#FFFEFB", text: "#232220", strong: "#3A3936", muted: "#8C8984", faint: "#B9B6B0", line: "#E8E5DF", hover: "#EFECE6", accent: "#C4704F", danger: "#A0524A", spine: "#E3DFD8", dash: "#D6D2CA", shade: "#232220" },
    tasks: LIGHT_TASKS,
  },
  paper: {
    label: "Бумага",
    dark: false,
    ui: UI.paper,
    // тёплая сепия: цвета чуть к охре и приглушённее
    tasks: tasksFor(LIGHT_TASKS, UI.paper, { hue: 35, pull: 0.12, sat: 0.88 }, false),
  },
  mist: {
    label: "Туман",
    dark: false,
    ui: UI.mist,
    // холодная: к синему, заметно приглушённее
    tasks: tasksFor(LIGHT_TASKS, UI.mist, { hue: 212, pull: 0.16, sat: 0.78 }, false),
  },
  matcha: {
    label: "Матча",
    dark: false,
    ui: UI.matcha,
    // зеленоватая: к травяному, приглушённее
    tasks: tasksFor(LIGHT_TASKS, UI.matcha, { hue: 95, pull: 0.12, sat: 0.82 }, false),
  },
  graphite: {
    label: "Графит",
    dark: true,
    ui: { bg: "#1B1A18", surface: "#262523", text: "#EEEBE5", strong: "#D6D2CA", muted: "#8F8A82", faint: "#5E5A54", line: "#34322F", hover: "#2E2C29", accent: "#E08E6B", danger: "#E39A86", spine: "#3A3835", dash: "#4A4743", shade: "#000000" },
    tasks: DARK_TASKS,
  },
  ink: {
    label: "Чернила",
    dark: true,
    ui: UI.ink,
    // тёмная холодная: оттенки почти не крутим (слива иначе сливается с графитом), холод — от синего фона в заливках
    tasks: tasksFor(DARK_TASKS, UI.ink, { hue: 215, pull: 0.06, sat: 0.95 }, true),
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
    "--c-accent:" + channels(u.accent) + ";--c-danger:" + channels(u.danger) + ";--c-shade:" + channels(u.shade) + ";" +
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
