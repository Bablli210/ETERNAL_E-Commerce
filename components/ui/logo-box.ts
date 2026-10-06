import type { LineKey } from "@/content/taxonomy";

/** Each logotype's box in the shared unit of components/ui/brand-paths.ts. */
export const LOGO_BOX: Record<LineKey, { w: number; h: number }> = {
  eterna: { w: 268, h: 66 },
  eterno: { w: 250.1, h: 66 },
  eternal: { w: 250.6, h: 82.6 },
};

/** The height of eterna and eterno (t to baseline); eternal's l rises above it. Names are sized by this. */
export const LOGO_T_HEIGHT = 66;
