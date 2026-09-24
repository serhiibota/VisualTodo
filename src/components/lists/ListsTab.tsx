"use client";

import { Icon } from "@/components/ui/Icon";
import { LIST_KIND, listSummary } from "@/lib/lists";
import { usePlannerStore } from "@/store/usePlannerStore";
import { NewListForm } from "./NewListForm";

/**
 * Раздел «Списки и заметки»: сначала создание, под ним — свёрнутый перечень
 * «Все списки и заметки». Раскрытие хранит шторка, чтобы после возврата
 * из списка перечень остался открытым.
 */
export function ListsTab({
  onOpen,
  expanded,
  onToggle,
}: {
  onOpen: (id: string) => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  const lists = usePlannerStore((s) => s.lists);
  const addList = usePlannerStore((s) => s.addList);

  return (
    <div>
      <p className="-mt-1 mb-3 text-[13px] leading-5 text-muted">
        Чеклисты, покупки и заметки. Любой можно прикрепить к блоку в его редакторе — он откроется прямо с ленты.
      </p>

      <NewListForm
        placeholder="Новый: например, «Продукты» или «Идеи»"
        onCreate={(t, kind) => onOpen(addList(t, kind))}
      />

      {lists.length > 0 && (
        <>
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            className="mt-4 flex w-full items-center justify-between rounded-2xl px-1 py-2 text-left"
          >
            <span className="text-[15px] font-medium text-ink">
              Все списки и заметки <span className="tabular-nums text-muted">· {lists.length}</span>
            </span>
            <Icon
              name="chevronDown"
              size={18}
              className="shrink-0 text-muted transition-transform duration-200"
              style={{ transform: expanded ? "rotate(180deg)" : "none" }}
            />
          </button>

          {expanded && (
            <ul className="mt-1 overflow-hidden rounded-2xl bg-hover">
              {lists.map((l, i) => (
                <li key={l.id} className={i ? "border-t border-line" : ""}>
                  <button
                    type="button"
                    onClick={() => onOpen(l.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-line"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper text-graphite">
                      <Icon name={LIST_KIND[l.kind].icon} size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[16px] font-semibold text-ink">{l.title}</span>
                      <span className="block truncate text-[12px] tabular-nums text-muted">
                        {LIST_KIND[l.kind].label.toLowerCase()} · {listSummary(l)}
                      </span>
                    </span>
                    <Icon name="chevronRight" size={16} className="shrink-0 text-faint" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
