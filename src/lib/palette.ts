import type { ColorKey } from "@/store/types";

export interface Swatch {
  label: string;
  /** Заливка блока */
  bg: string;
  /** Тонкая обводка */
  border: string;
  /** Акцентная полоса / точка */
  accent: string;
  /** Цвет текста на заливке */
  text: string;
}

// Сплошные пастельные цвета — никаких полупрозрачных наложений и blend-режимов,
// композитинг на A10 остаётся дешёвым.
export const PALETTE: Record<ColorKey, Swatch> = {
  sage: { label: "Шалфей", bg: "#E9EFE6", border: "#D3DECE", accent: "#7E9A76", text: "#34432F" },
  sand: { label: "Песок", bg: "#F4EDE1", border: "#E6D9C3", accent: "#B8955E", text: "#4E3D24" },
  rose: { label: "Пудра", bg: "#F6E8E6", border: "#EBD2CE", accent: "#C08A84", text: "#553531" },
  sky: { label: "Туман", bg: "#E6EDF3", border: "#CFDCE7", accent: "#7B9BB5", text: "#2F4252" },
  lavender: { label: "Лаванда", bg: "#EDEAF4", border: "#DAD3E8", accent: "#9588B5", text: "#3D3552" },
  clay: { label: "Глина", bg: "#F3E7DE", border: "#E6D0C0", accent: "#B87D5B", text: "#523423" },
  mist: { label: "Графит", bg: "#EEEDEA", border: "#DEDCD7", accent: "#7A7873", text: "#2C2B29" },
};

export const COLOR_KEYS = Object.keys(PALETTE) as ColorKey[];
