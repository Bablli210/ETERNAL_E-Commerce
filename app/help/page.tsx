import type { Metadata } from "next";
import { faq } from "@/content/faq";
import { site } from "@/content/site";
import { storeDomain } from "@/lib/shopify/client";
import { Accordion, Eyebrow } from "@/components/ui/Primitives";

export const metadata: Metadata = { title: "Help, delivery and returns", description: "Delivery across Egypt, returns, cash on delivery and every question about the scents.", alternates: { canonical: "/help" } };

export default function HelpPage() {
  return (
    <>
      <section className="wrap pt-10 lg:pt-16">
        <Eyebrow>Help</Eyebrow>
        <h1 className="display-l mt-3">Good to know</h1>
      </section>
      <section className="wrap grid gap-16 py-12 lg:grid-cols-[1fr_1.4fr] lg:py-20">
        <div className="flex flex-col gap-10 text-[15px] leading-relaxed">
          <div id="delivery">
            <h2 className="display-m">Shipping & delivery</h2>
            <p className="mt-2 text-ash">Delivery across Egypt in {site.deliveryTime}. Shipping and the cash-on-delivery fee ({site.codFee}) are shown at checkout before you pay.</p>
          </div>
          <div id="returns">
            <h2 className="display-m">Returns & exchanges</h2>
            <p className="mt-2 text-ash">
              {site.returnsPolicy} — unopened bottles within {site.returnsWindow}. Samples are not returnable.
            </p>
          </div>
          <div id="track">
            <h2 className="display-m">Track my order</h2>
            <p className="mt-2 text-ash">
              Order updates arrive by email{site.whatsapp ? " and WhatsApp" : ""}. You can also{" "}
              <a href={`https://${storeDomain}/account`} className="lnk lnk-quiet text-night">
                sign in to your account
              </a>{" "}
              to see every order.
            </p>
          </div>
          <div id="privacy">
            <h2 className="display-m">Privacy & terms</h2>
            <p className="mt-2 text-ash">[Privacy policy and terms to add — Shopify’s policy pages can be linked here once written.]</p>
          </div>
        </div>
        <div>
          <h2 className="display-m mb-6">Questions</h2>
          <Accordion items={faq.map((f) => ({ id: f.id, q: f.q, a: f.a }))} />
        </div>
      </section>
    </>
  );
}
