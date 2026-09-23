"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { STORAGE_KEY } from "@/lib/constants";
import { uid } from "@/lib/id";
import { todayKey } from "@/lib/time";
import { createSeed } from "./seed";
import type { ColorKey, Project, SheetState, Tag, Task, TaskDraft } from "./types";

interface PersistedState {
  tasks: Record<string, Task>;
  tags: Tag[];
  projects: Project[];
  seeded: boolean;
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
  removeTask: (id: string) => void;

  addProject: (name: string, color: ColorKey) => void;
  updateProject: (id: string, patch: Partial<Omit<Project, "id">>) => void;
  removeProject: (id: string) => void;

  addTag: (name: string, color: ColorKey) => void;
  updateTag: (id: string, patch: Partial<Omit<Tag, "id">>) => void;
  removeTag: (id: string) => void;

  seedIfEmpty: () => void;
}

export type PlannerState = PersistedState & UiState & Actions;

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set, get) => ({
      tasks: {},
      tags: [],
      projects: [],
      seeded: false,

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
      updateTask: (id, patch) =>
        set((s) => {
          const prev = s.tasks[id];
          if (!prev) return s;
          return { tasks: { ...s.tasks, [id]: { ...prev, ...patch } } };
        }),
      toggleTask: (id) =>
        set((s) => {
          const prev = s.tasks[id];
          if (!prev) return s;
          return { tasks: { ...s.tasks, [id]: { ...prev, done: !prev.done } } };
        }),
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
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // UI-состояние (открытая шторка, выбранный день) не сохраняем.
      partialize: (s): PersistedState => ({
        tasks: s.tasks,
        tags: s.tags,
        projects: s.projects,
        seeded: s.seeded,
      }),
      // Гидратация вручную на клиенте — без рассинхронизации SSR/CSR.
      skipHydration: true,
    }
  )
);
