"use client";

import { useState, type FormEvent } from "react";
import { track } from "@/lib/client/analytics";

type Status = "idle" | "sending" | "done" | "error";

/**
 * The newsletter join, on Shopify's customer form (form_type=customer, tagged
 * newsletter). It posts from the page with fetch so the visitor stays here and
 * gets the thank-you in place, instead of landing on the Shopify storefront
 * with no way back. Shopify answers another origin opaquely (no-cors), so only
 * a network failure is visible; that shows an inline retry. Without
 * JavaScript the same form posts in a new tab.
 */
export function JoinForm({ shopDomain }: { shopDomain: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const action = `https://${shopDomain}/contact#contact_form`;

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const body = new URLSearchParams();
    new FormData(e.currentTarget).forEach((v, k) => body.append(k, String(v)));
    setStatus("sending");
    try {
      await fetch(action, { method: "POST", mode: "no-cors", body });
      setStatus("done");
      track({ name: "generate_lead", method: "newsletter" });
    } catch {
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div role="status" className="flex min-h-[52px] flex-col justify-center">
        <p className="display-m text-linen">You’re on the list.</p>
        <p className="mt-1 text-[14px] text-dune">One email when something new arrives. Unsubscribe any time.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <form method="post" action={action} target="_blank" acceptCharset="UTF-8" onSubmit={submit} className="flex w-full max-w-[560px] flex-col gap-3 sm:flex-row">
        <input type="hidden" name="form_type" value="customer" />
        <input type="hidden" name="utf8" value="✓" />
        <input type="hidden" name="contact[tags]" value="newsletter" />
        <label className="sr-only" htmlFor="join-email">
          Email address
        </label>
        <input id="join-email" type="email" name="contact[email]" required autoComplete="email" enterKeyHint="send" placeholder="Email address" className="field field-dark sm:flex-1" />
        <button type="submit" className="btn btn-light sm:w-[132px]" disabled={status === "sending"}>
          {status === "sending" ? "Joining…" : "Join"}
        </button>
      </form>
      {status === "error" ? (
        <p role="alert" className="text-[13px] text-linen">
          That didn’t go through. Please check your connection and try again.
        </p>
      ) : (
        <p className="text-[12px] text-dune">One email when something new arrives. Unsubscribe any time.</p>
      )}
    </div>
  );
}
