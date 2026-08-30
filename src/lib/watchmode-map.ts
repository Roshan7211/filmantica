/** Watchmode -> DiscoveryTitle mapping.
 *
 *  Verified against live API output. Two traps the real data revealed:
 *
 *   1. /sources/ returns ONE ROW PER REGION. A title may list CA/GB/IN and no US at
 *      all, so filtering by the wrong region silently yields zero watch options.
 *   2. The same provider repeats per format (HD, 4K), so de-duplication is required
 *      or every provider renders twice.
 *
 *  Also: on the free tier ios_url/android_url contain the literal string
 *  "Deeplinks available for paid plans only." — never a URL. Only web_url is usable.
 */
import { discoverySlug, type DiscoveryTitle, type TitleType, type WatchOption } from "./discovery-types.ts";

/** Watchmode reports several series flavours; anything not clearly a series is
 *  treated as a film, which is the safe default for an unrecognised value. */
function normaliseType(raw: unknown): TitleType {
  const t = String(raw ?? "").toLowerCase();
  if (t === "tv_miniseries") return "tv_miniseries";
  if (t.startsWith("tv")) return "tv_series";
  return "movie";
}

export type RawSource = {
  source_id?: number;
  name?: string;
  type?: string;
  region?: string;
  web_url?: string;
  format?: string;
  price?: number | string | null;
};

export type RawTitle = {
  id: number | string;
  title?: string;
  original_title?: string;
  plot_overview?: string;
  year?: number | string;
  release_date?: string | null;
  runtime_minutes?: number | string;
  genre_names?: string[];
  user_rating?: number | null;
  poster?: string | null;
  posterMedium?: string | null;
  posterLarge?: string | null;
  backdrop?: string | null;
  us_rating?: string | null;
  original_language?: string | null;
  imdb_id?: string | null;
  trailer?: string | null;
  type?: string | null;
  end_year?: number | string | null;
};

export function mapSources(raw: unknown, region: string): DiscoveryTitle["options"] {
  const out: DiscoveryTitle["options"] = { free: [], stream: [], rent: [], buy: [] };
  const list: RawSource[] = Array.isArray(raw) ? raw : [];

  for (const s of list) {
    if (region && s.region !== region) continue;

    const price = s.price == null || s.price === "" ? null : Number(s.price);
    const option: WatchOption = {
      name: s.name ?? "Unknown",
      // Only web_url is a real link on the free tier.
      url: typeof s.web_url === "string" && s.web_url.startsWith("http") ? s.web_url : null,
      price: Number.isFinite(price) ? (price as number) : null,
      format: s.format ?? null,
    };

    switch (String(s.type ?? "").toLowerCase()) {
      case "free": out.free.push(option); break;
      case "sub": case "tve": out.stream.push(option); break;
      case "rent": out.rent.push(option); break;
      case "buy": case "purchase": out.buy.push(option); break;
    }
  }

  // Collapse per-format duplicates, keeping the cheapest priced entry per provider.
  for (const bucket of Object.keys(out) as (keyof typeof out)[]) {
    const best = new Map<string, WatchOption>();
    for (const o of out[bucket]) {
      const prev = best.get(o.name);
      if (!prev || (o.price != null && (prev.price == null || o.price < prev.price))) {
        best.set(o.name, o);
      }
    }
    out[bucket] = [...best.values()];
  }
  return out;
}

export function mapTitle(d: RawTitle, sources: unknown, region: string): DiscoveryTitle {
  const sourceId = String(d.id);
  const title = d.title ?? d.original_title ?? "Untitled";
  const rating = typeof d.user_rating === "number" ? d.user_rating : null;

  return {
    id: `watchmode:${sourceId}`,
    slug: discoverySlug(title, sourceId),
    title,
    year: Number(d.year) || null,
    releaseDate: d.release_date ?? null,
    plot: (d.plot_overview ?? "").trim(),
    posterUrl: d.posterLarge ?? d.posterMedium ?? d.poster ?? null,
    genres: (d.genre_names ?? []).map(String).slice(0, 5),
    runtime: Number(d.runtime_minutes) || null,
    rating,
    backdropUrl: d.backdrop ?? null,
    certification: d.us_rating ?? null,
    language: d.original_language ?? null,
    imdbId: d.imdb_id ?? null,
    trailerUrl: d.trailer ?? null,

    titleType: normaliseType(d.type),
    endYear: Number(d.end_year) || null,

    provider: "watchmode",
    sourceId,
    options: mapSources(sources, region),
    updatedAt: new Date().toISOString(),
  };
}
