"use client";

import { CONSENT_COOKIE, consentOrDefault, cookieValues, latestConsent, type Consent } from "@/lib/consent";

/**
 * Reading the visitor's cookie choice in the browser. Kept apart from
 * lib/client/consent.ts (which keeps the choice and applies it) so the
 * analytics and attribution code can ask without importing it back.
 */
export const readCookie = (name: string) => (typeof document === "undefined" ? null : (cookieValues(document.cookie, name)[0] ?? null));

/** The visitor's choice (of two copies, host and root domain, the newer), else the default (lib/consent.ts DEFAULT_CONSENT). */
export const readConsent = (): Consent | null => (typeof document === "undefined" ? null : consentOrDefault(latestConsent(cookieValues(document.cookie, CONSENT_COOKIE))));

/** True only when the visitor said yes to this purpose. */
export const allowed = (purpose: "analytics" | "marketing") => Boolean(readConsent()?.[purpose]);
