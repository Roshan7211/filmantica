/** Discovery types and pure helpers.
 *
 *  Deliberately free of "server-only" and of any Node/Next imports, so the
 *  scheduled importer (a plain Node script) can share this with the app.
 *  Store access lives in discovery.ts, which IS server-only.
 */

export type WatchOption = {
  name: string;
  url: string | null;
  price: number | null;
  format: string | null;
};

export type TitleType = "movie" | "tv_series" | "tv_miniseries";

export type DiscoveryTitle = {
  id: string;
  slug: string;
  title: string;
  /** Films and series need different labelling and browsing, so the kind is
   *  carried on the record rather than inferred. Older records default to movie. */
  titleType: TitleType;
  endYear?: number | null;
  year: number | null;
  releaseDate: string | null;
  plot: string;
  posterUrl: string | null;
  genres: string[];
  runtime: number | null;
  rating: number | null;

  /** Richer detail captured from the source. Optional because titles imported
   *  before these were mapped will not have them until the next refresh. */
  backdropUrl?: string | null;
  certification?: string | null;
  language?: string | null;
  imdbId?: string | null;
  trailerUrl?: string | null;
  /** YouTube video id extracted from trailerUrl, so the page does not parse a URL. */
  trailerId?: string | null;
  /** Top-billed cast and key crew, in the order the source supplies. */
  cast?: { name: string; role?: string | null }[];
  crew?: { name: string; role: string }[];

  /** When a refresh last confirmed this title's availability. */
  checkedAt?: string;
  /** Set when a refresh saw a title become free, cleared when it stops being free.
   *  Lets the site show what is newly free without diffing whole snapshots. */
  freeSince?: string | null;
  /** Set when a refresh saw a free title lose its free option. */
  leftFreeAt?: string | null;

  provider: string;
  sourceId: string;

  options: {
    free: WatchOption[];
    stream: WatchOption[];
    rent: WatchOption[];
    buy: WatchOption[];
  };
  updatedAt: string;
};

export const hasAnyOption = (t: DiscoveryTitle) =>
  t.options.free.length + t.options.stream.length + t.options.rent.length + t.options.buy.length > 0;

export const discoverySlug = (title: string, sourceId: string) => {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  return base ? `${base}-${sourceId}` : sourceId;
};
