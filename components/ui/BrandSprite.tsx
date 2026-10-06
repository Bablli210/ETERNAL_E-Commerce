import type { LineKey } from "@/content/taxonomy";
import { LOGO_PATHS } from "./brand-paths";
import { LOGO_BOX } from "./logo-box";

/**
 * The three line logotypes, once per page, as symbols that LineName draws by
 * reference (<use href="#brand-eterna">). A grid of cards then repeats a short
 * reference instead of each outline, and the outlines never enter a client
 * bundle. Each fills with the colour of the text around the name.
 */
export function BrandSprite() {
  return (
    <svg aria-hidden="true" focusable="false" width="0" height="0" className="pointer-events-none absolute h-0 w-0 overflow-hidden">
      <defs>
        {(Object.keys(LOGO_PATHS) as LineKey[]).map((k) => (
          <symbol key={k} id={`brand-${k}`} viewBox={`0 0 ${LOGO_BOX[k].w} ${LOGO_BOX[k].h}`}>
            <path d={LOGO_PATHS[k]} fill="currentColor" fillRule="evenodd" />
          </symbol>
        ))}
      </defs>
    </svg>
  );
}
