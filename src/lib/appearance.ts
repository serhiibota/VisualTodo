import type { ThemeKey } from "./themes";

export type UiFontKey = "system" | "onest" | "manrope" | "golos" | "nunito";
export type DisplayFontKey = "cormorant" | "playfair" | "lora" | "unbounded" | "ui";

export interface AppearanceSettings {
  theme: ThemeKey;
  uiFont: UiFontKey;
  displayFont: DisplayFontKey;
}

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  theme: "auto", // «Тушь с пометками» днём, «Суми» ночью
  uiFont: "system",
  displayFont: "cormorant",
};

const SYSTEM_STACK = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const UI_FONTS: { key: UiFontKey; label: string; note: string; family: string }[] = [
  { key: "system", label: "Системный", note: "SF Pro — уже в iPhone, ничего не скачивается", family: SYSTEM_STACK },
  { key: "onest", label: "Onest", note: "Чистый гротеск, отлично читается", family: "var(--f-onest), " + SYSTEM_STACK },
  { key: "manrope", label: "Manrope", note: "Геометричный, современный", family: "var(--f-manrope), " + SYSTEM_STACK },
  { key: "golos", label: "Golos", note: "Спокойный, «государственный» гротеск", family: "var(--f-golos), " + SYSTEM_STACK },
  { key: "nunito", label: "Nunito", note: "Мягкий, со скруглениями", family: "var(--f-nunito), " + SYSTEM_STACK },
];

// scale выравнивает визуальную ширину: узкий Cormorant крупнее, широкий Unbounded мельче,
// чтобы «23 сентября» помещалось рядом с кнопками на 375px.
export const DISPLAY_FONTS: { key: DisplayFontKey; label: string; family: string; scale: number }[] = [
  { key: "cormorant", label: "Cormorant", family: "var(--f-cormorant), Georgia, serif", scale: 1 },
  { key: "playfair", label: "Playfair", family: "var(--f-playfair), Georgia, serif", scale: 0.86 },
  { key: "lora", label: "Lora", family: "var(--f-lora), Georgia, serif", scale: 0.86 },
  { key: "unbounded", label: "Unbounded", family: "var(--f-unbounded), " + SYSTEM_STACK, scale: 0.7 },
  { key: "ui", label: "Как интерфейс", family: "var(--font-ui)", scale: 0.86 },
];

/** CSS: атрибуты на <html> переключают семейства через переменные */
export function buildFontCss(): string {
  let css = ":root{--font-ui:" + SYSTEM_STACK + ";--font-display:" + DISPLAY_FONTS[0].family + ";--display-scale:1}";
  for (const f of UI_FONTS) css += "[data-ui-font=" + f.key + "]{--font-ui:" + f.family + "}";
  for (const f of DISPLAY_FONTS)
    css += "[data-display-font=" + f.key + "]{--font-display:" + f.family + ";--display-scale:" + f.scale + "}";
  return css;
}
