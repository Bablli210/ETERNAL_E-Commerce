import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon } from "./Icon";

type Variant = "primary" | "secondary" | "light" | "outline-light" | "ghost";
type Size = "md" | "sm" | "xs";

type Common = { variant?: Variant; size?: Size; block?: boolean; arrow?: boolean; className?: string; children: ReactNode };
type AsLink = Common & { href: string; external?: boolean; onClick?: () => void };
type AsButton = Common & { href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>;

const cls = (variant: Variant, size: Size, block: boolean, className: string) =>
  ["btn", variant !== "primary" && `btn-${variant}`, size !== "md" && `btn-${size}`, block && "btn-block", className].filter(Boolean).join(" ");

export function Button(props: AsLink | AsButton) {
  const { variant = "primary", size = "md", block = false, arrow = false, className = "", children } = props;
  const inner = (
    <>
      {children}
      {arrow && <Icon name="arrow-right" size={16} className="btn-arrow" />}
    </>
  );
  if (props.href !== undefined) {
    const { href, external, onClick } = props as AsLink;
    if (external) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={cls(variant, size, block, className)} onClick={onClick}>
          {inner}
        </a>
      );
    }
    return (
      <Link href={href} className={cls(variant, size, block, className)} onClick={onClick}>
        {inner}
      </Link>
    );
  }
  const { variant: _v, size: _s, block: _b, arrow: _a, className: _c, children: _ch, ...rest } = props as AsButton;
  void _v; void _s; void _b; void _a; void _c; void _ch;
  return (
    <button type="button" className={cls(variant, size, block, className)} {...rest}>
      {inner}
    </button>
  );
}
