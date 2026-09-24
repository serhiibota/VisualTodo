import type { ColorKey } from "@/store/types";

export interface Swatch {
  label: string;
  /** Насыщенный цвет: заливка капсулы (выполнено / идёт сейчас), чекбокс, точки */
  solid: string;
  /** Светлая (в тёмных схемах — глубокая) заливка предстоящей задачи */
  tint: string;
  /** Цвет иконки на заливке tint */
  ink: string;
  /** Цвет категории в пикерах, точках проектов и тегов */
  mark: string;
}

const LABELS: Record<ColorKey, string> = {
  rose: "Коралл",
  clay: "Терракота",
  sand: "Охра",
  sage: "Шалфей",
  sky: "Небо",
  lavender: "Слива",
  mist: "Графит",
};

export const COLOR_KEYS: ColorKey[] = ["rose", "clay", "sand", "sage", "sky", "lavender", "mist"];

// Значения — CSS-переменные текущей схемы (lib/themes.ts). Ссылки на объекты
// стабильны, поэтому смена схемы не ломает memo и не требует ререндера.
export const PALETTE = {} as Record<ColorKey, Swatch>;
for (const key of COLOR_KEYS) {
  PALETTE[key] = {
    label: LABELS[key],
    solid: "var(--t-" + key + "-solid)",
    tint: "var(--t-" + key + "-tint)",
    ink: "var(--t-" + key + "-ink)",
    mark: "var(--t-" + key + "-mark)",
  };
}
