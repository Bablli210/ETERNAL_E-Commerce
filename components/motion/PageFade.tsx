"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** G2 · cross-fade of the page body between routes; the header outside stays put. */
export function PageFade({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}
