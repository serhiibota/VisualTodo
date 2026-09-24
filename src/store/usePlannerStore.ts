"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEFAULT_APPEARANCE, type AppearanceSettings } from "@/lib/appearance";
import { STORAGE_KEY } from "@/lib/constants";
import { uid } from "@/lib/id";
import { guessIcon } from "@/lib/taskIcons";
import { todayKey } from "@/lib/time";
import { createSeed } from "./seed";
import type { ColorKey, Project, SheetState, Tag, Task, TaskDraft } from "./types";

interface PersistedState {
  tasks: Record<string, Task>;
  tags: Tag[];
  projects: Project[];
  seeded: boolean;
  appearance: AppearanceSettings;
}

interface UiState {
  selectedDate: string;
  /** Фильтр по проекту: null — все задачи */
  activeProjectId: string | null;
  sheet: SheetState;
}

interface Actions {
  selectDate: (date: string) => void;
  setActiveProject: (id: string | null) => void;
  openSheet: (sheet: SheetState) => void;
  closeSheet: () => void;

  addTask: (draft: TaskDraft) => string;
  updateTask: (id: string, patch: Partial<TaskDraft>) => void;
  toggleTask: (id: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  scheduleTask: (id: string, date: string, start: number) => void;
  removeTask: (id: string) => void;

  addProject: (name: string, color: ColorKey) => void;
  updateProject: (id: string, patch: Partial<Omit<Project, "id">>) => void;
  removeProject: (id: string) => void;

  addTag: (name: string, color: ColorKey) => void;
  updateTag: (id: string, patch: Partial<Omit<Tag, "id">>) => void;
  removeTag: (id: string) => void;

  setAppearance: (patch: Partial<AppearanceSettings>) => void;

  seedIfEmpty: () => void;
}

export type PlannerState = PersistedState & UiState & Actions;

const patchTask = (
  s: PlannerState,
  id: string,
  fn: (t: Task) => Task
): Partial<PlannerState> | PlannerState => {
  const prev = s.tasks[id];
  if (!prev) return s;
  return { tasks: { ...s.tasks, [id]: fn(prev) } };
};

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set, get) => ({
      tasks: {},
      tags: [],
      projects: [],
      seeded: false,
      appearance: DEFAULT_APPEARANCE,

      // Дата выставляется на клиенте после гидратации (у сервера другой часовой пояс).
      selectedDate: "",
      activeProjectId: null,
      sheet: null,

      selectDate: (selectedDate) => set({ selectedDate }),
      setActiveProject: (activeProjectId) => set({ activeProjectId }),
      openSheet: (sheet) => set({ sheet }),
      closeSheet: () => set({ sheet: null }),

      addTask: (draft) => {
        const id = uid();
        set((s) => ({ tasks: { ...s.tasks, [id]: { ...draft, id } } }));
        return id;
      },
      updateTask: (id, patch) => set((s) => patchTask(s, id, (t) => ({ ...t, ...patch }))),
      toggleTask: (id) => set((s) => patchTask(s, id, (t) => ({ ...t, done: !t.done }))),
      toggleSubtask: (taskId, subtaskId) =>
        set((s) =>
          patchTask(s, taskId, (t) => ({
            ...t,
            subtasks: t.subtasks.map((st) => (st.id === subtaskId ? { ...st, done: !st.done } : st)),
          }))
        ),
      scheduleTask: (id, date, start) => set((s) => patchTask(s, id, (t) => ({ ...t, date, start }))),
      removeTask: (id) =>
        set((s) => {
          if (!s.tasks[id]) return s;
          const tasks = { ...s.tasks };
          delete tasks[id];
          return { tasks };
        }),

      addProject: (name, color) =>
        set((s) => ({ projects: [...s.projects, { id: uid(), name, color }] })),
      updateProject: (id, patch) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      removeProject: (id) =>
        set((s) => {
          const tasks: Record<string, Task> = {};
          for (const key in s.tasks) {
            const t = s.tasks[key];
            tasks[key] = t.projectId === id ? { ...t, projectId: null } : t;
          }
          return {
            tasks,
            projects: s.projects.filter((p) => p.id !== id),
            activeProjectId: s.activeProjectId === id ? null : s.activeProjectId,
          };
        }),

      addTag: (name, color) => set((s) => ({ tags: [...s.tags, { id: uid(), name, color }] })),
      updateTag: (id, patch) =>
        set((s) => ({ tags: s.tags.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      removeTag: (id) =>
        set((s) => {
          const tasks: Record<string, Task> = {};
          for (const key in s.tasks) {
            const t = s.tasks[key];
            tasks[key] = t.tagIds.includes(id)
              ? { ...t, tagIds: t.tagIds.filter((x) => x !== id) }
              : t;
          }
          return { tasks, tags: s.tags.filter((t) => t.id !== id) };
        }),

      setAppearance: (patch) => set((s) => ({ appearance: { ...s.appearance, ...patch } })),

      seedIfEmpty: () => {
        const s = get();
        const today = todayKey();
        if (s.seeded) {
          set({ selectedDate: today });
          return;
        }
        set({ ...createSeed(today), seeded: true, selectedDate: today });
      },
    }),
    {
      name: STORAGE_KEY,
      version: 2,
      storage: createJSONStorage(() => localStorage),
      // UI-состояние (открытая шторка, выбранный день) не сохраняем.
      partialize: (s): PersistedState => ({
        tasks: s.tasks,
        tags: s.tags,
        projects: s.projects,
        seeded: s.seeded,
        appearance: s.appearance,
      }),
      // v1 → v2: у задач появились иконка, собственный цвет и подзадачи.
      migrate: (persisted, version) => {
        const state = persisted as PersistedState;
        if (version < 2 && state?.tasks) {
          const tagColor: Record<string, ColorKey> = {};
          for (const tag of state.tags ?? []) tagColor[tag.id] = tag.color;
          const tasks: Record<string, Task> = {};
          for (const id in state.tasks) {
            const t = state.tasks[id] as Task;
            tasks[id] = {
              ...t,
              icon: t.icon ?? guessIcon(t.title),
              color: t.color ?? tagColor[t.tagIds?.[0]] ?? "mist",
              subtasks: t.subtasks ?? [],
            };
          }
          return { ...state, tasks };
        }
        return state;
      },
      // Сохранения без appearance (до появления настроек) получают значения по умолчанию
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<PersistedState>;
        return { ...current, ...p, appearance: { ...DEFAULT_APPEARANCE, ...p.appearance } };
      },
      // Гидратация вручную на клиенте — без рассинхронизации SSR/CSR.
      skipHydration: true,
    }
  )
);
