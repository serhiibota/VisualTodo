/** Видимое окно таймлайна: 06:00 – 24:00 */
export const DAY_START = 6 * 60;
export const DAY_END = 24 * 60;

/** Высота часа в px. 72 → 1.2 px/мин: 15-минутный блок = 18px, час = 72px. */
export const HOUR_HEIGHT = 72;
export const PX_PER_MIN = HOUR_HEIGHT / 60;

export const TIMELINE_HEIGHT = (DAY_END - DAY_START) * PX_PER_MIN;

/** Шаг привязки при создании задачи тапом по сетке */
export const SNAP_MIN = 15;

export const DURATION_PRESETS = [15, 30, 45, 60, 90, 120, 180];

export const STORAGE_KEY = "structura-planner";
