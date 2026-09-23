"use client";

import { memo, useRef } from "react";
import { Checkbox } from "@/components/ui/Checkbox";
import { Icon } from "@/components/ui/Icon";
import { pillHeight } from "@/lib/constants";
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
  overlaps: boolean;
  projectName: string | null;
  dimmed: boolean;
  onOpen: (id: string) => void;
  onToggle: (id: string) => void;
}

const SWIPE_START = 10;
const SWIPE_COMPLETE = 72;
const SWIPE_MAX = 110;

/**
 * Строка «нити дня»: время слева, капсула на нити, текст, чекбокс.
 * Свайп вправо = выполнено: touch-action: pan-y оставляет вертикальный
 * скролл браузеру, а сдвиг пишется в transform напрямую (без ререндеров).
 */
function TaskRowImpl({ task, progress, showEnd, overlaps, projectName, dimmed, onOpen, onToggle }: TaskRowProps) {
  const swatch = PALETTE[task.color] ?? PALETTE.mist;
  const height = pillHeight(task.duration);
  const end = task.start + task.duration;
  const active = progress !== null && !task.done;
  const fill = task.done ? 1 : active ? progress : 0;
  const tall = height >= 96;

  const bodyRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const g = useRef({ id: -1, x: 0, y: 0, dx: 0, swiping: false, moved: false });

  const apply = (dx: number, animate: boolean) => {
    const body = bodyRef.current;
    const hint = hintRef.current;
    if (!body || !hint) return;
    body.style.transition = animate ? "" : "none";
    body.style.transform = dx ? "translate3d(" + dx + "px,0,0)" : "";
    hint.style.opacity = String(Math.min(1, dx / SWIPE_COMPLETE));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    g.current = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, swiping: false, moved: false };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const s = g.current;
    if (s.id !== e.pointerId) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (!s.swiping) {
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) s.moved = true;
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
    const s = g.current;
    if (s.swiping) {
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
  const hasMeta = task.subtasks.length > 0 || task.links.length > 0 || !!projectName || overlaps;

  return (
    <div className="flow-row relative py-[3px]" style={{ opacity: dimmed ? 0.3 : 1 }} data-active={active || undefined}>
      <div className="spine spine-solid" />
      <div
        ref={hintRef}
        className="pointer-events-none absolute inset-y-0 left-[52px] flex items-center gap-1 text-[12px] font-medium"
        style={{ opacity: 0, color: swatch.ink }}
      >
        <Icon name="check" size={16} strokeWidth={2.2} />
        {task.done ? "Вернуть" : "Готово"}
      </div>

      <div className="flex">
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
            <div className="truncate text-[12px] leading-4 tabular-nums text-muted">
              {formatClock(task.start)}–{formatClock(Math.min(end, 1440))}
              <span className="text-faint"> · {formatDuration(task.duration)}</span>
              {active && (
                <span style={{ color: swatch.ink }}> · ещё {formatDuration(Math.max(1, Math.round(task.duration * (1 - (progress ?? 0)))))}</span>
              )}
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
            {hasMeta && (tall || height >= 70) && (
              <div className="mt-1 flex min-w-0 items-center gap-2 overflow-hidden text-[12px] text-muted">
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
