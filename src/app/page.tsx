import Link from "next/link";
import { allDiscovery, discoveryGenres, discoveryByGenre, discoveryPopulated, hasAnyOption, genreSlug } from "@/lib/discovery";
import { allMovies } from "@/lib/movies";
import DiscoveryCard from "@/components/DiscoveryCard";
import DiscoveryEmpty from "@/components/DiscoveryEmpty";
import MovieCard from "@/components/MovieCard";
import Poster from "@/components/Poster";

/** Homepage leads with current films and where to watch them — that is what
 *  people search for. The free public-domain catalogue is a genuine feature but a
 *  small one, so it sits below rather than defining the site. */
export default async function Home() {
  const populated = await discoveryPopulated();
  if (!populated) {
    return (
      <>
        <h1 className="display mb-6 text-3xl">Movies</h1>
        <DiscoveryEmpty />
      </>
    );
  }

  const [titles, genres, free] = await Promise.all([
    allDiscovery(), discoveryGenres(), allMovies(),
  ]);

  // Lead with something recent that actually has somewhere to watch it.
  const hero =
    titles.filter((t) => t.year && t.year >= 2024 && hasAnyOption(t) && t.plot)
          .sort((a, b) => (b.year ?? 0) - (a.year ?? 0))[0]
    ?? titles.find(hasAnyOption)
    ?? titles[0];

  const rows = await Promise.all(
    genres.slice(0, 5).map(async (g) => ({
      genre: g.name,
      items: (await discoveryByGenre(g.name)).filter((t) => t.id !== hero?.id).slice(0, 6),
    })),
  );

  const heroWays = hero
    ? hero.options.free.length + hero.options.stream.length +
      hero.options.rent.length + hero.options.buy.length
    : 0;

  return (
    <>
      {hero && (
        <section className="mb-14 grid gap-6 sm:grid-cols-[190px_1fr] sm:items-center">
          <div className="aspect-2/3 overflow-hidden rounded-md border border-edge shadow-2xl shadow-black/50">
            <Poster src={hero.posterUrl} title={hero.title} year={hero.year} />
          </div>
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-brass">Now streaming</p>
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
                Where to watch
              </Link>
              {heroWays > 0 && (
                <span className="text-xs text-muted">{heroWays} way{heroWays === 1 ? "" : "s"} to watch</span>
              )}
            </div>
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

      {free.length > 0 && (
        <section className="mt-16 rounded-lg border border-edge bg-ink-2/40 p-6">
          <div className="mb-4 flex items-baseline justify-between">
            <div>
              <h2 className="display text-xl">Free to watch here</h2>
              <p className="mt-1 text-xs text-muted">
                {free.length} public-domain films you can stream and download, no account needed
              </p>
            </div>
            <Link href="/movies" className="text-xs text-muted transition hover:text-brass">See all →</Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {free.slice(0, 6).map((m) => <MovieCard key={m.id} movie={m} />)}
          </div>
        </section>
      )}
    </>
  );
}
