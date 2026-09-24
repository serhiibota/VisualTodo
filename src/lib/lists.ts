import type { IconName } from "@/components/ui/Icon";
import type { TaskList } from "@/store/types";

export const LIST_KIND: Record<TaskList["kind"], { label: string; icon: IconName }> = {
  check: { label: "Чеклист", icon: "listCheck" },
  shopping: { label: "Покупки", icon: "cart" },
  note: { label: "Заметка", icon: "note" },
};

/** Короткая сводка: «1 из 3» для списков, первая строка для заметки */
export function listSummary(list: TaskList): string {
  if (list.kind === "note") {
    const first = (list.text ?? "").trim().split("\n")[0];
    return first ? first : "пустая";
  }
  const done = list.items.filter((it) => it.done).length;
  return list.items.length ? done + " из " + list.items.length : "пусто";
}

/** Для чипа на ленте: «2/5» или «заметка» */
export function listChipLabel(list: TaskList): string {
  if (list.kind === "note") return "заметка";
  return list.items.filter((it) => it.done).length + "/" + list.items.length;
}
