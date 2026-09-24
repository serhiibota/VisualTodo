"use client";

import { Icon } from "@/components/ui/Icon";

interface NowChipProps {
  visible: boolean;
  /** Куда ехать к текущему блоку */
  direction: "up" | "down";
  label: string;
  onClick: () => void;
}

/** Плашка «Сейчас» — появляется, когда текущий блок ушёл за край экрана. */
export function NowChip({ visible, direction, label, onClick }: NowChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={"now-chip fixed left-4 z-30 flex h-11 items-center gap-2 rounded-full bg-ink pl-3 pr-4 text-milk" + (visible ? " is-visible" : "")}
    >
      <span className="now-chip-dot flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
        <Icon name={direction === "up" ? "chevronUp" : "chevronDown"} size={14} strokeWidth={2.4} />
      </span>
      <span className="min-w-0 truncate text-[14px]">
        <span className="font-semibold">Сейчас</span>
        {label && <span className="opacity-70"> · {label}</span>}
      </span>
    </button>
  );
}
