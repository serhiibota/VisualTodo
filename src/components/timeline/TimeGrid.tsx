import { memo } from "react";
import { DAY_END, DAY_START, HOUR_HEIGHT } from "@/lib/constants";
import { formatClock } from "@/lib/time";

const HOURS: number[] = [];
for (let m = DAY_START; m <= DAY_END; m += 60) HOURS.push(m);

/** Статичная сетка часов. Рендерится один раз (memo без пропсов). */
function TimeGridImpl() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {HOURS.map((m, i) => (
        <div key={m} className="absolute inset-x-0" style={{ top: i * HOUR_HEIGHT }}>
          <span className="absolute left-0 w-[40px] -translate-y-1/2 text-right text-[11px] font-medium tabular-nums text-faint">
            {m === DAY_END ? "00:00" : formatClock(m)}
          </span>
          <div className="absolute left-[48px] right-0 h-px bg-line" />
          {m < DAY_END && (
            <div
              className="grid-half absolute left-[48px] right-0"
              style={{ top: HOUR_HEIGHT / 2 }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export const TimeGrid = memo(TimeGridImpl);
