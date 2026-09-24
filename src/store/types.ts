import type { TaskIconKey } from "@/lib/taskIcons";

export type ColorKey =
  | "sage"
  | "sand"
  | "rose"
  | "sky"
  | "lavender"
  | "clay"
  | "mist";

export interface TaskLink {
  id: string;
  title: string;
  url: string;
}

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  /** Локальная дата YYYY-MM-DD; null — задача во «Входящих» (без времени) */
  date: string | null;
  /** Минуты от полуночи (для входящих игнорируется) */
  start: number;
  /** Длительность в минутах */
  duration: number;
  icon: TaskIconKey;
  color: ColorKey;
  description: string;
  subtasks: Subtask[];
  links: TaskLink[];
  tagIds: string[];
  projectId: string | null;
  done: boolean;
  /** Прикреплённый список (например, «Продукты» к блоку «Купить продукты») */
  listId?: string | null;
}

export interface ListItem {
  id: string;
  title: string;
  done: boolean;
}

/**
 * Список или заметка — живут дольше одного дня и прикрепляются к блокам.
 * check — чеклист; shopping — покупки (отмеченное уезжает вниз и очищается
 * одной кнопкой, список переиспользуется); note — мемо, свободный текст.
 */
export interface TaskList {
  id: string;
  title: string;
  kind: "check" | "shopping" | "note";
  items: ListItem[];
  /** Текст заметки (только для kind: "note") */
  text?: string;
}

export interface Tag {
  id: string;
  name: string;
  color: ColorKey;
}

export interface Project {
  id: string;
  name: string;
  color: ColorKey;
}

export type TaskDraft = Omit<Task, "id">;

/** Границы «моего дня» в минутах от полуночи; to может быть 1440 (полночь) */
export interface DayBounds {
  from: number;
  to: number;
}

export type SheetState =
  | { kind: "task"; taskId: string | null; start?: number; duration?: number; inbox?: boolean }
  | { kind: "projects" }
  | { kind: "inbox" }
  | { kind: "lists" }
  | { kind: "list"; listId: string }
  | { kind: "settings" }
  | null;
