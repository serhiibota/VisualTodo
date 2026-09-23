"use client";

import { memo } from "react";
import { Icon } from "@/components/ui/Icon";
import { gapHeight } from "@/lib/constants";
import { formatClock, formatDuration } from "@/lib/time";

interface GapRowProps {
  start: number;
  end: number;
  /** Текущее время внутри окна (только для сегодня) */
  now: number | null;
  onAdd: (start: number, duration: number) => void;
}

/** Свободное окно между блоками: пунктир на нити + предложение занять время. */
function GapRowImpl({ start, end, now, onAdd }: GapRowProps) {
  const minutes = end - start;
  const height = gapHeight(minutes);
  const isNow = now !== null && now >= start && now < end;
  const left = isNow ? end - Math.floor(now) : minutes;

  return (
    <div className="flow-row relative flex" style={{ height }} data-active={isNow || undefined}>
      <div className="spine spine-dashed" />
      <div className="w-[42px] shrink-0" />
      <div className="relative flex w-[62px] shrink-0 items-center justify-center">
        {isNow && <span className="relative z-[1] h-2.5 w-2.5 rounded-full bg-accent ring-4 ring-milk" />}
      </div>
      <button
        type="button"
        onClick={() => onAdd(isNow ? Math.ceil(now / 5) * 5 : start, Math.min(60, left))}
        className="flex min-w-0 flex-1 items-center gap-2 text-left text-[13px] text-muted"
      >
        <span className="truncate">
          {isNow ? (
            <>
              <span className="font-medium text-accent">Сейчас {formatClock(Math.floor(now))}</span>
              {" · свободно ещё " + formatDuration(left)}
            </>
          ) : (
            "Свободно " + formatDuration(minutes)
          )}
        </span>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-hover text-graphite">
          <Icon name="plus" size={14} strokeWidth={2} />
        </span>
      </button>
      <div className="w-[40px] shrink-0" />
    </div>
  );
}

export const GapRow = memo(GapRowImpl);
