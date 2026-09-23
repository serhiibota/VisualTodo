import type { Task } from "@/store/types";
import { DAY_END, DAY_START, PX_PER_MIN } from "./constants";

export interface PlacedTask {
  task: Task;
  top: number;
  height: number;
  /** Номер колонки внутри кластера пересекающихся задач */
  lane: number;
  /** Сколько колонок в кластере */
  lanes: number;
}

/**
 * Раскладка задач по вертикали: высота строго пропорциональна длительности.
 * Пересекающиеся по времени задачи делят ширину на колонки (жадный алгоритм
 * по кластерам, O(n log n)).
 */
export function layoutTasks(tasks: Task[]): PlacedTask[] {
  const sorted = tasks
    .filter((t) => t.start + t.duration > DAY_START && t.start < DAY_END)
    .sort((a, b) => a.start - b.start || b.duration - a.duration);

  const result: PlacedTask[] = [];
  let cluster: PlacedTask[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -1;

  const flush = () => {
    const lanes = laneEnds.length;
    for (const item of cluster) item.lanes = lanes;
    cluster = [];
    laneEnds = [];
  };

  for (const task of sorted) {
    const start = Math.max(task.start, DAY_START);
    const end = Math.min(task.start + task.duration, DAY_END);

    if (start >= clusterEnd) flush();

    let lane = laneEnds.findIndex((laneEnd) => laneEnd <= start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(end);
    } else {
      laneEnds[lane] = end;
    }
    clusterEnd = Math.max(clusterEnd, end);

    const placed: PlacedTask = {
      task,
      top: (start - DAY_START) * PX_PER_MIN,
      height: (end - start) * PX_PER_MIN,
      lane,
      lanes: 1,
    };
    cluster.push(placed);
    result.push(placed);
  }
  flush();

  return result;
}

export const minutesToY = (minutes: number) => (minutes - DAY_START) * PX_PER_MIN;

export const yToMinutes = (y: number) => y / PX_PER_MIN + DAY_START;
