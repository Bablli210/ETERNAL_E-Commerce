"use client";

import { useSyncExternalStore } from "react";

const EVENT = "eternal:storage";

/** Server snapshot sentinel: lets components tell "not hydrated yet" from "empty". */
export const SERVER_SNAPSHOT = "__server__";

export function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function readJSON<T>(key: string, fallback: T): T {
  return parseJSON(readRaw(key), fallback);
}

export function parseJSON<T>(raw: string | null, fallback: T): T {
  if (raw === null || raw === SERVER_SNAPSHOT) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode or blocked storage — the page still works for this visit */
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/**
 * localStorage as an external store. Returns the raw string (a stable
 * primitive), SERVER_SNAPSHOT on the server and during hydration, null when
 * nothing is stored. Parse with useMemo keyed on the string.
 */
export function useStoredRaw(key: string): string | null {
  return useSyncExternalStore(subscribe, () => readRaw(key), () => SERVER_SNAPSHOT);
}

export const RECENT_KEY = "eternal.recent.v1";

export function pushRecentlyViewed(handle: string, max = 8) {
  const list = readJSON<string[]>(RECENT_KEY, []).filter((h) => h !== handle);
  writeJSON(RECENT_KEY, [handle, ...list].slice(0, max));
}
