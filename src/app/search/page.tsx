import { search } from "@/lib/movies";
import MovieCard from "@/components/MovieCard";

type Props = { searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ searchParams }: Props) {
  const { q } = await searchParams;
  return { title: q ? `Search: ${q}` : "Search", robots: { index: false } };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const results = await search(q);

  return (
    <>
      <h1 className="display mb-1 text-3xl">Search</h1>
      <p className="mb-8 text-sm text-muted">
        {q ? `${results.length} result${results.length === 1 ? "" : "s"} for “${q}”` : "Type a title, director or genre."}
      </p>
      {results.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {results.map((m) => <MovieCard key={m.id} movie={m} />)}
        </div>
      )}
      {q && results.length === 0 && (
        <p className="rounded border border-edge bg-ink-2 p-6 text-sm text-muted">
          Nothing matched. The catalogue covers public-domain and openly licensed cinema —
          recent studio releases will not appear here.
        </p>
      )}
    </>
  );
}
