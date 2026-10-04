"use client";

import { useCallback, useEffect, useRef, type MouseEvent, type RefObject } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** The history entry an open panel owns, under this key in history.state with an id per opening. The bag keeps its own (eternalBag). */
const ENTRY = "eternalModal";

const entryId = (): string | null => {
  const id = (window.history.state as Record<string, unknown> | null)?.[ENTRY];
  return typeof id === "string" ? id : null;
};

/** True while the current history entry belongs to an open panel. */
export const onPanelEntry = () => entryId() !== null;

/**
 * Runs `fn` once a closing panel has given its history entry back, or at once
 * when no panel holds one. A scroll made before that Back lands would be
 * undone by it: the browser puts the page back where it was when the panel opened.
 */
export function afterPanelBack(fn: () => void) {
  if (!onPanelEntry()) return fn();
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    window.removeEventListener("popstate", run);
    window.clearTimeout(fallback);
    window.setTimeout(fn, 0);
  };
  window.addEventListener("popstate", run);
  const fallback = window.setTimeout(run, 500);
}

/**
 * Makes everything outside the dialog inert, so Tab, a screen reader's swipe
 * cursor and taps stay inside it. An element marked data-modal-keep stays
 * live: the search panel's backdrop, which sits outside the panel.
 */
function inertOutside(el: HTMLElement) {
  const changed: HTMLElement[] = [];
  for (let node: HTMLElement | null = el; node && node !== document.body; node = node.parentElement) {
    for (const sibling of Array.from(node.parentElement?.children ?? [])) {
      if (sibling !== node && sibling instanceof HTMLElement && !sibling.inert && !sibling.hasAttribute("data-modal-keep")) {
        sibling.inert = true;
        changed.push(sibling);
      }
    }
  }
  return () => changed.forEach((s) => (s.inert = false));
}

/**
 * A modal panel's housekeeping: the page behind stops scrolling and goes
 * inert, Tab and Shift+Tab wrap around inside the panel, and when it closes
 * focus goes back to whatever opened it (the menu or search button), so
 * keyboard and screen-reader users are not dropped at the top of the page.
 *
 * With `onClose`, the open panel also owns a history entry, as the bag does:
 * the phone's Back (Android, Instagram's arrow) closes the panel instead of
 * leaving the site, and a panel closed from its own X, backdrop or Escape
 * gives the entry back. Links inside the panel take `replace` and the click
 * handler from `follow(href)`, so the page they open takes the panel's entry
 * over instead of leaving it behind; `release()` does the same for a
 * navigation started in code (pass it to router.replace).
 */
export function useModal(panel: RefObject<HTMLElement | null>, initial?: RefObject<HTMLElement | null>, onClose?: () => void) {
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });
  /** This panel's history entry while it holds one. */
  const entry = useRef<string | null>(null);
  const live = useRef(false);

  useEffect(() => {
    const root = panel.current;
    if (!root) return;
    live.current = true;
    const opener = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null;
    (initial?.current ?? root).focus({ preventScroll: true });

    const body = document.body;
    const overflow = body.style.overflow;
    body.style.overflow = "hidden";
    const restoreInert = inertOutside(root.closest<HTMLElement>('[role="dialog"]') ?? root);

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.tabIndex >= 0 && el.getClientRects().length > 0);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    root.addEventListener("keydown", onKey);

    if (close.current && !entry.current) {
      entry.current = Math.random().toString(36).slice(2);
      window.history.pushState({ [ENTRY]: entry.current }, "");
    }
    // Back left this panel's entry. A Back that lands on it (a panel opened over this one closing) is not for this panel.
    const onPop = () => {
      if (!entry.current || entryId() === entry.current) return;
      entry.current = null;
      close.current?.();
    };
    window.addEventListener("popstate", onPop);

    return () => {
      live.current = false;
      root.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPop);
      restoreInert();
      body.style.overflow = overflow;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
      // Closed from inside: give the entry back, so the next Back leaves the page in one press. A tick later,
      // because React's development double run re-opens the panel at once, and that panel keeps the entry.
      window.setTimeout(() => {
        const id = entry.current;
        if (live.current || !id) return;
        entry.current = null;
        if (entryId() === id) window.history.back();
      }, 0);
    };
  }, [panel, initial]);

  const release = useCallback(() => {
    entry.current = null;
  }, []);

  const follow = useCallback(
    (href: string) => (e: MouseEvent) => {
      // A new tab or window leaves this page and the panel as they are.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const to = new URL(href, window.location.href);
      // A link to the page already open only closes the panel; the panel's own Back takes its entry away.
      if (e.defaultPrevented || (to.pathname === window.location.pathname && to.search === window.location.search)) e.preventDefault();
      else release();
      close.current?.();
    },
    [release],
  );

  return { follow, release };
}
