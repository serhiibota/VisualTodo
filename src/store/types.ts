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

export type SheetState =
  | { kind: "task"; taskId: string | null; start?: number; inbox?: boolean }
  | { kind: "projects" }
  | { kind: "inbox" }
  | { kind: "settings" }
  | null;
