import Link from "next/link";
import { Fragment } from "react";
import { footerColumns, site } from "@/content/site";
import { facts } from "@/lib/facts";
import { Icon } from "@/components/ui/Icon";
import { Wordmark } from "@/components/ui/Wordmark";
import { MotionToggle } from "@/components/motion/MotionToggle";
import { JoinForm } from "./JoinForm";
import { WhatsAppLink } from "./WhatsAppLink";

/** A social link only once it names the house's own profile; the platform's home page proves nothing. */
const profile = (url: string) => {
  try {
    return new URL(url).pathname.replace(/\//g, "") ? url : null;
  } catch {
    return null;
  }
};

const socials = [
  { label: "Instagram", href: profile(site.instagram) },
  { label: "TikTok", href: profile(site.tiktok) },
].filter((s): s is { label: string; href: string } => s.href !== null);

/** The company behind the shop, each part shown once it is confirmed in content/site.ts. */
const legal = [
  facts.legalName,
  facts.companyRegistration && `Commercial registration ${facts.companyRegistration}`,
  facts.taxId && `Tax ID ${facts.taxId}`,
  facts.address,
].filter(Boolean);

export function JoinBand({ shopDomain }: { shopDomain: string }) {
  return (
    <section className="grain bg-night text-linen">
      <div className="wrap section grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-10" data-reveal>
        <div>
          <h2 className="display-l">Join the house</h2>
          <p className="body-l mt-4 max-w-[46ch] text-dune">
            First access to new scents and the tales behind them{facts.firstOrderOffer ? `, plus ${facts.firstOrderOffer} on your first order` : ""}.
          </p>
        </div>
        <JoinForm shopDomain={shopDomain} />
      </div>
    </section>
  );
}

export function Footer({ shopDomain }: { shopDomain: string }) {
  return (
    <>
      <JoinBand shopDomain={shopDomain} />
      <footer className="border-t border-dune bg-linen text-night">
        <div className="wrap grid grid-cols-2 gap-x-6 gap-y-10 py-14 lg:grid-cols-[1.2fr_repeat(3,1fr)] lg:gap-12 lg:py-16">
          <div className="col-span-2 flex flex-col gap-3 lg:col-span-1">
            <Wordmark />
            <p className="signature max-w-[24ch] text-ash">{site.tagline}</p>
            {socials.length > 0 && (
              <ul className="flex gap-5 text-[13px]">
                {socials.map((s) => (
                  <li key={s.label}>
                    <a href={s.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center">
                      <span className="lnk lnk-quiet">{s.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <WhatsAppLink label="footer" text="Hello eternal, I have a question about a scent." className="inline-flex min-h-11 items-center gap-3 self-start text-[14px]">
              <Icon name="whatsapp" size={20} className="shrink-0" />
              <span>
                <span className="block font-medium">Chat with us on WhatsApp</span>
                {facts.whatsappHours && <span className="block text-[12px] text-ash">{facts.whatsappHours}</span>}
              </span>
            </WhatsAppLink>
          </div>
          {footerColumns.map((col) => (
            <div key={col.title}>
              <p className="eyebrow mb-1 text-ash">{col.title}</p>
              <ul className="flex flex-col">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link href={l.href} className="flex min-h-11 items-center text-[14px] hover:text-sea lg:min-h-9">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="wrap flex flex-col gap-5 border-t border-dune py-6">
          {facts.paymentMethods.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Payment methods">
              {facts.paymentMethods.map((m) => (
                <li key={m} className="inline-flex h-8 items-center rounded-[3px] border border-dune bg-paper px-3 text-[12px] font-semibold tracking-[0.02em] text-night">
                  {m}
                </li>
              ))}
            </ul>
          )}
          <div className="flex max-w-[72ch] flex-col gap-2 text-[12px] leading-relaxed text-ash">
            {legal.length > 0 && (
              // Each part breaks as a whole ("Tax ID" never splits from its number).
              <p>
                {legal.map((part, i) => (
                  <Fragment key={i}>
                    {i > 0 && " · "}
                    <span className="inline-block">{part}</span>
                  </Fragment>
                ))}
              </p>
            )}
            <p>
              Every eternal scent is our own composition. Where we name the fragrance that inspired one, that name belongs to its owner; eternal is not affiliated with or endorsed by
              them.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 text-[12px] text-ash">
            {facts.deliveryTime && (
              <span className="inline-flex min-h-11 items-center gap-1.5">
                <Icon name="truck" size={14} /> Delivery across Egypt: {facts.deliveryTime}
              </span>
            )}
            <Link href="/help#privacy" className="inline-flex min-h-11 items-center hover:text-night">
              Privacy
            </Link>
            <Link href="/help#terms" className="inline-flex min-h-11 items-center hover:text-night">
              Terms
            </Link>
            <MotionToggle className="min-h-11" />
            <span className="inline-flex min-h-11 items-center">© eternal 2026</span>
          </div>
        </div>
      </footer>
    </>
  );
}
