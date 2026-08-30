import Link from "next/link";
import type { Metadata } from "next";
import { series, freeSeries } from "@/lib/discovery";
import { paginate } from "@/lib/paginate";
import DiscoveryCard from "@/components/DiscoveryCard";
import Pagination from "@/components/Pagination";
import { SITE } from "@/lib/site";
import JsonLd from "@/components/JsonLd";
import { graph, breadcrumb, itemList, collectionPage } from "@/lib/schema";

type Props = { searchParams: Promise<{ page?: string; free?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { page, free } = await searchParams;
  const n = Number(page) || 1;
  const onlyFree = free === "1";
  const base = `${SITE.url}/tv${onlyFree ? "?free=1" : ""}`;
  return {
    title: onlyFree
      ? "Free TV series to watch online in India"
      : n > 1 ? `TV series — page ${n}` : "TV series — where to watch",
    description:
      "Series and miniseries with every legal way to watch, and which are streaming free right now in India.",
    alternates: { canonical: n > 1 ? `${base}${onlyFree ? "&" : "?"}page=${n}` : base },
  };
}

export default async function TvPage({ searchParams }: Props) {
  const { page, free } = await searchParams;
  const onlyFree = free === "1";
  const [all, freeOnes] = await Promise.all([series(), freeSeries()]);
  const shown = onlyFree ? freeOnes : all;

  if (!all.length) {
    return (
      <>
        <h1 className="display mb-3 text-3xl">TV series</h1>
        <p className="rounded border border-edge bg-ink-2 p-6 text-sm text-muted">
          No series imported yet. Run{" "}
          <code className="rounded bg-ink px-1">npm run import:free -- --types tv_series</code> to
          populate this section.
        </p>
      </>
    );
  }

  const paged = paginate(shown, page);
  const base = onlyFree ? "/tv?free=1" : "/tv";


  const jsonLd = graph(
    collectionPage({ name: "TV series", description: "Where to watch TV series in India, and which are free.", path: "/tv" }),
    itemList(paged.items, { name: "TV series", startPosition: paged.from, total: paged.total }),
    breadcrumb([{ name: "TV series", path: "/tv" }]),
  );

  return (
    <>
      <JsonLd data={jsonLd} />
      <h1 className="display mb-1 text-3xl">TV series</h1>
      <p className="mb-4 max-w-2xl text-sm text-muted">
        Series and miniseries, newest first, with every legal way to watch each one.
      </p>

      {/* A filter rather than a separate route: same list, two views. */}
      <div className="mb-6 flex gap-2">
        <Link href="/tv"
          className={`rounded border px-3 py-1.5 text-sm transition ${
            onlyFree ? "border-edge text-muted hover:border-brass/60" : "border-brass bg-brass/15 text-brass"
          }`}>
          All series ({all.length})
        </Link>
        <Link href="/tv?free=1"
          className={`rounded border px-3 py-1.5 text-sm transition ${
            onlyFree ? "border-brass bg-brass/15 text-brass" : "border-edge text-muted hover:border-brass/60"
          }`}>
          Free to watch ({freeOnes.length})
        </Link>
      </div>

      <p className="mb-8 text-xs text-muted">
        Showing {paged.from}–{paged.to} of {paged.total} · page {paged.page} of {paged.totalPages}
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {paged.items.map((t) => <DiscoveryCard key={t.id} title={t} />)}
      </div>

      <Pagination paged={paged} basePath={base} />
    </>
  );
}
