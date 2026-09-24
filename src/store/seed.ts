import { guessIcon } from "@/lib/taskIcons";
import type { ColorKey, Project, Tag, Task, TaskList } from "./types";

type SeedTask = Partial<Task> & Pick<Task, "id" | "title" | "duration" | "color">;

/** Демо-данные при первом запуске, чтобы день не был пустым. */
export function createSeed(date: string): {
  tags: Tag[];
  projects: Project[];
  tasks: Record<string, Task>;
  lists: TaskList[];
} {
  const tags: Tag[] = [
    { id: "tag-work", name: "Работа", color: "sky" },
    { id: "tag-health", name: "Здоровье", color: "sage" },
    { id: "tag-personal", name: "Личное", color: "rose" },
  ];

  const projects: Project[] = [
    { id: "prj-launch", name: "Запуск лендинга", color: "sand" },
    { id: "prj-routine", name: "Режим дня", color: "sage" },
  ];

  const at = (h: number, m = 0) => h * 60 + m;
  const c = (k: ColorKey) => k;

  const list: SeedTask[] = [
    { id: "seed-1", title: "Подъём", start: at(7), duration: 15, color: c("rose"), projectId: "prj-routine", done: true },
    { id: "seed-2", title: "Йога", start: at(7, 15), duration: 30, color: c("sky"), tagIds: ["tag-health"], projectId: "prj-routine", done: true },
    { id: "seed-3", title: "Душ и собраться", start: at(7, 45), duration: 30, color: c("mist"), projectId: "prj-routine" },
    { id: "seed-4", title: "Кофе без телефона", start: at(8, 15), duration: 15, color: c("clay") },
    {
      id: "seed-5",
      title: "Глубокая работа: макет первого экрана",
      start: at(9),
      duration: 120,
      color: c("sky"),
      tagIds: ["tag-work"],
      projectId: "prj-launch",
      description: "Собрать 2–3 варианта hero-блока, выбрать типографику.",
      subtasks: [
        { id: "st1", title: "Референсы", done: true },
        { id: "st2", title: "Сетка и типографика", done: true },
        { id: "st3", title: "Три варианта hero", done: false },
      ],
      links: [{ id: "l1", title: "Референсы", url: "https://www.are.na" }],
    },
    { id: "seed-6", title: "Ответить на письма", start: at(11), duration: 30, color: c("rose"), tagIds: ["tag-work"] },
    { id: "seed-7", title: "Созвон с командой", start: at(11, 30), duration: 30, color: c("lavender"), tagIds: ["tag-work"], projectId: "prj-launch", listId: "list-call" },
    { id: "seed-8", title: "Обед", start: at(13), duration: 60, color: c("sage"), tagIds: ["tag-personal"] },
    { id: "seed-9", title: "Английский", start: at(15), duration: 45, color: c("lavender"), links: [{ id: "l2", title: "Словарь", url: "https://dictionary.cambridge.org" }] },
    { id: "seed-10", title: "Прогулка", start: at(19), duration: 60, color: c("sage"), tagIds: ["tag-health"] },
    { id: "seed-11", title: "Чтение перед сном", start: at(22, 30), duration: 30, color: c("sand"), projectId: "prj-routine" },
    { id: "seed-12", title: "Сон", start: at(23), duration: 60, color: c("mist") },
    // Входящие — без времени
    { id: "seed-in-1", title: "Стирка", date: null, duration: 60, color: c("sky") },
    { id: "seed-in-2", title: "Позвонить бабушке", date: null, duration: 30, color: c("rose") },
    { id: "seed-in-3", title: "Купить продукты", date: null, duration: 45, color: c("sage"), listId: "list-food" },
  ];

  const tasks: Record<string, Task> = {};
  for (const t of list) {
    tasks[t.id] = {
      date,
      start: 0,
      icon: guessIcon(t.title),
      description: "",
      subtasks: [],
      links: [],
      tagIds: [],
      projectId: null,
      done: false,
      ...t,
    };
  }
  const lists: TaskList[] = [
    {
      id: "list-food",
      title: "Продукты",
      kind: "shopping",
      items: [
        { id: "f1", title: "Молоко", done: false },
        { id: "f2", title: "Хлеб", done: false },
        { id: "f3", title: "Яйца", done: false },
        { id: "f4", title: "Кофе в зёрнах", done: false },
        { id: "f5", title: "Авокадо", done: true },
      ],
    },
    {
      id: "list-call",
      title: "Созвон с командой — план",
      kind: "check",
      items: [
        { id: "c1", title: "Статус макета первого экрана", done: false },
        { id: "c2", title: "Дата запуска", done: false },
        { id: "c3", title: "Кто пишет тексты", done: false },
      ],
    },
    {
      id: "list-trip",
      title: "Взять в поездку",
      kind: "check",
      items: [
        { id: "t1", title: "Паспорт", done: false },
        { id: "t2", title: "Зарядка и павербанк", done: false },
        { id: "t3", title: "Забронировать трансфер", done: false },
      ],
    },
  ];

  return { tags, projects, tasks, lists };
}
