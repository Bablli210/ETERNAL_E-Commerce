"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { cookiePurposes } from "@/content/cookies";
import { checkoutFollows, configureConsent, onConsentOpen, readConsent, saveConsent, syncCheckoutOnce, useConsent, type ConsentSettings } from "@/lib/client/consent";

/**
 * The cookie settings. Every purpose is on for every visitor without asking
 * (lib/consent.ts DEFAULT_CONSENT), so it opens only from Cookie settings (the
 * footer, the help page), with one switch per purpose set to the current
 * choice; a choice is kept 180 days. It is fixed to the bottom, so it never
 * moves the page; it sits first in the page's order after the skip link, so
 * keyboard and screen-reader users meet it first, and it publishes its height
 * (--consent-h) so a focused field is never scrolled under it. Should the
 * default ever ask first again, it opens on its own after the page has loaded,
 * with "Only necessary" and "Accept all" side by side at the same size.
 */
export function ConsentBanner(props: ConsentSettings) {
  useState(() => configureConsent(props));
  const consent = useConsent();
  const [reopened, setReopened] = useState(false);
  const [details, setDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const box = useRef<HTMLElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const firstSwitch = useRef<HTMLInputElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const id = useId();

  // Shopify's checkout keeps its own copy of the choice; hand it over again once a visit.
  useEffect(() => syncCheckoutOnce(), []);

  useEffect(
    () =>
      onConsentOpen(() => {
        const c = readConsent();
        // A tap that does not focus its button (Safari) leaves <body> active: then focus goes to the page after saving.
        const active = document.activeElement;
        opener.current = active instanceof HTMLElement && active !== document.body ? active : null;
        setAnalytics(Boolean(c?.analytics));
        setMarketing(Boolean(c?.marketing));
        setDetails(true);
        setReopened(true);
        // Opened from a link: bring keyboard and screen-reader focus to it.
        window.requestAnimationFrame(() => title.current?.focus());
      }),
    [],
  );

  const open = consent !== "pending" && (!consent || reopened);

  // The room it takes at the bottom (its height and the gap below it on desktop), for the page's padding (app/styles/chrome.css).
  useEffect(() => {
    const el = box.current;
    if (!open || !el) return;
    const rootStyle = document.documentElement.style;
    const ro = new ResizeObserver(() =>
      rootStyle.setProperty("--consent-h", `${Math.ceil(el.getBoundingClientRect().height + (parseFloat(getComputedStyle(el).bottom) || 0))}px`),
    );
    ro.observe(el);
    return () => {
      ro.disconnect();
      rootStyle.removeProperty("--consent-h");
    };
  }, [open]);

  if (!open) return null;

  const done = (choice: { analytics: boolean; marketing: boolean }) => {
    saveConsent(choice);
    setReopened(false);
    setDetails(false);
    // Focus goes back where it came from, or to the page, never to nowhere.
    const back = opener.current;
    opener.current = null;
    window.requestAnimationFrame(() => {
      if (back?.isConnected) back.focus({ preventScroll: true });
      else {
        const main = document.getElementById("main");
        if (!main) return;
        if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
        main.focus({ preventScroll: true });
      }
    });
  };

  const choose = () => {
    setDetails(true);
    window.requestAnimationFrame(() => firstSwitch.current?.focus());
  };

  return (
    <section
      ref={box}
      role="region"
      aria-labelledby={`${id}-title`}
      className="consent-banner fixed inset-x-0 bottom-0 z-[52] max-h-[calc(100dvh-var(--header-h)-var(--announce-h))] overflow-y-auto overscroll-contain border-t border-dune bg-linen px-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))] pt-4 text-night shadow-[0_-8px_24px_rgba(23,22,20,0.08)] lg:inset-x-auto lg:bottom-6 lg:left-6 lg:max-h-[calc(100dvh-48px-var(--header-h)-var(--announce-h))] lg:w-[420px] lg:border lg:p-6"
    >
      <p className="eyebrow text-ash">Cookies</p>
      <h2 id={`${id}-title`} ref={title} tabIndex={-1} className="mt-1 font-serif text-[22px] font-semibold leading-tight outline-none lg:text-[24px]">
        {consent ? "Cookie settings" : "A few cookies, if you agree"}
      </h2>
      <p className="mt-2 text-[14px] leading-snug text-ash">
        {/* Opened from Cookie settings, the visitor changes what already applies; asked first (no choice and no default), they agree to it. */}
        {consent ? (
          <>
            We use cookies and similar technologies. Strictly necessary cookies keep the site working; we and our partners also use them for analytics and personalised
            advertising. Turn off anything you would rather we did not use; you can change this at any time.{" "}
          </>
        ) : (
          <>
            We use cookies and similar technologies. Strictly necessary cookies keep the site working. With your consent, we and our partners also use them for
            analytics and personalised advertising. No personal data is shared for these purposes unless you accept, and you can withdraw your consent at any time.{" "}
          </>
        )}
        <Link href="/help#privacy" className="lnk whitespace-nowrap text-night">
          Cookie and privacy information
        </Link>
      </p>

      {details && (
        <fieldset className="mt-4 flex flex-col gap-3 border-t border-dune pt-3">
          <legend className="sr-only">Choose which cookies to allow</legend>
          <Purpose id={`${id}-necessary`} label={cookiePurposes.necessary.label} checked disabled note={cookiePurposes.necessary.note} />
          <Purpose
            id={`${id}-analytics`}
            ref={firstSwitch}
            label={cookiePurposes.analytics.label}
            checked={analytics}
            onChange={setAnalytics}
            note={cookiePurposes.analytics.note}
          />
          <Purpose
            id={`${id}-marketing`}
            label={cookiePurposes.marketing.label}
            checked={marketing}
            onChange={setMarketing}
            note={`${cookiePurposes.marketing.note} ${checkoutFollows() ? "Checkout follows the same choice." : "Checkout is operated by our e-commerce platform provider under its own cookie settings."}`}
          />
        </fieldset>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => done({ analytics: false, marketing: false })}>
          Only necessary
        </button>
        {details ? (
          <button type="button" className="btn btn-sm" onClick={() => done({ analytics, marketing })}>
            Save my choice
          </button>
        ) : (
          <button type="button" className="btn btn-sm" onClick={() => done({ analytics: true, marketing: true })}>
            Accept all
          </button>
        )}
      </div>
      {!details && (
        <button type="button" className="mt-2 inline-flex min-h-11 items-center text-[13px] text-night" onClick={choose}>
          <span className="lnk">Choose for myself</span>
        </button>
      )}
    </section>
  );
}

function Purpose({
  id,
  ref,
  label,
  note,
  checked,
  disabled = false,
  onChange,
}: {
  id: string;
  ref?: React.Ref<HTMLInputElement>;
  label: string;
  note: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        ref={ref}
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        aria-describedby={`${id}-note`}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-[3px] h-5 w-5 shrink-0 accent-[var(--color-night)] disabled:opacity-60"
      />
      <label htmlFor={id} className="text-[14px] leading-snug">
        <span className="font-semibold">{label}</span>
        <span id={`${id}-note`} className="block text-[13px] text-ash">
          {note}
        </span>
      </label>
    </div>
  );
}
