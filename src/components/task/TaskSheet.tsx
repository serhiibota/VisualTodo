"use client";

import { useEffect, useState } from "react";
import { BottomSheet } from "@/components/sheet/BottomSheet";
import { Icon } from "@/components/ui/Icon";
import { DAY_END } from "@/lib/constants";
import { PALETTE } from "@/lib/palette";
import { formatClock, formatDuration, parseClock } from "@/lib/time";
import { usePlannerStore } from "@/store/usePlannerStore";
import type { SheetState, TaskDraft } from "@/store/types";
import { DurationPicker } from "./DurationPicker";
import { LinksEditor } from "./LinksEditor";

const Label = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{children}</div>
);

type TaskSheetState = Extract<SheetState, { kind: "task" }>;

export function TaskSheet() {
  const sheet = usePlannerStore((s) => s.sheet);
  const closeSheet = usePlannerStore((s) => s.closeSheet);
  const open = sheet?.kind === "task";

  // Держим последнее состояние, чтобы форма не исчезала во время анимации закрытия.
  const [current, setCurrent] = useState<TaskSheetState | null>(open ? sheet : null);
  if (open && sheet !== current) setCurrent(sheet);

  return (
    <BottomSheet open={open} onClose={closeSheet} title={current && !current.taskId ? "Новый блок" : "Блок"}>
      {current && <TaskForm key={current.taskId ?? "new-" + (current.start ?? 0)} sheet={current} />}
    </BottomSheet>
  );
}

function TaskForm({ sheet }: { sheet: TaskSheetState }) {
  const tasks = usePlannerStore((s) => s.tasks);
  const tags = usePlannerStore((s) => s.tags);
  const projects = usePlannerStore((s) => s.projects);
  const selectedDate = usePlannerStore((s) => s.selectedDate);
  const activeProjectId = usePlannerStore((s) => s.activeProjectId);
  const { addTask, updateTask, removeTask, closeSheet } = usePlannerStore.getState();

  const taskId = sheet.taskId;
  const existing = taskId ? tasks[taskId] : undefined;

  const [draft, setDraft] = useState<TaskDraft>(() =>
    existing
      ? { ...existing }
      : {
          title: "",
          date: selectedDate,
          start: sheet.start ?? 9 * 60,
          duration: 60,
          description: "",
          links: [],
          tagIds: [],
          projectId: activeProjectId,
          done: false,
        }
  );

  // Задачу удалили извне — закрываемся
  useEffect(() => {
    if (taskId && !existing && usePlannerStore.getState().sheet?.kind === "task") closeSheet();
  }, [taskId, existing, closeSheet]);

  const patch = (p: Partial<TaskDraft>) => setDraft((d) => ({ ...d, ...p }));
  const maxDuration = DAY_END - draft.start;
  const canSave = draft.title.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    const clean: TaskDraft = {
      ...draft,
      title: draft.title.trim(),
      duration: Math.max(5, Math.min(draft.duration, maxDuration)),
    };
    if (taskId) updateTask(taskId, clean);
    else addTask(clean);
    closeSheet();
  };

  const remove = () => {
    if (!taskId) return;
    if (window.confirm("Удалить «" + draft.title + "»?")) {
      removeTask(taskId);
      closeSheet();
    }
  };

  const toggleTag = (id: string) =>
    patch({ tagIds: draft.tagIds.includes(id) ? draft.tagIds.filter((t) => t !== id) : [...draft.tagIds, id] });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <input
        value={draft.title}
        onChange={(e) => patch({ title: e.target.value })}
        placeholder="Что планируете?"
        enterKeyHint="done"
        className="mt-1 w-full border-b border-line bg-transparent pb-2 text-[20px] font-semibold tracking-[-0.01em] text-ink placeholder:font-normal placeholder:text-faint"
      />

      {taskId && (
        <button
          type="button"
          onClick={() => patch({ done: !draft.done })}
          className={
            "mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-medium transition-colors duration-200 " +
            (draft.done ? "bg-ink text-milk" : "bg-hover text-graphite")
          }
        >
          <Icon name="check" size={18} strokeWidth={2} />
          {draft.done ? "Выполнено" : "Отметить выполненным"}
        </button>
      )}

      <Label>Время</Label>
      <div className="flex items-center gap-3">
        <label className="flex h-11 flex-1 items-center justify-between rounded-2xl bg-hover px-4">
          <span className="text-[13px] text-muted">Начало</span>
          <input
            type="time"
            step={300}
            value={formatClock(draft.start)}
            onChange={(e) => {
              const v = parseClock(e.target.value);
              if (v !== null) patch({ start: v, duration: Math.min(draft.duration, DAY_END - v) });
            }}
            className="bg-transparent text-right text-[16px] font-semibold tabular-nums text-ink"
          />
        </label>
        <div className="flex h-11 flex-1 items-center justify-between rounded-2xl bg-hover px-4">
          <span className="text-[13px] text-muted">Конец</span>
          <span className="text-[16px] font-semibold tabular-nums text-ink">
            {formatClock(Math.min(draft.start + draft.duration, DAY_END))}
          </span>
        </div>
      </div>

      <Label>Длительность · {formatDuration(draft.duration)}</Label>
      <DurationPicker value={draft.duration} max={maxDuration} onChange={(duration) => patch({ duration })} />

      {projects.length > 0 && (
        <>
          <Label>Проект</Label>
          <div className="flex flex-wrap gap-1.5">
            <Chip on={draft.projectId === null} onClick={() => patch({ projectId: null })}>
              Без проекта
            </Chip>
            {projects.map((p) => (
              <Chip key={p.id} on={draft.projectId === p.id} dot={PALETTE[p.color].accent} onClick={() => patch({ projectId: p.id })}>
                {p.name}
              </Chip>
            ))}
          </div>
        </>
      )}

      {tags.length > 0 && (
        <>
          <Label>Теги</Label>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <Chip key={t.id} on={draft.tagIds.includes(t.id)} dot={PALETTE[t.color].accent} onClick={() => toggleTag(t.id)}>
                {t.name}
              </Chip>
            ))}
          </div>
        </>
      )}

      <Label>Описание</Label>
      <textarea
        value={draft.description}
        onChange={(e) => patch({ description: e.target.value })}
        placeholder="Детали, чек-лист, мысли…"
        rows={3}
        className="w-full resize-none rounded-2xl bg-hover px-4 py-3 text-[16px] leading-6 text-ink placeholder:text-faint"
      />

      <Label>Ресурсы</Label>
      <LinksEditor links={draft.links} onChange={(links) => patch({ links })} />

      {/* sticky (iOS 13+) — кнопка сохранения всегда под пальцем, даже на 4.7" */}
      <div className="sticky bottom-0 -mx-5 mt-6 flex gap-2 bg-paper px-5 pb-1 pt-2">
        {taskId && (
          <button
            type="button"
            onClick={remove}
            aria-label="Удалить"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-hover text-[#A0524A] active:bg-line"
          >
            <Icon name="trash" size={20} />
          </button>
        )}
        <button
          type="submit"
          disabled={!canSave}
          className="h-12 flex-1 rounded-2xl bg-ink text-[16px] font-semibold text-milk transition-opacity duration-200 disabled:opacity-30"
        >
          {taskId ? "Сохранить" : "Добавить в план"}
        </button>
      </div>
    </form>
  );
}

function Chip({
  on,
  dot,
  onClick,
  children,
}: {
  on: boolean;
  dot?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={
        "flex h-9 max-w-full items-center gap-1.5 rounded-full px-3.5 text-[14px] transition-colors duration-200 " +
        (on ? "bg-ink text-milk" : "bg-hover text-graphite")
      }
    >
      {dot && <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: dot }} />}
      <span className="truncate">{children}</span>
    </button>
  );
}
