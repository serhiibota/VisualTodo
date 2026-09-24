"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEFAULT_APPEARANCE, type AppearanceSettings } from "@/lib/appearance";
import { DEFAULT_DAY_BOUNDS, STORAGE_KEY } from "@/lib/constants";
import { uid } from "@/lib/id";
import { guessIcon } from "@/lib/taskIcons";
import { todayKey } from "@/lib/time";
import { createSeed } from "./seed";
import type { ColorKey, DayBounds, ListItem, Project, SheetState, Tag, Task, TaskDraft, TaskList } from "./types";

interface PersistedState {
  tasks: Record<string, Task>;
  tags: Tag[];
  projects: Project[];
  seeded: boolean;
  appearance: AppearanceSettings;
  dayBounds: DayBounds;
  lists: TaskList[];
}

interface UiState {
  selectedDate: string;
  /** Фильтр по проекту: null — все задачи */
  activeProjectId: string | null;
  sheet: SheetState;
  /** Режим «Свободное время»: вместо нити дня — карта свободных окон */
  freeMode: boolean;
}

interface Actions {
  selectDate: (date: string) => void;
  setActiveProject: (id: string | null) => void;
  openSheet: (sheet: SheetState) => void;
  closeSheet: () => void;
  toggleFreeMode: () => void;

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
  setDayBounds: (bounds: DayBounds) => void;

  addList: (title: string, kind: TaskList["kind"]) => string;
  updateList: (id: string, patch: Partial<Omit<TaskList, "id" | "items">>) => void;
  removeList: (id: string) => void;
  addListItem: (listId: string, title: string) => void;
  updateListItem: (listId: string, itemId: string, patch: Partial<Omit<ListItem, "id">>) => void;
  removeListItem: (listId: string, itemId: string) => void;
  clearDoneItems: (listId: string) => void;
  /** Пункт списка → задача во «Входящих» (пункт из списка убирается) */
  listItemToInbox: (listId: string, itemId: string) => void;

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
      dayBounds: DEFAULT_DAY_BOUNDS,
      lists: [],

      // Дата выставляется на клиенте после гидратации (у сервера другой часовой пояс).
      selectedDate: "",
      activeProjectId: null,
      sheet: null,
      freeMode: false,

      selectDate: (selectedDate) => set({ selectedDate }),
      setActiveProject: (activeProjectId) => set({ activeProjectId }),
      openSheet: (sheet) => set({ sheet }),
      closeSheet: () => set({ sheet: null }),
      toggleFreeMode: () => set((s) => ({ freeMode: !s.freeMode })),

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
      setDayBounds: (dayBounds) => set({ dayBounds }),

      addList: (title, kind) => {
        const id = uid();
        set((s) => ({ lists: [...s.lists, { id, title, kind, items: [], ...(kind === "note" ? { text: "" } : {}) }] }));
        return id;
      },
      updateList: (id, patch) =>
        set((s) => ({ lists: s.lists.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),
      removeList: (id) =>
        set((s) => {
          // Задачи со ссылкой на удалённый список просто отвязываем
          const tasks: Record<string, Task> = {};
          for (const key in s.tasks) {
            const t = s.tasks[key];
            tasks[key] = t.listId === id ? { ...t, listId: null } : t;
          }
          return { tasks, lists: s.lists.filter((l) => l.id !== id) };
        }),
      addListItem: (listId, title) =>
        set((s) => ({
          lists: s.lists.map((l) =>
            l.id === listId ? { ...l, items: [...l.items, { id: uid(), title, done: false }] } : l
          ),
        })),
      updateListItem: (listId, itemId, patch) =>
        set((s) => ({
          lists: s.lists.map((l) =>
            l.id === listId
              ? { ...l, items: l.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)) }
              : l
          ),
        })),
      removeListItem: (listId, itemId) =>
        set((s) => ({
          lists: s.lists.map((l) => (l.id === listId ? { ...l, items: l.items.filter((it) => it.id !== itemId) } : l)),
        })),
      clearDoneItems: (listId) =>
        set((s) => ({
          lists: s.lists.map((l) => (l.id === listId ? { ...l, items: l.items.filter((it) => !it.done) } : l)),
        })),
      listItemToInbox: (listId, itemId) => {
        const list = get().lists.find((l) => l.id === listId);
        const item = list?.items.find((it) => it.id === itemId);
        if (!list || !item) return;
        get().addTask({
          title: item.title,
          date: null,
          start: 0,
          duration: 30,
          icon: guessIcon(item.title),
          color: "mist",
          description: "",
          subtasks: [],
          links: [],
          tagIds: [],
          projectId: null,
          done: false,
        });
        get().removeListItem(listId, itemId);
      },

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
        dayBounds: s.dayBounds,
        lists: s.lists,
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
        return {
          ...current,
          ...p,
          appearance: { ...DEFAULT_APPEARANCE, ...p.appearance },
          dayBounds: p.dayBounds ?? DEFAULT_DAY_BOUNDS,
          lists: p.lists ?? [],
        };
      },
      // Гидратация вручную на клиенте — без рассинхронизации SSR/CSR.
      skipHydration: true,
    }
  )
);
