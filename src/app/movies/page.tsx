import type { Metadata } from "next";
import { allMovies, isSeedData } from "@/lib/movies";
import MovieCard from "@/components/MovieCard";
import SeedNotice from "@/components/SeedNotice";

export const metadata: Metadata = {
  title: "Browse classic films",
  description: "Every film in the catalogue — free to watch and download, licence verified.",
};

export default async function MoviesPage() {
  const [movies, seed] = await Promise.all([allMovies(), isSeedData()]);
  return (
    <>
      {seed && <SeedNotice />}
      <h1 className="display mb-1 text-3xl">Browse</h1>
      <p className="mb-8 text-sm text-muted">{movies.length} films free to watch and download.</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {movies.map((m) => <MovieCard key={m.id} movie={m} />)}
      </div>
    </>
  );
}
