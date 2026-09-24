"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { usePlannerStore } from "@/store/usePlannerStore";
import type { ListItem, TaskList } from "@/store/types";

/**
 * Один список. Быстрое добавление сверху (Enter — и сразу следующий пункт,
 * клавиатура не прячется). В режиме «покупки» отмеченное уезжает вниз
 * в «В корзине» и очищается одной кнопкой — список переиспользуется.
 */
export function ListDetail({ list, onBack }: { list: TaskList; onBack: () => void }) {
  const { addListItem, updateList, removeList, clearDoneItems } = usePlannerStore.getState();
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const shopping = list.kind === "shopping";

  const add = () => {
    const t = text.trim();
    if (!t) return;
    addListItem(list.id, t);
    setText("");
    inputRef.current?.focus();
  };

  const open = list.items.filter((it) => !it.done);
  const done = list.items.filter((it) => it.done);

  return (
    <div>
      <button type="button" onClick={onBack} className="-ml-1 mb-2 flex items-center gap-1 text-[14px] text-muted">
        <Icon name="chevronLeft" size={16} /> Все списки
      </button>

      <input
        value={list.title}
        onChange={(e) => updateList(list.id, { title: e.target.value })}
        onBlur={(e) => !e.target.value.trim() && updateList(list.id, { title: "Без названия" })}
        className="w-full bg-transparent text-[22px] font-semibold tracking-[-0.01em] text-ink"
      />

      <div className="mt-2 grid grid-cols-2 gap-1 rounded-2xl bg-hover p-1">
        {(["check", "shopping"] as const).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={list.kind === k}
            onClick={() => updateList(list.id, { kind: k })}
            className={
              "flex h-8 items-center justify-center gap-1.5 rounded-xl text-[13px] transition-colors duration-200 " +
              (list.kind === k ? "bg-paper font-medium text-ink shadow-[0_1px_3px_rgb(var(--c-shade)/0.12)]" : "text-muted")
            }
          >
            <Icon name={k === "shopping" ? "cart" : "listCheck"} size={14} />
            {k === "shopping" ? "Покупки" : "Чеклист"}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-2xl bg-hover pl-4 pr-1.5">
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={shopping ? "Что купить?" : "Добавить пункт"}
          enterKeyHint="enter"
          className="h-12 min-w-0 flex-1 bg-transparent text-[16px] text-ink placeholder:text-faint"
        />
        <button
          type="button"
          onClick={add}
          disabled={!text.trim()}
          aria-label="Добавить пункт"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-milk disabled:opacity-25"
        >
          <Icon name="plus" size={18} strokeWidth={2} />
        </button>
      </div>

      {/* В чеклисте порядок не меняется; в покупках отмеченное уходит вниз */}
      <ul className="mt-3">
        {(shopping ? open : list.items).map((it) => (
          <ItemRow key={it.id} list={list} item={it} />
        ))}
      </ul>

      {shopping && done.length > 0 && (
        <>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              В корзине · {done.length}
            </span>
            <button type="button" onClick={() => clearDoneItems(list.id)} className="text-[13px] text-accent">
              Очистить
            </button>
          </div>
          <ul className="mt-1">
            {done.map((it) => (
              <ItemRow key={it.id} list={list} item={it} />
            ))}
          </ul>
        </>
      )}

      {!shopping && done.length > 0 && (
        <button type="button" onClick={() => clearDoneItems(list.id)} className="mt-3 text-[13px] text-accent">
          Убрать выполненные ({done.length})
        </button>
      )}

      {list.items.length === 0 && (
        <p className="py-6 text-center text-[14px] text-muted">
          {shopping ? "Список пуст — добавляйте по одному слову." : "Пока пусто."}
        </p>
      )}

      <button
        type="button"
        onClick={() => {
          if (window.confirm("Удалить список «" + list.title + "»?")) {
            removeList(list.id);
            onBack();
          }
        }}
        className="mt-6 text-[13px] text-danger"
      >
        Удалить список
      </button>
    </div>
  );
}

function ItemRow({ list, item }: { list: TaskList; item: ListItem }) {
  const { updateListItem, removeListItem, listItemToInbox } = usePlannerStore.getState();
  return (
    <li className="flex items-center gap-3 border-b border-line">
      <button
        type="button"
        role="checkbox"
        aria-checked={item.done}
        aria-label={item.title}
        onClick={() => updateListItem(list.id, item.id, { done: !item.done })}
        className="tap-expand relative flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border-[1.5px] border-graphite"
        style={item.done ? { backgroundColor: "rgb(var(--c-strong))", borderColor: "rgb(var(--c-strong))" } : undefined}
      >
        {item.done && <Icon name="check" size={14} strokeWidth={2.6} className="text-milk" />}
      </button>
      <input
        value={item.title}
        onChange={(e) => updateListItem(list.id, item.id, { title: e.target.value })}
        onBlur={(e) => !e.target.value.trim() && removeListItem(list.id, item.id)}
        className={"h-12 min-w-0 flex-1 bg-transparent text-[16px] " + (item.done ? "text-faint line-through" : "text-ink")}
      />
      {list.kind === "check" && !item.done && (
        <button
          type="button"
          aria-label={"«" + item.title + "» во входящие"}
          onClick={() => listItemToInbox(list.id, item.id)}
          className="tap-expand relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted active:bg-line"
        >
          <Icon name="arrowRight" size={15} />
        </button>
      )}
      <button
        type="button"
        aria-label={"Удалить «" + item.title + "»"}
        onClick={() => removeListItem(list.id, item.id)}
        className="tap-expand relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted active:bg-line"
      >
        <Icon name="close" size={14} />
      </button>
    </li>
  );
}
