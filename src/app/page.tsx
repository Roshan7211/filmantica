import Link from "next/link";
import {
  allDiscovery, discoveryGenres, discoveryByGenre, discoveryPopulated,
  freeToWatch, genreSlug,
} from "@/lib/discovery";
import DiscoveryCard from "@/components/DiscoveryCard";
import HeroCarousel from "@/components/HeroCarousel";
import DiscoveryEmpty from "@/components/DiscoveryEmpty";

/** Free-first: the site exists to answer "what can I watch right now, free".
 *  Everything else is secondary to that question. */
export default async function Home() {
  if (!(await discoveryPopulated())) {
    return (
      <>
        <h1 className="display mb-6 text-3xl">Movies</h1>
        <DiscoveryEmpty />
      </>
    );
  }

  const [titles, genres, free] = await Promise.all([
    allDiscovery(), discoveryGenres(), freeToWatch(),
  ]);

  /** The rail leads the page, so it needs titles that look current and have
   *  artwork — a fallback tile in the hero position undersells the catalogue. */
  const justReleased = titles
    .filter((t) => t.posterUrl && t.year)
    .sort((a, b) => {
      if ((b.year ?? 0) !== (a.year ?? 0)) return (b.year ?? 0) - (a.year ?? 0);
      const af = a.options.free.length > 0, bf = b.options.free.length > 0;
      if (af !== bf) return af ? -1 : 1;
      return (b.rating ?? 0) - (a.rating ?? 0);
    })
    .slice(0, 20);

  const rows = await Promise.all(
    genres.slice(0, 5).map(async (g) => ({
      genre: g.name,
      items: (await discoveryByGenre(g.name)).slice(0, 6),
    })),
  );

  return (
    <>
      <HeroCarousel titles={justReleased} />

      {free.length > 0 && (
        <section className="mb-14 rounded-lg border border-brass/25 bg-brass/[0.04] p-6">
          <div className="mb-4 flex items-baseline justify-between">
            <div>
              <h2 className="display text-xl">Free to watch</h2>
              <p className="mt-1 text-xs text-muted">
                {free.length} films streaming free and legally, no subscription
              </p>
            </div>
            <Link href="/free" className="text-xs text-muted transition hover:text-brass">See all →</Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {free.slice(0, 6).map((t) => (
              <DiscoveryCard key={t.id} title={t} />
            ))}
          </div>
        </section>
      )}

      {rows.map(({ genre, items }) => items.length > 0 && (
        <section key={genre} className="mb-12">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="display text-xl">{genre}</h2>
            <Link href={`/genre/${genreSlug(genre)}`}
              className="text-xs text-muted transition hover:text-brass">See all →</Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {items.map((t) => <DiscoveryCard key={t.id} title={t} />)}
          </div>
        </section>
      ))}
    </>
  );
}
