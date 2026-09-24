"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { DAY_END, DEFAULT_START } from "@/lib/constants";
import { buildFlow } from "@/lib/flow";
import { animateScrollTop, focusOffset } from "@/lib/scroll";
import { formatClock, todayKey } from "@/lib/time";
import { useNowMinutes } from "@/hooks/useNow";
import { usePlannerStore } from "@/store/usePlannerStore";
import type { Task } from "@/store/types";
import { GapRow } from "./GapRow";
import { NowChip } from "./NowChip";
import { TaskRow } from "./TaskRow";

/**
 * «Нить дня» в духе бумажного ежедневника: задачи идут друг за другом,
 * капсула каждой растёт с длительностью, свободные окна — пунктиром.
 * Никакой почасовой сетки: пустые часы не съедают экран iPhone 7.
 */
const AUTO_RETURN_MS = 45_000;

export function Timeline() {
  const selectedDate = usePlannerStore((s) => s.selectedDate);
  const tasksMap = usePlannerStore((s) => s.tasks);
  const projects = usePlannerStore((s) => s.projects);
  const activeProjectId = usePlannerStore((s) => s.activeProjectId);
  const openSheet = usePlannerStore((s) => s.openSheet);
  const toggleTask = usePlannerStore((s) => s.toggleTask);
  const updateTask = usePlannerStore((s) => s.updateTask);
  const sheetOpen = usePlannerStore((s) => s.sheet !== null);
  const lists = usePlannerStore((s) => s.lists);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const isToday = selectedDate === todayKey();
  const nowRaw = useNowMinutes();
  const now = isToday ? nowRaw : null;

  const dayTasks = useMemo(() => {
    const list: Task[] = [];
    for (const id in tasksMap) if (tasksMap[id].date === selectedDate) list.push(tasksMap[id]);
    return list;
  }, [tasksMap, selectedDate]);

  const flow = useMemo(() => buildFlow(dayTasks), [dayTasks]);

  const projectNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of projects) map[p.id] = p.name;
    return map;
  }, [projects]);

  // При смене дня — к текущей задаче/окну (сегодня) или к началу списка.
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const target = el.querySelector<HTMLElement>("[data-active]");
    el.scrollTop = target ? Math.max(0, focusOffset(target, el)) : 0;
    // Намеренно только при смене дня
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const onOpen = useCallback((id: string) => openSheet({ kind: "task", taskId: id }), [openSheet]);
  // «2/5» для прикреплённых списков — строка-примитив, чтобы не ломать memo строк
  const listProgress = useMemo(() => {
    const map: Record<string, string> = {};
    for (const l of lists) map[l.id] = l.items.filter((it) => it.done).length + "/" + l.items.length;
    return map;
  }, [lists]);
  const onOpenList = useCallback((listId: string) => openSheet({ kind: "list", listId }), [openSheet]);

  const onMove = useCallback((id: string, start: number) => updateTask(id, { start }), [updateTask]);
  const onAdd = useCallback(
    (start: number) => openSheet({ kind: "task", taskId: null, start }),
    [openSheet]
  );

  // ---------- «Вы здесь»: плашка «Сейчас» и автовозврат ----------

  const [chip, setChip] = useState<{ visible: boolean; direction: "up" | "down" }>({ visible: false, direction: "down" });
  const nowKey = now === null ? -1 : Math.floor(now);
  const activeTask = now === null ? null : dayTasks.find((t) => now >= t.start && now < t.start + t.duration && !t.done);
  const chipLabel = activeTask ? activeTask.title : "свободно";

  const scrollToNow = useCallback((animated: boolean) => {
    const el = scrollerRef.current;
    const target = el?.querySelector<HTMLElement>("[data-active]");
    if (!el || !target) return;
    const to = focusOffset(target, el);
    if (animated) animateScrollTop(el, to);
    else el.scrollTop = Math.max(0, to);
  }, []);

  // Виден ли текущий блок. IntersectionObserver (Safari 12.1+) вместо подсчёта
  // на каждый scroll — main thread A10 свободен во время прокрутки.
  useEffect(() => {
    const el = scrollerRef.current;
    const target = el?.querySelector<HTMLElement>("[data-active]");
    if (!el || !target || !isToday) {
      setChip((c) => (c.visible ? { ...c, visible: false } : c));
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        const rootTop = entry.rootBounds ? entry.rootBounds.top : el.getBoundingClientRect().top;
        setChip({
          visible: !entry.isIntersecting,
          direction: entry.boundingClientRect.top < rootTop ? "up" : "down",
        });
      },
      { root: el, threshold: 0 }
    );
    io.observe(target);
    return () => io.disconnect();
  }, [isToday, flow, nowKey]);

  // Автовозврат: 45 с без касаний — лента мягко доезжает до «сейчас»;
  // при возвращении в приложение — сразу, без анимации.
  const lastTouch = useRef(Date.now());
  const chipVisible = useRef(false);
  chipVisible.current = chip.visible;
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !isToday) return;
    const touched = () => {
      lastTouch.current = Date.now();
    };
    el.addEventListener("touchstart", touched, { passive: true });
    el.addEventListener("wheel", touched, { passive: true });
    el.addEventListener("pointerdown", touched, { passive: true });
    const timer = setInterval(() => {
      if (document.hidden || sheetOpen || !chipVisible.current) return;
      if (Date.now() - lastTouch.current > AUTO_RETURN_MS) {
        lastTouch.current = Date.now();
        scrollToNow(true);
      }
    }, 5000);
    const onVisible = () => {
      if (!document.hidden && !sheetOpen) {
        lastTouch.current = Date.now();
        scrollToNow(false);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      el.removeEventListener("touchstart", touched);
      el.removeEventListener("wheel", touched);
      el.removeEventListener("pointerdown", touched);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isToday, sheetOpen, scrollToNow]);

  const first = dayTasks.length ? flow[0] : null;
  const firstStart = first && first.kind === "task" ? first.task.start : null;
  const lastEnd = dayTasks.reduce((m, t) => Math.max(m, t.start + t.duration), 0);

  return (
    <>
      <NowChip
        visible={isToday && chip.visible && !sheetOpen}
        direction={chip.direction}
        label={chipLabel}
        onClick={() => {
          lastTouch.current = Date.now();
          scrollToNow(true);
        }}
      />
      <div ref={scrollerRef} className="scroll-touch relative min-h-0 flex-1 overflow-y-auto">
        <div className="px-3 pb-[132px] pt-4">
          {/* Сегодня до первого блока — окно «сейчас» */}
          {now !== null && firstStart !== null && now < firstStart && (
            <GapRow start={Math.floor(now)} end={firstStart} now={now} onAdd={onAdd} />
          )}

          {flow.map((item, i) => {
            if (item.kind === "gap") {
              return <GapRow key={"gap-" + item.start} start={item.start} end={item.end} now={now} onAdd={onAdd} />;
            }
            const { task } = item;
            const next = flow[i + 1];
            const end = task.start + task.duration;
            const progress =
              now !== null && now >= task.start && now < end ? (now - task.start) / task.duration : null;
            return (
              <TaskRow
                key={task.id}
                task={task}
                progress={progress}
                past={now !== null && end <= now}
                nowMinute={progress !== null ? now : null}
                showEnd={!(next && next.kind === "task" && next.joined)}
                overlaps={item.overlaps}
                projectName={task.projectId ? projectNames[task.projectId] ?? null : null}
                dimmed={activeProjectId !== null && task.projectId !== activeProjectId}
                onOpen={onOpen}
                onToggle={toggleTask}
                onMove={onMove}
              listProgress={task.listId ? listProgress[task.listId] ?? null : null}
              onOpenList={onOpenList}
              />
            );
          })}

          {/* Хвост нити: после последнего блока */}
          {now !== null && dayTasks.length > 0 && now >= lastEnd && now < DAY_END && (
            <GapRow start={lastEnd} end={DAY_END} now={now} onAdd={onAdd} />
          )}

          <button
            type="button"
            onClick={() => onAdd(dayTasks.length ? Math.min(lastEnd, DAY_END - 15) : now !== null ? Math.ceil(now / 5) * 5 : DEFAULT_START)}
            className="flow-row relative flex h-14 w-full items-center text-left"
          >
            <span className="spine spine-fade" />
            <span className="w-[42px] shrink-0 text-right text-[11px] tabular-nums text-faint">
              {dayTasks.length ? formatClock(Math.min(lastEnd, DAY_END)) : ""}
            </span>
            <span className="relative z-[1] flex w-[62px] shrink-0 justify-center">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-faint bg-milk text-muted">
                <Icon name="plus" size={16} strokeWidth={2} />
              </span>
            </span>
            <span className="text-[14px] text-muted">
              {dayTasks.length ? "Добавить блок" : "День пуст — добавьте первый блок"}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
