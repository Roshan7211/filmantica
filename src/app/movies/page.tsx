import Link from "next/link";
import type { Metadata } from "next";
import { allMovies, isSeedData } from "@/lib/movies";
import MovieCard from "@/components/MovieCard";
import SeedNotice from "@/components/SeedNotice";

export const metadata: Metadata = {
  title: "Film archive — public domain classics to download",
  description:
    "Early cinema in the public domain, hosted here to stream or download. For recent films, see what is free to watch now.",
};

export default async function MoviesPage() {
  const [movies, seed] = await Promise.all([allMovies(), isSeedData()]);
  return (
    <>
      {seed && <SeedNotice />}
      <h1 className="display mb-1 text-3xl">Film archive</h1>
      <p className="mb-8 max-w-2xl text-sm text-muted">
        {movies.length} early films in the public domain — the only titles we can legally host
        ourselves, so they are old by definition. Stream or download them here, no account.
        {" "}
        <Link href="/free" className="text-brass underline underline-offset-2">
          Looking for recent films? See what&rsquo;s free to watch now →
        </Link>
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {movies.map((m) => <MovieCard key={m.id} movie={m} />)}
      </div>
    </>
  );
}
