"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { LIST_KIND } from "@/lib/lists";
import type { TaskList } from "@/store/types";

interface NewListFormProps {
  onCreate: (title: string, kind: TaskList["kind"]) => void;
  onCancel?: () => void;
  placeholder?: string;
  /** Какие типы предлагать (в блоке — только списки: для текста у блока есть своё поле «Заметки») */
  kinds?: TaskList["kind"][];
}

/**
 * Создание списка или заметки: название и тип выбирает человек.
 * Ничего не угадываем и не создаём, пока не нажат тип; «Ввод» ничего не создаёт.
 */
export function NewListForm({
  onCreate,
  onCancel,
  placeholder = "Название",
  kinds = ["check", "shopping", "note"],
}: NewListFormProps) {
  const [title, setTitle] = useState("");
  const ready = title.trim().length > 0;

  return (
    <div className="field-shell rounded-2xl bg-hover">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
        placeholder={placeholder}
        enterKeyHint="done"
        className="h-12 w-full bg-transparent px-4 text-[16px] text-ink placeholder:text-faint"
      />
      <div className="flex gap-1.5 border-t border-line px-2 py-2">
        {kinds.map((k) => (
          <button
            key={k}
            type="button"
            disabled={!ready}
            onClick={() => {
              onCreate(title.trim(), k);
              setTitle("");
            }}
            className="flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-paper text-[14px] text-graphite transition-opacity duration-200 disabled:opacity-40"
          >
            <Icon name={LIST_KIND[k].icon} size={15} className="shrink-0" />
            <span className="truncate">{LIST_KIND[k].label}</span>
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between px-4 pb-2.5 text-[12px] text-muted">
        <span>{ready ? "Выберите тип — и готово" : "Сначала название, потом тип"}</span>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-graphite underline">
            Отмена
          </button>
        )}
      </div>
    </div>
  );
}
