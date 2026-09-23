"use client";

import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { DAY_END, DAY_START, SNAP_MIN, TIMELINE_HEIGHT } from "@/lib/constants";
import { layoutTasks, minutesToY, yToMinutes } from "@/lib/layout";
import { PALETTE } from "@/lib/palette";
import { minutesNow, todayKey } from "@/lib/time";
import { usePlannerStore } from "@/store/usePlannerStore";
import type { Tag, Task } from "@/store/types";
import { NowIndicator } from "./NowIndicator";
import { TaskBlock } from "./TaskBlock";
import { TimeGrid } from "./TimeGrid";

const PAD_TOP = 14;
const PAD_BOTTOM = 120; // место под плавающую кнопку и нижнюю панель Safari

export function Timeline() {
  const selectedDate = usePlannerStore((s) => s.selectedDate);
  const tasksMap = usePlannerStore((s) => s.tasks);
  const tags = usePlannerStore((s) => s.tags);
  const projects = usePlannerStore((s) => s.projects);
  const activeProjectId = usePlannerStore((s) => s.activeProjectId);
  const openSheet = usePlannerStore((s) => s.openSheet);
  const toggleTask = usePlannerStore((s) => s.toggleTask);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const isToday = selectedDate === todayKey();

  const dayTasks = useMemo(() => {
    const list: Task[] = [];
    for (const id in tasksMap) if (tasksMap[id].date === selectedDate) list.push(tasksMap[id]);
    return list;
  }, [tasksMap, selectedDate]);

  const placed = useMemo(() => layoutTasks(dayTasks), [dayTasks]);

  const tagsById = useMemo(() => {
    const map: Record<string, Tag> = {};
    for (const t of tags) map[t.id] = t;
    return map;
  }, [tags]);

  const projectsById = useMemo(() => {
    const map: Record<string, (typeof projects)[number]> = {};
    for (const p of projects) map[p.id] = p;
    return map;
  }, [projects]);

  // При смене дня прокручиваем к «сейчас» или к первой задаче — до отрисовки кадра.
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let focus: number;
    if (isToday) focus = minutesNow() - 60;
    else if (dayTasks.length) focus = Math.min(...dayTasks.map((t) => t.start)) - 30;
    else focus = 8 * 60;
    el.scrollTop = Math.max(0, minutesToY(Math.max(DAY_START, focus)));
    // Намеренно только при смене дня
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const onOpen = useCallback((id: string) => openSheet({ kind: "task", taskId: id }), [openSheet]);

  const onGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const raw = yToMinutes(e.clientY - rect.top);
    const start = Math.min(DAY_END - SNAP_MIN, Math.max(DAY_START, Math.floor(raw / SNAP_MIN) * SNAP_MIN));
    openSheet({ kind: "task", taskId: null, start });
  };

  return (
    <div ref={scrollerRef} className="scroll-touch relative min-h-0 flex-1 overflow-y-auto">
      <div className="relative mx-3" style={{ height: TIMELINE_HEIGHT + PAD_TOP + PAD_BOTTOM }}>
        <div className="absolute inset-x-0" style={{ top: PAD_TOP, height: TIMELINE_HEIGHT }}>
          <TimeGrid />

          <div className="absolute bottom-0 left-[50px] right-0 top-0">
            <div className="absolute inset-0" onClick={onGridClick} aria-hidden="true" />

            {placed.map(({ task, top, height, lane, lanes }) => {
              const firstTag = task.tagIds.length ? tagsById[task.tagIds[0]] : undefined;
              const project = task.projectId ? projectsById[task.projectId] : undefined;
              const color = firstTag?.color ?? project?.color ?? "mist";
              return (
                <TaskBlock
                  key={task.id}
                  task={task}
                  top={top}
                  height={height}
                  lane={lane}
                  lanes={lanes}
                  swatch={PALETTE[color]}
                  tagsById={tagsById}
                  projectName={project ? project.name : null}
                  dimmed={activeProjectId !== null && task.projectId !== activeProjectId}
                  onOpen={onOpen}
                  onToggle={toggleTask}
                />
              );
            })}

            {placed.length === 0 && (
              <div
                className="pointer-events-none absolute inset-x-0 text-center text-[13px] leading-5 text-muted"
                style={{ top: minutesToY(9 * 60) }}
              >
                День свободен.
                <br />
                Нажмите на нужное время, чтобы добавить блок.
              </div>
            )}
          </div>

          {isToday && <NowIndicator />}
        </div>
      </div>
    </div>
  );
}
