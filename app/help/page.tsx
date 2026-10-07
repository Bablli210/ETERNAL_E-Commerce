import type { Metadata } from "next";
import { CheckoutCookieNote, CookieSettings } from "@/components/analytics/CookieSettings";
import { pageMeta } from "@/lib/metadata";
import type { ReactNode } from "react";
import Link from "next/link";
import { faqEntries } from "@/content/faq";
import { confirmed, facts } from "@/lib/facts";
import { site } from "@/content/site";
import { getCatalogue } from "@/lib/catalogue";
import { checkoutDomain } from "@/lib/shopify/client";
import { Accordion, Eyebrow } from "@/components/ui/Primitives";
import { Icon } from "@/components/ui/Icon";
import { FaqTrack } from "@/components/product/FaqTrack";
import { FinderBand } from "@/components/content/FinderBand";
import { WhatsAppLink } from "@/components/content/WhatsAppLink";

export const revalidate = 300;

export const metadata: Metadata = pageMeta({
  title: "Help: delivery, cash on delivery, payments and returns",
  description: "How delivery, cash on delivery, payments and returns work at eternal, in English and Arabic, and answers to the questions people ask before a first order.",
  path: "/help",
});

/** An owner's line as one sentence, whether or not it was written with a full stop. */
const sentence = (s: string) => `${s.replace(/[.\s]+$/, "")}.`;
/** "cash on delivery or InstaPay". */
const orList = (items: string[]) => (items.length > 1 ? `${items.slice(0, -1).join(", ")} or ${items.at(-1)}` : (items[0] ?? ""));

const policy = (path: string) => `https://${checkoutDomain}/policies/${path}`;

/** A text link with a 44 px tap area; external ones open the store's own page. */
function Way({ href, children }: { href: string; children: ReactNode }) {
  const cls = "inline-flex min-h-11 items-center gap-1.5 text-[13px] font-semibold text-night";
  const body = (
    <>
      <span className="lnk">{children}</span> <Icon name="arrow-right" size={14} />
    </>
  );
  return href.startsWith("/") ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <a href={href} className={cls}>
      {body}
    </a>
  );
}

type Topic = { id: string; nav: string; title: string; ar?: string; body: ReactNode };

/**
 * One page that the product page, the bag and the footer link into by anchor.
 * Every answer reads lib/facts.ts and says only what is confirmed; a missing
 * fact falls back to what is true today, usually that checkout shows it before
 * the order is placed. Reassurances carry one plain Arabic line, written to
 * stay true whatever the owner confirms later.
 */
export default async function HelpPage() {
  const { scents } = await getCatalogue();
  const faq = faqEntries({ samples: scents.some((s) => s.sample?.availableForSale) });
  const cod = facts.paymentMethods.some((m) => /cash/i.test(m));
  const methods = facts.paymentMethods.map((m) => (/cash/i.test(m) ? m.toLowerCase() : m));
  const instapay = facts.paymentMethods.some((m) => /instapay/i.test(m));
  const returns = facts.returnsPolicy ? sentence(facts.returnsWindow ? `${facts.returnsPolicy}, within ${facts.returnsWindow}` : facts.returnsPolicy) : null;
  const wa = facts.whatsapp;
  const email = confirmed(site.contactEmail);

  const topics: Topic[] = [
    {
      id: "delivery",
      nav: "Delivery",
      title: "Delivery",
      ar:
        facts.deliveryIncluded === true
          ? "التوصيل مشمول مع كل زجاجة."
          : site.freeShippingThreshold !== null
            ? `التوصيل مجاني للطلبات فوق ${site.freeShippingThreshold.toLocaleString("en-US")} جنيه، وتظهر أي تكلفة توصيل عند إتمام الطلب، قبل تأكيده.`
            : "تظهر تكلفة التوصيل عند إتمام الطلب، قبل تأكيده.",
      body: (
        <>
          {facts.deliveryIncluded === true && <p>Delivery is included on every bottle.</p>}
          {facts.deliveryIncluded !== true && facts.freeDeliveryOver && <p>Delivery is free on orders over {facts.freeDeliveryOver}.</p>}
          {facts.deliveryTime && <p>{sentence(`Delivery time: ${facts.deliveryTime}`)}</p>}
          {facts.deliveryCutoff && <p>{sentence(facts.deliveryCutoff)}</p>}
          <p>Any delivery cost for your address is shown at checkout, before you place the order.</p>
        </>
      ),
    },
    {
      id: "cod",
      nav: "Cash on delivery",
      title: "Cash on delivery",
      ar: cod ? "يمكنك الدفع نقدًا عند استلام طلبك." : undefined,
      body: cod ? (
        <p>
          Choose cash on delivery at checkout and pay the courier in cash when your order arrives.{facts.codLine ? ` ${sentence(facts.codLine)}` : ""}
        </p>
      ) : (
        <p>Cash on delivery is not offered at the moment. The ways to pay are shown at checkout.</p>
      ),
    },
    {
      id: "payments",
      nav: "Payments",
      title: "Payments",
      ar: cod && instapay ? "يمكنك الدفع نقدًا عند الاستلام أو عبر إنستاباي." : "تظهر وسائل الدفع المتاحة عند إتمام الطلب.",
      body: (
        <>
          <p>{methods.length ? `You can pay by ${orList(methods)}, on Shopify’s secure checkout.` : "The ways to pay are shown on Shopify’s secure checkout, before you place the order."}</p>
          {instapay && <p>To pay by InstaPay, choose it at checkout. The transfer details are shown when you place the order and in your confirmation email.</p>}
        </>
      ),
    },
    {
      id: "returns",
      nav: "Returns",
      title: "Returns and exchanges",
      body: (
        <>
          {returns && <p>{returns}</p>}
          <p>
            {returns ? "The details are in our refund policy." : "Returns and exchanges follow our refund policy."} {wa ? "To start one, message us on WhatsApp." : "To start one, reply to your order confirmation email."}
          </p>
          <Way href={policy("refund-policy")}>Read the refund policy</Way>
        </>
      ),
    },
    {
      id: "track",
      nav: "Tracking",
      title: "Track your order",
      ar: "يمكنك متابعة طلبك من حسابك.",
      body: (
        <>
          <p>Your order number shows as soon as you place the order, and the confirmation goes to the email you give at checkout. To see where an order is, sign in to your account.</p>
          <Way href={`https://${checkoutDomain}/account`}>Sign in to your account</Way>
        </>
      ),
    },
    // Talk to us: only a channel that is confirmed. With neither an email nor WhatsApp the section is left out, rather than promise a conversation.
    ...(email || wa
      ? [
          {
            id: "whatsapp",
            nav: email ? "Talk to us" : "WhatsApp",
            title: email ? "Talk to us" : "WhatsApp",
            ar: wa ? "راسلنا على واتساب." : undefined,
            body: (
              <>
                {email && (
                  <>
                    <p>Questions before you order, or about an order: email us and we will answer.</p>
                    <a href={`mailto:${email}`} className="btn btn-secondary mt-1 w-full sm:w-auto sm:self-start">
                      Email us
                    </a>
                  </>
                )}
                {wa && (
                  <>
                    <p className={email ? "mt-3" : undefined}>Message us on WhatsApp about a scent or an order.{facts.whatsappHours ? ` ${sentence(`We answer ${facts.whatsappHours.charAt(0).toLowerCase()}${facts.whatsappHours.slice(1)}`)}` : ""}</p>
                    <WhatsAppLink number={wa} text="Hello eternal, I have a question." from="help" className="btn btn-secondary mt-1 w-full sm:w-auto sm:self-start">
                      <Icon name="whatsapp" size={18} /> Message us on WhatsApp
                    </WhatsAppLink>
                  </>
                )}
              </>
            ),
          },
        ]
      : []),
    {
      id: "privacy",
      nav: "Privacy",
      title: "Privacy",
      body: (
        <>
          <p>How we collect and use your details is set out in our privacy policy.</p>
          <Way href={policy("privacy-policy")}>Read the privacy policy</Way>
          <p className="mt-4">
            <strong className="font-semibold">Cookies.</strong> The site keeps what it needs to work without asking: your bag, your cookie choice, and the name of the
            campaign that brought you here. Nothing that identifies you goes to Meta or Google from this site until you say yes, and you can change your mind at any time.
          </p>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5">
            <li>
              <strong className="font-semibold">Analytics</strong>: Google Analytics and Vercel Web Analytics count visits and show which pages work, so we can improve the
              site.
            </li>
            <li>
              <strong className="font-semibold">Marketing</strong>: the Meta pixel and Meta&rsquo;s Conversions API, and Google&rsquo;s ad measurement, tell Instagram,
              Facebook and Google which scents you viewed and added to your bag, so our ads reach the right people and we can measure what they sell. The ad you came from
              (its click id) travels with your order.{" "}
              <CheckoutCookieNote cookieDomain={process.env.COOKIE_DOMAIN?.trim() || null} checkoutDomain={checkoutDomain} storefrontToken={process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN?.trim() || null} />
            </li>
          </ul>
          <p className="mt-2">
            When you arrive from a campaign link, we note which campaign it was (its name only, nothing about you) so we know which posts bring visitors. Your choice is
            kept for six months, then we ask again.
          </p>
          <CookieSettings className="btn btn-secondary mt-3 w-full sm:w-auto sm:self-start">Change cookie settings</CookieSettings>
        </>
      ),
    },
    {
      id: "terms",
      nav: "Terms",
      title: "Terms",
      body: (
        <>
          <p>The terms that apply to every order are in our terms of service.</p>
          <Way href={policy("terms-of-service")}>Read the terms of service</Way>
        </>
      ),
    },
  ];

  // Anchored headings clear the fixed header (and the announcement bar while it shows).
  const clear = facts.announcement ? "scroll-mt-[calc(var(--header-h)+var(--announce-h)+16px)]" : "scroll-mt-[calc(var(--header-h)+16px)]";

  return (
    <>
      {/* One centred reading column: the topics, then the questions. Answers stay left-aligned (and the Arabic right-aligned) so they read easily. */}
      <section className="wrap pt-8 text-center lg:pt-16">
        <Eyebrow>Help</Eyebrow>
        <h1 className="display-l mt-3">Good to know</h1>
        <p className="mx-auto mt-3 max-w-[46ch] text-[16px] leading-relaxed text-ash">Delivery, payment and returns, in English and Arabic. Anything else, ask us.</p>
        <nav aria-label="Help topics" className="no-scrollbar -mx-5 mt-6 flex gap-2 overflow-x-auto px-5 sm:mx-auto sm:max-w-[1040px] sm:flex-wrap sm:justify-center sm:px-0">
          {topics.map((t) => (
            <a key={t.id} href={`#${t.id}`} className="flex h-11 shrink-0 items-center">
              <span className="chip">{t.nav}</span>
            </a>
          ))}
          <a href="#questions" className="flex h-11 shrink-0 items-center">
            <span className="chip">Questions</span>
          </a>
        </nav>
      </section>

      <div className="wrap py-10 lg:py-16">
        <div className="mx-auto max-w-[680px]">
          <div className="divide-y divide-dune border-y border-dune">
            {topics.map((t) => (
              <section key={t.id} id={t.id} aria-labelledby={`${t.id}-title`} className={`py-8 lg:py-10 ${clear}`}>
                <h2 id={`${t.id}-title`} className="display-m">
                  {t.title}
                </h2>
                <div className="mt-3 flex flex-col gap-2.5 text-[16px] leading-relaxed text-night">{t.body}</div>
                {t.ar && (
                  <p lang="ar" dir="rtl" className="help-ar mt-4 border-r-2 border-gold pr-4 text-[17px] leading-loose text-ash">
                    {t.ar}
                  </p>
                )}
              </section>
            ))}
          </div>
          <section id="questions" aria-labelledby="questions-title" className={`pt-14 lg:pt-20 ${clear}`}>
            <h2 id="questions-title" className="display-l mb-6 text-center">
              Questions
            </h2>
            <FaqTrack>
              <Accordion
                items={faq.map((f) => ({
                  id: f.id,
                  q: f.q,
                  a: (
                    <>
                      <p>{f.a}</p>
                      {f.links && (
                        <p className="mt-1 flex flex-wrap gap-x-5">
                          {f.links.map((l) => (
                            <Way key={l.href} href={l.href}>
                              {l.label}
                            </Way>
                          ))}
                        </p>
                      )}
                    </>
                  ),
                }))}
              />
            </FaqTrack>
          </section>
          <FinderBand title="Still deciding?" className="mt-14" />
        </div>
      </div>
    </>
  );
}
