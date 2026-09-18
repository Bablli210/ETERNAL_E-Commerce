"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/** The two hero actions travel with the reader once the hero scrolls out (mobile only). */
export function MobileStickyBar() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting), { threshold: 0.05 });
    io.observe(hero);
    return () => io.disconnect();
  }, []);
  if (!show) return null;
  return (
    <div className="bar-enter float-shadow fixed inset-x-0 bottom-0 z-[40] grid grid-cols-2 gap-2 border-t border-dune bg-paper p-3 lg:hidden">
      <Link href="/shop" className="btn btn-sm">
        Shop
      </Link>
      <Link href="/finder" className="btn btn-secondary btn-sm">
        Find your scent
      </Link>
    </div>
  );
}
