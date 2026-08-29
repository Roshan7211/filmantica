/** TMDB client — powers the discovery half of the site.
 *
 *  Important distinction from the catalogue: nothing here is streamed by us. These
 *  are metadata pages that answer "where can I watch X" and link out to licensed
 *  providers. Facts and links carry no rights burden, which is why this half can
 *  cover current releases the catalogue never could.
 *
 *  Requires TMDB_API_KEY. Supports both v3 keys and v4 read tokens.
 */

const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";

export const tmdbConfigured = () => Boolean(process.env.TMDB_API_KEY);

export type TmdbMovie = {
  id: number;
  title: string;
  overview: string;
  releaseDate: string | null;
  year: number | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  rating: number | null;
  genres: string[];
  runtime: number | null;
};

export type Provider = { id: number; name: string; logoUrl: string | null };

export type WatchOptions = {
  link: string | null;
  stream: Provider[];
  rent: Provider[];
  buy: Provider[];
};

export const posterUrl = (p: string | null | undefined, size = "w500") =>
  p ? `${IMG}/${size}${p}` : null;

/** TMDB accepts a v3 key as a query param, or a v4 token as a bearer header. */
async function tmdb<T>(path: string, params: Record<string, string> = {}, revalidate = 3600): Promise<T | null> {
  const key = process.env.TMDB_API_KEY;
  if (!key) return null;

  const isV4Token = key.startsWith("eyJ");
  const qs = new URLSearchParams(params);
  if (!isV4Token) qs.set("api_key", key);

  try {
    const res = await fetch(`${BASE}${path}?${qs}`, {
      headers: isV4Token ? { Authorization: `Bearer ${key}` } : {},
      next: { revalidate }, // cached, so we stay well inside TMDB's rate limits
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

type RawMovie = {
  id: number;
  title: string;
  overview?: string;
  release_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  runtime?: number | null;
  genres?: { id: number; name: string }[];
  genre_ids?: number[];
};

function normalise(m: RawMovie): TmdbMovie {
  return {
    id: m.id,
    title: m.title,
    overview: m.overview ?? "",
    releaseDate: m.release_date || null,
    year: m.release_date ? Number(m.release_date.slice(0, 4)) || null : null,
    posterUrl: posterUrl(m.poster_path),
    backdropUrl: posterUrl(m.backdrop_path, "w1280"),
    rating: typeof m.vote_average === "number" ? Math.round(m.vote_average * 10) / 10 : null,
    genres: m.genres?.map((g) => g.name) ?? [],
    runtime: m.runtime ?? null,
  };
}

export async function trending(): Promise<TmdbMovie[]> {
  const data = await tmdb<{ results: RawMovie[] }>("/trending/movie/week", {}, 21600);
  return (data?.results ?? []).map(normalise);
}

export async function searchTmdb(query: string): Promise<TmdbMovie[]> {
  if (!query.trim()) return [];
  const data = await tmdb<{ results: RawMovie[] }>("/search/movie", { query, include_adult: "false" });
  return (data?.results ?? []).map(normalise);
}

export async function movieDetails(id: number): Promise<TmdbMovie | null> {
  const data = await tmdb<RawMovie>(`/movie/${id}`);
  return data ? normalise(data) : null;
}

/** Where a film can legally be watched, per region. TMDB sources this from JustWatch,
 *  whose terms require the deep link be presented alongside the provider list. */
export async function watchProviders(id: number, region = "US"): Promise<WatchOptions> {
  type Raw = {
    results?: Record<string, {
      link?: string;
      flatrate?: { provider_id: number; provider_name: string; logo_path: string }[];
      rent?: { provider_id: number; provider_name: string; logo_path: string }[];
      buy?: { provider_id: number; provider_name: string; logo_path: string }[];
    }>;
  };
  const data = await tmdb<Raw>(`/movie/${id}/watch/providers`);
  const r = data?.results?.[region];
  const map = (list?: { provider_id: number; provider_name: string; logo_path: string }[]): Provider[] =>
    (list ?? []).map((p) => ({ id: p.provider_id, name: p.provider_name, logoUrl: posterUrl(p.logo_path, "w92") }));

  return {
    link: r?.link ?? null,
    stream: map(r?.flatrate),
    rent: map(r?.rent),
    buy: map(r?.buy),
  };
}

export const tmdbSlug = (m: { id: number; title: string }) =>
  `${m.id}-${m.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60)}`;

export const idFromSlug = (slug: string) => Number(slug.split("-")[0]) || null;
