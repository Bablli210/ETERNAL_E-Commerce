import type { ElementType } from "react";
import { Mark } from "@/components/ui/Wordmark";

/**
 * "INSPIRED BY" over "Bleu de Chanel": which fragrance a scent is inspired by, as plain to see as the scent's own
 * name. A small capital label in the subtitle face, in the colour of the text around it, on its own line, then the
 * original under it in the serif, a size up and in full colour (`tone`), so it reads at a glance on a card, in the
 * bag or on the product page. One look everywhere the original is named. Inside a single line of text
 * (`as="span"`: the sticky bar, search results, the menu) the two stay on one line.
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
      {Tag === "span" ? (
        <>
          <span className="inspired-label">Inspired by</span> <span className={`inspired-name ${tone} ${nameClassName}`}>{name}</span>
        </>
      ) : (
        <>
          <span className="inspired-label block">Inspired by</span>
          <span className={`inspired-name block ${tone} ${nameClassName}`}>{name}</span>
        </>
      )}
    </Tag>
  );
}

/**
 * Where an inspired scent names its original, one of the Eternal Originals says it is the house's own, in the same
 * two lines: the small capital label, then "Our own composition" in the serif and full colour, so the row reads the
 * same on every card. Inside a single line of text (`as="span"`) only the label shows.
 */
export function EternalOriginal({
  as: Tag = "p",
  className = "",
  tone = "text-night",
  nameClassName = "",
}: {
  as?: ElementType;
  className?: string;
  tone?: string;
  nameClassName?: string;
}) {
  return (
    <Tag className={className}>
      {Tag === "span" ? (
        <span className="inspired-label">Eternal Original</span>
      ) : (
        <>
          <span className="inspired-label block">Eternal Original</span>
          <span className={`inspired-name block ${tone} ${nameClassName}`}>Our own composition</span>
        </>
      )}
    </Tag>
  );
}

/** On a card's picture: the house's mark and "Eternal Original" in the serif, on a linen label like the bottle's own. */
export function OriginalTag({ className = "" }: { className?: string }) {
  return (
    <span className={`original-tag ${className}`}>
      <Mark size={20} className="shrink-0 text-gold-text" />
      Eternal Original
    </span>
  );
}
