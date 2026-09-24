/**
 * Плавная прокрутка контейнера. `scrollTo({ behavior: "smooth" })` в Safari
 * появился только в 15.4 — на iOS 15.0–15.3 он просто прыгает, поэтому
 * анимируем scrollTop сами через rAF. Касание пальцем прерывает анимацию.
 */
export function animateScrollTop(el: HTMLElement, to: number, duration = 420): () => void {
  const from = el.scrollTop;
  const max = el.scrollHeight - el.clientHeight;
  const target = Math.max(0, Math.min(max, to));
  const delta = target - from;
  if (Math.abs(delta) < 2) return () => {};

  let raf = 0;
  let cancelled = false;
  const start = performance.now();
  const ease = (t: number) => 1 - Math.pow(1 - t, 3);

  const stop = () => {
    cancelled = true;
    cancelAnimationFrame(raf);
    el.removeEventListener("touchstart", stop);
    el.removeEventListener("wheel", stop);
  };
  el.addEventListener("touchstart", stop, { passive: true });
  el.addEventListener("wheel", stop, { passive: true });

  const step = (now: number) => {
    if (cancelled) return;
    const t = Math.min(1, (now - start) / duration);
    el.scrollTop = from + delta * ease(t);
    if (t < 1) raf = requestAnimationFrame(step);
    else stop();
  };
  raf = requestAnimationFrame(step);
  return stop;
}

/** Куда прокрутить, чтобы элемент оказался в верхней трети экрана */
export function focusOffset(el: HTMLElement, scroller: HTMLElement): number {
  return el.offsetTop - Math.round(scroller.clientHeight * 0.22);
}
