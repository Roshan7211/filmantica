/** Structured data builders.
 *
 *  Every page that emits JSON-LD builds it from here rather than inline, so the
 *  site makes one consistent set of claims about itself. Two rules hold
 *  throughout: only state what the data actually supports, and never emit a
 *  field we would have to invent a value for. Fabricated structured data is a
 *  manual-action risk, and on a site whose whole pitch is accuracy it would be
 *  the wrong kind of shortcut.
 */

import { SITE } from "@/lib/site";
import type { DiscoveryTitle } from "@/lib/discovery-types";
import { directorsOf } from "@/lib/credits";

const abs = (path: string) => (path.startsWith("http") ? path : `${SITE.url}${path}`);

/** Stable identifiers, so Organization and WebSite can be referenced by @id from
 *  any page instead of being restated (and possibly contradicted) on each one. */
export const ORG_ID = `${SITE.url}/#organization`;
export const SITE_ID = `${SITE.url}/#website`;

export const organization = () => ({
  "@type": "Organization",
  "@id": ORG_ID,
  name: SITE.name,
  url: SITE.url,
  description: SITE.description,
  logo: { "@type": "ImageObject", url: abs("/icon.svg") },
  email: "filmantica@hexavo.co.uk",
});

/** No SearchAction here on purpose: robots.txt disallows /search, and telling a
 *  crawler to use an endpoint we have asked it not to visit is a contradiction. */
export const website = () => ({
  "@type": "WebSite",
  "@id": SITE_ID,
  name: SITE.name,
  url: SITE.url,
  description: SITE.description,
  publisher: { "@id": ORG_ID },
  inLanguage: "en-IN",
});

export type Crumb = { name: string; path: string };

/** Home is always the first crumb, so callers pass only what follows it. */
export const breadcrumb = (trail: Crumb[]) => ({
  "@type": "BreadcrumbList",
  itemListElement: [{ name: SITE.name, path: "/" }, ...trail].map((c, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: c.name,
    item: abs(c.path),
  })),
});

/** A page of titles. `startPosition` keeps positions continuous across
 *  pagination rather than restarting at 1 on every page. */
export const itemList = (
  items: { title: string; slug: string }[],
  { name, startPosition = 1, total }: { name: string; startPosition?: number; total?: number },
) => ({
  "@type": "ItemList",
  name,
  numberOfItems: total ?? items.length,
  itemListElement: items.map((t, i) => ({
    "@type": "ListItem",
    position: startPosition + i,
    name: t.title,
    url: abs(`/discover/${t.slug}`),
  })),
});

export const collectionPage = (
  { name, description, path }: { name: string; description: string; path: string },
) => ({
  "@type": "CollectionPage",
  name,
  description,
  url: abs(path),
  isPartOf: { "@id": SITE_ID },
});

export const webPage = (
  { name, description, path }: { name: string; description: string; path: string },
) => ({
  "@type": "WebPage",
  name,
  description,
  url: abs(path),
  isPartOf: { "@id": SITE_ID },
  publisher: { "@id": ORG_ID },
});

/** Films and series are different schema.org types. Emitting Movie for a series
 *  is a plain factual error, and 352 of our 1,064 titles are series. */
const schemaType = (t: DiscoveryTitle) => (t.titleType === "movie" ? "Movie" : "TVSeries");

export function titleSchema(t: DiscoveryTitle) {
  const isSeries = t.titleType !== "movie";
  const directors = directorsOf(t.crew ?? []);

  return {
    "@type": schemaType(t),
    name: t.title,
    url: abs(`/discover/${t.slug}`),
    description: t.plot || undefined,
    image: t.posterUrl ?? undefined,
    datePublished: t.releaseDate ?? (t.year ? String(t.year) : undefined),
    genre: t.genres.length ? t.genres : undefined,
    // Runtime describes a film. On a series it would be the episode length, which
    // is not what this field holds, so it is left off rather than misapplied.
    duration: !isSeries && t.runtime ? `PT${t.runtime}M` : undefined,
    startDate: isSeries && t.year ? String(t.year) : undefined,
    endDate: isSeries && t.endYear ? String(t.endYear) : undefined,
    contentRating: t.certification ?? undefined,
    inLanguage: t.language ?? undefined,
    actor: t.cast?.length
      ? t.cast.slice(0, 8).map((p) => ({ "@type": "Person", name: p.name }))
      : undefined,
    director: directors.length
      ? directors.map((c) => ({ "@type": "Person", name: c.name }))
      : undefined,
    trailer: t.trailerId
      ? {
          "@type": "VideoObject",
          name: `${t.title} trailer`,
          embedUrl: `https://www.youtube-nocookie.com/embed/${t.trailerId}`,
          thumbnailUrl: t.backdropUrl ?? t.posterUrl ?? undefined,
        }
      : undefined,
    // aggregateRating is deliberately absent. The source gives a score but no
    // vote count, and AggregateRating is invalid without one — the previous code
    // filled the gap with ratingCount:1, which claimed every score came from a
    // single vote. Better to omit the field than to state something untrue.
    potentialAction: t.options.free.length
      ? {
          "@type": "WatchAction",
          target: t.options.free.map((o) => o.url).filter(Boolean)[0] ?? undefined,
        }
      : undefined,
    isPartOf: { "@id": SITE_ID },
  };
}

/** JSON-LD accepts a top-level array, so a page can state several things at once
 *  without repeating the @context. */
export const graph = (...nodes: object[]) => ({
  "@context": "https://schema.org",
  "@graph": nodes,
});
