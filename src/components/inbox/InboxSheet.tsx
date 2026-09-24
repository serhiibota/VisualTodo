"use client";

import { useMemo, useState } from "react";
import { BottomSheet } from "@/components/sheet/BottomSheet";
import { ListDetail } from "@/components/lists/ListDetail";
import { ListsTab } from "@/components/lists/ListsTab";
import { TaskPill } from "@/components/timeline/TaskPill";
import { Icon } from "@/components/ui/Icon";
import { COLOR_KEYS, PALETTE } from "@/lib/palette";
import { findFreeSlot } from "@/lib/flow";
import { guessIcon } from "@/lib/taskIcons";
import { formatClock, formatDayMonth, formatDuration, minutesNow, todayKey } from "@/lib/time";
import { usePlannerStore } from "@/store/usePlannerStore";
import type { Task } from "@/store/types";

/**
 * Хранилища вне дня: «Входящие» (задачи без времени) и «Списки».
 * Одна кнопка в шапке — две вкладки: на 375px в шапке больше нет места.
 */
export function InboxSheet() {
  const sheet = usePlannerStore((s) => s.sheet);
  const lists = usePlannerStore((s) => s.lists);
  const closeSheet = usePlannerStore((s) => s.closeSheet);
  const open = sheet?.kind === "inbox" || sheet?.kind === "list";

  const [tab, setTab] = useState<"inbox" | "lists">("inbox");
  const [listId, setListId] = useState<string | null>(null);
  // Синхронизация с тем, как открыли шторку: «Входящие», вкладка «Списки» или конкретный список
  const [openedWith, setOpenedWith] = useState(sheet);
  if (open && sheet !== openedWith) {
    setOpenedWith(sheet);
    if (sheet?.kind === "list") {
      setTab("lists");
      setListId(sheet.listId);
    } else if (sheet?.kind === "inbox") {
      setTab(sheet.tab ?? "inbox");
      setListId(null);
    }
  }

  const list = listId ? lists.find((l) => l.id === listId) : undefined;
  const title = tab === "inbox" ? "Входящие" : list ? "Список" : "Списки";

  return (
    <BottomSheet open={open} onClose={closeSheet} title={title}>
      {!list && (
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-2xl bg-hover p-1">
          {(
            [
              ["inbox", "Входящие"],
              ["lists", "Списки"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={tab === key}
              onClick={() => setTab(key)}
              className={
                "h-9 rounded-xl text-[14px] transition-colors duration-200 " +
                (tab === key ? "bg-paper font-medium text-ink shadow-[0_1px_3px_rgb(var(--c-shade)/0.12)]" : "text-muted")
              }
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {tab === "inbox" && <InboxContent />}
      {tab === "lists" && !list && <ListsTab onOpen={setListId} />}
      {tab === "lists" && list && <ListDetail list={list} onBack={() => setListId(null)} />}
    </BottomSheet>
  );
}

function InboxContent() {
  const tasks = usePlannerStore((s) => s.tasks);
  const lists = usePlannerStore((s) => s.lists);
  const listTitles = useMemo(() => Object.fromEntries(lists.map((l) => [l.id, l.title])), [lists]);
  const selectedDate = usePlannerStore((s) => s.selectedDate);
  const { addTask, scheduleTask, openSheet } = usePlannerStore.getState();
  const [title, setTitle] = useState("");
  const [lastPlaced, setLastPlaced] = useState<string | null>(null);

  const { inbox, day } = useMemo(() => {
    const inbox: Task[] = [];
    const day: Task[] = [];
    for (const id in tasks) {
      const t = tasks[id];
      if (t.date === null) inbox.push(t);
      else if (t.date === selectedDate) day.push(t);
    }
    inbox.sort((a, b) => Number(a.done) - Number(b.done));
    return { inbox, day };
  }, [tasks, selectedDate]);

  const quickAdd = () => {
    const t = title.trim();
    if (!t) return;
    addTask({
      title: t,
      date: null,
      start: 0,
      duration: 30,
      icon: guessIcon(t),
      color: COLOR_KEYS[inbox.length % COLOR_KEYS.length],
      description: "",
      subtasks: [],
      links: [],
      tagIds: [],
      projectId: null,
      done: false,
    });
    setTitle("");
  };

  const place = (task: Task) => {
    const { from: dayFrom } = usePlannerStore.getState().dayBounds;
    const from = selectedDate === todayKey() ? Math.max(minutesNow(), dayFrom) : dayFrom;
    const start = findFreeSlot(day, task.duration, from);
    scheduleTask(task.id, selectedDate, start);
    setLastPlaced(task.title + " → " + formatClock(start));
  };

  return (
    <div>
      <p className="-mt-1 mb-3 text-[13px] leading-5 text-muted">
        Задачи без времени. «+» поставит задачу в первое свободное окно на {formatDayMonth(selectedDate)}.
      </p>

      <div className="flex items-center gap-2 rounded-2xl bg-hover pl-4 pr-1.5">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              quickAdd();
            }
          }}
          placeholder="Быстро записать задачу"
          enterKeyHint="done"
          className="h-12 min-w-0 flex-1 bg-transparent text-[16px] text-ink placeholder:text-faint"
        />
        <button
          type="button"
          onClick={quickAdd}
          disabled={!title.trim()}
          aria-label="Добавить во входящие"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-milk disabled:opacity-25"
        >
          <Icon name="plus" size={18} strokeWidth={2} />
        </button>
      </div>

      {lastPlaced && (
        <p className="mt-3 text-[13px] text-muted">
          Запланировано: <span className="text-ink">{lastPlaced}</span>
        </p>
      )}

      <ul className="mt-3">
        {inbox.map((task) => {
          const swatch = PALETTE[task.color] ?? PALETTE.mist;
          return (
            <li key={task.id} className="flex items-center gap-3 border-b border-line py-2.5 last:border-0">
              <button
                type="button"
                onClick={() => openSheet({ kind: "task", taskId: task.id })}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <TaskPill icon={task.icon} swatch={swatch} height={46} fill={task.done ? 1 : 0} />
                <span className="min-w-0">
                  <span className="block text-[12px] text-muted">
                    {formatDuration(task.duration)}
                    {task.listId && listTitles[task.listId] ? " · список «" + listTitles[task.listId] + "»" : ""}
                  </span>
                  <span className={"block truncate text-[16px] font-semibold " + (task.done ? "text-faint line-through" : "text-ink")}>
                    {task.title}
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => place(task)}
                aria-label={"Запланировать «" + task.title + "»"}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: swatch.tint, color: swatch.ink }}
              >
                <Icon name="plus" size={20} strokeWidth={2} />
              </button>
            </li>
          );
        })}
      </ul>

      {inbox.length === 0 && (
        <p className="py-8 text-center text-[14px] text-muted">Пусто. Всё распланировано.</p>
      )}
    </div>
  );
}
