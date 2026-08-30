"use client";
import { useEffect, useRef, useState } from "react";

/** Archive.org poster with a typographic fallback.
 *
 *  Catalogue thumbnails are frequently missing, and a broken image looks worse
 *  than none. Note the mount check: an image that fails before hydration never
 *  fires onError, so we re-test complete/naturalWidth once the ref is attached.
 */
export default function Poster({
  src, title, year, className = "", priority = false,
}: {
  src: string | null;
  title: string;
  year: number | null;
  className?: string;
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
      alt={`${title} poster`}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      onError={() => setFailed(true)}
      className={`h-full w-full object-cover ${className}`}
    />
  );
}
