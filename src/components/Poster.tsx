"use client";
import { useEffect, useRef, useState } from "react";

/** TMDB serves each poster at fixed widths, and the catalogue stores the w780
 *  one (~150 KB). A 200px card on a 1x screen needs only w342 (~40 KB), so offer
 *  the smaller widths and let the browser pick from `sizes`. */
const TMDB_SIZE = /^(https:\/\/image\.tmdb\.org\/t\/p\/)w\d+(\/.+)$/;
const TMDB_WIDTHS = [342, 500, 780];

function tmdbSrcSet(src: string): string | undefined {
  const m = TMDB_SIZE.exec(src);
  if (!m) return undefined;
  return TMDB_WIDTHS.map((w) => `${m[1]}w${w}${m[2]} ${w}w`).join(", ");
}

/** Archive.org poster with a typographic fallback.
 *
 *  Catalogue thumbnails are frequently missing, and a broken image looks worse
 *  than none. Note the mount check: an image that fails before hydration never
 *  fires onError, so we re-test complete/naturalWidth once the ref is attached.
 */
export default function Poster({
  src, title, year, className = "", priority = false,
  sizes = "(min-width: 1024px) 200px, (min-width: 640px) 33vw, 50vw",
}: {
  src: string | null;
  title: string;
  year: number | null;
  className?: string;
  /** Rendered width, for choosing a poster size. The default fits the card grids. */
  sizes?: string;
  /** Set on images above the fold. Lazy-loading the largest visible image
   *  delays the LCP, which is the metric that decides whether a page feels fast. */
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  const srcSet = src ? tmdbSrcSet(src) : undefined;

  if (!src || failed) {
    return (
      <div
        className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-ink-3 via-ink-2 to-ink p-4 text-center ${className}`}
      >
        <span aria-hidden className="text-lg text-brass/40">✦</span>
        <span className="display text-balance text-sm leading-tight text-cream/80">{title}</span>
        {year && <span className="text-[11px] tracking-widest text-brass/60">{year}</span>}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote host is deliberately outside next/image's allowlist
    <img
      ref={ref}
      src={src}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={`${title} poster`}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      onError={() => setFailed(true)}
      className={`h-full w-full object-cover ${className}`}
    />
  );
}
