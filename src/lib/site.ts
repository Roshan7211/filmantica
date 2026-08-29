/** Site identity and canonical URL.
 *
 *  The URL is resolved defensively because it is used by `new URL()` inside
 *  `metadata`, which runs at module evaluation: a bad value does not degrade the
 *  page, it fails the entire build. An empty NEXT_PUBLIC_SITE_URL did exactly
 *  that — `??` only falls back on null/undefined, so "" passed straight through
 *  to new URL("") and threw ERR_INVALID_URL.
 */

const DEFAULT_URL = "https://filmantica.com";

/** new URL() is far more permissive than it looks — it happily parses
 *  "https://ht!tp://%%%" and reports the hostname as "ht!tp". Parsing alone is
 *  therefore not validation; the hostname has to look like a real domain. */
const VALID_HOSTNAME = /^(localhost|(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63})$/i;

/** First value that is a usable absolute URL wins; anything unusable is skipped
 *  rather than thrown. Vercel's own variables are consulted so preview and
 *  production deployments get correct canonical URLs without configuration. */
function resolveSiteUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    // Vercel sets these; VERCEL_URL is host-only, so it needs a scheme.
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
    DEFAULT_URL,
  ];

  for (const raw of candidates) {
    const value = raw?.trim();
    if (!value) continue;

    const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    try {
      const url = new URL(withScheme);
      if (VALID_HOSTNAME.test(url.hostname)) return url.origin;
    } catch {
      // Malformed value — try the next candidate rather than failing the build.
    }
  }
  return DEFAULT_URL;
}

export const SITE = {
  name: "Filmantica",
  tagline: "Where to watch, and what's free",
  description:
    "Find where to stream, rent or buy any film — plus a free catalogue of public-domain cinema you can watch and download here.",
  url: resolveSiteUrl(),
};
