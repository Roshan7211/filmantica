/** Extracts a YouTube video id from the several URL shapes that circulate.
 *
 *  Kept as a pure function with its own tests because a wrong id renders an
 *  embed that fails silently — the page looks fine and the video simply never
 *  plays, which is the sort of bug nobody reports.
 */
const PATTERNS = [
  /[?&]v=([A-Za-z0-9_-]{11})(?![A-Za-z0-9_-])/,   // watch?v=ID
  /youtu\.be\/([A-Za-z0-9_-]{11})(?![A-Za-z0-9_-])/,
  /\/embed\/([A-Za-z0-9_-]{11})(?![A-Za-z0-9_-])/,
  /\/shorts\/([A-Za-z0-9_-]{11})(?![A-Za-z0-9_-])/,
  /\/v\/([A-Za-z0-9_-]{11})(?![A-Za-z0-9_-])/,
];

export function youtubeId(url: string | null | undefined): string | null {
  const s = (url ?? "").trim();
  if (!s) return null;

  // A bare id, already extracted.
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;

  for (const p of PATTERNS) {
    const m = s.match(p);
    if (m) return m[1];
  }
  return null;
}

/** youtube-nocookie.com does not set tracking cookies until playback begins,
 *  which is the difference between disclosing third-party tracking and not. */
export const youtubeEmbedUrl = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;

export const youtubeThumb = (id: string) =>
  `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
