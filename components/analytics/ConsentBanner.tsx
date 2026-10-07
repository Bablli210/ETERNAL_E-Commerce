"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { configureConsent, onConsentOpen, readConsent, saveConsent, useConsent, type ConsentSettings } from "@/lib/client/consent";

/**
 * The cookie choice, asked once and kept 180 days (lib/consent.ts). It shows
 * after the page has loaded, fixed to the bottom, so it never moves the page
 * or delays its first paint. Saying no is as easy as saying yes: both buttons
 * sit side by side at the same size. "Choose for myself" opens one switch per
 * purpose. The footer's Cookie settings opens it again with the switches set
 * to the current choice.
 */
export function ConsentBanner(props: ConsentSettings) {
  useState(() => configureConsent(props));
  const consent = useConsent();
  const [reopened, setReopened] = useState(false);
  const [details, setDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const title = useRef<HTMLHeadingElement>(null);
  const id = useId();

  useEffect(
    () =>
      onConsentOpen(() => {
        const c = readConsent();
        setAnalytics(Boolean(c?.analytics));
        setMarketing(Boolean(c?.marketing));
        setDetails(true);
        setReopened(true);
        // Opened from a link: bring keyboard and screen-reader focus to it.
        window.requestAnimationFrame(() => title.current?.focus());
      }),
    [],
  );

  if (consent === "pending" || (consent && !reopened)) return null;

  const done = (choice: { analytics: boolean; marketing: boolean }) => {
    saveConsent(choice);
    setReopened(false);
    setDetails(false);
  };

  return (
    <section
      role="region"
      aria-labelledby={`${id}-title`}
      className="consent-banner fixed inset-x-0 bottom-0 z-[52] border-t border-dune bg-linen px-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))] pt-4 text-night shadow-[0_-8px_24px_rgba(23,22,20,0.08)] lg:inset-x-auto lg:bottom-6 lg:left-6 lg:w-[420px] lg:border lg:p-6"
    >
      <p className="eyebrow text-ash">Cookies</p>
      <h2 id={`${id}-title`} ref={title} tabIndex={-1} className="mt-1 font-serif text-[22px] font-semibold leading-tight outline-none lg:text-[24px]">
        A few cookies, if you agree
      </h2>
      <p className="mt-2 text-[14px] leading-snug text-ash">
        We&rsquo;d like to count visits and show eternal to you on Instagram and Facebook. Nothing optional is set until you choose.{" "}
        <Link href="/help#privacy" className="lnk whitespace-nowrap text-night">
          How we use your data
        </Link>
      </p>

      {details && (
        <fieldset className="mt-4 flex flex-col gap-3 border-t border-dune pt-3">
          <legend className="sr-only">Choose which cookies to allow</legend>
          <Purpose id={`${id}-necessary`} label="Necessary" checked disabled note="Your bag, and this choice. Always on." />
          <Purpose
            id={`${id}-analytics`}
            label="Analytics"
            checked={analytics}
            onChange={setAnalytics}
            note="Google Analytics and Vercel count visits and see which pages work, so we can make the site better."
          />
          <Purpose
            id={`${id}-marketing`}
            label="Marketing"
            checked={marketing}
            onChange={setMarketing}
            note="The Meta pixel tells Instagram and Facebook which scents you looked at, so our ads reach the right people and we can see what they sold."
          />
        </fieldset>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        {details ? (
          <>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => done({ analytics: false, marketing: false })}>
              Only necessary
            </button>
            <button type="button" className="btn btn-sm" onClick={() => done({ analytics, marketing })}>
              Save my choice
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => done({ analytics: false, marketing: false })}>
              Only necessary
            </button>
            <button type="button" className="btn btn-sm" onClick={() => done({ analytics: true, marketing: true })}>
              Accept all
            </button>
          </>
        )}
      </div>
      {!details && (
        <button type="button" className="mt-2 inline-flex min-h-11 items-center text-[13px] text-night" onClick={() => setDetails(true)}>
          <span className="lnk">Choose for myself</span>
        </button>
      )}
    </section>
  );
}

function Purpose({ id, label, note, checked, disabled = false, onChange }: { id: string; label: string; note: string; checked: boolean; disabled?: boolean; onChange?: (v: boolean) => void }) {
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
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
