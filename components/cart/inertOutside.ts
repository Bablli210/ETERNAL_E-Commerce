/**
 * Makes everything outside a modal inert, so Tab, the screen-reader cursor and
 * taps stay inside it; returns the undo. Only siblings it changed are restored,
 * so two modals stacked in turn (the bag over a sheet) don't undo each other.
 * The bag uses it, and any other aria-modal panel should too (useModal).
 */
export function inertOutside(el: HTMLElement) {
  const changed: HTMLElement[] = [];
  for (let node: HTMLElement | null = el; node && node !== document.body; node = node.parentElement) {
    for (const sibling of Array.from(node.parentElement?.children ?? [])) {
      if (sibling !== node && sibling instanceof HTMLElement && !sibling.inert) {
        sibling.inert = true;
        changed.push(sibling);
      }
    }
  }
  return () => changed.forEach((s) => (s.inert = false));
}
