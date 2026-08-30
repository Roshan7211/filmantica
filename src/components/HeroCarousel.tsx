"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Poster from "./Poster";
import type { DiscoveryTitle } from "@/lib/discovery-types";

/** Newly released titles as a horizontal rail.
 *
 *  A single hero image shows one film; a rail shows fifteen in the same space and
 *  tells a visitor immediately that the catalogue is current. Cards are larger
 *  than the grid's so the posters carry at a glance.
 *
 *  Scrolling is native with snap points — it works with a trackpad, a touch
 *  swipe, and arrow keys before any JavaScript runs. The buttons are an
 *  enhancement on top, not the mechanism.
 */
export default function HeroCarousel({ titles }: { titles: DiscoveryTitle[] }) {
  const rail = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const sync = useCallback(() => {
    const el = rail.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    sync();
    const el = rail.current;
    if (!el) return;
    // Re-check on resize: a wider viewport can make the rail non-scrollable.
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [sync]);

  const scrollBy = (dir: 1 | -1) => {
    const el = rail.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.8), behavior: "smooth" });
  };

  if (!titles.length) return null;

  const arrow =
    "absolute top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full " +
    "border border-edge bg-ink/90 p-2.5 text-cream shadow-lg backdrop-blur transition " +
    "hover:border-brass hover:text-brass disabled:opacity-0 sm:flex";

  return (
    <section className="mb-14">
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <h2 className="display text-xl">Just released</h2>
          <p className="mt-1 text-xs text-muted">
            The newest films and series we track, free ones marked
          </p>
        </div>
        <Link href="/free" className="text-xs text-muted transition hover:text-brass">
          See everything free →
        </Link>
      </div>

      <div className="relative">
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scrollBy(-1)}
          disabled={atStart}
          className={`${arrow} -left-3`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div
          ref={rail}
          onScroll={sync}
          tabIndex={0}
          aria-label="Newly released titles"
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2
                     [scrollbar-width:none] focus-visible:outline-2 focus-visible:outline-brass
                     [&::-webkit-scrollbar]:hidden"
        >
          {titles.map((t, i) => {
            const free = t.options.free.length > 0;
            return (
              <Link
                key={t.id}
                href={`/discover/${t.slug}`}
                className="group w-[160px] shrink-0 snap-start sm:w-[200px]"
              >
                <div className="relative aspect-2/3 overflow-hidden rounded-lg border border-edge bg-ink-2
                                shadow-lg shadow-black/40 transition group-hover:border-brass/60">
                  <Poster
                    src={t.posterUrl}
                    title={t.title}
                    year={t.year}
                    priority={i < 4}
                    className="transition duration-500 group-hover:scale-105"
                  />
                  {free && (
                    <span className="absolute left-2 top-2 rounded bg-brass px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-ink">
                      FREE
                    </span>
                  )}
                  {t.rating ? (
                    <span className="absolute right-2 top-2 rounded bg-ink/85 px-1.5 py-0.5 text-[11px] font-medium text-brass ring-1 ring-brass/30">
                      ★ {t.rating.toFixed(1)}
                    </span>
                  ) : null}
                </div>
                <h3 className="display mt-2 line-clamp-2 text-sm leading-snug">{t.title}</h3>
                <p className="mt-0.5 text-xs text-muted">
                  {t.year}
                  {free && <span className="text-brass"> · Free</span>}
                </p>
              </Link>
            );
          })}
        </div>

        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scrollBy(1)}
          disabled={atEnd}
          className={`${arrow} -right-3`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </section>
  );
}
