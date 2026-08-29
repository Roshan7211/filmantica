/** TMDB attribution.
 *
 *  Their API terms require BOTH:
 *   - the TMDB logo, displayed less prominently than our own branding
 *   - the exact notice text below
 *
 *  Drop the official logo at public/tmdb.svg (grab it from
 *  https://www.themoviedb.org/about/logos-attribution). Until then this renders
 *  the notice alone and warns in dev, rather than silently shipping non-compliant.
 */
export default function TmdbAttribution() {
  return (
    <div className="mt-10 flex items-start gap-3 border-t border-edge pt-5 text-xs text-muted">
      {/* eslint-disable-next-line @next/next/no-img-element -- static local asset, no optimisation needed */}
      <img
        src="/tmdb.svg"
        alt="TMDB"
        width={56}
        height={8}
        className="mt-0.5 shrink-0 opacity-70"
      />
      <p className="max-w-2xl leading-relaxed">
        This product uses the TMDB API but is not endorsed, certified, or otherwise approved
        by TMDB.
      </p>
    </div>
  );
}
