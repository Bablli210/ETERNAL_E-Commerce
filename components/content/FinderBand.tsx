import Link from "next/link";

/** The way out of every content page for a visitor who has not chosen yet: the finder, or the whole shop. */
export function FinderBand({ title = "Still choosing?", className = "" }: { title?: string; className?: string }) {
  return (
    <div className={`watermark relative flex flex-col gap-5 overflow-hidden bg-sand p-6 text-night lg:p-10 ${className}`}>
      <div className="relative">
        <p className="display-m">{title}</p>
        <p className="mt-2 max-w-[44ch] text-[15px] leading-relaxed text-ash">Five questions, and the finder gives you three scents from across the house, each one tap from your bag.</p>
      </div>
      <div className="relative flex flex-wrap items-center gap-x-6 gap-y-2">
        <Link href="/finder" className="btn">
          Take the scent finder
        </Link>
        <Link href="/shop" className="inline-flex min-h-11 items-center text-[13px] font-semibold">
          <span className="lnk">Shop all scents</span>
        </Link>
      </div>
    </div>
  );
}
