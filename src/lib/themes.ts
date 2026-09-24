import type { ColorKey } from "@/store/types";

/**
 * Цветовые схемы. Единый источник правды: из этих данных генерируется CSS
 * (переменные на <html data-theme>) и рисуются превью в настройках.
 * Смена схемы = смена одного атрибута, без ререндера React.
 */

export type ThemeKey =
  | "auto"
  | "tush"
  | "marks"
  | "sumi"
  | "milk"
  | "paper"
  | "mist"
  | "matcha"
  | "graphite"
  | "ink";

type SchemeKey = Exclude<ThemeKey, "auto">;

export interface TaskTone {
  /** Заливка капсулы (выполнено / прошедшая часть текущего блока) */
  solid: string;
  /** Заливка предстоящей капсулы */
  tint: string;
  /** Иконка на tint */
  ink: string;
  /** Цвет категории в пикерах и точках проектов/тегов (в «туши» капсулы монохромны, а выбор цвета должен оставаться различимым) */
  mark: string;
}

export interface ThemeDef {
  label: string;
  group: "ink" | "color";
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
    /** Единый цвет «сейчас» для текущего блока (киноварь в «туши»); без него — цвет самой задачи */
    now?: string;
    /** Цвет иконки/галочки на насыщенной заливке; по умолчанию белый */
    onSolid?: string;
    /** Толщина нити, px */
    spineWidth?: number;
  };
  tasks: Record<ColorKey, TaskTone>;
}

const KEYS: ColorKey[] = ["rose", "clay", "sand", "sage", "sky", "lavender", "mist"];

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

/**
 * Цветные схемы: каждой — своя подобранная семёрка насыщенных цветов в её
 * характере; остальное выводится из них и из самой схемы:
 * tint — цвет, растворённый в поверхности (светлые) или фоне (тёмные) схемы,
 * ink — цвет, притемнённый текстом схемы (светлые) или высветленный (тёмные).
 */
function tones(solids: Record<ColorKey, string>, ui: ThemeDef["ui"], dark: boolean): Record<ColorKey, TaskTone> {
  const out = {} as Record<ColorKey, TaskTone>;
  for (const k of KEYS) {
    const solid = solids[k];
    out[k] = dark
      ? { solid, tint: mix(solid, ui.bg, 0.22), ink: mix(solid, "#FFFFFF", 0.7), mark: solid }
      : { solid, tint: mix(solid, ui.surface, 0.2), ink: mix(solid, ui.text, 0.62), mark: solid };
  }
  return out;
}

/** «Тушь»: все капсулы одного тона; pickerMarks — различимые цвета для выбора категории */
function inkTones(tone: Omit<TaskTone, "mark" | "ink">, ink: (k: ColorKey) => string, marks: Record<ColorKey, string>) {
  const out = {} as Record<ColorKey, TaskTone>;
  for (const k of KEYS) out[k] = { ...tone, ink: ink(k), mark: marks[k] };
  return out;
}

// ---------- Тушь: бумага, тушь и одна киноварь ----------

const VERMILION = "#C8432B";

/** Тёмные приглушённые цвета категорий: кирпич, умбра, олива, хвоя, индиго, сливовый, тушь */
const INK_MARKS: Record<ColorKey, string> = {
  rose: "#9A4536",
  clay: "#8A6428",
  sand: "#66703A",
  sage: "#3B6B5F",
  sky: "#34507C",
  lavender: "#4D4870",
  mist: "#2F2F2D",
};
/** Те же категории, высветленные для угольного фона (подобраны вручную: смешение с белым сливало небо и сливу) */
const SUMI_MARKS: Record<ColorKey, string> = {
  rose: "#D0826F",
  clay: "#C49A5A",
  sand: "#A4AE6C",
  sage: "#6FA392",
  sky: "#7C9BCC",
  lavender: "#A48CC4",
  mist: "#BDBAB3",
};

const TUSH_UI: ThemeDef["ui"] = {
  bg: "#F4F3EF", surface: "#FCFBF8", text: "#1A1A19", strong: "#2F2F2D", muted: "#85847F", faint: "#B7B5AF",
  line: "#E3E1DB", hover: "#EAE8E3", accent: VERMILION, danger: "#A8392A", spine: "#2A2A28", dash: "#9C9A94",
  shade: "#1A1A19", now: VERMILION, spineWidth: 1.5,
};
const SUMI_UI: ThemeDef["ui"] = {
  bg: "#161615", surface: "#201F1D", text: "#ECEAE4", strong: "#D2CFC8", muted: "#8A8781", faint: "#55534F",
  line: "#2C2B29", hover: "#272624", accent: "#E0583D", danger: "#E27A66", spine: "#CFCCC5", dash: "#5A5854",
  shade: "#000000", now: "#E0583D", onSolid: "#161615", spineWidth: 1.5,
};

// ---------- Цветные схемы ----------

const MILK_UI: ThemeDef["ui"] = { bg: "#F7F5F0", surface: "#FFFEFB", text: "#232220", strong: "#3A3936", muted: "#8C8984", faint: "#B9B6B0", line: "#E8E5DF", hover: "#EFECE6", accent: "#C4704F", danger: "#A0524A", spine: "#E3DFD8", dash: "#D6D2CA", shade: "#232220" };
const PAPER_UI: ThemeDef["ui"] = { bg: "#F2EBDD", surface: "#FAF5EA", text: "#2E261C", strong: "#4A3F31", muted: "#8D7F6B", faint: "#B8AB95", line: "#E3D8C4", hover: "#E9E0CE", accent: "#B5653C", danger: "#9C4A32", spine: "#DDD0B9", dash: "#CDBFA6", shade: "#2E261C" };
const MIST_UI: ThemeDef["ui"] = { bg: "#F3F5F7", surface: "#FFFFFF", text: "#1F2328", strong: "#363C44", muted: "#838B96", faint: "#B3BAC3", line: "#E3E7EC", hover: "#EAEEF2", accent: "#4F7CAC", danger: "#A04B5A", spine: "#DDE2E8", dash: "#CDD3DB", shade: "#1F2328" };
const MATCHA_UI: ThemeDef["ui"] = { bg: "#F1F3EC", surface: "#FBFCF8", text: "#20261E", strong: "#39412F", muted: "#838C79", faint: "#B3BAA8", line: "#E0E5D7", hover: "#E7EBDF", accent: "#6F8F4E", danger: "#A0503E", spine: "#D9DFCE", dash: "#C8D0BB", shade: "#20261E" };
const GRAPHITE_UI: ThemeDef["ui"] = { bg: "#1B1A18", surface: "#262523", text: "#EEEBE5", strong: "#D6D2CA", muted: "#8F8A82", faint: "#5E5A54", line: "#34322F", hover: "#2E2C29", accent: "#E08E6B", danger: "#E39A86", spine: "#3A3835", dash: "#4A4743", shade: "#000000", onSolid: "#1B1A18" };
const INK_UI: ThemeDef["ui"] = { bg: "#131A23", surface: "#1C2531", text: "#E6ECF3", strong: "#C9D3DE", muted: "#7E8B9B", faint: "#4F5B6A", line: "#2A3441", hover: "#243040", accent: "#8FB3E0", danger: "#E8909A", spine: "#2E3947", dash: "#3D4958", shade: "#000000", onSolid: "#131A23" };

export const THEMES: Record<SchemeKey, ThemeDef> = {
  tush: {
    label: "Тушь",
    group: "ink",
    dark: false,
    ui: TUSH_UI,
    tasks: inkTones({ solid: "#2A2A28", tint: "#E7E5DF" }, () => "#2F2F2D", INK_MARKS),
  },
  marks: {
    label: "Тушь с пометками",
    group: "ink",
    dark: false,
    ui: TUSH_UI,
    // капсулы серые, иконка — тёмный приглушённый цвет категории
    tasks: inkTones({ solid: "#2A2A28", tint: "#E7E5DF" }, (k) => INK_MARKS[k], INK_MARKS),
  },
  sumi: {
    label: "Суми",
    group: "ink",
    dark: true,
    ui: SUMI_UI,
    tasks: inkTones({ solid: "#D9D6CF", tint: "#2A2927" }, () => "#D2CFC8", SUMI_MARKS),
  },
  milk: {
    label: "Молоко",
    group: "color",
    dark: false,
    ui: MILK_UI,
    // карандашные: терракота, охра, шалфей — меньше розового и сиреневого, чем раньше
    tasks: tones({ rose: "#D4836C", clay: "#B87550", sand: "#CFA257", sage: "#88A479", sky: "#6F90B2", lavender: "#86799C", mist: "#4F5A6B" }, MILK_UI, false),
  },
  paper: {
    label: "Бумага",
    group: "color",
    dark: false,
    ui: PAPER_UI,
    // сепия: сиена, умбра, охра, олива, выцветший синий, сливово-коричневый, сепия
    tasks: tones({ rose: "#B5634B", clay: "#9A6B3F", sand: "#BF9347", sage: "#7D8A57", sky: "#57788A", lavender: "#7F6377", mist: "#4A4038" }, PAPER_UI, false),
  },
  mist: {
    label: "Туман",
    group: "color",
    dark: false,
    ui: MIST_UI,
    // холод: клюква, тауп, хаки, эвкалипт, сталь, сланец, графит
    tasks: tones({ rose: "#A45F66", clay: "#957C69", sand: "#A89A58", sage: "#5F8C80", sky: "#52739A", lavender: "#6E6C94", mist: "#454E5C" }, MIST_UI, false),
  },
  matcha: {
    label: "Матча",
    group: "color",
    dark: false,
    ui: MATCHA_UI,
    // красная глина, ходзича, юдзу, матча, селадон, глициния, мох
    tasks: tones({ rose: "#A8574E", clay: "#957247", sand: "#AE9B55", sage: "#5F8A4C", sky: "#4F8286", lavender: "#6F6789", mist: "#3B4637" }, MATCHA_UI, false),
  },
  graphite: {
    label: "Графит",
    group: "color",
    dark: true,
    ui: GRAPHITE_UI,
    // тёплые земляные: терракота, карамель, охра, полынь, сизый, пепельная слива, камень
    tasks: tones({ rose: "#C9725F", clay: "#B08A5E", sand: "#C7A566", sage: "#93A67B", sky: "#8098B0", lavender: "#A48B9F", mist: "#8E8C86" }, GRAPHITE_UI, true),
  },
  ink: {
    label: "Чернила",
    group: "color",
    dark: true,
    ui: INK_UI,
    // холодные: пыльная клюква, тауп, хаки, эвкалипт, сталь, сланец, пепел
    tasks: tones({ rose: "#C47E86", clay: "#A9918A", sand: "#B8AA78", sage: "#7FA89A", sky: "#7C9CC4", lavender: "#9895C0", mist: "#A3AAB5" }, INK_UI, true),
  },
};

export const THEME_OPTIONS: { key: ThemeKey; label: string; group: "ink" | "color" }[] = [
  { key: "auto", label: "Как в системе", group: "ink" },
  ...(Object.keys(THEMES) as SchemeKey[]).map((key) => ({ key, label: THEMES[key].label, group: THEMES[key].group })),
];

/** Схемы, которые «Как в системе» берёт для светлого и тёмного режима */
export const AUTO_LIGHT = "marks" as const;
export const AUTO_DARK = "sumi" as const;

export function resolveTheme(key: ThemeKey, systemDark: boolean): SchemeKey {
  if (key === "auto") return systemDark ? AUTO_DARK : AUTO_LIGHT;
  return key in THEMES ? (key as SchemeKey) : AUTO_LIGHT;
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
    // initial = «не задано»: var(--c-now, запасной) возьмёт цвет задачи — иначе киноварь
    // «Туши» из :root протекла бы в цветные схемы
    "--c-now:" + (u.now ?? "initial") + ";--c-on-solid:" + (u.onSolid ?? "#FFFFFF") + ";" +
    "--spine-w:" + (u.spineWidth ?? 2) + "px;" +
    "--shade-a:" + (t.dark ? "0.55" : "0.35") + ";";
  for (const key in t.tasks) {
    const tone = t.tasks[key as ColorKey];
    css += "--t-" + key + "-solid:" + tone.solid + ";--t-" + key + "-tint:" + tone.tint + ";--t-" + key + "-ink:" + tone.ink + ";--t-" + key + "-mark:" + tone.mark + ";";
  }
  return css;
}

/** CSS всех схем. «Как в системе» — через prefers-color-scheme, без JS. */
export function buildThemeCss(): string {
  let css = ":root,[data-theme=auto]{" + themeVars(THEMES[AUTO_LIGHT]) + "}";
  css += "@media (prefers-color-scheme: dark){:root:not([data-theme]),[data-theme=auto]{" + themeVars(THEMES[AUTO_DARK]) + "}}";
  for (const key in THEMES) {
    css += "[data-theme=" + key + "]{" + themeVars(THEMES[key as SchemeKey]) + "}";
  }
  return css;
}
