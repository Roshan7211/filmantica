import "server-only";
import { freeToWatch, type DiscoveryTitle } from "./discovery";

/** Curated lists.
 *
 *  Two jobs. They rank for queries a per-title page cannot ("free horror movies
 *  on Hotstar"), and they are original editorial writing — which matters because
 *  ad networks generally reject sites that are purely aggregated third-party data.
 *
 *  The prose is written; only the selection is computed, so the lists stay current
 *  as availability changes without anyone rewriting them.
 */

export type CuratedList = {
  slug: string;
  title: string;
  blurb: string;
  intro: string;
  pick: (films: DiscoveryTitle[]) => DiscoveryTitle[];
};

const byNewest = (a: DiscoveryTitle, b: DiscoveryTitle) => (b.year ?? 0) - (a.year ?? 0);
const inGenre = (g: string) => (t: DiscoveryTitle) =>
  t.genres.some((x) => x.toLowerCase() === g.toLowerCase());

export const LISTS: CuratedList[] = [
  {
    slug: "new-free-movies",
    title: "New free movies you can watch right now",
    blurb: "Recent releases that are already free to stream — no subscription needed.",
    intro:
      "Films usually arrive on free, ad-supported services long after release — which makes it " +
      "genuinely surprising how many recent titles are already there. These are the newest films " +
      "we can find that cost nothing to watch legally in India. Availability shifts week to week, " +
      "so this list changes as titles arrive and leave.",
    pick: (f) => f.filter((t) => t.year && t.year >= 2024).sort(byNewest),
  },
  {
    slug: "free-horror-movies",
    title: "Free horror movies streaming now",
    blurb: "Horror is the genre free services stock best. Here is everything currently free.",
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
      "releases and older titles whose rights have cycled onto ad-supported services. Everything " +
      "here is free and legal today.",
    pick: (f) => f.filter(inGenre("Thriller")).sort(byNewest),
  },
  {
    slug: "free-action-movies",
    title: "Free action movies streaming now",
    blurb: "Action films you can watch free, no subscription.",
    intro:
      "Action travels well across regions, so it shows up on free services more consistently than " +
      "most genres. This is everything currently free to watch in India, newest first.",
    pick: (f) => f.filter(inGenre("Action")).sort(byNewest),
  },
  {
    slug: "free-comedy-movies",
    title: "Free comedies to watch tonight",
    blurb: "Comedy that costs nothing, updated as availability changes.",
    intro:
      "Comedy ages differently from other genres — a film from a decade ago plays much the same " +
      "as it did on release, which is why so much of it ends up free. Everything below is " +
      "streaming free and legally right now.",
    pick: (f) => f.filter(inGenre("Comedy")).sort(byNewest),
  },
];

export const getList = (slug: string) => LISTS.find((l) => l.slug === slug) ?? null;

export async function resolveList(slug: string) {
  const list = getList(slug);
  if (!list) return null;
  const films = list.pick(await freeToWatch());
  return { list, films };
}

/** Lists with too few films read as broken; hide them rather than ship a stub. */
export async function populatedLists() {
  const free = await freeToWatch();
  return LISTS.map((l) => ({ list: l, count: l.pick(free).length })).filter((x) => x.count >= 6);
}
