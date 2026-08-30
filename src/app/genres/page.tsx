import Link from "next/link";
import type { Metadata } from "next";
import { discoveryGenres, genreSlug } from "@/lib/discovery";

export const metadata: Metadata = {
  title: "Browse movies by genre — where to watch",
  description: "Action, thriller, horror, comedy and more, with every legal way to watch each film.",
};

export default async function GenresPage() {
  const genres = await discoveryGenres();
  return (
    <>
      <h1 className="display mb-1 text-3xl">Genres</h1>
      <p className="mb-8 text-sm text-muted">Where to stream, rent or buy, by genre.</p>
      <div className="flex flex-wrap gap-3">
        {genres.map((g) => (
          <Link key={g.name} href={`/genre/${genreSlug(g.name)}`}
            className="rounded border border-edge bg-ink-2 px-4 py-2 text-sm transition hover:border-brass/60">
            {g.name} <span className="text-muted">({g.count})</span>
          </Link>
        ))}
      </div>
    </>
  );
}
