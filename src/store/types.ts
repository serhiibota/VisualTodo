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

export interface Task {
  id: string;
  title: string;
  /** Локальная дата в формате YYYY-MM-DD */
  date: string;
  /** Минуты от полуночи */
  start: number;
  /** Длительность в минутах */
  duration: number;
  description: string;
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
  | { kind: "task"; taskId: string | null; start?: number }
  | { kind: "projects" }
  | null;
