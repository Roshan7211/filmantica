import Link from "next/link";
import { allMovies, featured, allGenres, isSeedData } from "@/lib/movies";
import MovieCard from "@/components/MovieCard";
import Poster from "@/components/Poster";
import SeedNotice from "@/components/SeedNotice";

export default async function Home() {
  const [hero, movies, genres, seed] = await Promise.all([
    featured(), allMovies(), allGenres(), isSeedData(),
  ]);

  const rows = genres.slice(0, 4).map((g) => ({
    genre: g.name,
    items: movies.filter((m) => m.genres.includes(g.name)).slice(0, 6),
  }));

  return (
    <>
      {seed && <SeedNotice />}

      {hero && (
        <section className="mb-14 grid gap-6 sm:grid-cols-[190px_1fr] sm:items-center">
          <div className="aspect-2/3 overflow-hidden rounded-md border border-edge shadow-2xl shadow-black/50">
            <Poster src={hero.posterUrl} title={hero.title} year={hero.year} />
          </div>
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-brass">Featured</p>
            <h1 className="display text-4xl leading-tight sm:text-5xl">{hero.title}</h1>
            <p className="mt-2 text-sm text-muted">
              {hero.year} · {hero.director} · {hero.duration && `${Math.round(hero.duration / 60)} min`}
            </p>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-cream/85">{hero.description}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`/watch/${hero.slug}`}
                className="rounded bg-brass px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-brass/90">
                Watch free
              </Link>
              <Link href={`/movies/${hero.slug}`}
                className="rounded border border-edge px-5 py-2.5 text-sm transition hover:border-brass/60">
                Details
              </Link>
            </div>
          </div>
        </section>
      )}

      {rows.map(({ genre, items }) => (
        <section key={genre} className="mb-12">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="display text-xl">{genre}</h2>
            <Link href={`/genres/${encodeURIComponent(genre.toLowerCase())}`}
              className="text-xs text-muted transition hover:text-brass">See all →</Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {items.map((m) => <MovieCard key={m.id} movie={m} />)}
          </div>
        </section>
      ))}
    </>
  );
}
