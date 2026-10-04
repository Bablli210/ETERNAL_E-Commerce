import { Figure } from "@/components/ui/Figure";
import { siteImage } from "@/lib/site-images";

/** A tale's card: the 4:3 still with the bottle in the scene, or the wide still in a box of its own shape, never cropped taller. */
export function TaleStill({ slug, label, sizes, className = "" }: { slug: string; label: string; sizes: string; className?: string }) {
  const card = siteImage(`tale-${slug}-card`);
  return <Figure name={card ? `tale-${slug}-card` : `tale-${slug}`} label={label} sizes={sizes} className={`${card ? "aspect-[4/3]" : "aspect-[7/3]"} w-full bg-sand ${className}`} />;
}
