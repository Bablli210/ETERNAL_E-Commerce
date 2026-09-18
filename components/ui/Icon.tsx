import type { SVGProps } from "react";

export type IconName =
  | "search" | "bag" | "menu" | "close" | "arrow-right" | "arrow-left" | "chevron-down" | "chevron-right"
  | "plus" | "minus" | "check" | "play" | "whatsapp" | "mail" | "share" | "clock" | "sun" | "leaf" | "wave" | "shield" | "truck" | "refresh" | "star";

const paths: Record<IconName, React.ReactNode> = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  bag: <><path d="M6 8h12l1 13H5L6 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
  menu: <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>,
  close: <><path d="m6 6 12 12" /><path d="M18 6 6 18" /></>,
  "arrow-right": <><path d="M4 12h16" /><path d="m14 6 6 6-6 6" /></>,
  "arrow-left": <><path d="M20 12H4" /><path d="m10 6-6 6 6 6" /></>,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  "chevron-right": <path d="m9 6 6 6-6 6" />,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  minus: <path d="M5 12h14" />,
  check: <path d="m5 12 5 5L20 7" />,
  play: <path d="M8 6v12l10-6L8 6Z" />,
  whatsapp: <><path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3Z" /><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.5-2-1-1 1a4 4 0 0 1-2.2-2.2l1-1-1-2L9 9.5Z" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" /><path d="m3 7 9 6 9-6" /></>,
  share: <><path d="M12 4v12" /><path d="m8 8 4-4 4 4" /><path d="M5 14v6h14v-6" /></>,
  clock: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" /></>,
  leaf: <><path d="M4 20C4 10 10 4 20 4c0 10-6 16-16 16Z" /><path d="M4 20 14 10" /></>,
  wave: <><path d="M3 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0" /><path d="M3 17c2-2 4-2 6 0s4 2 6 0 4-2 6 0" /></>,
  shield: <path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3Z" />,
  truck: <><path d="M3 7h11v9H3z" /><path d="M14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="1.5" /><circle cx="17" cy="18" r="1.5" /></>,
  refresh: <><path d="M20 12a8 8 0 1 1-2.3-5.7" /><path d="M20 4v5h-5" /></>,
  star: <path d="m12 3 2.7 5.8 6.3.8-4.6 4.4 1.2 6.3L12 17.3 6.4 20.3l1.2-6.3L3 9.6l6.3-.8L12 3Z" />,
};

export function Icon({ name, size = 20, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
