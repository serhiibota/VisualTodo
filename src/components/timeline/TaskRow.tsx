"use client";

import { memo, useEffect, useRef } from "react";
import { Checkbox } from "@/components/ui/Checkbox";
import { Icon, type IconName } from "@/components/ui/Icon";
import { DAY_END, PILL_PX_PER_MIN, pillHeight, SNAP_MIN } from "@/lib/constants";
import { PALETTE } from "@/lib/palette";
import { formatClock, formatDuration } from "@/lib/time";
import type { Task } from "@/store/types";
import { TaskPill } from "./TaskPill";

interface TaskRowProps {
  task: Task;
  /** 0…1 доля прошедшего времени, если задача идёт сейчас; иначе null */
  progress: number | null;
  /** Показывать время окончания (если следующая задача не стыкуется) */
  showEnd: boolean;
  /** Блок уже закончился (сегодня) — приглушаем, чтобы взгляд шёл к настоящему */
  past: boolean;
  /** Текущая минута (для подписи отметки «вы здесь»), только у идущего блока */
  nowMinute: number | null;
  overlaps: boolean;
  projectName: string | null;
  dimmed: boolean;
  onOpen: (id: string) => void;
  onToggle: (id: string) => void;
  onMove: (id: string, start: number) => void;
  /** Прикреплённый список/заметка: иконка и «2/5» или «заметка» (null — нет) */
  listChip: { icon: IconName; label: string } | null;
  onOpenList: (listId: string) => void;
}

const SWIPE_START = 10;
const SWIPE_COMPLETE = 72;
const SWIPE_MAX = 110;
const LONG_PRESS_MS = 380;
const DRAG_MIN_PER_PX = 1 / PILL_PX_PER_MIN;
const EDGE = 64;

/**
 * Строка «нити дня»: время слева, капсула на нити, текст, чекбокс.
 * Свайп вправо = выполнено: touch-action: pan-y оставляет вертикальный
 * скролл браузеру, а сдвиг пишется в transform напрямую (без ререндеров).
 * Долгое нажатие (380 мс) «поднимает» блок: его можно вести по нити,
 * время меняется с шагом 5 минут, у краёв список прокручивается сам.
 */
function TaskRowImpl({
  task,
  progress,
  showEnd,
  past,
  nowMinute,
  overlaps,
  projectName,
  dimmed,
  onOpen,
  onToggle,
  onMove,
  listChip: attachedChip,
  onOpenList,
}: TaskRowProps) {
  const base = PALETTE[task.color] ?? PALETTE.mist;
  const height = pillHeight(task.duration);
  const end = task.start + task.duration;
  const active = progress !== null && !task.done;
  // У текущего блока схема может задать общий цвет «сейчас» (киноварь в «Туши»);
  // если не задала — var() откатится к цвету самой задачи
  const swatch = active
    ? { ...base, solid: "var(--c-now, " + base.solid + ")", ink: "var(--c-now, " + base.ink + ")" }
    : base;
  const fill = task.done ? 1 : active ? progress : 0;
  const tall = height >= 96;

  const rowRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const g = useRef({
    id: -1,
    x: 0,
    y: 0,
    dx: 0,
    swiping: false,
    moved: false,
    // перетаскивание по нити
    dragging: false,
    timer: 0 as ReturnType<typeof setTimeout> | 0,
    lastY: 0,
    scroller: null as HTMLElement | null,
    startScroll: 0,
    newStart: task.start,
    raf: 0,
  });

  // Актуальные значения для обработчиков, живущих дольше одного рендера
  const live = useRef({ task, onMove });
  live.current = { task, onMove };

  const apply = (dx: number, animate: boolean) => {
    const body = bodyRef.current;
    const hint = hintRef.current;
    if (!body || !hint) return;
    body.style.transition = animate ? "" : "none";
    body.style.transform = dx ? "translate3d(" + dx + "px,0,0)" : "";
    hint.style.opacity = String(Math.min(1, dx / SWIPE_COMPLETE));
  };

  // ---------- Перетаскивание по нити (long-press → drag) ----------

  const updateDrag = () => {
    const s = g.current;
    const row = rowRef.current;
    if (!row || !s.scroller) return;
    const { start, duration } = live.current.task;
    const dy = s.lastY - s.y + (s.scroller.scrollTop - s.startScroll);
    row.style.transform = "translate3d(0," + dy + "px,0)";
    // Масштаб перетаскивания = масштаб капсул: ~1.1 мин на пиксель, шаг 5 мин
    const raw = start + dy * DRAG_MIN_PER_PX;
    const next = Math.max(0, Math.min(DAY_END - duration, Math.round(raw / SNAP_MIN) * SNAP_MIN));
    if (next !== s.newStart) {
      s.newStart = next;
      if (badgeRef.current) {
        badgeRef.current.textContent = formatClock(next) + "–" + formatClock(Math.min(next + duration, DAY_END));
      }
    }
  };

  // Автопрокрутка у верхнего/нижнего края списка
  const autoScroll = () => {
    const s = g.current;
    if (!s.dragging || !s.scroller) return;
    const rect = s.scroller.getBoundingClientRect();
    const top = s.lastY - rect.top;
    const bottom = rect.bottom - s.lastY;
    let v = 0;
    if (top < EDGE) v = -Math.ceil((EDGE - top) / 6);
    else if (bottom < EDGE) v = Math.ceil((EDGE - bottom) / 6);
    if (v) {
      s.scroller.scrollTop += v;
      updateDrag();
    }
    s.raf = requestAnimationFrame(autoScroll);
  };

  const startDrag = () => {
    const s = g.current;
    const row = rowRef.current;
    if (!row || s.moved || s.swiping || s.id === -1) return;
    s.dragging = true;
    s.moved = true; // клик после отпускания не откроет шторку
    s.lastY = s.y;
    s.scroller = row.closest<HTMLElement>(".scroll-touch");
    s.startScroll = s.scroller ? s.scroller.scrollTop : 0;
    s.newStart = live.current.task.start;
    try {
      bodyRef.current?.setPointerCapture(s.id);
    } catch {
      /* указатель уже отпущен */
    }
    if (badgeRef.current) {
      const { start, duration } = live.current.task;
      badgeRef.current.textContent = formatClock(start) + "–" + formatClock(Math.min(start + duration, DAY_END));
    }
    row.style.transition = "none";
    row.classList.add("is-dragging");
    // :has() нет в iOS 15 — поднимаем z-index родителю вручную
    row.parentElement?.classList.add("is-lifted");
    s.raf = requestAnimationFrame(autoScroll);
  };

  const endDrag = (commit: boolean) => {
    const s = g.current;
    const row = rowRef.current;
    s.dragging = false;
    cancelAnimationFrame(s.raf);
    if (!row) return;
    row.classList.remove("is-dragging");
    row.parentElement?.classList.remove("is-lifted");
    const changed = commit && s.newStart !== live.current.task.start;
    if (changed) {
      // Список пересоберётся в новом порядке — снимаем сдвиг без анимации
      row.style.transform = "";
      live.current.onMove(live.current.task.id, s.newStart);
    } else {
      row.style.transition = "";
      row.style.transform = "";
    }
  };

  const clearTimer = () => {
    const s = g.current;
    if (s.timer) clearTimeout(s.timer);
    s.timer = 0;
  };

  // Пока тянем — гасим нативный скролл. Нужен НЕпассивный touchmove:
  // React вешает touch-обработчики пассивными, поэтому addEventListener вручную.
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const onTouchMove = (e: TouchEvent) => {
      if (g.current.dragging) e.preventDefault();
    };
    const onContextMenu = (e: Event) => e.preventDefault();
    body.addEventListener("touchmove", onTouchMove, { passive: false });
    body.addEventListener("contextmenu", onContextMenu);
    const state = g.current;
    return () => {
      body.removeEventListener("touchmove", onTouchMove);
      body.removeEventListener("contextmenu", onContextMenu);
      if (state.timer) clearTimeout(state.timer);
      cancelAnimationFrame(state.raf);
    };
  }, []);

  // ---------- Жесты ----------

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    clearTimer();
    const s = g.current;
    s.id = e.pointerId;
    s.x = e.clientX;
    s.y = e.clientY;
    s.dx = 0;
    s.swiping = false;
    s.moved = false;
    s.dragging = false;
    s.timer = setTimeout(startDrag, LONG_PRESS_MS);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const s = g.current;
    if (s.id !== e.pointerId) return;
    if (s.dragging) {
      s.lastY = e.clientY;
      updateDrag();
      return;
    }
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (!s.swiping) {
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        s.moved = true;
        clearTimer();
      }
      if (dx > SWIPE_START && Math.abs(dx) > Math.abs(dy) * 1.4) {
        s.swiping = true;
        e.currentTarget.setPointerCapture(e.pointerId);
      } else return;
    }
    const eased = dx <= 0 ? 0 : dx < SWIPE_COMPLETE ? dx : SWIPE_COMPLETE + (dx - SWIPE_COMPLETE) * 0.35;
    s.dx = Math.min(eased, SWIPE_MAX);
    apply(s.dx, false);
  };

  const finish = (commit: boolean) => {
    clearTimer();
    const s = g.current;
    if (s.dragging) endDrag(commit);
    else if (s.swiping) {
      if (commit && s.dx >= SWIPE_COMPLETE) onToggle(task.id);
      apply(0, true);
    }
    s.id = -1;
  };

  const onClick = () => {
    const s = g.current;
    if (s.swiping || s.moved) {
      s.swiping = false;
      s.moved = false;
      return;
    }
    onOpen(task.id);
  };

  const subDone = task.subtasks.filter((st) => st.done).length;
  const hasList = !!task.listId && attachedChip !== null;
  const hasMeta = task.subtasks.length > 0 || task.links.length > 0 || !!projectName || overlaps || hasList;
  const showMeta = hasMeta && (tall || height >= 70);

  // Отдельная кнопка внутри строки: тап открывает список, а не редактор блока
  const listChip = hasList ? (
    <button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onOpenList(task.listId as string);
      }}
      aria-label={"Открыть прикреплённое: " + attachedChip?.label}
      className="tap-expand relative inline-flex shrink-0 items-center gap-1 rounded-full bg-hover px-1.5 py-px text-[12px] tabular-nums text-graphite"
    >
      <Icon name={attachedChip?.icon ?? "listCheck"} size={12} />
      {attachedChip?.label}
    </button>
  ) : null;

  return (
    <div
      className={"flow-row relative py-[3px]" + (past && !dimmed ? " is-past" : "")}
      style={{ opacity: dimmed ? 0.3 : undefined }}
      data-active={active || undefined}
    >
      <div className="spine spine-solid" />
      {active && nowMinute !== null && <NowMark top={3 + Math.round(fill * height)} minute={nowMinute} />}
      <div
        ref={hintRef}
        className="pointer-events-none absolute inset-y-0 left-[52px] flex items-center gap-1 text-[12px] font-medium"
        style={{ opacity: 0, color: swatch.ink }}
      >
        <Icon name="check" size={16} strokeWidth={2.2} />
        {task.done ? "Вернуть" : "Готово"}
      </div>

      <div ref={rowRef} className="drag-layer relative flex">
        {/* Плашка нового времени — видна только во время перетаскивания */}
        <span
          ref={badgeRef}
          className="drag-badge pointer-events-none absolute left-0 top-0 z-[2] rounded-full px-2 py-1 text-[11px] font-semibold tabular-nums"
          style={{ backgroundColor: swatch.solid, color: "var(--c-on-solid)" }}
        />
        {/* Время: начало у верха капсулы, конец — у низа */}
        <div className="relative w-[42px] shrink-0 text-right text-[11px] tabular-nums leading-none text-muted">
          <span className="absolute right-0 top-[4px]">{formatClock(task.start)}</span>
          {showEnd && height >= 70 && (
            <span className="absolute bottom-[4px] right-0 text-faint">{formatClock(Math.min(end, 1440))}</span>
          )}
        </div>

        <div
          ref={bodyRef}
          role="button"
          tabIndex={0}
          aria-label={task.title + ", " + formatClock(task.start) + "–" + formatClock(end)}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => finish(true)}
          onPointerCancel={() => finish(false)}
          onClick={onClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpen(task.id);
            }
          }}
          className="flow-body flex min-w-0 flex-1 items-stretch"
        >
          <div className="relative z-[1] flex w-[62px] shrink-0 justify-center">
            <TaskPill icon={task.icon} swatch={swatch} height={height} fill={fill} />
          </div>

          <div className={"flex min-w-0 flex-1 flex-col pr-1 " + (tall ? "justify-start pt-2.5" : "justify-center")}>
            <div className="flex min-w-0 items-center gap-1.5 text-[12px] leading-4 tabular-nums text-muted">
              <span className="min-w-0 truncate">
              {formatClock(task.start)}–{formatClock(Math.min(end, 1440))}
              <span className="text-faint"> · {formatDuration(task.duration)}</span>
              {active && (
                <span style={{ color: swatch.ink }}> · ещё {formatDuration(Math.max(1, Math.round(task.duration * (1 - (progress ?? 0)))))}</span>
              )}
              </span>
              {!showMeta && listChip}
            </div>
            <div
              className={
                "task-title mt-0.5 text-[16px] font-semibold leading-[21px] tracking-[-0.01em] " +
                (tall ? "line-clamp-2" : "truncate") +
                (task.done ? " is-done text-faint" : " text-ink")
              }
            >
              {task.title}
            </div>
            {showMeta && (
              <div className="mt-1 flex min-w-0 items-center gap-2 overflow-hidden text-[12px] text-muted">
                {listChip}
                {task.subtasks.length > 0 && (
                  <span className="flex shrink-0 items-center gap-1 tabular-nums">
                    <Icon name="check" size={12} strokeWidth={2.2} />
                    {subDone}/{task.subtasks.length}
                  </span>
                )}
                {task.links.length > 0 && <Icon name="link" size={12} className="shrink-0" />}
                {projectName && <span className="truncate">{projectName}</span>}
                {overlaps && <span className="shrink-0 text-accent">пересекается</span>}
              </div>
            )}
          </div>
        </div>

        <div className="flex w-[40px] shrink-0 items-center justify-center">
          <Checkbox checked={task.done} onChange={() => onToggle(task.id)} color={swatch.solid} size={24} label="Выполнено" />
        </div>
      </div>
    </div>
  );
}

export const TaskRow = memo(TaskRowImpl);

/**
 * Отметка «вы здесь»: засечка на уровне текущей минуты через колонку
 * времени и капсулу (текст не перечёркивает). Цвет — «сейчас» схемы,
 * в цветных схемах — акцент.
 */
export function NowMark({ top, minute }: { top: number; minute: number }) {
  return (
    <div className="now-mark pointer-events-none absolute left-0 z-[3]" style={{ top }} aria-hidden="true">
      <span className="now-mark-label absolute left-0 w-[42px] -translate-y-1/2 rounded-full py-px text-center text-[10px] font-semibold tabular-nums">
        {formatClock(Math.floor(minute))}
      </span>
      <span className="now-mark-line absolute left-[44px] h-[2px] w-[50px] -translate-y-1/2" />
      <span className="now-mark-line absolute left-[91px] h-[7px] w-[7px] -translate-y-1/2 rounded-full" />
    </div>
  );
}
