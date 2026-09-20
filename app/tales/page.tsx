import type { Metadata } from "next";
import Link from "next/link";
import { tales } from "@/content/tales";
import { Eyebrow } from "@/components/ui/Primitives";
import { Figure } from "@/components/ui/Figure";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Tales", description: "One tale per scent. Read the story, then smell it.", alternates: { canonical: "/tales" } };

export default function TalesPage() {
  const [lead, ...rest] = tales;
  return (
    <>
      <section className="wrap pt-10 lg:pt-16">
        <Eyebrow>Tales</Eyebrow>
        <h1 className="display-l mt-3">One story per bottle.</h1>
        <p className="body-l mt-3 max-w-[56ch] text-ash">Every scent in the house has a tale. Read it first, then smell what it describes.</p>
      </section>
      <section className="wrap py-12">
        <Link href={`/tales/${lead.slug}`} className="group grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end" data-reveal>
          <Figure name={`tale-${lead.slug}`} label={lead.heroArt} dark sizes="(min-width: 1024px) 60vw, 100vw" className="aspect-[16/9] w-full" />
          <div>
            <Eyebrow>
              A tale from {lead.line} · {lead.readTime}
            </Eyebrow>
            <h2 className="display-l mt-3 group-hover:text-sea">{lead.title}</h2>
            <p className="body-l mt-4 text-ash">{lead.paragraphs[0]}</p>
            <span className="lnk mt-6">
              Read the tale <Icon name="arrow-right" size={16} />
            </span>
          </div>
        </Link>
        <ul className="mt-20 grid gap-x-6 gap-y-14 md:grid-cols-2 lg:grid-cols-4">
          {rest.map((t, i) => (
            <li key={t.slug} data-reveal style={{ ["--i" as string]: i }}>
              <Link href={`/tales/${t.slug}`} className="group flex flex-col">
                <Figure name={`tale-${t.slug}`} label={t.heroArt} sizes="(min-width: 1024px) 25vw, 50vw" className="aspect-[4/5] w-full" />
                <Eyebrow className="mt-5">
                  {t.line} · {t.handle.replace(/-/g, " ")}
                </Eyebrow>
                <p className="serif mt-2 text-[24px] leading-[1.15] group-hover:text-sea">{t.signature}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
