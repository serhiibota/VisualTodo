import { memo } from "react";
import { TaskIcon } from "@/components/ui/TaskIcon";
import type { Swatch } from "@/lib/palette";
import type { TaskIconKey } from "@/lib/taskIcons";

interface TaskPillProps {
  icon: TaskIconKey;
  swatch: Swatch;
  height: number;
  /** 0…1 — насколько капсула «залита»: 1 = выполнено, доля = идёт сейчас */
  fill: number;
  width?: number;
}

const ICON = 22;

/**
 * Капсула задачи. Высота растёт с длительностью; заливка сверху вниз
 * показывает прошедшее время (как карандашная штриховка в бумажном
 * ежедневнике). Белая иконка лежит внутри заливки и обрезается ею —
 * на границе иконка «перекрашивается» без масок и blend-режимов.
 */
function TaskPillImpl({ icon, swatch, height, fill, width = 46 }: TaskPillProps) {
  const iconTop = Math.round((height - ICON) / 2);
  const iconLeft = Math.round((width - ICON) / 2);
  const fillPx = Math.round(Math.max(0, Math.min(1, fill)) * height);

  return (
    <div
      className="relative shrink-0 overflow-hidden"
      style={{ width, height, borderRadius: width / 2, backgroundColor: swatch.tint }}
    >
      <div className="absolute" style={{ top: iconTop, left: iconLeft }}>
        <TaskIcon name={icon} size={ICON} color={swatch.ink} />
      </div>
      <div
        className="pill-fill absolute inset-x-0 top-0 overflow-hidden"
        style={{ height: fillPx, backgroundColor: swatch.solid }}
      >
        <div className="absolute" style={{ top: iconTop, left: iconLeft }}>
          <TaskIcon name={icon} size={ICON} color="var(--c-on-solid)" />
        </div>
      </div>
    </div>
  );
}

export const TaskPill = memo(TaskPillImpl);
