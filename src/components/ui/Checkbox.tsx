"use client";

import { Icon } from "./Icon";

interface CheckboxProps {
  checked: boolean;
  onChange: () => void;
  color: string;
  size?: number;
  label: string;
}

/**
 * Круглый чекбокс. Видимый кружок маленький, но зона нажатия ≥ 32px
 * (за счёт отрицательного margin у псевдо-слоя) — палец не промахнётся.
 */
export function Checkbox({ checked, onChange, color, size = 22, label }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      className="tap-expand relative flex shrink-0 items-center justify-center rounded-full transition-colors duration-200"
      style={{
        width: size,
        height: size,
        border: "1.5px solid " + color,
        backgroundColor: checked ? color : "transparent",
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
    >
      {checked && <Icon name="check" size={size - 8} strokeWidth={2.4} style={{ color: "var(--c-on-solid)" }} />}
    </button>
  );
}
