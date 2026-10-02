/** TMDB image sizing.
 *
 *  TMDB serves each poster at fixed widths, and the catalogue stores the w780
 *  one (~150 KB). Anything drawn smaller should ask for a smaller width: a
 *  200px card needs w342 at 1x, and a 32px search thumbnail needs only w92.
 */
const TMDB_SIZE = /^(https:\/\/image\.tmdb\.org\/t\/p\/)w\d+(\/.+)$/;
const SRCSET_WIDTHS = [342, 500, 780];

/** The same TMDB image at another width; any other URL is returned unchanged. */
export function tmdbSized(src: string, width: number): string {
  const m = TMDB_SIZE.exec(src);
  return m ? `${m[1]}w${width}${m[2]}` : src;
}

/** A srcset of the widths worth offering for posters, or undefined for non-TMDB URLs. */
export function tmdbSrcSet(src: string): string | undefined {
  if (!TMDB_SIZE.test(src)) return undefined;
  return SRCSET_WIDTHS.map((w) => `${tmdbSized(src, w)} ${w}w`).join(", ");
}
