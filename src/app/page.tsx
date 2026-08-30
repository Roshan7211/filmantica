import Link from "next/link";
import {
  allDiscovery, discoveryGenres, discoveryByGenre, discoveryPopulated,
  freeToWatch, hasAnyOption, genreSlug,
} from "@/lib/discovery";
import DiscoveryCard from "@/components/DiscoveryCard";
import DiscoveryEmpty from "@/components/DiscoveryEmpty";
import Poster from "@/components/Poster";

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

  const hero =
    free.filter((t) => t.year && t.year >= 2024 && t.plot)
        .sort((a, b) => (b.year ?? 0) - (a.year ?? 0))[0]
    ?? free[0]
    ?? titles.find(hasAnyOption)
    ?? titles[0];

  const rows = await Promise.all(
    genres.slice(0, 5).map(async (g) => ({
      genre: g.name,
      items: (await discoveryByGenre(g.name)).filter((t) => t.id !== hero?.id).slice(0, 6),
    })),
  );

  const heroIsFree = (hero?.options.free.length ?? 0) > 0;

  return (
    <>
      {hero && (
        <section className="mb-14 grid gap-6 sm:grid-cols-[190px_1fr] sm:items-center">
          <div className="aspect-2/3 overflow-hidden rounded-md border border-edge shadow-2xl shadow-black/50">
            <Poster src={hero.posterUrl} title={hero.title} year={hero.year} />
          </div>
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-brass">
              {heroIsFree ? `Free on ${hero.options.free[0].name}` : "Now streaming"}
            </p>
            <h1 className="display text-4xl leading-tight sm:text-5xl">{hero.title}</h1>
            <p className="mt-2 text-sm text-muted">
              {[hero.year, hero.runtime && `${hero.runtime} min`, hero.genres.slice(0, 3).join(", ")]
                .filter(Boolean).join(" · ")}
            </p>
            {hero.plot && (
              <p className="mt-4 line-clamp-3 max-w-xl text-[15px] leading-relaxed text-cream/85">
                {hero.plot}
              </p>
            )}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href={`/discover/${hero.slug}`}
                className="rounded bg-brass px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-brass/90">
                {heroIsFree ? "Watch free" : "Where to watch"}
              </Link>
              <Link href="/free" className="text-xs text-muted transition hover:text-brass">
                {free.length} films free right now →
              </Link>
            </div>
          </div>
        </section>
      )}

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
            {free.filter((t) => t.id !== hero?.id).slice(0, 6).map((t) => (
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
