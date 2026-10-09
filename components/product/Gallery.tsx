import Image from "next/image";
import { Mark } from "@/components/ui/Wordmark";
import { SnapRow } from "@/components/motion/SnapRow";
import type { Scent } from "@/lib/catalogue";

/** Alt text by what the frame shows: local stills follow public/images/README.md (-2 lifestyle, -3 notes). */
function frameAlt(scent: Scent, url: string, altText: string | null): string {
  const local = url.match(new RegExp(`/images/products/${scent.handle}(-\\d)?\\.\\w+$`));
  if (!local) return altText || scent.title;
  if (local[1] === "-2") return `${scent.title}, the bottle in a scene`;
  if (local[1] === "-3") return scent.notesShort.length ? `${scent.title} among its notes: ${scent.notesShort.join(", ").toLowerCase()}` : `${scent.title} among its notes`;
  return scent.title;
}

/**
 * The frame that shows the notes: the local notes still (products/<handle>-3,
 * public/images/README.md), or a Shopify image whose alt text or file name
 * says "notes".
 */
const isNotesFrame = (scent: Scent, url: string, altText: string | null) =>
  new RegExp(`/images/products/${scent.handle}-3\\.\\w+$`).test(url) || /\bnotes?\b/i.test(altText ?? "") || /[-_]notes?[-_.]/i.test(url.split("?")[0]);

/**
 * Real frames only, the notes frame first, at the owner's request, then the rest in their order (packshot, lifestyle). On a phone
 * they swipe with a "1 / 3" counter, sized by .pdp-frame so Add to bag stays
 * on the first screen; from lg they stack. Rendered once for both, so the
 * first frame is the single preloaded image. A scent with no imagery yet
 * shows its colour world and the eternal mark, never a placeholder brief.
 */
export function Gallery({ scent }: { scent: Scent }) {
  const all = scent.images.slice(0, 4);
  const notes = all.findIndex((img) => isNotesFrame(scent, img.url, img.altText));
  const imgs = notes > 0 ? [all[notes], ...all.filter((_, i) => i !== notes)] : all;
  const solo = imgs.length < 2;
  const frameClass = `pdp-frame ${solo ? "pdp-frame-solo" : ""} relative overflow-hidden lg:aspect-[4/5] lg:h-auto lg:w-full`;
  const sizes = solo ? "(min-width: 1024px) 50vw, calc(100vw - 40px)" : "(min-width: 1024px) 50vw, calc(100vw - 64px)";
  const frames = imgs.length
    ? imgs.map((img, i) => (
        <div key={img.url} className={frameClass}>
          <Image src={img.url} alt={frameAlt(scent, img.url, img.altText)} fill preload={i === 0} fetchPriority={i === 0 ? "high" : undefined} sizes={sizes} className={`object-cover ${i === 0 ? "zoom-slow" : ""}`} />
        </div>
      ))
    : [
        <div key="world" role="img" aria-label={scent.title} className={`${frameClass} flex items-center justify-center`} style={{ backgroundColor: scent.world.bg, color: scent.world.accent }}>
          <Mark size={120} className="opacity-40" />
        </div>,
      ];
  return (
    <div className="-mx-5 lg:mx-0">
      <SnapRow
        items={frames}
        className="scroll-px-5 gap-2.5 px-5 lg:flex-col lg:gap-4 lg:overflow-visible lg:px-0"
        label={`${scent.title} images`}
        counter
        counterClassName="right-14 lg:hidden"
        swipeLabel={scent.handle}
      />
    </div>
  );
}
