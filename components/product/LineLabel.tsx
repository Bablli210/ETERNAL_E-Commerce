import type { LineKey } from "@/content/taxonomy";
import { lineWithAudience } from "./line";

/**
 * "eterno · for him" on the page, as plain text in the type around it: beside its audience a line's name is
 * written, not drawn. The logotypes stand on their own, as titles (Three lines, the line pages).
 */
export function LineLabel({ line, sep = " · " }: { line: LineKey; sep?: string }) {
  return <>{lineWithAudience(line, sep)}</>;
}
