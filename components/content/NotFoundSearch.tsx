"use client";

import Form from "next/form";
import { useEffect } from "react";
import { track } from "@/lib/client/analytics";

/**
 * The 404's search, by name or by the original a visitor knows; it lands on
 * the shop's results and works before the page hydrates. Mounting it logs
 * not_found with the path and its query, so a broken ad link shows up in the
 * reports with the utm_content that names the ad. Click ids are dropped: they
 * are long, name no ad, and would push the rest past GA's 100-character limit.
 */
export function NotFoundSearch() {
  useEffect(() => {
    const url = new URL(window.location.href);
    for (const id of ["fbclid", "gclid", "ttclid"]) url.searchParams.delete(id);
    track({ name: "ui", action: "not_found", label: `${url.pathname}${url.search}`.slice(0, 100) });
  }, []);
  return (
    <Form
      action="/shop"
      role="search"
      className="flex gap-2"
      onSubmit={(e) => {
        const term = new FormData(e.currentTarget).get("q");
        if (typeof term === "string" && term.trim()) track({ name: "search", term: term.trim() });
      }}
    >
      <label htmlFor="not-found-q" className="sr-only">
        Search by name, or by the original you love
      </label>
      <input id="not-found-q" name="q" type="search" required placeholder="Scent or original" className="field min-w-0 flex-1 !text-[16px]" />
      <button type="submit" className="btn shrink-0 px-5">
        Search
      </button>
    </Form>
  );
}
