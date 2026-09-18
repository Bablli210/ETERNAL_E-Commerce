import Link from "next/link";
import type { ReactNode } from "react";
import { formatMoney } from "@/lib/format";
import type { Money } from "@/lib/shopify/types";
import { Icon } from "./Icon";

export function Eyebrow({ children, className = "", ...rest }: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={`eyebrow text-ash ${className}`} {...rest}>
      {children}
    </span>
  );
}

export function Price({ money, className = "" }: { money: Money; className?: string }) {
  return <span className={`tnum ${className}`}>{formatMoney(money)}</span>;
}

/** Index number, left-aligned serif title, action on the right baseline. */
export function SectionHead({
  index,
  title,
  sub,
  action,
  dark = false,
  className = "",
}: {
  index?: string;
  title: ReactNode;
  sub?: ReactNode;
  action?: { label: string; href: string };
  dark?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-6 md:flex-row md:items-end md:justify-between ${className}`} data-reveal>
      <div className="max-w-[640px]">
        {index && <span className={`tnum serif mb-3 block text-[20px] ${dark ? "text-dune" : "text-gold"}`}>{index}</span>}
        <h2 className={`display-l ${dark ? "text-linen" : "text-night"}`}>{title}</h2>
        {sub && <p className={`body-l mt-4 max-w-[52ch] ${dark ? "text-dune" : "text-ash"}`}>{sub}</p>}
      </div>
      {action && (
        <Link href={action.href} className={`lnk shrink-0 ${dark ? "text-linen" : "text-night"}`}>
          {action.label}
          <Icon name="arrow-right" size={16} />
        </Link>
      )}
    </div>
  );
}

/** A hatched image or video slot, labelled with its art direction. */
export function ImageSlot({ label, className = "", dark = false, style, ...rest }: { label: string; className?: string; dark?: boolean; style?: React.CSSProperties } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`slot ${dark ? "slot-dark" : ""} ${className}`} style={style} role="img" aria-label={label} {...rest}>
      <span>{label}</span>
    </div>
  );
}

export function Meter({ label, value, max = 10, dark = false }: { label: string; value: number; max?: number; dark?: boolean }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex flex-col gap-2" data-reveal>
      <div className={`flex items-baseline justify-between text-[13px] ${dark ? "text-dune" : "text-ash"}`}>
        <span className="font-medium">{label}</span>
        <span className={`tnum font-semibold ${dark ? "text-linen" : "text-night"}`}>
          {value}/{max}
        </span>
      </div>
      <div className="meter" style={{ ["--v" as string]: `${pct}%` }}>
        <i />
      </div>
    </div>
  );
}

export function Accordion({ items }: { items: { id: string; q: string; a: ReactNode }[] }) {
  return (
    <div>
      {items.map((it) => (
        <details key={it.id} className="acc">
          <summary>
            <span>{it.q}</span>
            <Icon name="chevron-down" size={18} />
          </summary>
          <div>{it.a}</div>
        </details>
      ))}
    </div>
  );
}

export function Placeholder({ children }: { children: ReactNode }) {
  return <span className="text-gold-text">{children}</span>;
}
