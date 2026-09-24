/**
 * Высота капсулы растёт вместе с длительностью: база под иконку + 0.9 px/мин.
 * 15 мин → 58px, 30 → 71, 1 ч → 98, 2 ч → 152. После 3 ч рост замедляется,
 * чтобы 8-часовой рабочий блок не занимал три экрана iPhone 7.
 */
export const PILL_BASE = 44;
export const PILL_PX_PER_MIN = 0.9;
export const PILL_LONG_AFTER = 180;
export const PILL_LONG_PX_PER_MIN = 0.2;

export function pillHeight(duration: number): number {
  const main = Math.min(duration, PILL_LONG_AFTER);
  const tail = Math.max(0, duration - PILL_LONG_AFTER);
  return Math.round(PILL_BASE + main * PILL_PX_PER_MIN + tail * PILL_LONG_PX_PER_MIN);
}

/** Промежуток между задачами: сжат, но длинный отдых визуально длиннее короткого */
export function gapHeight(minutes: number): number {
  return Math.round(44 + Math.min(minutes, 240) * 0.18);
}

/** Шаг привязки времени */
export const SNAP_MIN = 5;

/** Начало дня по умолчанию для нового блока в не-сегодняшний день */
export const DEFAULT_START = 9 * 60;

export const DAY_END = 24 * 60;

/** Границы дня по умолчанию: в них считаем свободное время и ищем окна (меняются в настройках) */
export const DEFAULT_DAY_BOUNDS = { from: 7 * 60, to: 23 * 60 };
/** Быстрые варианты в настройках */
export const DAY_BOUNDS_PRESETS = [
  { from: 7 * 60, to: 23 * 60 },
  { from: 8 * 60, to: 22 * 60 },
  { from: 9 * 60, to: 18 * 60 },
  { from: 6 * 60, to: 24 * 60 },
];
/** День короче этого не разрешаем — иначе «свободное время» теряет смысл */
export const MIN_DAY_LENGTH = 60;
/** Окна короче этого в режиме «Свободное время» не показываем */
export const MIN_FREE = 15;

export const DURATION_PRESETS = [15, 30, 45, 60, 90, 120, 180];

export const STORAGE_KEY = "structura-planner";
