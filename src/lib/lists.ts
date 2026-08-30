import "server-only";
import { freeToWatch, freeSeries, isSeries, type DiscoveryTitle } from "./discovery";

/** Curated lists.
 *
 *  Two jobs. They rank for queries a per-title page cannot ("free horror movies
 *  on Hotstar"), and they are original editorial writing — which matters because
 *  ad networks reject sites that are purely aggregated third-party data.
 *
 *  The prose is written once; the selection is computed, so a list stays accurate
 *  as titles arrive on and leave free services without anyone rewriting it.
 */

export type CuratedList = {
  slug: string;
  title: string;
  blurb: string;
  intro: string;
  /** Films by default; series lists opt in. */
  source?: "films" | "series";
  pick: (titles: DiscoveryTitle[]) => DiscoveryTitle[];
};

const byNewest = (a: DiscoveryTitle, b: DiscoveryTitle) => (b.year ?? 0) - (a.year ?? 0);
const byRating = (a: DiscoveryTitle, b: DiscoveryTitle) => (b.rating ?? 0) - (a.rating ?? 0);
const inGenre = (g: string) => (t: DiscoveryTitle) =>
  t.genres.some((x) => x.toLowerCase() === g.toLowerCase());
const onService = (name: string) => (t: DiscoveryTitle) =>
  t.options.free.some((o) => o.name.toLowerCase().includes(name.toLowerCase()));

export const LISTS: CuratedList[] = [
  // ---- recency ----
  {
    slug: "new-free-movies",
    title: "New free movies you can watch right now",
    blurb: "Recent releases already free to stream — no subscription needed.",
    intro:
      "Films normally reach free, ad-supported services long after release, which makes it " +
      "genuinely surprising how many recent titles are already there. These are the newest we " +
      "can find that cost nothing to watch legally in India. Availability shifts week to week, " +
      "so this list changes as titles arrive and leave.",
    pick: (f) => f.filter((t) => t.year && t.year >= 2024).sort(byNewest),
  },
  {
    slug: "best-rated-free-movies",
    title: "The best-reviewed films you can watch free",
    blurb: "Free titles rated 7.0 and above, best first.",
    intro:
      "A free catalogue is only worth browsing if something in it is good. These are the " +
      "highest-rated films currently streaming free in India, ordered by score rather than " +
      "release date — the list to start with if you want quality over novelty.",
    pick: (f) => f.filter((t) => (t.rating ?? 0) >= 7).sort(byRating),
  },
  {
    slug: "free-movies-under-100-minutes",
    title: "Free films under 100 minutes",
    blurb: "Short enough for a weeknight.",
    intro:
      "Runtime is the constraint nobody accounts for. Everything here is free to watch and " +
      "finishes inside an hour and forty — long enough to be a real film, short enough to " +
      "start after dinner without committing your evening.",
    pick: (f) => f.filter((t) => t.runtime && t.runtime < 100).sort(byNewest),
  },

  // ---- genre ----
  {
    slug: "free-horror-movies",
    title: "Free horror movies streaming now",
    blurb: "Horror is the genre free services stock best.",
    intro:
      "Horror does better than any other genre on ad-supported streaming. Studios treat back " +
      "catalogue horror as evergreen, so it lands on free services quickly and tends to stay. " +
      "That makes it the one genre where a free catalogue genuinely competes with a paid one.",
    pick: (f) => f.filter(inGenre("Horror")).sort(byNewest),
  },
  {
    slug: "free-thriller-movies",
    title: "Free thrillers worth your evening",
    blurb: "Every thriller currently streaming free, newest first.",
    intro:
      "Thrillers make up one of the largest slices of what is free to watch — a mix of recent " +
      "releases and older titles whose rights have cycled onto ad-supported services.",
    pick: (f) => f.filter(inGenre("Thriller")).sort(byNewest),
  },
  {
    slug: "free-action-movies",
    title: "Free action movies streaming now",
    blurb: "Action films you can watch free, no subscription.",
    intro:
      "Action travels across languages and regions better than most genres, so it appears on " +
      "free services more consistently. This is everything currently free in India, newest first.",
    pick: (f) => f.filter(inGenre("Action")).sort(byNewest),
  },
  {
    slug: "free-comedy-movies",
    title: "Free comedies to watch tonight",
    blurb: "Comedy that costs nothing.",
    intro:
      "Comedy ages differently from other genres — a film from a decade ago plays much as it did " +
      "on release, which is why so much of it ends up free. Everything below is streaming free " +
      "and legally right now.",
    pick: (f) => f.filter(inGenre("Comedy")).sort(byNewest),
  },
  {
    slug: "free-drama-movies",
    title: "Free drama films streaming now",
    blurb: "The largest free category, newest first.",
    intro:
      "Drama is the deepest part of any free catalogue, partly because the label covers so much " +
      "ground. Expect range here: festival films beside broad crowd-pleasers, all free to watch.",
    pick: (f) => f.filter(inGenre("Drama")).sort(byNewest),
  },
  {
    slug: "free-crime-movies",
    title: "Free crime films and thrillers",
    blurb: "Heists, investigations and the people who get caught.",
    intro:
      "Crime sits between thriller and drama and borrows the appeal of both — plot you can " +
      "follow, stakes you can feel. These are free to watch legally in India right now.",
    pick: (f) => f.filter(inGenre("Crime")).sort(byNewest),
  },
  {
    slug: "free-romance-movies",
    title: "Free romance films to watch free",
    blurb: "Romance, newest first, no subscription.",
    intro:
      "Romance rotates onto free services steadily, and unlike most genres it is worth browsing " +
      "by mood rather than recency. Everything here is free right now.",
    pick: (f) => f.filter(inGenre("Romance")).sort(byNewest),
  },
  {
    slug: "free-mystery-movies",
    title: "Free mystery films streaming now",
    blurb: "Something to work out.",
    intro:
      "Mystery rewards attention in a way that suits a deliberate evening rather than background " +
      "viewing. These are the ones currently free to watch.",
    pick: (f) => f.filter(inGenre("Mystery")).sort(byNewest),
  },
  {
    slug: "free-sci-fi-movies",
    title: "Free science fiction films",
    blurb: "Science fiction that costs nothing to watch.",
    intro:
      "Science fiction dates faster than most genres and is often more interesting for it — the " +
      "future a film imagined tells you plenty about when it was made. All free right now.",
    pick: (f) => f.filter((t) => inGenre("Science Fiction")(t) || inGenre("Sci-Fi")(t)).sort(byNewest),
  },
  {
    slug: "free-adventure-movies",
    title: "Free adventure films streaming now",
    blurb: "Journeys, quests and everything that happens on the way.",
    intro:
      "Adventure is the most reliable family-friendly category on free services, and one of the " +
      "few that plays equally well across ages. Everything here is free to watch.",
    pick: (f) => f.filter(inGenre("Adventure")).sort(byNewest),
  },
  {
    slug: "free-documentaries",
    title: "Free documentaries to watch online",
    blurb: "Non-fiction, free and legal.",
    intro:
      "Documentaries land on free services faster than fiction, because their commercial window " +
      "is shorter and their shelf life is longer. That combination makes this one of the better " +
      "free categories.",
    pick: (f) => f.filter(inGenre("Documentary")).sort(byNewest),
  },
  {
    slug: "free-family-movies",
    title: "Free family films everyone can watch",
    blurb: "Family and animated titles, free to stream.",
    intro:
      "Family films and animation, free to watch with no subscription — the category most worth " +
      "checking before paying for anything, since so much of it is already free.",
    pick: (f) => f.filter((t) => inGenre("Family")(t) || inGenre("Animation")(t)).sort(byNewest),
  },

  // ---- by service ----
  {
    slug: "free-movies-on-hotstar",
    title: "Free movies on Hotstar right now",
    blurb: "Everything watchable on Hotstar without paying.",
    intro:
      "Hotstar carries the largest free, ad-supported film selection available in India. You do " +
      "not need a subscription for anything on this list — these titles are free with ads.",
    pick: (f) => f.filter(onService("Hotstar")).sort(byNewest),
  },
  {
    slug: "free-movies-on-plex",
    title: "Free movies on Plex",
    blurb: "Plex's ad-supported catalogue, newest first.",
    intro:
      "Plex is easy to overlook as a streaming service because it started as a media server, but " +
      "its free ad-supported catalogue is one of the largest available. No account needed to " +
      "browse, no subscription to watch.",
    pick: (f) => f.filter(onService("Plex")).sort(byNewest),
  },
  {
    slug: "free-movies-on-mx-player",
    title: "Free movies on Amazon MX Player",
    blurb: "MX Player's free catalogue.",
    intro:
      "MX Player is free by design rather than as a tier, and leans heavily toward Indian titles " +
      "and regional language cinema. Everything here is free with ads.",
    pick: (f) => f.filter(onService("MX Player")).sort(byNewest),
  },

  // ---- series ----
  {
    slug: "free-tv-series",
    title: "Free TV series to watch online",
    blurb: "Series and miniseries streaming free right now.",
    intro:
      "Series are harder to find free than films, because a show's value to a service is the " +
      "return visit rather than the single view. These are the ones currently free to watch in " +
      "India, newest first.",
    source: "series",
    pick: (s) => s.slice().sort(byNewest),
  },
  {
    slug: "free-anime-series",
    title: "Free anime series streaming now",
    blurb: "Anime you can watch free, newest first.",
    intro:
      "Anime reaches free services faster than most categories, and simulcast seasons often " +
      "appear within weeks. Everything here is free to watch legally in India.",
    source: "series",
    pick: (s) => s.filter((t) => inGenre("Anime")(t) || inGenre("Animation")(t)).sort(byNewest),
  },
];

export const getList = (slug: string) => LISTS.find((l) => l.slug === slug) ?? null;

async function poolFor(list: CuratedList) {
  return list.source === "series" ? freeSeries() : freeToWatch();
}

export async function resolveList(slug: string) {
  const list = getList(slug);
  if (!list) return null;
  return { list, films: list.pick(await poolFor(list)) };
}

/** A list with too few entries reads as broken; hide it rather than ship a stub. */
export async function populatedLists() {
  const [films, tv] = await Promise.all([freeToWatch(), freeSeries()]);
  return LISTS
    .map((list) => ({ list, count: list.pick(list.source === "series" ? tv : films).length }))
    .filter((x) => x.count >= 8);
}

export { isSeries };
