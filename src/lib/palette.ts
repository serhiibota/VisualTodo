import type { ColorKey } from "@/store/types";

export interface Swatch {
  label: string;
  /** Насыщенный цвет: заливка капсулы (выполнено / идёт сейчас), чекбокс, нить */
  solid: string;
  /** Светлая заливка капсулы у предстоящей задачи */
  tint: string;
  /** Цвет иконки на светлой заливке */
  ink: string;
}

// Приглушённые «бумажные» цвета — как карандаши в японском ежедневнике.
// Только сплошные HEX: никаких blend-режимов и полупрозрачных слоёв.
export const PALETTE: Record<ColorKey, Swatch> = {
  rose: { label: "Коралл", solid: "#E08E7B", tint: "#F8E6E0", ink: "#B8604D" },
  clay: { label: "Терракота", solid: "#C27A56", tint: "#F3E5DB", ink: "#9A5534" },
  sand: { label: "Охра", solid: "#D2A45A", tint: "#F6EDDC", ink: "#A07630" },
  sage: { label: "Шалфей", solid: "#8FAA7E", tint: "#E7EEE2", ink: "#5F7D4F" },
  sky: { label: "Небо", solid: "#7596B8", tint: "#E3EBF3", ink: "#4B6E93" },
  lavender: { label: "Слива", solid: "#9A7FA8", tint: "#EEE7F1", ink: "#6F5480" },
  mist: { label: "Графит", solid: "#4F5A6B", tint: "#E6E8EB", ink: "#3A4452" },
};

export const COLOR_KEYS: ColorKey[] = ["rose", "clay", "sand", "sage", "sky", "lavender", "mist"];
