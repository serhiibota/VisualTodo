"use client";

import { Icon } from "@/components/ui/Icon";
import { DURATION_PRESETS } from "@/lib/constants";

interface DurationPickerProps {
  value: number;
  max: number;
  onChange: (minutes: number) => void;
}

const STEP = 5;

function presetLabel(m: number) {
  return m < 60 ? m + "м" : m % 60 ? Math.floor(m / 60) + "ч" + (m % 60) : m / 60 + "ч";
}

export function DurationPicker({ value, max, onChange }: DurationPickerProps) {
  const clamp = (m: number) => Math.max(STEP, Math.min(max, m));

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Меньше на 5 минут"
        onClick={() => onChange(clamp(value - STEP))}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-hover text-graphite active:bg-line"
      >
        <Icon name="minus" size={16} />
      </button>
      <div className="no-scrollbar scroll-touch flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
        {DURATION_PRESETS.map((m) => (
          <button
            key={m}
            type="button"
            disabled={m > max}
            onClick={() => onChange(m)}
            className={
              "h-9 shrink-0 rounded-full px-3 text-[14px] tabular-nums transition-colors duration-200 disabled:opacity-30 " +
              (value === m ? "bg-ink text-milk" : "bg-hover text-graphite")
            }
          >
            {presetLabel(m)}
          </button>
        ))}
      </div>
      <button
        type="button"
        aria-label="Больше на 5 минут"
        onClick={() => onChange(clamp(value + STEP))}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-hover text-graphite active:bg-line"
      >
        <Icon name="plus" size={16} />
      </button>
    </div>
  );
}
