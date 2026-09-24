import type { SVGProps } from "react";

const paths = {
  plus: "M12 5v14M5 12h14",
  check: "M5 12.5l4.5 4.5L19 7.5",
  close: "M6 6l12 12M18 6L6 18",
  chevronLeft: "M15 5l-7 7 7 7",
  chevronRight: "M9 5l7 7-7 7",
  chevronDown: "M6 9l6 6 6-6",
  chevronUp: "M6 15l6-6 6 6",
  link: "M10 14a4.5 4.5 0 006.4 0l3-3a4.5 4.5 0 00-6.4-6.4l-1 1M14 10a4.5 4.5 0 00-6.4 0l-3 3a4.5 4.5 0 006.4 6.4l1-1",
  folder: "M3.5 7.5A2 2 0 015.5 5.5h4l2 2h7a2 2 0 012 2v7.5a2 2 0 01-2 2h-13a2 2 0 01-2-2z",
  trash: "M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12",
  minus: "M5 12h14",
  listCheck: "M10 6h10M10 12h10M10 18h10M3.5 6l1.2 1.2L7 5M3.5 12l1.2 1.2L7 11M3.5 18l1.2 1.2L7 17",
  cart: "M3 4h2l2.5 11h11L21 7H6M9 20h.01M18 20h.01",
  arrowRight: "M5 12h14M13 6l6 6-6 6",
  hourglass: "M7 3h10M7 21h10M8 3v2.5a4 4 0 002 3.5l2 1.5 2-1.5a4 4 0 002-3.5V3M8 21v-2.5a4 4 0 012-3.5l2-1.5 2 1.5a4 4 0 012 3.5V21",
  sliders: "M4 7h9M17 7h3M15 5v4M4 17h3M11 17h9M9 15v4",
  inbox: "M4 13l2.5-7h11l2.5 7v5a1 1 0 01-1 1H5a1 1 0 01-1-1zM4 13h4.5l1 2h5l1-2H20",
  clock: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2",
} as const;

export type IconName = keyof typeof paths;

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 20, strokeWidth = 1.7, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <path d={paths[name]} />
    </svg>
  );
}
