import { lines, type LineKey } from "@/content/taxonomy";
import { LOGO_BOX, LOGO_T_HEIGHT } from "./logo-box";

/**
 * A line's name drawn as its own logotype (BrandSprite), in the colour of the
 * text around it. `size` is the height of the t, so eterna and eterno are that
 * tall; eternal keeps the same letters and lets its l rise above them without
 * making the line of text taller. The default, 1.05em, sets the logotype's small
 * letters a little larger than the text's, so the name reads at 12 px too.
 * Screen readers, search engines and copy-paste get the plain name.
 */
export function LineName({ line, size = "1.05em", className = "" }: { line: LineKey; size?: string; className?: string }) {
  const { w, h } = LOGO_BOX[line];
  const rise = h / LOGO_T_HEIGHT;
  return (
    <span className={`whitespace-nowrap ${className}`}>
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox={`0 0 ${w} ${h}`}
        className="inline-block align-baseline"
        style={{
          width: `calc(${size} * ${(w / LOGO_T_HEIGHT).toFixed(4)})`,
          height: `calc(${size} * ${rise.toFixed(4)})`,
          // The l's extra height hangs into the space above the line instead of pushing it open.
          marginTop: rise > 1 ? `calc(${size} * ${(1 - rise).toFixed(4)})` : undefined,
        }}
      >
        <use href={`#brand-${line}`} />
      </svg>
      <span className="sr-only">{lines[line].label}</span>
    </span>
  );
}
