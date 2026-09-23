"use client";

import { useEffect } from "react";

/**
 * В Safari iOS 15 `100vh` равен высоте экрана БЕЗ нижней панели браузера,
 * поэтому низ интерфейса уезжает под неё, а `dvh` появился только в 15.4.
 * Записываем реальную видимую высоту в CSS-переменную --app-height.
 */
export function useAppHeight() {
  useEffect(() => {
    let frame = 0;
    const apply = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        document.documentElement.style.setProperty("--app-height", window.innerHeight + "px");
      });
    };
    apply();
    window.addEventListener("resize", apply);
    window.addEventListener("orientationchange", apply);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", apply);
      window.removeEventListener("orientationchange", apply);
    };
  }, []);
}
