import { lines, type LineKey } from "@/content/taxonomy";

/** The three line names differ by one letter, so the audience always travels with them: "eterno · for him". */
export const lineWithAudience = (line: LineKey, sep = " · ") => `${lines[line].label}${sep}${line === "eternal" ? "unisex" : `for ${lines[line].audience.toLowerCase()}`}`;
