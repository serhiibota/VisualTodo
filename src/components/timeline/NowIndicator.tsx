"use client";

import { DAY_END, DAY_START } from "@/lib/constants";
import { minutesToY } from "@/lib/layout";
import { formatClock } from "@/lib/time";
import { useNowMinutes } from "@/hooks/useNow";

/**
 * Линия текущего времени. Собственный таймер изолирует ререндеры:
 * раз в 30 секунд обновляется только этот маленький компонент,
 * а сдвиг — через transform (без reflow всего таймлайна).
 */
export function NowIndicator() {
  const now = useNowMinutes();
  if (now < DAY_START || now > DAY_END) return null;
  const y = minutesToY(now);

  return (
    <div
      className="now-line pointer-events-none absolute inset-x-0 top-0 z-20"
      style={{ transform: "translate3d(0," + y + "px,0)" }}
      aria-label={"Сейчас " + formatClock(Math.floor(now))}
    >
      <span className="absolute left-0 w-[40px] -translate-y-1/2 rounded-full bg-accent py-px text-center text-[10px] font-semibold tabular-nums text-white">
        {formatClock(Math.floor(now))}
      </span>
      <div className="absolute left-[44px] h-[9px] w-[9px] -translate-y-1/2 rounded-full bg-accent" />
      <div className="absolute left-[48px] right-0 h-[1.5px] -translate-y-1/2 bg-accent" />
    </div>
  );
}
