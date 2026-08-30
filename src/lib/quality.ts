/** Content quality gate.
 *
 *  The Internet Archive's `movies` mediatype means *any* moving image — phone
 *  clips, screen recordings, vlogs, adverts. A licence check alone cannot tell a
 *  film from someone's camera roll, which is how "IMG 0057" and
 *  "VID 20250819 WA 0001" ended up published as public-domain cinema.
 *
 *  This runs on every candidate regardless of licence, before the licence gate's
 *  verdict is acted on. Junk is dropped, not queued — a review queue full of
 *  vlogs is worse than useless.
 */

/** Cinema begins ~1888 (Roundhay Garden Scene). Anything earlier is bad metadata,
 *  usually EXIF from a phone. */
export const EARLIEST_FILM_YEAR = 1888;

/** Camera-roll and screen-capture filenames used verbatim as titles. */
const DEVICE_FILENAME = [
  /^(img|vid|dsc|dscn|mov|mvi|gopro|pxl|wa)[ _-]?\d+/i,
  /^(video|photo|movie|clip|recording)[ _-]?\d{3,}/i,
  /whatsapp|screen[ _-]?rec|screencast|zoom[ _-]?\d|untitled[ _-]?\d+/i,
  /^\d{8,}/,                       // bare timestamps
  /_\d{9,}/,                       // epoch-ish ids embedded in the name
  /\(\s*\d{3,4}\s*p\s*\)/i,        // "(480p)" transcode suffixes
  /[_-](144|240|360|480|720|1080|1440|2160)p?$/i,  // trailing "_480" resolution
  /[_-]\d{6}[_-]\d{3,4}$/,        // "_230217_480" date+resolution tails
  // Release-group and file annotations: "[P&M] 1080p Blu-ray (7.7GB)".
  // Anchored from the first bracket that is followed by a technical token, so a
  // meaningful bracket like "[Restored Print]" is left alone.
  /\s*\[[^\]]{1,24}\](?=[^[]*\b(blu-?ray|bluray|dvdrip|webrip|hdrip|remux|\d{3,4}p|[\d.]+\s?[gm]b)\b).*$/i,
  /\s*\b(blu-?ray|bluray|dvdrip|webrip|hdrip|remux)\b.*$/i,
  /\s*\(\s*[\d.]+\s?[gm]b\s*\)\s*$/i,
];

export type QualityVerdict = { ok: boolean; reasons: string[] };

export type Candidate = {
  title?: string | null;
  description?: string | null;
  year?: number | null;
  runtime?: number | null;
};

/** TIER 1 — is this a film at all?
 *
 *  Hard reject. Nothing failing this is worth a human's time, so it never reaches
 *  the review queue. Deliberately excludes metadata richness: the Archive's records
 *  for genuine old films are often sparse, and dropping "Up the River" (1930)
 *  because nobody wrote a synopsis would defeat the point of the project. */
export function assessQuality(input: Candidate): QualityVerdict {
  const reasons: string[] = [];
  const title = (input.title ?? "").trim();

  if (!title) reasons.push("no title");
  else if (DEVICE_FILENAME.some((p) => p.test(title))) reasons.push("title looks like a device filename");

  const thisYear = new Date().getFullYear();
  if (input.year != null) {
    if (input.year < EARLIEST_FILM_YEAR) reasons.push(`year ${input.year} predates cinema`);
    else if (input.year > thisYear + 1) reasons.push(`year ${input.year} is in the future`);
  }

  return { ok: reasons.length === 0, reasons };
}

/** TIER 2 — the published bar.
 *
 *  What a title must have to go live WITHOUT a human looking at it. Failing this is
 *  not a rejection: it routes to the review queue instead. A sparse record can still
 *  become a fine page once a person confirms the rights and fills the gaps. */
/** The free catalogue is a CLASSIC film section. A modern upload can be perfectly
 *  legal to publish and still not belong there — a 2024 Minetest tutorial under CC0
 *  passes every rights check and is not cinema. Titles after this year route to
 *  review rather than auto-publishing into the classic catalogue. */
export const CLASSIC_ERA_ENDS = 1980;

export function meetsPublishBar(
  input: Candidate,
  opts: { minDescription?: number; classicOnly?: boolean } = {},
): QualityVerdict {
  const minDescription = opts.minDescription ?? 80;
  const classicOnly = opts.classicOnly ?? true;
  const reasons: string[] = [];

  const base = assessQuality(input);
  reasons.push(...base.reasons);

  if (input.year == null) reasons.push("no year");
  else if (classicOnly && input.year > CLASSIC_ERA_ENDS) {
    reasons.push(`released ${input.year} — the free catalogue is classic cinema (pre-${CLASSIC_ERA_ENDS + 1})`);
  }

  const description = (input.description ?? "").trim();
  if (description.length < minDescription) {
    reasons.push(`description too thin (${description.length} < ${minDescription} chars)`);
  }

  return { ok: reasons.length === 0, reasons };
}

/** Ensures slugs are unique. The importer previously only checked the in-memory
 *  batch, so repeated runs produced three records sharing one slug — and three
 *  pages competing for one URL. */
export function uniqueSlug(base: string, taken: Set<string>, fallbackId: string): string {
  const slug = base || fallbackId;
  if (!taken.has(slug)) { taken.add(slug); return slug; }

  const suffixed = `${slug}-${fallbackId}`.slice(0, 90);
  if (!taken.has(suffixed)) { taken.add(suffixed); return suffixed; }

  let n = 2;
  while (taken.has(`${suffixed}-${n}`)) n++;
  const final = `${suffixed}-${n}`;
  taken.add(final);
  return final;
}

/** Archive uploaders often append encoding details, credits and the year to the
 *  title field: "Bed Time / Dave Fleischer / DVD / x264 / MKV". That string becomes
 *  the page <title> and the primary SEO signal, so it is worth cleaning — but
 *  conservatively, since over-trimming would mangle real titles. */
/** Format/codec/container tokens uploaders append after slashes. */
const FORMAT_TOKEN = /^(dvd|vhs|bluray|blu-ray|web|webrip|hdtv|divx|xvid|x26[45]|h\.?26[45]|mkv|avi|mp4|m4v|mpe?g\d?|ogg|ogv|flv|wmv|ia|\d{3,4}p)$/i;

const TITLE_CRUFT = [
  /\s*\(\s*\d{3,4}\s*p\s*\)\s*$/i,
  /\s*\b(1080p|720p|480p|360p|4k|hd|sd)\b\s*$/i,
  /\s*[-–—]\s*(complete|full movie|full film|restored|remastered)\s*$/i,
  // Release-group and file annotations: "[P&M] 1080p Blu-ray (7.7GB)". Anchored on
  // a bracket followed by a technical token, so "[Restored Print]" survives.
  /\s*\[[^\]]{1,24}\](?=[^[]*\b(blu-?ray|bluray|dvdrip|webrip|hdrip|remux|\d{3,4}p|[\d.]+\s?[gm]b)\b).*$/i,
  /\s*\b(blu-?ray|bluray|dvdrip|webrip|hdrip|remux)\b.*$/i,
  /\s*\(\s*[\d.]+\s?[gm]b\s*\)\s*$/i,
];

export function cleanTitle(raw: string | null | undefined): string {
  let t = (raw ?? "").trim();
  if (!t) return "";

  // "Title / Director / DVD / x264 / MKV" — when any slash-separated segment is a
  // format token, the whole chain is uploader bookkeeping and the film title is
  // the first segment. Requiring a format token keeps titles that legitimately
  // contain a slash intact.
  if (t.includes("/")) {
    const parts = t.split("/").map((x) => x.trim());
    if (parts.length > 1 && parts.slice(1).some((x) => FORMAT_TOKEN.test(x))) {
      t = parts[0];
    }
  }

  for (const p of TITLE_CRUFT) t = t.replace(p, "").trim();

  // Strip wrapping quotes an uploader added: "Home, Sweet Home" (1914) director ...
  const quoted = t.match(/^"([^"]{2,})"\s*(?:\(\d{4}\))?\s*(?:(?:director|starring|dir\.?|with)\b.*)?$/i);
  if (quoted) t = quoted[1].trim();

  // "Title (1924) starring Someone" -> "Title"
  t = t.replace(/\s*\(\d{4}\)\s*(?:starring|director|dir\.?|with)\b.*$/i, "").trim();

  return t.replace(/\s{2,}/g, " ").replace(/[\s,;/|-]+$/, "").trim();
}

/** Archive runtime metadata is inconsistent: "1:23:45", "83 min", "4980", or absent.
 *  Reading it as a bare Number left every record with no duration, so pages showed
 *  no runtime and the VideoObject markup omitted it. */
export function parseRuntime(raw: unknown): number | null {
  if (raw == null) return null;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw > 0 ? Math.round(raw) : null;

  const s = String(raw).trim();
  if (!s) return null;

  // HH:MM:SS or MM:SS
  const clock = s.match(/^(?:(\d+):)?(\d{1,2}):(\d{2})(?:\.\d+)?$/);
  if (clock) {
    const [, h, m, sec] = clock;
    const total = (Number(h ?? 0) * 3600) + (Number(m) * 60) + Number(sec);
    return total > 0 ? total : null;
  }

  // "83 min", "83 minutes", "1.5 hours"
  const unit = s.match(/^([\d.]+)\s*(sec|secs|seconds|min|mins|minutes|hour|hours|hr|hrs)\b/i);
  if (unit) {
    const n = Number(unit[1]);
    if (!Number.isFinite(n) || n <= 0) return null;
    const u = unit[2].toLowerCase();
    if (u.startsWith("sec")) return Math.round(n);
    if (u.startsWith("min")) return Math.round(n * 60);
    return Math.round(n * 3600);
  }

  const bare = Number(s);
  return Number.isFinite(bare) && bare > 0 ? Math.round(bare) : null;
}

/** Archive `subject` fields arrive either as an array or as one delimited string
 *  ("retro programming;vlogging;BASIC"). Stored whole, that becomes a single
 *  enormous "genre" and the genre index fills with unusable one-off entries. */
export function splitGenres(raw: unknown, limit = 6): string[] {
  const parts = (Array.isArray(raw) ? raw : [raw])
    .filter((x) => x != null)
    .flatMap((x) => String(x).split(/[;,|]/))
    .map((g) => g.trim().replace(/\s{2,}/g, " "))
    .filter((g) => g.length > 1 && g.length <= 40);

  const seen = new Set<string>();
  const out: string[] = [];
  for (const g of parts) {
    const key = g.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(g);
    if (out.length >= limit) break;
  }
  return out;
}

/** Archive uploaders often paste a synopsis from IMDb or Wikipedia into the
 *  description field. A film's licence covers the FILM, not third-party text
 *  attached to its record: IMDb's terms forbid republication outright, and
 *  Wikipedia's CC BY-SA requires attribution and share-alike we do not provide.
 *
 *  Detected descriptions are discarded rather than served. Losing the text drops
 *  the record below the publish bar, so it lands in review — the safe direction. */
const BORROWED_TEXT = /\b(taken from imdb|from imdb|source:\s*imdb|imdb\.com|courtesy of imdb|from wikipedia|source:\s*wikipedia|wikipedia\.org|reprinted from)\b/i;

export function descriptionIsBorrowed(description: string | null | undefined): boolean {
  return BORROWED_TEXT.test(description ?? "");
}

/** Returns a description safe to publish, or "" when it quotes a third party. */
export function safeDescription(description: string | null | undefined): string {
  const d = (description ?? "").trim();
  return descriptionIsBorrowed(d) ? "" : d;
}
