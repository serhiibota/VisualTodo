"use client";

import { useMemo } from "react";
import { Icon } from "@/components/ui/Icon";
import { formatDayMonth, formatWeekday, pluralRu, todayKey } from "@/lib/time";
import { usePlannerStore } from "@/store/usePlannerStore";
import { ProjectFilter } from "./ProjectFilter";
import { WeekStrip } from "./WeekStrip";

/**
 * Шапка. Сплошной фон вместо «стеклянного» blur — в Safari iOS 15
 * backdrop-filter поверх скролла стоит десятки FPS на A10.
 */
export function DayHeader() {
  const selectedDate = usePlannerStore((s) => s.selectedDate);
  const tasks = usePlannerStore((s) => s.tasks);
  const selectDate = usePlannerStore((s) => s.selectDate);
  const openSheet = usePlannerStore((s) => s.openSheet);
  const isToday = selectedDate === todayKey();

  const inboxCount = useMemo(() => {
    let n = 0;
    for (const id in tasks) if (tasks[id].date === null && !tasks[id].done) n++;
    return n;
  }, [tasks]);

  const { total, done } = useMemo(() => {
    let total = 0;
    let done = 0;
    for (const id in tasks) {
      if (tasks[id].date !== selectedDate) continue;
      total++;
      if (tasks[id].done) done++;
    }
    return { total, done };
  }, [tasks, selectedDate]);

  const progress = total ? done / total : 0;

  return (
    <header className="safe-top relative z-10 shrink-0 border-b border-line bg-milk px-4 pb-3">
      <div className="flex items-start justify-between gap-3 pt-2.5">
        <div className="min-w-0">
          <p className="text-[13px] capitalize text-muted">
            {formatWeekday(selectedDate)}
            {isToday && <span className="text-accent"> · сегодня</span>}
          </p>
          <h1 className="truncate font-display text-[30px] font-medium leading-[1.1] tracking-[-0.01em] text-ink">
            {formatDayMonth(selectedDate)}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 pt-1">
          {!isToday && (
            <button
              type="button"
              onClick={() => selectDate(todayKey())}
              className="h-9 rounded-full bg-hover px-3 text-[13px] font-medium text-graphite active:bg-line"
            >
              Сегодня
            </button>
          )}
          <button
            type="button"
            aria-label={"Входящие: " + inboxCount}
            onClick={() => openSheet({ kind: "inbox" })}
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-hover text-graphite active:bg-line"
          >
            <Icon name="inbox" size={19} />
            {inboxCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold tabular-nums text-white">
                {inboxCount}
              </span>
            )}
          </button>
          <button
            type="button"
            aria-label="Проекты и теги"
            onClick={() => openSheet({ kind: "projects" })}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-hover text-graphite active:bg-line"
          >
            <Icon name="folder" size={19} />
          </button>
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-3">
        <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-line">
          <div
            className="progress-fill h-full w-full rounded-full bg-graphite"
            style={{ transform: "translate3d(" + (progress - 1) * 100 + "%,0,0)" }}
          />
        </div>
        <span className="shrink-0 text-[12px] tabular-nums text-muted">
          {total
            ? done + " из " + total + " " + pluralRu(total, "блока", "блоков", "блоков")
            : "нет блоков"}
        </span>
      </div>

      <div className="mt-2">
        <WeekStrip />
      </div>

      <div className="mt-1.5">
        <ProjectFilter />
      </div>
    </header>
  );
}
