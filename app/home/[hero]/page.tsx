import { notFound } from "next/navigation";
import { HomePage, homeMetadata } from "@/components/home/HomePage";
import { heroByHandle, heroes } from "@/content/heroes";

export const revalidate = 300;
export const dynamicParams = false;

export const metadata = homeMetadata;

/** One static home page per hero; proxy.ts rewrites "/" to one of them on every visit. */
export function generateStaticParams() {
  return heroes.map((h) => ({ hero: h.handle }));
}

export default async function HomeWithHero({ params }: { params: Promise<{ hero: string }> }) {
  const hero = heroByHandle((await params).hero);
  if (!hero) notFound();
  return <HomePage hero={hero} />;
}
