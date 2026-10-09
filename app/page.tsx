import { HomePage, homeMetadata } from "@/components/home/HomePage";
import { heroes } from "@/content/heroes";

export const revalidate = 300;

export const metadata = homeMetadata;

/**
 * Served only if proxy.ts does not run: every request for "/" is rewritten
 * to /home/<handle>, one static page per hero, the hero film by default.
 */
export default function Home() {
  return <HomePage hero={heroes[0]} />;
}
