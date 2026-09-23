"use client";

import { useEffect, useState } from "react";
import { usePlannerStore } from "@/store/usePlannerStore";

/** Поднимает данные из localStorage один раз и сообщает, когда можно рендерить. */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let alive = true;
    const finish = () => {
      if (!alive) return;
      usePlannerStore.getState().seedIfEmpty();
      setHydrated(true);
    };
    if (usePlannerStore.persist.hasHydrated()) {
      finish();
    } else {
      const unsub = usePlannerStore.persist.onFinishHydration(finish);
      Promise.resolve(usePlannerStore.persist.rehydrate()).catch(finish);
      return () => {
        alive = false;
        unsub();
      };
    }
    return () => {
      alive = false;
    };
  }, []);

  return hydrated;
}
