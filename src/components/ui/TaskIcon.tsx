import { memo } from "react";
import { TASK_ICONS, type TaskIconKey } from "@/lib/taskIcons";

interface TaskIconProps {
  name: TaskIconKey;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

function TaskIconImpl({ name, size = 22, color = "currentColor", strokeWidth = 1.8 }: TaskIconProps) {
  const paths = TASK_ICONS[name] ?? TASK_ICONS.dot;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

export const TaskIcon = memo(TaskIconImpl);
