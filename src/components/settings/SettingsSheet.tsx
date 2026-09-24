"use client";

import { BottomSheet } from "@/components/sheet/BottomSheet";
import { Icon } from "@/components/ui/Icon";
import { DISPLAY_FONTS, UI_FONTS } from "@/lib/appearance";
import { AUTO_DARK, AUTO_LIGHT, THEME_OPTIONS, THEMES, type ThemeDef, type ThemeKey } from "@/lib/themes";
import { usePlannerStore } from "@/store/usePlannerStore";

export function SettingsSheet() {
  const open = usePlannerStore((s) => s.sheet?.kind === "settings");
  const closeSheet = usePlannerStore((s) => s.closeSheet);

  return (
    <BottomSheet open={open} onClose={closeSheet} title="Оформление">
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

  return (
    <div className="pb-2">
      <SectionTitle>Цветовая схема</SectionTitle>
      <div className="grid grid-cols-2 gap-2.5">
        {THEME_OPTIONS.map((opt) => (
          <ThemeCard
            key={opt.key}
            themeKey={opt.key}
            label={opt.label}
            selected={appearance.theme === opt.key}
            onSelect={() => setAppearance({ theme: opt.key })}
          />
        ))}
      </div>

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
  const rows = [
    { tone: tasks.rose, h: 16, fill: 1, w: 70 },
    { tone: tasks.sky, h: 26, fill: 0.5, w: 85 },
    { tone: tasks.sage, h: 16, fill: 0, w: 55 },
  ];
  return (
    <div className="relative flex-1 px-3 py-2" style={{ backgroundColor: ui.bg }}>
      <div className="absolute bottom-2 top-2 w-[2px]" style={{ left: 22, backgroundColor: ui.spine }} />
      <div className="relative flex flex-col gap-1.5">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="relative w-[18px] overflow-hidden rounded-full" style={{ height: r.h, backgroundColor: r.tone.tint }}>
              <div className="absolute inset-x-0 top-0" style={{ height: r.h * r.fill, backgroundColor: r.tone.solid }} />
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
