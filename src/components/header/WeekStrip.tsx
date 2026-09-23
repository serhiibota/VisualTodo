"use client";

import { useMemo } from "react";
import { Icon } from "@/components/ui/Icon";
import { PALETTE } from "@/lib/palette";
import { addDays, formatWeekdayShort, fromDateKey, startOfWeek, todayKey } from "@/lib/time";
import { usePlannerStore } from "@/store/usePlannerStore";

export function WeekStrip() {
  const selectedDate = usePlannerStore((s) => s.selectedDate);
  const selectDate = usePlannerStore((s) => s.selectDate);
  const tasks = usePlannerStore((s) => s.tasks);
  const today = todayKey();

  const days = useMemo(() => {
    const monday = startOfWeek(selectedDate);
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  }, [selectedDate]);

  // Под каждым днём — до 4 цветных точек его блоков (по порядку времени)
  const dots = useMemo(() => {
    const byDay: Record<string, { start: number; color: string }[]> = {};
    for (const id in tasks) {
      const t = tasks[id];
      if (!t.date) continue;
      (byDay[t.date] ??= []).push({ start: t.start, color: (PALETTE[t.color] ?? PALETTE.mist).solid });
    }
    const out: Record<string, string[]> = {};
    for (const day in byDay) out[day] = byDay[day].sort((a, b) => a.start - b.start).slice(0, 4).map((d) => d.color);
    return out;
  }, [tasks]);

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label="Предыдущая неделя"
        onClick={() => selectDate(addDays(selectedDate, -7))}
        className="flex h-9 w-7 shrink-0 items-center justify-center rounded-full text-muted active:bg-hover"
      >
        <Icon name="chevronLeft" size={18} />
      </button>

      <div className="grid flex-1 grid-cols-7">
        {days.map((day) => {
          const selected = day === selectedDate;
          const isToday = day === today;
          return (
            <button
              key={day}
              type="button"
              onClick={() => selectDate(day)}
              aria-pressed={selected}
              className="flex flex-col items-center gap-1 py-1"
            >
              <span className={"text-[11px] uppercase tracking-[0.06em] " + (isToday ? "text-accent" : "text-muted")}>
                {formatWeekdayShort(day)}
              </span>
              <span
                className={
                  "flex h-8 w-8 items-center justify-center rounded-full text-[15px] tabular-nums transition-colors duration-200 " +
                  (selected
                    ? "bg-ink font-semibold text-milk"
                    : isToday
                      ? "font-semibold text-accent"
                      : "text-graphite active:bg-hover")
                }
              >
                {fromDateKey(day).getDate()}
              </span>
              <span className="flex h-1.5 items-center gap-[2px]">
                {(dots[day] ?? []).map((c, i) => (
                  <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c }} />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        aria-label="Следующая неделя"
        onClick={() => selectDate(addDays(selectedDate, 7))}
        className="flex h-9 w-7 shrink-0 items-center justify-center rounded-full text-muted active:bg-hover"
      >
        <Icon name="chevronRight" size={18} />
      </button>
    </div>
  );
}
