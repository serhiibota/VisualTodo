"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { LIST_KIND, listSummary } from "@/lib/lists";
import { usePlannerStore } from "@/store/usePlannerStore";
import type { ListItem, TaskList } from "@/store/types";

/** textarea, растущая по содержимому: длинное название переносится, а не обрезается */
function useAutoHeight(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [value]);
  return ref;
}

/**
 * Один список или заметка. Сверху — только название и тихая строка
 * «Чеклист · 1 из 3», дальше сразу работа: поле добавления и пункты.
 * Редкие действия (смена типа, удаление) — мелко внизу.
 */
export function ListDetail({ list, onBack }: { list: TaskList; onBack: () => void }) {
  const { updateList, removeList, clearDoneItems } = usePlannerStore.getState();
  const titleRef = useAutoHeight(list.title);
  const kind = LIST_KIND[list.kind];

  return (
    <div>
      <button type="button" onClick={onBack} className="-ml-1 flex items-center gap-1 text-[14px] text-muted">
        <Icon name="chevronLeft" size={16} /> Все
      </button>

      <textarea
        ref={titleRef}
        rows={1}
        value={list.title}
        onChange={(e) => updateList(list.id, { title: e.target.value.replace(/\n/g, " ") })}
        onBlur={(e) => !e.target.value.trim() && updateList(list.id, { title: "Без названия" })}
        aria-label="Название"
        className="mt-2 block w-full resize-none overflow-hidden bg-transparent text-[22px] font-semibold leading-[28px] tracking-[-0.01em] text-ink"
      />
      <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted">
        <Icon name={kind.icon} size={14} />
        {kind.label}
        {list.kind !== "note" && " · " + listSummary(list)}
      </p>

      {list.kind === "note" ? <NoteBody list={list} /> : <ItemsBody list={list} />}

      {/* Редкие действия */}
      <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3 text-[13px]">
        {list.kind !== "note" && (
          <button
            type="button"
            onClick={() => updateList(list.id, { kind: list.kind === "check" ? "shopping" : "check" })}
            className="flex items-center gap-1.5 text-muted"
          >
            <Icon name={list.kind === "check" ? "cart" : "listCheck"} size={14} />
            {list.kind === "check" ? "Сделать списком покупок" : "Сделать чеклистом"}
          </button>
        )}
        {list.kind === "check" && list.items.some((it) => it.done) && (
          <button type="button" onClick={() => clearDoneItems(list.id)} className="text-muted">
            Убрать выполненные
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Удалить «" + list.title + "»?")) {
              removeList(list.id);
              onBack();
            }
          }}
          className="ml-auto text-danger"
        >
          Удалить
        </button>
      </div>
    </div>
  );
}

function NoteBody({ list }: { list: TaskList }) {
  const updateList = usePlannerStore((s) => s.updateList);
  const ref = useAutoHeight(list.text ?? "");
  return (
    <textarea
      ref={ref}
      value={list.text ?? ""}
      onChange={(e) => updateList(list.id, { text: e.target.value })}
      placeholder="Мысли, протокол встречи, адрес, код домофона…"
      rows={6}
      className="field-shell mt-4 block min-h-[160px] w-full resize-none overflow-hidden rounded-2xl bg-hover px-4 py-3 text-[16px] leading-6 text-ink placeholder:text-faint"
    />
  );
}

function ItemsBody({ list }: { list: TaskList }) {
  const addListItem = usePlannerStore((s) => s.addListItem);
  const clearDoneItems = usePlannerStore((s) => s.clearDoneItems);
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
    <>
      <div className="field-shell mt-4 flex items-center gap-2 rounded-2xl bg-hover pl-4 pr-1.5">
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
          placeholder={shopping ? "Что купить?" : "Новый пункт"}
          enterKeyHint="enter"
          className="h-12 min-w-0 flex-1 bg-transparent text-[16px] text-ink placeholder:text-faint"
        />
        {text.trim() && (
          <button
            type="button"
            onClick={add}
            aria-label="Добавить пункт"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-milk"
          >
            <Icon name="plus" size={18} strokeWidth={2} />
          </button>
        )}
      </div>

      {/* В чеклисте порядок не меняется; в покупках отмеченное уходит вниз */}
      <ul className="mt-2">
        {(shopping ? open : list.items).map((it) => (
          <ItemRow key={it.id} list={list} item={it} />
        ))}
      </ul>

      {!shopping && open.length > 0 && (
        <p className="mt-2 flex items-center gap-1 text-[12px] text-faint">
          <Icon name="inbox" size={13} className="shrink-0" /> — отправить пункт во «Входящие» и поставить в день
        </p>
      )}

      {shopping && done.length > 0 && (
        <>
          <div className="mt-5 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              В корзине · {done.length}
            </span>
            <button type="button" onClick={() => clearDoneItems(list.id)} className="text-[13px] text-graphite underline">
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

      {list.items.length === 0 && (
        <p className="py-6 text-center text-[14px] leading-6 text-muted">
          {shopping ? "Добавляйте по одному слову —" : "Пишите пункт и жмите «Ввод» —"}
          <br />
          клавиатура не закроется.
        </p>
      )}
    </>
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
          title="Во входящие"
          onClick={() => listItemToInbox(list.id, item.id)}
          className="tap-expand relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-faint active:bg-line"
        >
          <Icon name="inbox" size={16} />
        </button>
      )}
      <button
        type="button"
        aria-label={"Удалить «" + item.title + "»"}
        onClick={() => removeListItem(list.id, item.id)}
        className="tap-expand relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-faint active:bg-line"
      >
        <Icon name="close" size={14} />
      </button>
    </li>
  );
}
