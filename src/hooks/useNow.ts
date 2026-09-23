"use client";

import { useEffect, useState } from "react";
import { minutesNow } from "@/lib/time";

/**
 * Текущее время в минутах. Тикает раз в 30 секунд и засыпает, пока вкладка
 * скрыта, — не тратим батарею фоновыми таймерами.
 */
export function useNowMinutes(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => minutesNow());

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    const tick = () => setNow(minutesNow());
    const start = () => {
      tick();
      clearInterval(timer);
      timer = setInterval(tick, intervalMs);
    };
    const onVisibility = () => {
      if (document.hidden) clearInterval(timer);
      else start();
    };
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs]);

  return now;
}
