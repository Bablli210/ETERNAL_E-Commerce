"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment, useEffect, useRef } from "react";
import { motionAllowed } from "@/lib/motion";

export type CinemaImage = { src: string; alt: string };
type Base = { id: string; kicker: string; line: string };
export type CinemaScene =
  | (Base & { kind: "still"; img: CinemaImage | null; sub?: string; sign?: string; short?: boolean })
  | (Base & { kind: "lines"; bands: { name: string; meta: string; href: string; img: CinemaImage | null }[] })
  | (Base & { kind: "tales"; img: CinemaImage | null; sigs: { text: string; who: string; href: string }[]; more: { label: string; href: string } });
export type CinemaClose = { title: string; sub: string; primary: { label: string; href: string }; secondary: { label: string; href: string } };

const pad = (n: number) => String(n).padStart(2, "0");
const clamp = (v: number) => Math.min(1, Math.max(0, v));

/** A line split into words, so each can light as the scene plays. Screen readers still read it as one line. */
function Words({ text }: { text: string }) {
  const words = text.trim().split(/\s+/);
  return (
    <>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="cine-w">{w}</span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </>
  );
}

/**
 * The house as a film (Direction B, Cinema): full-screen scenes, each pinned
 * under the header while its line lights word by word, the next scene rising
 * over it. The three lines wipe in as bands; the tales scene turns through
 * their signature lines.
 *
 * Everything reads at rest. The page is complete before the script runs (all
 * words lit, every band and signature shown); only once the script knows
 * motion is allowed does it dim what is still to come (.is-live). Reduced
 * motion, or the visitor's motion switch, keeps that resting page.
 */
export function HouseCinema({ scenes, close }: { scenes: CinemaScene[]; close: CinemaClose }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const parts = Array.from(el.querySelectorAll<HTMLElement>("[data-scene]")).map((scene, i) => ({
      scene,
      pin: scene.querySelector<HTMLElement>(".cine-pin"),
      still: scene.querySelector<HTMLElement>(".cine-still"),
      words: Array.from(scene.querySelectorAll<HTMLElement>(".cine-w")),
      sub: scene.querySelector<HTMLElement>(".cine-sub"),
      bands: Array.from(scene.querySelectorAll<HTMLElement>(".cine-band-img")),
      sigs: Array.from(scene.querySelectorAll<HTMLElement>(".cine-sig")),
      first: i === 0,
    }));

    let frame = 0;
    const render = () => {
      frame = 0;
      const live = motionAllowed();
      el.classList.toggle("is-live", live);
      if (!live) return;
      const vh = window.innerHeight;
      for (const p of parts) {
        const r = p.scene.getBoundingClientRect();
        if (r.bottom < -vh || r.top > vh * 1.5) continue;
        const pinH = p.pin?.offsetHeight ?? vh;
        const pinTop = vh - pinH;
        // 0 as the scene pins under the header, 1 as it is about to leave; `enter` runs while it rises into view.
        const prog = clamp((pinTop - r.top) / Math.max(1, r.height - pinH));
        const enter = clamp(1 - (r.top - pinTop) / pinH);
        p.still?.style.setProperty("--zoom", (1.1 - 0.1 * prog).toFixed(4));
        if (!p.first) {
          const lit = Math.round(clamp(enter * 0.6 + prog * 1.4) * p.words.length);
          p.words.forEach((w, i) => w.classList.toggle("lit", i < lit));
          p.sub?.style.setProperty("--sub", (0.35 + 0.65 * clamp((prog - 0.15) / 0.3)).toFixed(3));
        }
        p.bands.forEach((b, i) => b.style.setProperty("--r", (1 - clamp((prog - i * 0.22) / 0.3)).toFixed(3)));
        if (p.sigs.length) {
          const k = Math.min(p.sigs.length - 1, Math.floor(prog * p.sigs.length * 0.999));
          p.sigs.forEach((g, i) => g.classList.toggle("on", i === k));
        }
      }
    };
    const request = () => {
      if (!frame) frame = window.requestAnimationFrame(render);
    };
    render();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    return () => {
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const total = scenes.length;
  return (
    <div ref={root} className="cinema">
      {scenes.map((s, i) => {
        const Title = i === 0 ? "h1" : "h2";
        return (
          <section key={s.id} data-scene className={`cine-scene ${s.kind === "still" && s.short ? "cine-short" : ""}`} aria-labelledby={`${s.id}-title`}>
            <div className="cine-pin">
              {s.kind === "lines" ? (
                <div className="cine-bands">
                  <header className="cine-bands-head">
                    <p className="cine-kicker">{s.kicker}</p>
                    <Title id={`${s.id}-title`} className="cine-line cine-line-sm">
                      <Words text={s.line} />
                    </Title>
                  </header>
                  {s.bands.map((b) => (
                    <Link key={b.name} href={b.href} className="cine-band group">
                      {b.img && <Image src={b.img.src} alt={b.img.alt} fill sizes="100vw" className="cine-band-img object-cover" />}
                      <span className="cine-veil" aria-hidden="true" />
                      <span className="cine-band-label">
                        <span className="cine-band-name">{b.name}</span>
                        <span className="cine-band-meta">{b.meta}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <>
                  {s.img && (
                    <div className="cine-still">
                      <Image src={s.img.src} alt={s.img.alt} fill sizes="100vw" priority={i === 0} className="object-cover" />
                    </div>
                  )}
                  <div className="cine-veil" aria-hidden="true" />
                  <div className="cine-copy">
                    <p className="cine-kicker">{s.kicker}</p>
                    <Title id={`${s.id}-title`} className="cine-line">
                      <Words text={s.line} />
                    </Title>
                    {s.kind === "still" && s.sub && (
                      <p className="cine-sub">
                        {s.sub}
                        {s.sign && <span className="cine-sign">{s.sign}</span>}
                      </p>
                    )}
                    {s.kind === "tales" && (
                      <>
                        <ul className="cine-sigs">
                          {s.sigs.map((g, k) => (
                            <li key={g.href} className={`cine-sig ${k === 0 ? "on" : ""}`}>
                              <Link href={g.href}>
                                <q>{g.text}</q>
                                <small>{g.who}</small>
                              </Link>
                            </li>
                          ))}
                        </ul>
                        <Link href={s.more.href} className="cine-more">
                          <span className="lnk lnk-quiet">{s.more.label}</span>
                        </Link>
                      </>
                    )}
                  </div>
                </>
              )}
              <span className="cine-count" aria-hidden="true">
                {pad(i + 1)} / {pad(total)}
              </span>
              {i === 0 && (
                <span className="cine-hint" aria-hidden="true">
                  Scroll
                </span>
              )}
            </div>
          </section>
        );
      })}
      <section className="cine-close" aria-labelledby="cine-close-title">
        <div>
          <h2 id="cine-close-title" className="cine-close-title">
            {close.title}
          </h2>
          <p className="cine-close-sub">{close.sub}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
            <Link href={close.primary.href} className="btn btn-light">
              {close.primary.label}
            </Link>
            <Link href={close.secondary.href} className="inline-flex min-h-11 items-center text-[13px] font-semibold">
              <span className="lnk lnk-quiet">{close.secondary.label}</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
