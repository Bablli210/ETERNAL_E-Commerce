import type { LineKey } from "@/content/taxonomy";
import { LineName } from "@/components/ui/LineName";
import { audienceOf } from "./line";

/** "eterno · for him" on the page: the name as its logotype, then its audience in the text around it. */
export function LineLabel({ line, sep = " · ", size }: { line: LineKey; sep?: string; size?: string }) {
  return (
    <>
      <LineName line={line} size={size} />
      {sep}
      {audienceOf(line)}
    </>
  );
}
