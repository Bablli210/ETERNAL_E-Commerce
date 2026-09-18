import Link from "next/link";
import { footerColumns, site } from "@/content/site";
import { Icon } from "@/components/ui/Icon";
import { Wordmark } from "@/components/ui/Wordmark";

/** Shopify's customer form: posts the email as a newsletter subscriber, no token needed. */
function JoinForm({ storeDomain, dark = true }: { storeDomain: string; dark?: boolean }) {
  return (
    <form method="post" action={`https://${storeDomain}/contact#contact_form`} acceptCharset="UTF-8" className="flex w-full max-w-[560px] flex-col gap-3 sm:flex-row">
      <input type="hidden" name="form_type" value="customer" />
      <input type="hidden" name="utf8" value="✓" />
      <input type="hidden" name="contact[tags]" value="newsletter" />
      <label className="sr-only" htmlFor="join-email">
        Email address
      </label>
      <input id="join-email" type="email" name="contact[email]" required placeholder="Email address" className={`field ${dark ? "field-dark" : ""} flex-1`} />
      <button type="submit" className={`btn ${dark ? "btn-light" : ""}`}>
        Join
      </button>
    </form>
  );
}

export function JoinBand({ storeDomain }: { storeDomain: string }) {
  return (
    <section className="grain bg-night text-linen">
      <div className="wrap section grid gap-10 lg:grid-cols-2 lg:items-center" data-reveal>
        <div>
          <span className="tnum serif mb-3 block text-[20px] text-dune">12</span>
          <h2 className="display-l">Join the house</h2>
          <p className="body-l mt-4 max-w-[46ch] text-dune">First access to new scents and the tales behind them, plus {site.firstOrderOffer} on your first order.</p>
        </div>
        <div className="flex flex-col gap-3">
          <JoinForm storeDomain={storeDomain} />
          <p className="text-[12px] text-dune">Order updates on WhatsApp [opt-in and consent wording to confirm]. Unsubscribe any time.</p>
        </div>
      </div>
    </section>
  );
}

export function Footer({ storeDomain }: { storeDomain: string }) {
  return (
    <>
      <JoinBand storeDomain={storeDomain} />
      <footer className="border-t border-dune bg-linen text-night">
        <div className="wrap grid gap-12 py-16 lg:grid-cols-[1.2fr_repeat(3,1fr)]">
          <div className="flex flex-col gap-4">
            <Wordmark />
            <p className="signature max-w-[24ch] text-ash">{site.tagline}</p>
            <div className="mt-2 flex gap-4 text-[13px]">
              <a href={site.instagram} target="_blank" rel="noopener noreferrer" className="lnk lnk-quiet">
                Instagram
              </a>
              <a href={site.tiktok} target="_blank" rel="noopener noreferrer" className="lnk lnk-quiet">
                TikTok
              </a>
              {site.whatsapp && (
                <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener noreferrer" className="lnk lnk-quiet">
                  Chat on WhatsApp
                </a>
              )}
            </div>
          </div>
          {footerColumns.map((col) => (
            <div key={col.title}>
              <p className="eyebrow mb-4 text-ash">{col.title}</p>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link href={l.href} className="text-[14px] hover:text-sea">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="wrap flex flex-col gap-6 border-t border-dune py-6 lg:flex-row lg:items-center lg:justify-between">
          <ul className="flex flex-wrap gap-2" aria-label="Payment methods">
            {site.paymentMethods.map((m) => (
              <li key={m} className="inline-flex h-8 items-center border border-dune px-3 text-[11px] font-medium tracking-[0.04em] text-ash">
                {m}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-ash">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="truck" size={14} /> Delivery across Egypt in {site.deliveryTime}
            </span>
            <Link href="/help#privacy" className="hover:text-night">
              Privacy
            </Link>
            <Link href="/help#terms" className="hover:text-night">
              Terms
            </Link>
            <span>© eternal 2026</span>
          </div>
        </div>
      </footer>
    </>
  );
}
