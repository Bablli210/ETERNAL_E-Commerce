/**
 * Small pieces every dashboard section shares: the section frame and its
 * heading row, the quiet card that stands in for figures a source could not
 * give, status pills (always a word, never colour alone) and scrollable
 * table boxes.
 */

export function Section({ id, title, sub, children }: { id: string; title: string; sub?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="sect" aria-labelledby={id}>
      <div className="head">
        <h2 id={id}>{title}</h2>
        {sub ? <p className="small">{sub}</p> : null}
      </div>
      {children}
    </section>
  );
}

/** Why a part of the page has no figures, said plainly in place of zeros. */
export function Gap({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`quiet ${className}`}>
      <span className="label">Not available</span>
      <p>{children}</p>
    </div>
  );
}

export function Pill({ tone, children }: { tone: string; children: React.ReactNode }) {
  return <span className={`dash-pill ${tone}`}>{children}</span>;
}

/**
 * A table that may be wider than a phone: it scrolls inside its card, never
 * the page. Wide tables get a label and a tab stop so a keyboard can scroll
 * them too.
 */
export function TableBox({ label, wide = false, children }: { label?: string; wide?: boolean; children: React.ReactNode }) {
  return wide ? (
    <div className="tablebox" role="region" aria-label={label} tabIndex={0}>
      {children}
    </div>
  ) : (
    <div className="tablebox">{children}</div>
  );
}
