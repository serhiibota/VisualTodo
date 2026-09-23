"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { uid } from "@/lib/id";
import type { Subtask } from "@/store/types";

interface SubtasksEditorProps {
  subtasks: Subtask[];
  color: string;
  onChange: (subtasks: Subtask[]) => void;
}

export function SubtasksEditor({ subtasks, color, onChange }: SubtasksEditorProps) {
  const [text, setText] = useState("");

  const add = () => {
    const title = text.trim();
    if (!title) return;
    onChange([...subtasks, { id: uid(), title, done: false }]);
    setText("");
  };

  const update = (id: string, p: Partial<Subtask>) =>
    onChange(subtasks.map((st) => (st.id === id ? { ...st, ...p } : st)));

  return (
    <ul className="overflow-hidden rounded-2xl bg-hover">
      {subtasks.map((st) => (
        <li key={st.id} className="flex items-center gap-3 border-b border-line px-4">
          <button
            type="button"
            role="checkbox"
            aria-checked={st.done}
            aria-label="Выполнено"
            onClick={() => update(st.id, { done: !st.done })}
            className="tap-expand relative flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
            style={{ border: "1.5px solid " + color, backgroundColor: st.done ? color : "transparent" }}
          >
            {st.done && <Icon name="check" size={13} strokeWidth={2.6} className="text-white" />}
          </button>
          <input
            value={st.title}
            onChange={(e) => update(st.id, { title: e.target.value })}
            className={"h-11 min-w-0 flex-1 bg-transparent text-[16px] " + (st.done ? "text-faint line-through" : "text-ink")}
          />
          <button
            type="button"
            aria-label="Удалить подзадачу"
            onClick={() => onChange(subtasks.filter((x) => x.id !== st.id))}
            className="tap-expand relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted"
          >
            <Icon name="close" size={14} />
          </button>
        </li>
      ))}
      <li className="flex items-center gap-3 px-4">
        <Icon name="plus" size={18} className="shrink-0 text-muted" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          onBlur={add}
          placeholder="Добавить шаг"
          enterKeyHint="done"
          className="h-11 min-w-0 flex-1 bg-transparent text-[16px] text-ink placeholder:text-faint"
        />
      </li>
    </ul>
  );
}
