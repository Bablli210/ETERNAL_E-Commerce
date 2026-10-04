"use client";

import { useRef, useState, type FormEvent } from "react";
import { track } from "@/lib/client/analytics";

type Status = "idle" | "sending" | "done" | "invalid" | "error";

/**
 * The newsletter join, on Shopify's customer form (form_type=customer, tagged
 * newsletter). The page posts the email to /api/join, which hands it to
 * Shopify from the server and reports what Shopify answered, so the visitor
 * stays here and is thanked only once the signup has gone through (and only
 * then is a Lead reported). If it fails, the visitor can send the same form to
 * Shopify's own page in a new tab. Without JavaScript the form posts there
 * directly.
 */
export function JoinForm({ shopDomain }: { shopDomain: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const form = useRef<HTMLFormElement>(null);
  const action = `https://${shopDomain}/contact#contact_form`;

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("contact[email]") ?? "").trim();
    setStatus("sending");
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        signal: typeof AbortSignal.timeout === "function" ? AbortSignal.timeout(15_000) : undefined,
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; reason?: string };
      if (res.ok && json.ok) {
        setStatus("done");
        track({ name: "generate_lead", method: "newsletter" });
        return;
      }
      setStatus(json.reason === "invalid_email" ? "invalid" : "error");
    } catch {
      setStatus("error");
    }
  };

  /** Shopify's own form page, in a new tab, with the email already in the form. */
  const openShopifyForm = () => {
    const f = form.current;
    if (f?.reportValidity()) f.submit();
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
      <form ref={form} method="post" action={action} target="_blank" acceptCharset="UTF-8" onSubmit={submit} className="flex w-full max-w-[560px] flex-col gap-3 sm:flex-row">
        <input type="hidden" name="form_type" value="customer" />
        <input type="hidden" name="utf8" value="✓" />
        <input type="hidden" name="contact[tags]" value="newsletter" />
        <label className="sr-only" htmlFor="join-email">
          Email address
        </label>
        <input id="join-email" type="email" name="contact[email]" required autoComplete="email" enterKeyHint="send" placeholder="Email address" aria-invalid={status === "invalid" || undefined} aria-describedby="join-note" className="field field-dark sm:flex-1" />
        <button type="submit" className="btn btn-light sm:w-[132px]" disabled={status === "sending"}>
          {status === "sending" ? "Joining…" : "Join"}
        </button>
      </form>
      {status === "invalid" ? (
        <p id="join-note" role="alert" className="text-[13px] text-linen">
          That email address doesn’t look right. Please check it and try again.
        </p>
      ) : status === "error" ? (
        <div id="join-note" role="alert" className="text-[13px] text-linen">
          <p>We couldn’t add you just now. Try again in a moment, or join on our store’s sign-up page.</p>
          <button type="button" onClick={openShopifyForm} className="-ml-1 inline-flex min-h-11 items-center px-1 text-[13px] font-semibold underline decoration-dune underline-offset-4 hover:decoration-linen">
            Open the sign-up page<span className="sr-only"> (opens in a new tab)</span>
          </button>
        </div>
      ) : (
        <p id="join-note" className="text-[12px] text-dune">
          One email when something new arrives. Unsubscribe any time.
        </p>
      )}
    </div>
  );
}
