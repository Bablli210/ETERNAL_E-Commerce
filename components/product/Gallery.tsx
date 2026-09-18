import Image from "next/image";
import { ImageSlot } from "@/components/ui/Primitives";
import { SnapRow } from "@/components/motion/SnapRow";
import type { Scent } from "@/lib/catalogue";

/** Stacked frames on desktop (D1: the first zooms slowly), swipe with snap and dots on mobile. */
export function Gallery({ scent }: { scent: Scent }) {
  const frames: React.ReactNode[] = [];
  scent.images.slice(0, 4).forEach((img, i) => {
    frames.push(
      <div key={`img-${i}`} className="relative aspect-[4/5] w-full overflow-hidden" style={{ backgroundColor: scent.world.bg }}>
        <Image src={img.url} alt={img.altText ?? `${scent.title} — frame ${i + 1}`} fill priority={i === 0} sizes="(min-width: 1024px) 55vw, 100vw" className={`object-cover ${i === 0 ? "zoom-slow" : ""}`} />
      </div>,
    );
  });
  const labels = ["Frame 1 — bottle on colour world", "Frame 2 — bottle in scene: wet stone, fog, harbour light", `Frame 3 — notes flatlay: ${scent.notesShort.join(", ") || "top, heart, base"}`, "Frame 4 — packaging"];
  for (let i = frames.length; i < 3; i++) {
    frames.push(<ImageSlot key={`slot-${i}`} label={labels[i]} dark={scent.world.dark} className="aspect-[4/5] w-full" style={{ backgroundColor: i === 0 ? scent.world.bg : undefined }} />);
  }
  return (
    <>
      <div className="-mx-5 lg:hidden">
        <SnapRow items={frames} className="px-5" itemClassName="w-[86vw]" label="Product images" />
      </div>
      <div className="hidden flex-col gap-4 lg:flex">
        {frames.map((f, i) => (
          <div key={i}>{f}</div>
        ))}
      </div>
    </>
  );
}
