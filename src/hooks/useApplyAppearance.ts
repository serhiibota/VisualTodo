"use client";

import { useEffect } from "react";
import { resolveTheme, THEMES } from "@/lib/themes";
import { usePlannerStore } from "@/store/usePlannerStore";

/**
 * Переносит настройки внешнего вида на <html data-*> и обновляет
 * theme-color (цвет панели Safari в iOS 15). Первичное применение делает
 * inline-скрипт в layout ещё до отрисовки — без вспышки светлой темы.
 */
export function useApplyAppearance() {
  const { theme, uiFont, displayFont } = usePlannerStore((s) => s.appearance);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.setAttribute("data-ui-font", uiFont);
    root.setAttribute("data-display-font", displayFont);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const syncMeta = () => {
      const bg = THEMES[resolveTheme(theme, media.matches)].ui.bg;
      document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", bg));
    };
    syncMeta();
    if (theme !== "auto") return;
    // addListener — для Safari < 14; addEventListener там нет
    if (media.addEventListener) media.addEventListener("change", syncMeta);
    else media.addListener(syncMeta);
    return () => {
      if (media.removeEventListener) media.removeEventListener("change", syncMeta);
      else media.removeListener(syncMeta);
    };
  }, [theme, uiFont, displayFont]);
}
