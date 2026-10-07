import type { DashData, SourceChip, TierState, TrackStatus } from "@/lib/dashboard/types";
import { pct, plural, rangeText } from "./format";
import { Pill, Section } from "./ui";

/** Each source's state as a mark and a word as well as a colour: ✓ read, ! partly, × not read. */
export function SourceChips({ sources }: { sources: SourceChip[] }) {
  if (!sources.length) return null;
  return (
    <ul className="src-chips" aria-label="Sources">
      {sources.map((s) => {
        const tone = s.ok === true ? "ok" : s.ok === false ? "bad" : "warn";
        return (
          <li key={s.label} className={`src-chip ${tone}`}>
            <span className="src-mark" aria-hidden="true">
              {s.ok === true ? "✓" : s.ok === false ? "×" : "!"}
            </span>
            <span>
              <span className="vh">{s.ok === true ? "Working: " : s.ok === false ? "Not working: " : "Partly or not checked: "}</span>
              {s.label}
              {s.note ? <span className="src-note"> · {s.note}</span> : null}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

const LEVEL_WORD = { critical: "Urgent", warning: "Soon", info: "Note" } as const;

export function Attention({ items }: { items: DashData["status"]["attention"] }) {
  return (
    <Section id="h-att" title="Needs attention" sub={items.length ? `${plural(items.length, "open item")}` : undefined}>
      {items.length ? (
        <ul className="attn">
          {items.map((a) => (
            <li key={a.title} className="attn-item">
              <Pill tone={a.level}>{LEVEL_WORD[a.level]}</Pill>
              <div>
                <strong>{a.title}</strong>
                <p>{a.detail}</p>
                {a.owner ? <p className="who">Who: {a.owner}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="quiet-line">Nothing needs attention right now.</p>
      )}
    </Section>
  );
}

const TRACK_WORD: Record<TrackStatus, string> = { ok: "Working", partial: "Partly", missing: "Not set up", blocked: "Blocked", unknown: "Can’t check here" };

export function Tracking({ items }: { items: DashData["tracking"]["items"] }) {
  if (!items.length) return null;
  const working = items.filter((i) => i.status === "ok").length;
  return (
    <Section id="h-trk" title="Can we trust the data?" sub={`${working} of ${items.length} working.`}>
      <ul className="card checks">
        {items.map((i) => (
          <li key={i.label} className="check">
            <Pill tone={i.status}>{TRACK_WORD[i.status] ?? i.status}</Pill>
            <div>
              <strong>{i.label}</strong>
              <p>{i.detail}</p>
              {i.action ? (
                <p className="act">
                  Next: {i.action}
                  {i.owner ? ` · ${i.owner}` : ""}
                </p>
              ) : null}
              {i.href ? (
                <p className="act">
                  <a href={i.href} target="_blank" rel="noopener noreferrer">
                    Open in Vercel<span className="vh"> (opens in a new tab)</span>
                  </a>
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

const NOTE_WORD = { risk: "Risk", win: "Working", next: "Next step" } as const;

export function Notes({ notes }: { notes: DashData["notes"] }) {
  if (!notes.items.length) return null;
  return (
    <Section
      id="h-notes"
      title={notes.headline || "This week’s read"}
      sub={notes.basis ? `From the figures for ${rangeText(notes.basis)} · updates with every refresh` : undefined}
    >
      <ul className="notes">
        {notes.items.map((n) => (
          <li key={n.title} className={`note ${n.kind}`}>
            <span className="label">{NOTE_WORD[n.kind]}</span>
            <h3>{n.title}</h3>
            <p>{n.body}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function Foot({ dayLabel }: { dayLabel: string }) {
  return (
    <footer className="foot">
      <dl>
        <dt>Net sales</dt>
        <dd>Shopify sales after discounts and returns, before shipping.</dd>
        <dt>Return on ad spend</dt>
        <dd>Purchase value Meta attributes to its ads, divided by what the ads cost. Above 1 means the ads brought back more than they cost.</dd>
        <dt>Match quality</dt>
        <dd>Meta&rsquo;s 0–10 score for how well an event can be matched to a person. Higher means better targeting and reporting.</dd>
        <dt>Orders</dt>
        <dd>Every order, including cash on delivery orders that were later cancelled; Shopify counts a cancellation as a return.</dd>
      </dl>
      <p>Sources: Shopify Analytics and Admin, Meta Ads Manager and Events Manager. Figures are in Egyptian pounds. {dayLabel}</p>
    </footer>
  );
}

const TIER_WORD: Record<TierState, string> = {
  ok: "Read",
  off: "No key set",
  no_permission: "Not allowed with this key",
  unsettled: "Refused: unpaid balance",
  throttled: "Slowed down by Meta",
  key_invalid: "Key rejected",
  error: "Failed",
};
const TIER_TONE: Record<TierState, string> = {
  ok: "ok",
  off: "unknown",
  no_permission: "unknown",
  unsettled: "blocked",
  throttled: "partial",
  key_invalid: "blocked",
  error: "blocked",
};
const CHECK_WORD = { ok: "OK", warn: "Check", fail: "Failed" } as const;
const CHECK_TONE = { ok: "ok", warn: "partial", fail: "blocked" } as const;
const CHECK_NAME: Record<string, string> = {
  env: "Settings in Vercel",
  token: "App token",
  version: "API version",
  scopes: "Permissions",
  shop: "Store details",
  shopifyql: "Analytics access",
  request: "Reading the store",
};
const PART_NAME: Record<string, string> = { ads: "Ad figures", pixel: "Website events", audiences: "Audiences", matchQuality: "Match quality" };

/** Owners only: how each source's read went, for when a figure looks wrong. */
export function OwnerDetails({ admin }: { admin: NonNullable<DashData["admin"]> }) {
  const states = Object.entries(admin.meta.states);
  return (
    <details className="owner">
      <summary>
        <h2>Owner details</h2>
        <span className="small">Shopify&rsquo;s self-checks and how Meta answered. Only owners see this.</span>
      </summary>
      <div className="owner-body">
        <div className="card">
          <h3>Shopify self-checks</h3>
          {admin.shopifyChecks.length ? (
            <ul className="checks">
              {admin.shopifyChecks.map((c) => (
                <li key={c.id} className="check">
                  <Pill tone={CHECK_TONE[c.level]}>{CHECK_WORD[c.level]}</Pill>
                  <div>
                    <strong>{CHECK_NAME[c.id] ?? c.id}</strong>
                    <p>{c.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="small card-sub">No self-checks ran with this read.</p>
          )}
          <h3 className="card-h">Panels Shopify didn&rsquo;t give</h3>
          {admin.shopifyHidden.length ? (
            <ul className="checks">
              {admin.shopifyHidden.map((h) => (
                <li key={h.panel} className="check">
                  <Pill tone="unknown">Hidden</Pill>
                  <div>
                    <strong>{h.panel}</strong>
                    <p>{h.reason}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="small card-sub">None: every panel was read.</p>
          )}
        </div>
        <div className="card">
          <h3>Meta</h3>
          {states.length ? (
            <ul className="checks states">
              {states.map(([part, state]) => (
                <li key={part} className="state-row">
                  <strong>{PART_NAME[part] ?? part}</strong>
                  <Pill tone={TIER_TONE[state] ?? "unknown"}>{TIER_WORD[state] ?? state}</Pill>
                </li>
              ))}
            </ul>
          ) : (
            <p className="small card-sub">No Meta read to report.</p>
          )}
          <p className="small card-foot">
            Meta&rsquo;s own usage reading from the last call: {admin.meta.tier ? `${admin.meta.tier.replace(/_/g, " ")} tier, ` : "tier not reported, "}
            {admin.meta.maxPct !== null ? `${pct(admin.meta.maxPct / 100)} of its limit at the highest` : "no usage figure"} ·{" "}
            {plural(admin.meta.calls, "call")} in the last read.
          </p>
        </div>
      </div>
    </details>
  );
}
