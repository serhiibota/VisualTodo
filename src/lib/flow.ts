import type { Task } from "@/store/types";
import { DAY_END, SNAP_MIN } from "./constants";

export type FlowItem =
  | { kind: "task"; task: Task; overlaps: boolean; joined: boolean }
  | { kind: "gap"; start: number; end: number };

/** Промежутки короче этого не показываем отдельной строкой — капсулы просто «стыкуются» */
const MIN_GAP = 5;

/**
 * Поток дня: задачи по порядку и свободные окна между ними.
 * joined — задача начинается ровно там, где закончилась предыдущая
 * (нить между капсулами сплошная). overlaps — наезжает на предыдущую.
 */
export function buildFlow(tasks: Task[]): FlowItem[] {
  const sorted = tasks.slice().sort((a, b) => a.start - b.start || a.duration - b.duration);
  const items: FlowItem[] = [];
  let cursor = -1;

  for (const task of sorted) {
    const end = task.start + task.duration;
    if (cursor < 0) {
      items.push({ kind: "task", task, overlaps: false, joined: false });
    } else if (task.start - cursor >= MIN_GAP) {
      items.push({ kind: "gap", start: cursor, end: task.start });
      items.push({ kind: "task", task, overlaps: false, joined: false });
    } else {
      items.push({ kind: "task", task, overlaps: task.start < cursor, joined: true });
    }
    cursor = Math.max(cursor, end);
  }
  return items;
}

/** Первое свободное окно нужной длины, начиная с from (с привязкой к 5 минутам). */
export function findFreeSlot(tasks: Task[], duration: number, from: number): number {
  const sorted = tasks.slice().sort((a, b) => a.start - b.start);
  let start = Math.ceil(from / SNAP_MIN) * SNAP_MIN;
  for (const t of sorted) {
    const end = t.start + t.duration;
    if (end <= start) continue;
    if (t.start >= start + duration) break;
    start = Math.ceil(end / SNAP_MIN) * SNAP_MIN;
  }
  return Math.min(start, DAY_END - duration);
}
