import type { Project, Tag, Task } from "./types";

/** Демо-данные при первом запуске, чтобы таймлайн не был пустым. */
export function createSeed(date: string): {
  tags: Tag[];
  projects: Project[];
  tasks: Record<string, Task>;
} {
  const tags: Tag[] = [
    { id: "tag-work", name: "Работа", color: "sky" },
    { id: "tag-health", name: "Здоровье", color: "sage" },
    { id: "tag-personal", name: "Личное", color: "rose" },
    { id: "tag-study", name: "Учёба", color: "lavender" },
  ];

  const projects: Project[] = [
    { id: "prj-launch", name: "Запуск лендинга", color: "sand" },
    { id: "prj-routine", name: "Режим дня", color: "sage" },
  ];

  const base: Pick<Task, "date" | "description" | "links" | "done" | "projectId"> = {
    date,
    description: "",
    links: [],
    done: false,
    projectId: null,
  };

  const list: Task[] = [
    { ...base, id: "seed-1", title: "Утренняя пробежка", start: 7 * 60, duration: 45, tagIds: ["tag-health"], projectId: "prj-routine", done: true },
    { ...base, id: "seed-2", title: "Завтрак без телефона", start: 7 * 60 + 45, duration: 30, tagIds: ["tag-personal"], projectId: "prj-routine" },
    {
      ...base,
      id: "seed-3",
      title: "Глубокая работа: макет первого экрана",
      start: 9 * 60,
      duration: 120,
      tagIds: ["tag-work"],
      projectId: "prj-launch",
      description: "Собрать 2–3 варианта hero-блока, выбрать типографику.",
      links: [{ id: "l1", title: "Референсы", url: "https://www.are.na" }],
    },
    { ...base, id: "seed-4", title: "Стакан воды и растяжка", start: 11 * 60, duration: 15, tagIds: ["tag-health"] },
    { ...base, id: "seed-5", title: "Созвон с командой", start: 11 * 60 + 30, duration: 30, tagIds: ["tag-work"], projectId: "prj-launch" },
    { ...base, id: "seed-6", title: "Обед", start: 13 * 60, duration: 60, tagIds: ["tag-personal"] },
    {
      ...base,
      id: "seed-7",
      title: "Английский",
      start: 15 * 60,
      duration: 45,
      tagIds: ["tag-study"],
      links: [{ id: "l2", title: "Словарь", url: "https://dictionary.cambridge.org" }],
    },
    { ...base, id: "seed-8", title: "Ужин и прогулка", start: 19 * 60, duration: 90, tagIds: ["tag-personal"] },
    { ...base, id: "seed-9", title: "Чтение перед сном", start: 22 * 60 + 30, duration: 30, tagIds: ["tag-study"], projectId: "prj-routine" },
  ];

  const tasks: Record<string, Task> = {};
  for (const t of list) tasks[t.id] = t;
  return { tags, projects, tasks };
}
