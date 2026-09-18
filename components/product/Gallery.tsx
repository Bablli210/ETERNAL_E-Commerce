import Image from "next/image";
import { ImageSlot } from "@/components/ui/Primitives";
import type { Scent } from "@/lib/catalogue";

/** Stacked frames on desktop, swipe with snap on mobile. Frame 1 is the bottle on its colour world. */
export function Gallery({ scent }: { scent: Scent }) {
  const frames: { key: string; node: React.ReactNode }[] = [];
  scent.images.slice(0, 4).forEach((img, i) => {
    frames.push({
      key: `img-${i}`,
      node: (
        <div className="relative aspect-[4/5] w-full overflow-hidden" style={{ backgroundColor: scent.world.bg }}>
          <Image src={img.url} alt={img.altText ?? `${scent.title} — frame ${i + 1}`} fill priority={i === 0} sizes="(min-width: 1024px) 55vw, 100vw" className={`object-cover ${i === 0 ? "zoom-slow" : ""}`} />
        </div>
      ),
    });
  });
  const labels = ["Frame 1 — bottle on colour world", "Frame 2 — bottle in scene: wet stone, fog, harbour light", `Frame 3 — notes flatlay: ${scent.notesShort.join(", ") || "top, heart, base"}`, "Frame 4 — packaging"];
  for (let i = frames.length; i < 3; i++) {
    frames.push({ key: `slot-${i}`, node: <ImageSlot label={labels[i]} dark={scent.world.dark} className="aspect-[4/5] w-full" style={{ backgroundColor: i === 0 ? scent.world.bg : undefined }} /> });
  }
  return (
    <>
      <div className="snap-row -mx-5 px-5 lg:hidden" aria-label="Product images">
        {frames.map((f) => (
          <div key={f.key} className="w-[86vw]">
            {f.node}
          </div>
        ))}
      </div>
      <div className="hidden flex-col gap-4 lg:flex">
        {frames.map((f) => (
          <div key={f.key}>{f.node}</div>
        ))}
      </div>
    </>
  );
}
