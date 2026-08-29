import { search } from "@/lib/movies";
import { searchDiscovery, discoveryPopulated } from "@/lib/discovery";
import MovieCard from "@/components/MovieCard";
import DiscoveryCard from "@/components/DiscoveryCard";

type Props = { searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ searchParams }: Props) {
  const { q } = await searchParams;
  return { title: q ? `Search: ${q}` : "Search", robots: { index: false } };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;

  // Our own catalogue leads — those are free and watchable here.
  const [ours, elsewhere, hasDiscovery] = await Promise.all([
    search(q), searchDiscovery(q), discoveryPopulated(),
  ]);

  const ourTitles = new Set(ours.map((m) => m.title.toLowerCase()));
  const others = elsewhere.filter((t) => !ourTitles.has(t.title.toLowerCase())).slice(0, 15);

  return (
    <>
      <h1 className="display mb-1 text-3xl">Search</h1>
      <p className="mb-8 text-sm text-muted">
        {q ? `Results for “${q}”` : "Type a title, director or genre."}
      </p>

      {ours.length > 0 && (
        <section className="mb-12">
          <h2 className="display mb-1 text-xl">Watch free here</h2>
          <p className="mb-4 text-xs text-muted">{ours.length} in our catalogue</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {ours.map((m) => <MovieCard key={m.id} movie={m} />)}
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section>
          <h2 className="display mb-1 text-xl">Where to watch elsewhere</h2>
          <p className="mb-4 text-xs text-muted">Not in our catalogue — see licensed options</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {others.map((t) => <DiscoveryCard key={t.id} title={t} />)}
          </div>
        </section>
      )}

      {q && !ours.length && !others.length && (
        <p className="rounded border border-edge bg-ink-2 p-6 text-sm text-muted">
          Nothing matched.{" "}
          {!hasDiscovery && "Run the discovery import to search current releases too."}
        </p>
      )}
    </>
  );
}
