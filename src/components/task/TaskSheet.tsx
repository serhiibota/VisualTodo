"use client";

import { useEffect, useState } from "react";
import { BottomSheet } from "@/components/sheet/BottomSheet";
import { Icon } from "@/components/ui/Icon";
import { TaskPill } from "@/components/timeline/TaskPill";
import { TaskIcon } from "@/components/ui/TaskIcon";
import { DAY_END, DEFAULT_START, pillHeight } from "@/lib/constants";
import { COLOR_KEYS, PALETTE } from "@/lib/palette";
import { guessIcon, TASK_ICON_KEYS } from "@/lib/taskIcons";
import { formatClock, formatDuration, parseClock } from "@/lib/time";
import { usePlannerStore } from "@/store/usePlannerStore";
import type { SheetState, TaskDraft } from "@/store/types";
import { DurationPicker } from "./DurationPicker";
import { LinksEditor } from "./LinksEditor";
import { SubtasksEditor } from "./SubtasksEditor";

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
    <BottomSheet open={open} onClose={closeSheet} title={current && !current.taskId ? (current.inbox ? "Во входящие" : "Новый блок") : "Блок"}>
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
          date: sheet.inbox ? null : selectedDate,
          start: sheet.start ?? DEFAULT_START,
          duration: 30,
          icon: "dot",
          color: COLOR_KEYS[Object.keys(tasks).length % COLOR_KEYS.length],
          description: "",
          subtasks: [],
          links: [],
          tagIds: [],
          projectId: activeProjectId,
          done: false,
        }
  );
  // Иконка подбирается по названию, пока пользователь не выбрал её сам
  const [iconTouched, setIconTouched] = useState(!!existing);
  const [iconsOpen, setIconsOpen] = useState(false);

  // Задачу удалили извне — закрываемся
  useEffect(() => {
    if (taskId && !existing && usePlannerStore.getState().sheet?.kind === "task") closeSheet();
  }, [taskId, existing, closeSheet]);

  const patch = (p: Partial<TaskDraft>) => setDraft((d) => ({ ...d, ...p }));
  const inInbox = draft.date === null;
  const maxDuration = inInbox ? DAY_END : DAY_END - draft.start;
  const canSave = draft.title.trim().length > 0;
  const swatch = PALETTE[draft.color] ?? PALETTE.mist;

  const save = () => {
    if (!canSave) return;
    const clean: TaskDraft = {
      ...draft,
      title: draft.title.trim(),
      duration: Math.max(5, Math.min(draft.duration, maxDuration)),
      subtasks: draft.subtasks.filter((st) => st.title.trim()),
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
      {/* Капсула-превью + название */}
      <div className="mt-1 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIconsOpen((v) => !v)}
          aria-label="Выбрать иконку"
          className="shrink-0"
        >
          <TaskPill icon={draft.icon} swatch={swatch} height={Math.min(pillHeight(draft.duration), 84)} fill={draft.done ? 1 : 0} />
        </button>
        <input
          value={draft.title}
          onChange={(e) => {
            const title = e.target.value;
            patch(iconTouched ? { title } : { title, icon: guessIcon(title) });
          }}
          placeholder="Что планируете?"
          enterKeyHint="done"
          className="min-w-0 flex-1 border-b border-line bg-transparent pb-2 text-[20px] font-semibold tracking-[-0.01em] text-ink placeholder:font-normal placeholder:text-faint"
        />
      </div>

      {/* Цвет — всегда на виду, иконки — по тапу на капсулу */}
      <div className="mt-4 flex items-center justify-between">
        {COLOR_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            aria-label={PALETTE[key].label}
            aria-pressed={draft.color === key}
            onClick={() => patch({ color: key })}
            className="tap-expand relative flex h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: PALETTE[key].solid }}
          >
            {draft.color === key && <Icon name="check" size={16} strokeWidth={2.4} className="text-white" />}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setIconsOpen((v) => !v)}
          aria-expanded={iconsOpen}
          className="flex h-8 items-center gap-1 rounded-full bg-hover px-2.5 text-[13px] text-graphite"
        >
          <TaskIcon name={draft.icon} size={16} />
          <Icon name={iconsOpen ? "chevronUp" : "chevronDown"} size={14} />
        </button>
      </div>

      {iconsOpen && (
        <div className="mt-3 grid grid-cols-7 gap-1.5 rounded-2xl bg-hover p-2">
          {TASK_ICON_KEYS.map((key) => {
            const on = draft.icon === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={on}
                aria-label={key}
                onClick={() => {
                  patch({ icon: key });
                  setIconTouched(true);
                }}
                className="flex h-10 items-center justify-center rounded-xl text-graphite"
                style={{ backgroundColor: on ? swatch.solid : "transparent" }}
              >
                <TaskIcon name={key} size={20} color={on ? "#FFFFFF" : "currentColor"} />
              </button>
            );
          })}
        </div>
      )}

      {taskId && (
        <button
          type="button"
          onClick={() => patch({ done: !draft.done })}
          className={
            "mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-medium transition-colors duration-200 " +
            (draft.done ? "text-white" : "bg-hover text-graphite")
          }
          style={draft.done ? { backgroundColor: swatch.solid } : undefined}
        >
          <Icon name="check" size={18} strokeWidth={2} />
          {draft.done ? "Выполнено" : "Отметить выполненным"}
        </button>
      )}

      <Label>Когда</Label>
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-hover p-1">
        {[
          { on: !inInbox, label: "В плане дня", click: () => patch({ date: existing?.date ?? selectedDate }) },
          { on: inInbox, label: "Во входящие", click: () => patch({ date: null }) },
        ].map((o) => (
          <button
            key={o.label}
            type="button"
            onClick={o.click}
            aria-pressed={o.on}
            className={
              "h-9 rounded-xl text-[14px] transition-colors duration-200 " +
              (o.on ? "bg-paper font-medium text-ink shadow-[0_1px_3px_rgb(var(--c-shade)/0.12)]" : "text-muted")
            }
          >
            {o.label}
          </button>
        ))}
      </div>

      {!inInbox && (
        <div className="mt-2 flex items-center gap-2">
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
      )}

      <Label>Длительность · {formatDuration(draft.duration)}</Label>
      <DurationPicker value={draft.duration} max={maxDuration} onChange={(duration) => patch({ duration })} />

      <Label>Подзадачи</Label>
      <SubtasksEditor
        subtasks={draft.subtasks}
        color={swatch.solid}
        onChange={(subtasks) => patch({ subtasks })}
      />

      {projects.length > 0 && (
        <>
          <Label>Проект</Label>
          <div className="flex flex-wrap gap-1.5">
            <Chip on={draft.projectId === null} onClick={() => patch({ projectId: null })}>
              Без проекта
            </Chip>
            {projects.map((p) => (
              <Chip key={p.id} on={draft.projectId === p.id} dot={PALETTE[p.color].solid} onClick={() => patch({ projectId: p.id })}>
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
              <Chip key={t.id} on={draft.tagIds.includes(t.id)} dot={PALETTE[t.color].solid} onClick={() => toggleTag(t.id)}>
                {t.name}
              </Chip>
            ))}
          </div>
        </>
      )}

      <Label>Заметки</Label>
      <textarea
        value={draft.description}
        onChange={(e) => patch({ description: e.target.value })}
        placeholder="Детали, мысли…"
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
          {taskId ? "Сохранить" : inInbox ? "Во входящие" : "Добавить в план"}
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
