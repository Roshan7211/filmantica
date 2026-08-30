import { searchDiscovery, discoveryPopulated } from "@/lib/discovery";
import DiscoveryCard from "@/components/DiscoveryCard";

type Props = { searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ searchParams }: Props) {
  const { q } = await searchParams;
  return { title: q ? `Search: ${q}` : "Search", robots: { index: false } };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const [results, populated] = await Promise.all([searchDiscovery(q), discoveryPopulated()]);

  // Free options first — that is what people come here to find.
  const free = results.filter((t) => t.options.free.length > 0);
  const paid = results.filter((t) => t.options.free.length === 0);

  return (
    <>
      <h1 className="display mb-1 text-3xl">Search</h1>
      <p className="mb-8 text-sm text-muted">
        {q ? `${results.length} result${results.length === 1 ? "" : "s"} for “${q}”` : "Search for any film."}
      </p>

      {free.length > 0 && (
        <section className="mb-12">
          <h2 className="display mb-1 text-xl">Free to watch</h2>
          <p className="mb-4 text-xs text-muted">{free.length} streaming free right now</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {free.map((t) => <DiscoveryCard key={t.id} title={t} />)}
          </div>
        </section>
      )}

      {paid.length > 0 && (
        <section>
          <h2 className="display mb-1 text-xl">Where to watch</h2>
          <p className="mb-4 text-xs text-muted">Stream, rent or buy</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {paid.map((t) => <DiscoveryCard key={t.id} title={t} />)}
          </div>
        </section>
      )}

      {q && !results.length && (
        <p className="rounded border border-edge bg-ink-2 p-6 text-sm text-muted">
          Nothing matched.{" "}
          {!populated && "Run the discovery import to populate the catalogue."}
        </p>
      )}
    </>
  );
}
