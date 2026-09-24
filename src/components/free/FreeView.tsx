"use client";

import { useMemo, useRef } from "react";
import { Icon } from "@/components/ui/Icon";
import { FREE_FROM, FREE_TO, MIN_FREE, SNAP_MIN } from "@/lib/constants";
import { freeWindows, type FreeWindow } from "@/lib/flow";
import { animateScrollTop } from "@/lib/scroll";
import { formatClock, formatDuration, pluralRu, todayKey } from "@/lib/time";
import { useNowMinutes } from "@/hooks/useNow";
import { usePlannerStore } from "@/store/usePlannerStore";
import type { Task } from "@/store/types";

const SPAN = FREE_TO - FREE_FROM;
const pct = (m: number) => ((m - FREE_FROM) / SPAN) * 100 + "%";

/**
 * Режим «Свободное время»: всё лишнее убрано, видно только сколько
 * свободно и где. Каждое окно — готовые длительности для нового блока.
 */
export function FreeView() {
  const selectedDate = usePlannerStore((s) => s.selectedDate);
  const tasksMap = usePlannerStore((s) => s.tasks);
  const openSheet = usePlannerStore((s) => s.openSheet);
  const nowRaw = useNowMinutes();
  const scrollerRef = useRef<HTMLDivElement>(null);

  const today = todayKey();
  const isToday = selectedDate === today;
  const isPast = selectedDate < today;

  const dayTasks = useMemo(() => {
    const list: Task[] = [];
    for (const id in tasksMap) if (tasksMap[id].date === selectedDate) list.push(tasksMap[id]);
    return list;
  }, [tasksMap, selectedDate]);

  // Сегодня считаем с текущего момента (с шагом 5 мин), иначе — с начала окна дня
  const from = isToday ? Math.max(FREE_FROM, Math.ceil(nowRaw / SNAP_MIN) * SNAP_MIN) : FREE_FROM;
  const windows = useMemo(
    () => (from >= FREE_TO ? [] : freeWindows(dayTasks, from, FREE_TO, MIN_FREE)),
    [dayTasks, from]
  );
  const total = windows.reduce((sum, w) => sum + (w.end - w.start), 0);
  const longest = windows.reduce((m, w) => Math.max(m, w.end - w.start), 0);

  const busy = useMemo(
    () =>
      dayTasks
        .map((t) => ({ start: Math.max(FREE_FROM, t.start), end: Math.min(FREE_TO, t.start + t.duration), id: t.id }))
        .filter((b) => b.end > b.start),
    [dayTasks]
  );

  const add = (start: number, duration: number) => openSheet({ kind: "task", taskId: null, start, duration });

  const goTo = (w: FreeWindow) => {
    const scroller = scrollerRef.current;
    const row = scroller?.querySelector<HTMLElement>('[data-window="' + w.start + '"]');
    if (!scroller || !row) return;
    animateScrollTop(scroller, row.offsetTop - 16);
    row.classList.remove("is-flash");
    // перезапуск анимации подсветки
    void row.offsetWidth;
    row.classList.add("is-flash");
  };

  const summary = isPast
    ? "этот день уже прошёл"
    : from >= FREE_TO
      ? "на сегодня день закончился"
      : windows.length
        ? windows.length +
          " " +
          pluralRu(windows.length, "окно", "окна", "окон") +
          " · самое длинное " +
          formatDuration(longest)
        : "свободных окон нет";

  return (
    <div ref={scrollerRef} className="scroll-touch relative min-h-0 flex-1 overflow-y-auto">
      <div className="px-4 pb-[120px] pt-5">
        <p className="text-[13px] text-muted">
          Свободно {isToday ? "сегодня с " + formatClock(Math.min(from, FREE_TO)) : "с " + formatClock(FREE_FROM)} до{" "}
          {formatClock(FREE_TO)}
        </p>
        <div className="font-display text-[calc(46px*var(--display-scale,1))] font-medium leading-[1.1] tracking-[-0.01em] text-ink">
          {total ? formatDuration(total) : "0 мин"}
        </div>
        <p className="mt-0.5 text-[13px] text-muted">{summary}</p>

        {/* Полоса дня: занятое — тушью, свободное — бумагой, прошедшее — приглушено */}
        <div className="mt-5">
          <div className="free-bar relative h-11 overflow-hidden rounded-xl">
            {isToday && from > FREE_FROM && (
              <div className="free-bar-past absolute inset-y-0 left-0" style={{ width: pct(Math.min(from, FREE_TO)) }} />
            )}
            {busy.map((b) => (
              <div
                key={b.id}
                className={"free-bar-busy absolute inset-y-[6px] rounded-[4px]" + (isToday && b.end <= from ? " is-past" : "")}
                style={{ left: pct(b.start), width: "calc(" + pct(b.end) + " - " + pct(b.start) + " - 1px)" }}
              />
            ))}
            {windows.map((w) => (
              <button
                key={w.start}
                type="button"
                aria-label={"Окно " + formatClock(w.start) + "–" + formatClock(w.end)}
                onClick={() => goTo(w)}
                className="absolute inset-y-0"
                style={{ left: pct(w.start), width: "calc(" + pct(w.end) + " - " + pct(w.start) + ")" }}
              >
                <span className="free-bar-slot absolute inset-x-[1px] inset-y-[6px] rounded-[4px]" />
              </button>
            ))}
            {isToday && nowRaw > FREE_FROM && nowRaw < FREE_TO && (
              <div className="free-bar-now absolute inset-y-0 w-[2px]" style={{ left: pct(nowRaw) }} />
            )}
          </div>
          <div className="relative mt-1.5 h-4 text-[11px] tabular-nums text-faint">
            {[FREE_FROM, FREE_FROM + 240, FREE_FROM + 480, FREE_FROM + 720, FREE_TO].map((m, i, arr) => (
              <span
                key={m}
                className="absolute"
                style={{
                  left: pct(m),
                  transform: i === 0 ? "none" : i === arr.length - 1 ? "translateX(-100%)" : "translateX(-50%)",
                }}
              >
                {formatClock(m)}
              </span>
            ))}
          </div>
        </div>

        <ul className="mt-5 flex flex-col gap-2.5">
          {windows.map((w) => (
            <WindowRow key={w.start} window={w} live={isToday && w.start <= from} onAdd={add} />
          ))}
        </ul>

        {!isPast && windows.length === 0 && from < FREE_TO && (
          <p className="mt-8 text-center text-[14px] leading-6 text-muted">
            С {formatClock(from)} до {formatClock(FREE_TO)} всё занято.
            <br />
            Можно выбрать другой день в неделе сверху.
          </p>
        )}
      </div>
    </div>
  );
}

const DURATION_CHOICES = [30, 60, 90];

function WindowRow({
  window: w,
  live,
  onAdd,
}: {
  window: FreeWindow;
  live: boolean;
  onAdd: (start: number, duration: number) => void;
}) {
  const len = w.end - w.start;
  const choices = len < 30 ? [15] : DURATION_CHOICES.filter((d) => d <= len);
  const whole = !choices.includes(len) && len <= 240;

  const label = (d: number) => (d < 60 ? d + " мин" : d % 60 ? (d / 60).toString().replace(".", ",") + " ч" : d / 60 + " ч");

  return (
    <li data-window={w.start} className="free-window rounded-2xl bg-paper px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[18px] font-semibold tabular-nums text-ink">
          {formatClock(w.start)} – {formatClock(w.end)}
        </span>
        <span className="shrink-0 text-[13px] tabular-nums text-muted">{formatDuration(len)}</span>
      </div>
      {live && <p className="now-text mt-0.5 text-[12px] font-medium">свободно прямо сейчас</p>}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {choices.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => onAdd(w.start, d)}
            className="flex h-9 items-center gap-1 rounded-full bg-hover pl-2.5 pr-3.5 text-[14px] text-graphite active:bg-line"
          >
            <Icon name="plus" size={14} strokeWidth={2} />
            {label(d)}
          </button>
        ))}
        {whole && (
          <button
            type="button"
            onClick={() => onAdd(w.start, len)}
            className="flex h-9 items-center gap-1 rounded-full bg-hover pl-2.5 pr-3.5 text-[14px] text-graphite active:bg-line"
          >
            <Icon name="plus" size={14} strokeWidth={2} />
            всё окно
          </button>
        )}
      </div>
    </li>
  );
}
