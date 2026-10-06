import { lines, type LineKey } from "@/content/taxonomy";

/** Who a line is for, as it follows the name: "for him", "unisex". */
export const audienceOf = (line: LineKey) => (line === "eternal" ? "unisex" : `for ${lines[line].audience.toLowerCase()}`);

/**
 * The three line names differ by one letter, so the audience always travels with them: "eterno · for him".
 * Plain text, for titles, descriptions, structured data and labels; on the page, LineLabel draws the name as
 * its logotype.
 */
export const lineWithAudience = (line: LineKey, sep = " · ") => `${lines[line].label}${sep}${audienceOf(line)}`;
