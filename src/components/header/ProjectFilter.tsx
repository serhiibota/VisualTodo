"use client";

import { PALETTE } from "@/lib/palette";
import { usePlannerStore } from "@/store/usePlannerStore";

/** Горизонтальная лента проектов. Выбор проекта приглушает остальные блоки. */
export function ProjectFilter() {
  const projects = usePlannerStore((s) => s.projects);
  const active = usePlannerStore((s) => s.activeProjectId);
  const setActive = usePlannerStore((s) => s.setActiveProject);

  if (!projects.length) return null;

  const chip = "flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] transition-colors duration-200 ";

  return (
    <div className="no-scrollbar scroll-touch -mx-4 flex gap-1.5 overflow-x-auto px-4">
      <button
        type="button"
        onClick={() => setActive(null)}
        className={chip + (active === null ? "bg-ink text-milk" : "bg-hover text-graphite")}
      >
        Все
      </button>
      {projects.map((p) => {
        const on = active === p.id;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => setActive(on ? null : p.id)}
            className={chip + (on ? "bg-ink text-milk" : "bg-hover text-graphite")}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PALETTE[p.color].solid }} />
            <span className="max-w-[140px] truncate">{p.name}</span>
          </button>
        );
      })}
    </div>
  );
}
