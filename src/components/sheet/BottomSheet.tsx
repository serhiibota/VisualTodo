"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

const DURATION = 320;
const CLOSE_DISTANCE = 110;
const CLOSE_VELOCITY = 0.55; // px/ms

/**
 * Нижняя шторка.
 * - Анимация только через transform: translate3d → композитинг на GPU, 60 FPS на A10.
 * - Никакого backdrop-filter: подложка — сплошной полупрозрачный цвет.
 * - Закрытие: свайп вниз за «ручку»/шапку, тап по подложке или крестик
 *   (крестик — страховка на случай, если жесты Safari перехватят свайп).
 * - Во время перетаскивания React не ререндерится: transform пишется прямо в DOM.
 */
export function BottomSheet({ open, onClose, title, children, footer }: BottomSheetProps) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startY: 0, lastY: 0, lastT: 0, velocity: 0, dy: 0 });

  // Монтирование → следующий кадр → класс видимости (иначе transition не сработает).
  useEffect(() => {
    if (open) {
      setMounted(true);
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setVisible(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }
    setVisible(false);
    const t = setTimeout(() => setMounted(false), DURATION);
    return () => clearTimeout(t);
  }, [open]);

  // Escape для внешней клавиатуры / десктопа
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const setOffset = (dy: number, animate: boolean) => {
    const panel = panelRef.current;
    const backdrop = backdropRef.current;
    if (!panel || !backdrop) return;
    panel.style.transition = animate ? "" : "none";
    backdrop.style.transition = animate ? "" : "none";
    panel.style.transform = dy ? "translate3d(0," + dy + "px,0)" : "";
    const h = panel.offsetHeight || 1;
    backdrop.style.opacity = dy ? String(Math.max(0, 1 - dy / h)) : "";
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    drag.current = { active: true, startY: e.clientY, lastY: e.clientY, lastT: e.timeStamp, velocity: 0, dy: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active) return;
    const raw = e.clientY - d.startY;
    // Вверх тянется с сильным сопротивлением, вниз — 1:1
    const dy = raw < 0 ? raw / 6 : raw;
    const dt = e.timeStamp - d.lastT;
    if (dt > 0) d.velocity = (e.clientY - d.lastY) / dt;
    d.lastY = e.clientY;
    d.lastT = e.timeStamp;
    d.dy = dy;
    setOffset(dy, false);
  };

  const onPointerEnd = () => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    const shouldClose = d.dy > CLOSE_DISTANCE || (d.dy > 24 && d.velocity > CLOSE_VELOCITY);
    if (shouldClose) {
      // Докатываем с текущей позиции, затем снимаем inline-стили.
      const panel = panelRef.current;
      if (panel) {
        panel.style.transition = "";
        panel.style.transform = "translate3d(0,100%,0)";
      }
      onClose();
      setTimeout(() => setOffset(0, true), DURATION);
    } else {
      setOffset(0, true);
    }
  };

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true">
      <div
        ref={backdropRef}
        onClick={onClose}
        className={
          "sheet-backdrop absolute inset-0 bg-ink/35 transition-opacity duration-300 " +
          (visible ? "opacity-100" : "opacity-0")
        }
      />
      <div
        ref={panelRef}
        className={"sheet-panel absolute inset-x-0 bottom-0 flex flex-col rounded-t-4xl bg-paper " + (visible ? "is-open" : "")}
      >
        <div
          className="shrink-0 cursor-grab touch-none select-none px-5 pt-2.5"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
        >
          <div className="mx-auto h-[5px] w-10 rounded-full bg-line" />
          <div className="flex min-h-[48px] items-center justify-between gap-3 pb-1 pt-2">
            <div className="min-w-0 flex-1 truncate font-display text-[22px] leading-tight text-ink">{title}</div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-hover text-graphite active:bg-line"
            >
              <Icon name="close" size={18} />
            </button>
          </div>
        </div>

        {/* Отступ снизу — внутри обёртки, а не у скролл-контейнера: иначе sticky-футер формы «просвечивает» */}
        <div className="scroll-touch min-h-0 flex-1 overflow-y-auto px-5">
          <div className="pb-4">{children}</div>
        </div>

        {footer && <div className="sheet-footer shrink-0 border-t border-line px-5 pt-3">{footer}</div>}
        {!footer && <div className="sheet-footer shrink-0" />}
      </div>
    </div>
  );
}
