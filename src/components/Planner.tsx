"use client";

import { DayHeader } from "@/components/header/DayHeader";
import { ProjectsSheet } from "@/components/projects/ProjectsSheet";
import { TaskSheet } from "@/components/task/TaskSheet";
import { Timeline } from "@/components/timeline/Timeline";
import { Icon } from "@/components/ui/Icon";
import { useAppHeight } from "@/hooks/useAppHeight";
import { useHydrated } from "@/hooks/useHydrated";
import { minutesNow, todayKey } from "@/lib/time";
import { DAY_END, DAY_START, SNAP_MIN } from "@/lib/constants";
import { usePlannerStore } from "@/store/usePlannerStore";

export function Planner() {
  useAppHeight();
  const hydrated = useHydrated();

  return (
    <div className="app-shell flex flex-col bg-milk">
      {hydrated ? (
        <>
          <DayHeader />
          <Timeline />
          <AddButton />
          <TaskSheet />
          <ProjectsSheet />
        </>
      ) : (
        <Skeleton />
      )}
    </div>
  );
}

function AddButton() {
  const openSheet = usePlannerStore((s) => s.openSheet);
  const selectedDate = usePlannerStore((s) => s.selectedDate);

  const onClick = () => {
    // Сегодня — ближайшие 15 минут от «сейчас», в другие дни — 09:00
    let start = 9 * 60;
    if (selectedDate === todayKey()) {
      start = Math.ceil(minutesNow() / SNAP_MIN) * SNAP_MIN;
      start = Math.min(DAY_END - SNAP_MIN, Math.max(DAY_START, start));
    }
    openSheet({ kind: "task", taskId: null, start });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Добавить блок"
      className="fab fixed right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-milk active:scale-95"
    >
      <Icon name="plus" size={26} strokeWidth={1.8} />
    </button>
  );
}

function Skeleton() {
  return (
    <div className="safe-top px-4 pt-4" aria-hidden="true">
      <div className="h-3 w-24 rounded-full bg-hover" />
      <div className="mt-3 h-8 w-48 rounded-full bg-hover" />
      <div className="mt-6 h-12 rounded-2xl bg-hover" />
    </div>
  );
}
