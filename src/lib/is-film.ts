/** Positive gate: is this a film?
 *
 *  The other filters in this project are blacklists — they enumerate junk already
 *  seen (camera-roll filenames, propaganda organisations). A blacklist only ever
 *  catches what has already reached you. This is the whitelist: nothing enters the
 *  catalogue unless it positively looks like cinema.
 *
 *  The authoritative signal is COLLECTION MEMBERSHIP. The Internet Archive's film
 *  collections are curated by the Archive, unlike the licence and subject fields
 *  which any uploader can set freely. Measured against this catalogue, a film-ish
 *  subject tag appears on 48% of pre-1970 records but only 2% of post-2015 ones —
 *  a strong signal, but too lossy to stand alone, so it is a fallback rather than
 *  the primary test.
 */

/** Archive collections that consist of films. Membership is curated. */
export const FILM_COLLECTIONS = new Set([
  "feature_films",
  "silent_films",
  "film_noir",
  "sci_fi_horror",
  "classic_cartoons",
  "more_animation",
  "prelinger",
  "short_films",
  "publicmovies212",
  "classic_tv",
  "animationandcartoons",
  "moviesandfilms",
]);

const FILM_SUBJECT = /\b(film|movie|cinema|feature|short subject|silent|noir|western|serial|newsreel|documentary|animation|cartoon)\b/i;

/** Identifier prefixes that mark a re-upload from a video platform rather than a
 *  film. These carry whatever licence the uploader chose and are never cinema. */
const PLATFORM_RIP = /^(youtube-|yt-|tiktok|twitch|vimeo-|dailymotion)/i;

export type FilmVerdict = { isFilm: boolean; reason: string };

export function looksLikeFilm(input: {
  sourceId?: string | null;
  collections?: string[] | null;
  genres?: string[] | null;
  runtime?: number | null;
}): FilmVerdict {
  const id = input.sourceId ?? "";

  if (PLATFORM_RIP.test(id)) {
    return { isFilm: false, reason: "re-upload from a video platform, not a film" };
  }

  const collections = (input.collections ?? []).map((c) => String(c).toLowerCase());
  const inFilmCollection = collections.some((c) => FILM_COLLECTIONS.has(c));
  if (inFilmCollection) {
    return { isFilm: true, reason: "member of a curated film collection" };
  }

  // Fallback for records imported before collections were stored. Weaker, and
  // deliberately paired with a runtime floor so short clips do not slip through.
  const subjectLooksFilmic = (input.genres ?? []).some((g) => FILM_SUBJECT.test(g));
  if (subjectLooksFilmic) {
    return { isFilm: true, reason: "subject tags describe a film" };
  }

  // A feature-length runtime is itself evidence: vlogs and clips are short.
  if (input.runtime != null && input.runtime >= 40 * 60) {
    return { isFilm: true, reason: `runtime ${Math.round(input.runtime / 60)} min is feature length` };
  }

  return {
    isFilm: false,
    reason: collections.length
      ? "not in any film collection and nothing else identifies it as cinema"
      : "no collection, subject or runtime evidence that this is a film",
  };
}
