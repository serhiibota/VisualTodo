"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { usePlannerStore } from "@/store/usePlannerStore";
import type { TaskList } from "@/store/types";

/** Обзор списков + создание нового. */
export function ListsTab({ onOpen }: { onOpen: (id: string) => void }) {
  const lists = usePlannerStore((s) => s.lists);
  const addList = usePlannerStore((s) => s.addList);
  const [title, setTitle] = useState("");

  const create = (kind: TaskList["kind"]) => {
    const t = title.trim();
    if (!t) return;
    const id = addList(t, kind);
    setTitle("");
    onOpen(id);
  };

  return (
    <div>
      <p className="-mt-1 mb-3 text-[13px] leading-5 text-muted">
        То, что живёт дольше одного дня. Список можно прикрепить к блоку — он откроется прямо с ленты.
      </p>

      {lists.length > 0 && (
        <ul className="overflow-hidden rounded-2xl bg-hover">
          {lists.map((l, i) => {
            const done = l.items.filter((it) => it.done).length;
            return (
              <li key={l.id} className={i ? "border-t border-line" : ""}>
                <button
                  type="button"
                  onClick={() => onOpen(l.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-line"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper text-graphite">
                    <Icon name={l.kind === "shopping" ? "cart" : "listCheck"} size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[16px] font-semibold text-ink">{l.title}</span>
                    <span className="block text-[12px] tabular-nums text-muted">
                      {l.kind === "shopping" ? "покупки" : "чеклист"} ·{" "}
                      {l.items.length ? done + " из " + l.items.length : "пусто"}
                    </span>
                  </span>
                  <Icon name="chevronRight" size={16} className="shrink-0 text-faint" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-3 rounded-2xl bg-hover">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              create("check");
            }
          }}
          placeholder="Новый список"
          enterKeyHint="done"
          className="h-12 w-full bg-transparent px-4 text-[16px] text-ink placeholder:text-faint"
        />
        {title.trim() && (
          <div className="flex gap-1.5 border-t border-line px-2 py-2">
            <button
              type="button"
              onClick={() => create("check")}
              className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-paper text-[14px] text-graphite"
            >
              <Icon name="listCheck" size={16} /> Чеклист
            </button>
            <button
              type="button"
              onClick={() => create("shopping")}
              className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-paper text-[14px] text-graphite"
            >
              <Icon name="cart" size={16} /> Покупки
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
