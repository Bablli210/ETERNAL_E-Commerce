import type { Metadata } from "next";
import { pageMeta } from "@/lib/metadata";
import { siteImage } from "@/lib/site-images";
import Link from "next/link";
import { tales } from "@/content/tales";
import { getScent } from "@/lib/catalogue";
import { lineWithAudience } from "@/components/product/line";
import { FinderBand } from "@/components/content/FinderBand";
import { TaleStill } from "@/components/content/TaleStill";
import { Eyebrow, Price } from "@/components/ui/Primitives";
import { Icon } from "@/components/ui/Icon";

export const revalidate = 300;

export const metadata: Metadata = pageMeta({ title: "Tales", description: "The stories behind our scents. Read one, then smell what it describes.", path: "/tales", image: siteImage("tale-featured") });

export default async function TalesPage() {
  const scents = await Promise.all(tales.map((t) => getScent(t.handle)));
  return (
    <>
      <section className="wrap pt-6 lg:pt-16">
        <Eyebrow>Tales</Eyebrow>
        <h1 className="display-l mt-3">The story behind the bottle.</h1>
        <p className="mt-3 max-w-[56ch] text-[16px] leading-relaxed text-ash lg:text-[17px]">Some of our scents come with a tale. Read it first, then smell what it describes.</p>
      </section>
      <section className="wrap py-10 lg:py-16">
        <ul className="grid gap-x-6 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
          {tales.map((t, i) => {
            const scent = scents[i];
            return (
              <li key={t.slug} className="flex flex-col">
                <Link href={`/tales/${t.slug}`} className="group flex flex-col">
                  <TaleStill slug={t.slug} label={t.heroArt} sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" />
                  <p className="mt-4 text-[12px] tracking-[0.02em] text-ash">
                    {lineWithAudience(t.line)} · {t.readTime}
                  </p>
                  <h2 className="serif mt-1 text-[28px] leading-[1.1] group-hover:text-sea">{t.title}</h2>
                  <p className="mt-2 line-clamp-3 text-[15px] leading-relaxed text-ash">{t.paragraphs[0]}</p>
                  <span className="mt-2 inline-flex min-h-11 items-center gap-1.5 self-start text-[13px] font-semibold">
                    <span className="lnk">Read the tale</span> <Icon name="arrow-right" size={14} />
                  </span>
                </Link>
                {scent && (
                  <Link href={`/products/${scent.handle}`} className="mt-2 flex min-h-12 items-center justify-between gap-3 border-y border-dune py-2 text-[14px] hover:text-sea">
                    <span className="min-w-0">
                      The scent: <span className="font-semibold">{scent.title}</span>
                      <span className="text-ash">
                        {" "}
                        · <Price money={scent.price} />
                      </span>
                    </span>
                    <Icon name="chevron-right" size={16} className="shrink-0 text-ash" />
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </section>
      <section className="wrap pb-14 lg:pb-24">
        <FinderBand />
      </section>
    </>
  );
}
