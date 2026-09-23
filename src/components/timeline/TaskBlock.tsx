"use client";

import { memo, useRef } from "react";
import { Checkbox } from "@/components/ui/Checkbox";
import { Icon } from "@/components/ui/Icon";
import { PALETTE, type Swatch } from "@/lib/palette";
import { formatClock, formatDuration } from "@/lib/time";
import type { Tag, Task } from "@/store/types";

interface TaskBlockProps {
  task: Task;
  top: number;
  height: number;
  lane: number;
  lanes: number;
  swatch: Swatch;
  /** Стабильная ссылка (меняется только при правке тегов) — не ломает memo */
  tagsById: Record<string, Tag>;
  projectName: string | null;
  dimmed: boolean;
  onOpen: (id: string) => void;
  onToggle: (id: string) => void;
}

const SWIPE_START = 10;
const SWIPE_COMPLETE = 72;
const SWIPE_MAX = 110;
const GAP = 2;

/**
 * Блок задачи. Высота = длительность × PX_PER_MIN (без минимальной высоты).
 * Содержимое адаптируется к высоте: крошечный / компактный / полный вид,
 * чтобы на ширине 375px текст не переносился неуклюже.
 *
 * Свайп вправо → «выполнено». touch-action: pan-y отдаёт вертикальный скролл
 * браузеру, а горизонталь обрабатываем сами; transform пишем прямо в DOM.
 */
function TaskBlockImpl({
  task,
  top,
  height,
  lane,
  lanes,
  swatch,
  tagsById,
  projectName,
  dimmed,
  onOpen,
  onToggle,
}: TaskBlockProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const gesture = useRef({ id: -1, x: 0, y: 0, dx: 0, swiping: false, moved: false });

  const size = height < 30 ? "tiny" : height < 54 ? "compact" : "full";
  const end = task.start + task.duration;

  const apply = (dx: number, animate: boolean) => {
    const card = cardRef.current;
    const hint = hintRef.current;
    if (!card || !hint) return;
    card.style.transition = animate ? "" : "none";
    card.style.transform = dx ? "translate3d(" + dx + "px,0,0)" : "";
    hint.style.opacity = String(Math.min(1, dx / SWIPE_COMPLETE));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    gesture.current = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, swiping: false, moved: false };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (g.id !== e.pointerId) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (!g.swiping) {
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) g.moved = true;
      if (dx > SWIPE_START && Math.abs(dx) > Math.abs(dy) * 1.4) {
        g.swiping = true;
        e.currentTarget.setPointerCapture(e.pointerId);
      } else {
        return;
      }
    }
    // Резиновое сопротивление после порога
    const eased = dx <= 0 ? 0 : dx < SWIPE_COMPLETE ? dx : SWIPE_COMPLETE + (dx - SWIPE_COMPLETE) * 0.35;
    g.dx = Math.min(eased, SWIPE_MAX);
    apply(g.dx, false);
  };

  const finish = (commit: boolean) => {
    const g = gesture.current;
    if (g.swiping) {
      if (commit && g.dx >= SWIPE_COMPLETE) onToggle(task.id);
      apply(0, true);
    }
    g.id = -1;
  };

  const onClick = () => {
    const g = gesture.current;
    if (g.swiping || g.moved) {
      g.swiping = false;
      g.moved = false;
      return;
    }
    onOpen(task.id);
  };

  const width = 100 / lanes;
  const hasLinks = task.links.length > 0;
  const tags: Tag[] = [];
  for (const id of task.tagIds) if (tagsById[id]) tags.push(tagsById[id]);

  return (
    <div
      className="task-slot absolute"
      style={{
        // Позиция статична — обычный top, без лишних GPU-слоёв на каждую карточку
        top,
        left: width * lane + "%",
        width: "calc(" + width + "% - " + GAP + "px)",
        height: Math.max(height - GAP, 1),
        opacity: dimmed ? 0.28 : 1,
      }}
    >
      {/* Подсказка под карточкой, проявляется при свайпе */}
      <div
        ref={hintRef}
        className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-[12px] font-medium"
        style={{ opacity: 0, color: swatch.accent }}
      >
        <Icon name="check" size={16} strokeWidth={2.2} />
        {height >= 30 && <span className="ml-1">{task.done ? "Вернуть" : "Готово"}</span>}
      </div>

      <div
        ref={cardRef}
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
        className={"task-card relative flex h-full overflow-hidden rounded-[10px] " + (task.done ? "is-done" : "")}
        style={{ backgroundColor: swatch.bg, boxShadow: "inset 0 0 0 1px " + swatch.border, color: swatch.text }}
      >
        <div className="w-[3px] shrink-0" style={{ backgroundColor: swatch.accent }} />

        {size === "tiny" ? (
          <div className="flex min-w-0 flex-1 items-center gap-1.5 pl-2 pr-1.5">
            <span className="task-title min-w-0 flex-1 truncate text-[12px] font-semibold leading-none">{task.title}</span>
            {lanes === 1 && (
              <span className="shrink-0 text-[11px] tabular-nums leading-none opacity-60">{formatClock(task.start)}</span>
            )}
            <Checkbox checked={task.done} onChange={() => onToggle(task.id)} color={swatch.accent} size={14} label="Выполнено" />
          </div>
        ) : (
          <div className={"flex min-w-0 flex-1 gap-2 pl-2.5 pr-2 " + (size === "compact" ? "items-center" : "items-start pt-2")}>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-baseline gap-2">
                <span
                  className={
                    "task-title min-w-0 text-[14px] font-semibold leading-[18px] tracking-[-0.01em] " +
                    (size === "full" && height >= 90 ? "line-clamp-2" : "truncate")
                  }
                >
                  {task.title}
                </span>
                {size === "compact" && lanes === 1 && (
                  <span className="shrink-0 text-[12px] tabular-nums opacity-60">{formatClock(task.start)}</span>
                )}
              </div>

              {size === "full" && (
                <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[12px] leading-4 opacity-70">
                  <span className="shrink-0 tabular-nums">
                    {formatClock(task.start)}–{formatClock(end)}
                  </span>
                  {lanes === 1 && <span className="truncate">· {formatDuration(task.duration)}</span>}
                  {hasLinks && <Icon name="link" size={12} className="shrink-0" />}
                </div>
              )}

              {size === "full" && height >= 70 && (tags.length > 0 || projectName) && (
                <div className="mt-1.5 flex min-w-0 items-center gap-1 overflow-hidden">
                  {projectName && lanes === 1 && (
                    <span className="shrink-0 truncate rounded-full bg-paper/70 px-1.5 py-px text-[11px] font-medium">
                      {projectName}
                    </span>
                  )}
                  {tags.map((tag) => (
                    <span key={tag.id} className="flex shrink-0 items-center gap-1 text-[11px] opacity-80">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: PALETTE[tag.color].accent }} />
                      {lanes === 1 && tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <Checkbox
              checked={task.done}
              onChange={() => onToggle(task.id)}
              color={swatch.accent}
              size={size === "compact" ? 18 : 20}
              label="Выполнено"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export const TaskBlock = memo(TaskBlockImpl);
