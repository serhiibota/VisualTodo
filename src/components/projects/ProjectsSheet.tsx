"use client";

import { useMemo, useState } from "react";
import { BottomSheet } from "@/components/sheet/BottomSheet";
import { Icon } from "@/components/ui/Icon";
import { COLOR_KEYS, PALETTE } from "@/lib/palette";
import { pluralRu } from "@/lib/time";
import { usePlannerStore } from "@/store/usePlannerStore";
import type { ColorKey } from "@/store/types";

export function ProjectsSheet() {
  const open = usePlannerStore((s) => s.sheet?.kind === "projects");
  const closeSheet = usePlannerStore((s) => s.closeSheet);

  return (
    <BottomSheet open={open} onClose={closeSheet} title="Проекты и теги">
      <ProjectsSection />
      <TagsSection />
      <div className="h-4" />
    </BottomSheet>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{children}</div>;
}

function ProjectsSection() {
  const projects = usePlannerStore((s) => s.projects);
  const tasks = usePlannerStore((s) => s.tasks);
  const activeProjectId = usePlannerStore((s) => s.activeProjectId);
  const { addProject, updateProject, removeProject, setActiveProject, closeSheet } = usePlannerStore.getState();

  const counts = useMemo(() => {
    const map: Record<string, { total: number; done: number }> = {};
    for (const id in tasks) {
      const t = tasks[id];
      if (!t.projectId) continue;
      const c = (map[t.projectId] ??= { total: 0, done: 0 });
      c.total++;
      if (t.done) c.done++;
    }
    return map;
  }, [tasks]);

  return (
    <>
      <SectionTitle>Проекты</SectionTitle>
      <p className="-mt-1 mb-3 text-[13px] leading-5 text-muted">
        Нажмите на проект, чтобы подсветить его блоки на таймлайне.
      </p>
      <ul className="overflow-hidden rounded-2xl bg-hover">
        {projects.map((p, i) => {
          const c = counts[p.id] ?? { total: 0, done: 0 };
          const active = activeProjectId === p.id;
          return (
            <li key={p.id} className={"flex items-center gap-3 px-4 py-2 " + (i ? "border-t border-line" : "")}>
              <ColorDot color={p.color} onChange={(color) => updateProject(p.id, { color })} />
              <RenameInput value={p.name} onCommit={(name) => updateProject(p.id, { name })} />
              <button
                type="button"
                onClick={() => {
                  setActiveProject(active ? null : p.id);
                  closeSheet();
                }}
                className={
                  "h-8 shrink-0 rounded-full px-3 text-[12px] tabular-nums " +
                  (active ? "bg-ink text-milk" : "bg-paper text-graphite")
                }
              >
                {c.done}/{c.total} {pluralRu(c.total, "блок", "блока", "блоков")}
              </button>
              <DeleteButton
                label={"Удалить проект «" + p.name + "»? Задачи останутся без проекта."}
                onConfirm={() => removeProject(p.id)}
              />
            </li>
          );
        })}
        <AddRow placeholder="Новый проект" onAdd={addProject} bordered={projects.length > 0} />
      </ul>
    </>
  );
}

function TagsSection() {
  const tags = usePlannerStore((s) => s.tags);
  const { addTag, updateTag, removeTag } = usePlannerStore.getState();

  return (
    <>
      <SectionTitle>Теги</SectionTitle>
      <ul className="overflow-hidden rounded-2xl bg-hover">
        {tags.map((t, i) => (
          <li key={t.id} className={"flex items-center gap-3 px-4 py-2 " + (i ? "border-t border-line" : "")}>
            <ColorDot color={t.color} onChange={(color) => updateTag(t.id, { color })} />
            <RenameInput value={t.name} onCommit={(name) => updateTag(t.id, { name })} />
            <DeleteButton label={"Удалить тег «" + t.name + "»?"} onConfirm={() => removeTag(t.id)} />
          </li>
        ))}
        <AddRow placeholder="Новый тег" onAdd={addTag} bordered={tags.length > 0} />
      </ul>
    </>
  );
}

/** Точка цвета: тап переключает на следующий цвет палитры. */
function ColorDot({ color, onChange }: { color: ColorKey; onChange: (c: ColorKey) => void }) {
  const next = COLOR_KEYS[(COLOR_KEYS.indexOf(color) + 1) % COLOR_KEYS.length];
  return (
    <button
      type="button"
      aria-label={"Цвет: " + PALETTE[color].label + ". Сменить"}
      onClick={() => onChange(next)}
      className="tap-expand relative h-5 w-5 shrink-0 rounded-full"
      style={{ backgroundColor: PALETTE[color].tint, boxShadow: "inset 0 0 0 5px " + PALETTE[color].solid }}
    />
  );
}

function RenameInput({ value, onCommit }: { value: string; onCommit: (v: string) => void }) {
  const [text, setText] = useState(value);
  return (
    <input
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        const v = text.trim();
        if (v && v !== value) onCommit(v);
        else setText(value);
      }}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      className="h-9 min-w-0 flex-1 bg-transparent text-[16px] text-ink"
    />
  );
}

function DeleteButton({ label, onConfirm }: { label: string; onConfirm: () => void }) {
  return (
    <button
      type="button"
      aria-label="Удалить"
      onClick={() => window.confirm(label) && onConfirm()}
      className="tap-expand relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted active:bg-line"
    >
      <Icon name="trash" size={16} />
    </button>
  );
}

function AddRow({
  placeholder,
  onAdd,
  bordered,
}: {
  placeholder: string;
  onAdd: (name: string, color: ColorKey) => void;
  bordered: boolean;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<ColorKey>("sage");

  const submit = () => {
    const v = name.trim();
    if (!v) return;
    onAdd(v, color);
    setName("");
    setColor(COLOR_KEYS[(COLOR_KEYS.indexOf(color) + 1) % COLOR_KEYS.length]);
  };

  return (
    <li className={"flex items-center gap-3 px-4 py-2 " + (bordered ? "border-t border-line" : "")}>
      <ColorDot color={color} onChange={setColor} />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        enterKeyHint="done"
        className="h-9 min-w-0 flex-1 bg-transparent text-[16px] text-ink placeholder:text-faint"
      />
      <button
        type="button"
        onClick={submit}
        disabled={!name.trim()}
        aria-label="Добавить"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-milk disabled:opacity-25"
      >
        <Icon name="plus" size={16} strokeWidth={2} />
      </button>
    </li>
  );
}
