import type { Metadata } from "next";
import { freeToWatch, lastCheckedAt } from "@/lib/discovery";
import { paginate } from "@/lib/paginate";
import DiscoveryCard from "@/components/DiscoveryCard";
import DiscoveryEmpty from "@/components/DiscoveryEmpty";
import Pagination from "@/components/Pagination";
import { SITE } from "@/lib/site";
import JsonLd from "@/components/JsonLd";
import { graph, breadcrumb, itemList, collectionPage } from "@/lib/schema";

type Props = { searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { page } = await searchParams;
  const n = Number(page) || 1;
  return {
    title: n > 1
      ? `Free movies to watch online in India — page ${n}`
      : "Free movies to watch online in India — legally, no subscription",
    description:
      "Every film you can watch free and legally right now in India, newest first. No sign-up, no subscription.",
    alternates: { canonical: n > 1 ? `${SITE.url}/free?page=${n}` : `${SITE.url}/free` },
  };
}

export default async function FreePage({ searchParams }: Props) {
  const { page } = await searchParams;
  const [films, checked] = await Promise.all([freeToWatch(), lastCheckedAt()]);

  if (!films.length) {
    return (
      <>
        <h1 className="display mb-6 text-3xl">Free to watch</h1>
        <DiscoveryEmpty />
      </>
    );
  }

  const paged = paginate(films, page);
  const services = [...new Set(films.flatMap((t) => t.options.free.map((o) => o.name)))];
  const recent = films.filter((t) => t.year && t.year >= 2024).length;


  const jsonLd = graph(
    collectionPage({ name: "Free to watch", description: "Films streaming free and legally in India right now.", path: "/free" }),
    itemList(paged.items, { name: "Free to watch", startPosition: paged.from, total: paged.total }),
    breadcrumb([{ name: "Free to watch", path: "/free" }]),
  );

  return (
    <>
      <JsonLd data={jsonLd} />
      <h1 className="display mb-1 text-3xl">Free to watch</h1>
      <p className="mb-4 max-w-2xl text-sm text-muted">
        {films.length} films streaming free and legally right now
        {services.length ? ` on ${services.slice(0, 4).join(", ")}` : ""} — no subscription, no
        sign-up. {recent > 0 && `${recent} released in the last two years.`} Newest first.
      </p>
      {/* Stated openly because stale availability is the commonest complaint about
          guides like this one, and the only honest answer is to show the date. */}
      <p className="mb-8 text-xs text-muted">
        Showing {paged.from}–{paged.to} of {paged.total} · page {paged.page} of {paged.totalPages}
        {checked && (
          <> · availability last checked{" "}
            {new Date(checked).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </>
        )}
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {paged.items.map((t) => <DiscoveryCard key={t.id} title={t} />)}
      </div>

      <Pagination paged={paged} basePath="/free" />
    </>
  );
}
