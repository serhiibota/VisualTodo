const pad = (n: number) => (n < 10 ? "0" + n : String(n));

/** Минуты от полуночи → "HH:MM" (24:00 допускается как конец дня) */
export function formatClock(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return pad(h) + ":" + pad(m);
}

/** "HH:MM" → минуты от полуночи, либо null */
export function parseClock(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

/** 90 → "1 ч 30 мин" */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return m + " мин";
  if (!m) return h + " ч";
  return h + " ч " + m + " мин";
}

/** Локальный ключ даты YYYY-MM-DD (без toISOString, который сдвигает в UTC) */
export function toDateKey(date: Date): string {
  return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function addDays(key: string, days: number): string {
  const d = fromDateKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

/** Понедельник недели, содержащей дату */
export function startOfWeek(key: string): string {
  const d = fromDateKey(key);
  const shift = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - shift);
  return toDateKey(d);
}

export function minutesNow(date = new Date()): number {
  return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
}

// Форматтеры создаются один раз: Intl.DateTimeFormat дорогой в конструировании.
const dayMonthFmt = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });
const weekdayFmt = new Intl.DateTimeFormat("ru-RU", { weekday: "long" });
const weekdayShortFmt = new Intl.DateTimeFormat("ru-RU", { weekday: "short" });

export const formatDayMonth = (key: string) => dayMonthFmt.format(fromDateKey(key));
export const formatWeekday = (key: string) => weekdayFmt.format(fromDateKey(key));
export const formatWeekdayShort = (key: string) =>
  weekdayShortFmt.format(fromDateKey(key)).replace(".", "");

export function pluralRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
