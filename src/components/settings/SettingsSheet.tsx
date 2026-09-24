"use client";

import { BottomSheet } from "@/components/sheet/BottomSheet";
import { Icon } from "@/components/ui/Icon";
import { DISPLAY_FONTS, UI_FONTS } from "@/lib/appearance";
import { DAY_BOUNDS_PRESETS, MIN_DAY_LENGTH } from "@/lib/constants";
import { formatClock, formatDuration } from "@/lib/time";
import type { DayBounds } from "@/store/types";
import { AUTO_DARK, AUTO_LIGHT, THEME_OPTIONS, THEMES, type ThemeDef, type ThemeKey } from "@/lib/themes";
import { usePlannerStore } from "@/store/usePlannerStore";

export function SettingsSheet() {
  const open = usePlannerStore((s) => s.sheet?.kind === "settings");
  const closeSheet = usePlannerStore((s) => s.closeSheet);

  return (
    <BottomSheet open={open} onClose={closeSheet} title="Настройки">
      <SettingsContent />
    </BottomSheet>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{children}</div>;
}

function SettingsContent() {
  const appearance = usePlannerStore((s) => s.appearance);
  const setAppearance = usePlannerStore((s) => s.setAppearance);
  const openSheet = usePlannerStore((s) => s.openSheet);

  return (
    <div className="pb-2">
      <SectionTitle>Мой день</SectionTitle>
      <DayBoundsEditor />

      <SectionTitle>Проекты и теги</SectionTitle>
      <button
        type="button"
        onClick={() => openSheet({ kind: "projects" })}
        className="flex w-full items-center gap-3 rounded-2xl bg-hover px-4 py-3 text-left active:bg-line"
      >
        <Icon name="folder" size={18} className="shrink-0 text-graphite" />
        <span className="min-w-0 flex-1 text-[16px] text-ink">Проекты и теги</span>
        <Icon name="chevronRight" size={16} className="shrink-0 text-faint" />
      </button>

      <SectionTitle>Экран дня</SectionTitle>
      <ToggleRow
        label="Фильтр проектов под неделей"
        note="Строка «Все · проекты». По умолчанию скрыта, чтобы не спорить с выбором дня; выделить проект можно и из «Проектов»."
        on={appearance.showProjectBar}
        onChange={(showProjectBar) => setAppearance({ showProjectBar })}
      />

      <SectionTitle>Тушь</SectionTitle>
      <ThemeGrid group="ink" current={appearance.theme} onSelect={(theme) => setAppearance({ theme })} />
      <p className="mt-2 text-[12px] leading-5 text-muted">
        Почти монохром, как в бумажном ежедневнике. Цветом отмечено только то, что идёт сейчас.
      </p>

      <SectionTitle>Цветные</SectionTitle>
      <ThemeGrid group="color" current={appearance.theme} onSelect={(theme) => setAppearance({ theme })} />

      <SectionTitle>Шрифт интерфейса</SectionTitle>
      <ul className="overflow-hidden rounded-2xl bg-hover">
        {UI_FONTS.map((f, i) => {
          const on = appearance.uiFont === f.key;
          return (
            <li key={f.key} className={i ? "border-t border-line" : ""}>
              <button
                type="button"
                onClick={() => setAppearance({ uiFont: f.key })}
                aria-pressed={on}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <span className="min-w-0 flex-1" style={{ fontFamily: f.family }}>
                  <span className="block text-[17px] font-semibold leading-6 text-ink">
                    {f.label} · Утренняя пробежка
                  </span>
                  <span className="block truncate text-[13px] leading-5 text-muted">
                    07:00–07:45 · {f.note}
                  </span>
                </span>
                <Radio on={on} />
              </button>
            </li>
          );
        })}
      </ul>

      <SectionTitle>Шрифт заголовков</SectionTitle>
      <ul className="overflow-hidden rounded-2xl bg-hover">
        {DISPLAY_FONTS.map((f, i) => {
          const on = appearance.displayFont === f.key;
          return (
            <li key={f.key} className={i ? "border-t border-line" : ""}>
              <button
                type="button"
                onClick={() => setAppearance({ displayFont: f.key })}
                aria-pressed={on}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate font-medium leading-9 text-ink"
                    style={{ fontFamily: f.family, fontSize: Math.round(28 * f.scale) }}
                  >
                    23 сентября
                  </span>
                  <span className="block text-[12px] text-muted">{f.label}</span>
                </span>
                <Radio on={on} />
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-[12px] leading-5 text-muted">
        Шрифты, кроме системного, скачиваются один раз при выборе и дальше берутся из кэша.
      </p>
    </div>
  );
}

const presetLabel = (b: DayBounds) => String(b.from / 60).padStart(2, "0") + "–" + String(b.to / 60).padStart(2, "0");
const STEP = 30;

/**
 * Границы «моего дня»: в них режим «Свободное время» считает окна,
 * а «Входящие» и «+» ищут первое свободное место. Свои переключатели
 * вместо <input type="time">: не зависят от 12/24-часового формата
 * телефона и не вылезают за 375px.
 */
function DayBoundsEditor() {
  const bounds = usePlannerStore((s) => s.dayBounds);
  const setDayBounds = usePlannerStore((s) => s.setDayBounds);

  // Концы не могут сойтись ближе чем на MIN_DAY_LENGTH — сдвигаем, а не запрещаем
  const setFrom = (from: number) =>
    setDayBounds({ from, to: Math.max(bounds.to, from + MIN_DAY_LENGTH) });
  const setTo = (to: number) =>
    setDayBounds({ from: Math.min(bounds.from, to - MIN_DAY_LENGTH), to });

  return (
    <div>
      <div className="flex gap-2">
        <TimeStepper
          label="Начало"
          value={bounds.from}
          min={0}
          max={1440 - MIN_DAY_LENGTH}
          onChange={setFrom}
        />
        <TimeStepper label="Конец" value={bounds.to} min={MIN_DAY_LENGTH} max={1440} onChange={setTo} />
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {DAY_BOUNDS_PRESETS.map((p) => {
          const on = bounds.from === p.from && bounds.to === p.to;
          return (
            <button
              key={p.from + "-" + p.to}
              type="button"
              aria-pressed={on}
              onClick={() => setDayBounds(p)}
              className={
                "h-9 rounded-full px-3.5 text-[14px] tabular-nums transition-colors duration-200 " +
                (on ? "bg-ink text-milk" : "bg-hover text-graphite")
              }
            >
              {presetLabel(p)}
            </button>
          );
        })}
      </div>

      <p className="mt-2 text-[12px] leading-5 text-muted">
        День — {formatDuration(bounds.to - bounds.from)}. В этих границах считается свободное время, и сюда
        «Входящие» и «+» ставят новые блоки.
      </p>
    </div>
  );
}

function TimeStepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (m: number) => void;
}) {
  const btn =
    "tap-expand relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper text-graphite disabled:opacity-30";
  return (
    <div className="flex min-w-0 flex-1 items-center justify-between rounded-2xl bg-hover px-2 py-1.5">
      <button
        type="button"
        aria-label={label + ": раньше на 30 минут"}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - STEP))}
        className={btn}
      >
        <Icon name="minus" size={14} strokeWidth={2} />
      </button>
      <div className="min-w-0 text-center leading-tight">
        <div className="text-[11px] text-muted">{label}</div>
        <div className="text-[17px] font-semibold tabular-nums text-ink">{formatClock(value)}</div>
      </div>
      <button
        type="button"
        aria-label={label + ": позже на 30 минут"}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + STEP))}
        className={btn}
      >
        <Icon name="plus" size={14} strokeWidth={2} />
      </button>
    </div>
  );
}

function ThemeGrid({
  group,
  current,
  onSelect,
}: {
  group: "ink" | "color";
  current: ThemeKey;
  onSelect: (key: ThemeKey) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {THEME_OPTIONS.filter((o) => o.group === group).map((opt) => (
        <ThemeCard
          key={opt.key}
          themeKey={opt.key}
          label={opt.label}
          selected={current === opt.key}
          onSelect={() => onSelect(opt.key)}
        />
      ))}
    </div>
  );
}

function ToggleRow({
  label,
  note,
  on,
  onChange,
}: {
  label: string;
  note: string;
  on: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex w-full items-center gap-3 rounded-2xl bg-hover px-4 py-3 text-left"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] text-ink">{label}</span>
        <span className="mt-0.5 block text-[12px] leading-[18px] text-muted">{note}</span>
      </span>
      {/* Переключатель: бегунок едет через transform */}
      <span
        className={"relative h-[30px] w-[50px] shrink-0 rounded-full transition-colors duration-200 " + (on ? "bg-ink" : "bg-line")}
      >
        <span
          className="absolute left-[2px] top-[2px] h-[26px] w-[26px] rounded-full bg-paper shadow-[0_1px_3px_rgb(var(--c-shade)/0.25)] transition-transform duration-200"
          style={{ transform: on ? "translate3d(20px,0,0)" : "translate3d(0,0,0)" }}
        />
      </span>
    </button>
  );
}

function Radio({ on }: { on: boolean }) {
  return (
    <span
      className={
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors duration-200 " +
        (on ? "bg-ink text-milk" : "border-[1.5px] border-faint")
      }
    >
      {on && <Icon name="check" size={14} strokeWidth={2.6} />}
    </span>
  );
}

/** Карточка схемы — мини-макет дня в цветах этой схемы (цвета берутся из данных, не из CSS). */
function ThemeCard({
  themeKey,
  label,
  selected,
  onSelect,
}: {
  themeKey: ThemeKey;
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={
        "overflow-hidden rounded-2xl text-left transition-shadow duration-200 " +
        (selected ? "shadow-[0_0_0_2px_rgb(var(--c-text))]" : "shadow-[0_0_0_1px_rgb(var(--c-line))]")
      }
    >
      <div className="flex h-[84px]">
        {themeKey === "auto" ? (
          <>
            <MiniDay theme={THEMES[AUTO_LIGHT]} half />
            <MiniDay theme={THEMES[AUTO_DARK]} half />
          </>
        ) : (
          <MiniDay theme={THEMES[themeKey]} />
        )}
      </div>
      <div className="flex items-center justify-between bg-paper px-3 py-2">
        <span className="text-[14px] font-medium text-ink">{label}</span>
        {selected && <Icon name="check" size={16} strokeWidth={2.4} className="text-ink" />}
      </div>
    </button>
  );
}

function MiniDay({ theme, half }: { theme: ThemeDef; half?: boolean }) {
  const { ui, tasks } = theme;
  // Как на экране дня: выполнено → текущий (цвет «сейчас», если он есть у схемы) → предстоящий
  const rows = [
    { tone: tasks.rose, h: 16, fill: 1, w: 70, now: false },
    { tone: tasks.sky, h: 26, fill: 0.5, w: 85, now: true },
    { tone: tasks.sage, h: 16, fill: 0, w: 55, now: false },
  ];
  return (
    <div className="relative flex-1 px-3 py-2" style={{ backgroundColor: ui.bg }}>
      <div className="absolute bottom-2 top-2" style={{ left: 22, width: ui.spineWidth ?? 2, backgroundColor: ui.spine }} />
      <div className="relative flex flex-col gap-1.5">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="relative w-[18px] overflow-hidden rounded-full" style={{ height: r.h, backgroundColor: r.tone.tint }}>
              <div className="absolute inset-x-0 top-0" style={{ height: r.h * r.fill, backgroundColor: r.now && ui.now ? ui.now : r.tone.solid }} />
            </div>
            <div className="flex-1">
              <div className="h-[5px] rounded-full" style={{ width: (half ? r.w - 15 : r.w) + "%", backgroundColor: ui.text, opacity: 0.85 }} />
              {r.h > 20 && <div className="mt-1 h-[4px] w-1/2 rounded-full" style={{ backgroundColor: ui.muted }} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
