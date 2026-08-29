import Link from "next/link";
import type { Metadata } from "next";
import { allGenres } from "@/lib/movies";

export const metadata: Metadata = { title: "Genres" };

export default async function GenresPage() {
  const genres = await allGenres();
  return (
    <>
      <h1 className="display mb-8 text-3xl">Genres</h1>
      <div className="flex flex-wrap gap-3">
        {genres.map((g) => (
          <Link key={g.name} href={`/genres/${encodeURIComponent(g.name.toLowerCase())}`}
            className="rounded border border-edge bg-ink-2 px-4 py-2 text-sm transition hover:border-brass/60">
            {g.name} <span className="text-muted">({g.count})</span>
          </Link>
        ))}
      </div>
    </>
  );
}
