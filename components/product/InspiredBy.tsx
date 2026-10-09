import type { ElementType } from "react";

/**
 * "INSPIRED BY Bleu de Chanel": which fragrance a scent is inspired by, as plain to see as the scent's own name.
 * A small capital label in the subtitle face, in the colour of the text around it, then the original in the
 * serif, a size up and in full colour (`tone`), so it reads at a glance on a card, in the bag or in search.
 * One look everywhere the original is named.
 */
export function InspiredBy({
  name,
  as: Tag = "p",
  className = "",
  tone = "text-night",
  nameClassName = "",
}: {
  name: string;
  as?: ElementType;
  className?: string;
  /** The original's colour: Night on light grounds, Linen on dark ones. */
  tone?: string;
  nameClassName?: string;
}) {
  return (
    <Tag className={className}>
      <span className="inspired-label">Inspired by</span> <span className={`inspired-name ${tone} ${nameClassName}`}>{name}</span>
    </Tag>
  );
}

/**
 * Where an inspired scent names its original, one of the Eternal Originals says it is the house's own:
 * the same small capital label, so the row reads the same on every card.
 */
export function EternalOriginal({ as: Tag = "p", className = "" }: { as?: ElementType; className?: string }) {
  return (
    <Tag className={className}>
      <span className="inspired-label">Eternal Original</span>
    </Tag>
  );
}
