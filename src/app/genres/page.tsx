import Link from "next/link";
import type { Metadata } from "next";
import { discoveryGenres } from "@/lib/discovery";
import { allGenres as freeGenres } from "@/lib/movies";

export const metadata: Metadata = {
  title: "Browse by genre",
  description: "Action, sci-fi, thriller, comedy and more — with every legal way to watch.",
};

export default async function GenresPage() {
  const [genres, free] = await Promise.all([discoveryGenres(), freeGenres()]);

  return (
    <>
      <h1 className="display mb-1 text-3xl">Genres</h1>
      <p className="mb-8 text-sm text-muted">Where to stream, rent or buy, by genre.</p>

      <div className="flex flex-wrap gap-3">
        {genres.map((g) => (
          <Link key={g.name} href={`/genre/${encodeURIComponent(g.name.toLowerCase())}`}
            className="rounded border border-edge bg-ink-2 px-4 py-2 text-sm transition hover:border-brass/60">
            {g.name} <span className="text-muted">({g.count})</span>
          </Link>
        ))}
      </div>

      {free.length > 0 && (
        <section className="mt-14">
          <h2 className="display mb-1 text-xl">In the free catalogue</h2>
          <p className="mb-4 text-xs text-muted">
            Public-domain films you can watch here directly
          </p>
          <div className="flex flex-wrap gap-2">
            {free.slice(0, 24).map((g) => (
              <Link key={g.name} href={`/genres/${encodeURIComponent(g.name.toLowerCase())}`}
                className="rounded-full border border-edge px-3 py-1 text-xs text-muted transition hover:border-brass/60 hover:text-cream">
                {g.name} ({g.count})
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
