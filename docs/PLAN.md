# План реализации «Структура» — с учётом Safari iOS 15 / iPhone 7

## Шаг 1. Выбор стека под старый WebKit

| Решение | Почему |
|---|---|
| **Next.js 14 (App Router) + React 18** | Стабильная связка; `browserslist: ios_saf >= 15` заставляет SWC транспилировать синтаксис ровно под iOS 15. |
| **Tailwind CSS v3, не v4** | v4 опирается на `@property`, `color-mix()`, `oklch()` и нативные cascade layers — в Safari 15.0–15.3 их нет. |
| **Zustand + `persist`** | ~1 КБ, селекторы подписывают компонент только на нужный срез: переключение чекбокса не перерисовывает шапку. |
| **Без Framer Motion** | Все анимации — CSS `transition` по `transform`/`opacity`, жесты — на Pointer Events с записью `transform` прямо в DOM (без ререндеров React). Экономим ~40 КБ JS и время main thread на A10. |
| **Системный шрифт + одна антиква** | SF Pro уже на устройстве. Cormorant Garamond (next/font, self-hosted, `display: swap`) — только для крупных заголовков. |

API, которые **не** используем (появились в Safari 15.4+): `crypto.randomUUID`, `structuredClone`, `Array.prototype.at`, единицы `dvh/svh`, `:has()`.

## Шаг 2. Каркас приложения и высота экрана

1. Документ не скроллится (`body { position: fixed; overflow: hidden }`), скроллится только таймлайн. Итог: панели Safari не схлопываются/не прыгают, резиновый overscroll страницы отключён.
2. `100vh` в iOS 15 = высота *без* нижней панели Safari → низ интерфейса уезжает под неё. Решение каскадом:
   `height: 100vh` → `-webkit-fill-available` → `var(--app-height)`, где `--app-height = window.innerHeight` (хук `useAppHeight`, обновление на `resize`/`orientationchange` через rAF).
3. `viewport-fit=cover` + `env(safe-area-inset-*)` с фолбэком: на iPhone 7 инсеты = 0, поэтому везде `max(12px, env(...))` — отступ над кнопкой Home никогда не нулевой.
4. Поля ввода — `font-size ≥ 16px`, иначе iOS зумит страницу при фокусе.
5. `touch-action: manipulation` на кнопках убирает задержку двойного тапа.

## Шаг 3. Модель данных и стор

```
Task    { id, title, date(YYYY-MM-DD), start(мин), duration(мин), description, links[], tagIds[], projectId, done }
Tag     { id, name, color }
Project { id, name, color }
```

- Задачи хранятся словарём `Record<id, Task>` → O(1) обновление, неизменённые объекты сохраняют ссылку → `React.memo` у блоков срабатывает.
- `persist` с `skipHydration`: данные поднимаются из `localStorage` только на клиенте (нет рассинхронизации SSR, у сервера другой часовой пояс). Сохраняются только данные, UI-состояние (шторки, выбранный день) — нет.
- Даты — локальные ключи без `toISOString()` (тот сдвигает в UTC и «перескакивает» день ночью).

## Шаг 4. Таймлайн

- Шкала 06:00–24:00, `HOUR_HEIGHT = 72px` → **1.2 px/мин**. Высота блока = `duration × 1.2` — строго пропорционально, без минимальной высоты.
- Три режима содержимого по высоте блока, чтобы на 375px ничего не переносилось неуклюже: *tiny* (< 30px: одна строка 12px), *compact* (< 54px: название + время в строку), *full* (время, длительность, проект, теги; двухстрочный заголовок от 90px).
- Пересечения: жадная раскладка по кластерам (`lib/layout.ts`, O(n log n)) — задачи делят ширину на колонки.
- Статичная сетка часов (`memo` без пропсов — рендерится один раз).
- Тап по пустому месту сетки → новая задача с привязкой к 15 минутам.
- Линия «сейчас» — отдельный компонент со своим таймером (30 с, пауза на скрытой вкладке) и сдвигом через `translate3d`: раз в полминуты перерисовывается только она.

## Шаг 5. Жесты и анимации (60 FPS на A10)

- **Свайп вправо по блоку = выполнено.** `touch-action: pan-y` отдаёт вертикальный скролл браузеру, горизонталь ловим Pointer Events; `transform: translate3d()` пишется в `style` напрямую, React не участвует до отпускания пальца. Порог 72px + резиновое сопротивление.
- **Затухание выполненной задачи:** `opacity .45` + зачёркивание, переход по `opacity` (дёшево для композитора).
- **Bottom Sheet:** `translate3d(0,100%,0) → 0`, кривая `cubic-bezier(.32,.72,0,1)`; перетаскивание за ручку/шапку с учётом скорости жеста; дубли — крестик и тап по подложке (на случай, если системный жест Safari перехватит свайп). Подложка — сплошной `rgba`, **без `backdrop-filter`**.
- Позиции блоков — обычный `top` (они не анимируются), чтобы не плодить GPU-слои на каждую карточку; слой создаётся только на время свайпа.
- Уважение к `prefers-reduced-motion`.

## Шаг 6. Проекты и теги

- Шторка «Проекты и теги»: создание, переименование (inline), смена цвета тапом по точке, удаление (задачи не теряются — отвязываются).
- Лента проектов в шапке: выбранный проект подсвечивает свои блоки, остальные приглушаются (а не скрываются — видна занятость дня).
- Цвет блока: первый тег → цвет проекта → нейтральный графит. Палитра — сплошные пастельные HEX (`lib/palette.ts`).

## Шаг 7. PWA-штрихи

`manifest.webmanifest`, `apple-touch-icon` (генерируется `next/og`), `apple-mobile-web-app-capable` — приложение можно добавить на экран «Домой» и открывать без интерфейса Safari.

## Структура

```
src/
├─ app/
│  ├─ layout.tsx          viewport-fit=cover, шрифт, мета для iOS
│  ├─ page.tsx
│  ├─ globals.css         каркас высоты, safe-area, анимации шторки/карточек
│  ├─ manifest.ts
│  └─ apple-icon.tsx
├─ components/
│  ├─ Planner.tsx         корень: гидратация, FAB, шторки
│  ├─ header/             DayHeader, WeekStrip, ProjectFilter
│  ├─ timeline/           Timeline, TimeGrid, TaskBlock (свайп), NowIndicator
│  ├─ sheet/BottomSheet.tsx
│  ├─ task/               TaskSheet (форма), DurationPicker, LinksEditor
│  ├─ projects/ProjectsSheet.tsx
│  └─ ui/                 Icon (inline SVG), Checkbox
├─ hooks/                 useHydrated, useAppHeight, useNow
├─ lib/                   constants, time, layout, palette, id
└─ store/                 usePlannerStore (Zustand + persist), types, seed
```

## Что можно добавить дальше

- Перетаскивание блока по вертикали для смены времени (long-press → drag, тот же подход с `transform`).
- Тёмная тема (палитра уже вынесена в токены).
- Повторяющиеся задачи и «инбокс» без времени.
- Service Worker для офлайн-запуска с экрана «Домой».
