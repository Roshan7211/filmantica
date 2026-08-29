import { notFound } from "next/navigation";
import { byGenre } from "@/lib/movies";
import MovieCard from "@/components/MovieCard";

type Params = { params: Promise<{ genre: string }> };

export async function generateMetadata({ params }: Params) {
  const { genre } = await params;
  const name = decodeURIComponent(genre);
  return { title: `${name} films`, description: `Free ${name.toLowerCase()} films to watch and download.` };
}

export default async function GenrePage({ params }: Params) {
  const { genre } = await params;
  const name = decodeURIComponent(genre);
  const movies = await byGenre(name);
  if (!movies.length) notFound();

  return (
    <>
      <h1 className="display mb-1 text-3xl capitalize">{name}</h1>
      <p className="mb-8 text-sm text-muted">{movies.length} films</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {movies.map((m) => <MovieCard key={m.id} movie={m} />)}
      </div>
    </>
  );
}
