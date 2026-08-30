import Link from "next/link";
import { notFound } from "next/navigation";
import { LISTS, resolveList } from "@/lib/lists";
import { paginate } from "@/lib/paginate";
import DiscoveryCard from "@/components/DiscoveryCard";
import Pagination from "@/components/Pagination";
import { SITE } from "@/lib/site";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

export async function generateStaticParams() {
  return LISTS.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params, searchParams }: Props) {
  const [{ slug }, { page }] = await Promise.all([params, searchParams]);
  const resolved = await resolveList(slug);
  if (!resolved) return {};
  const n = Number(page) || 1;
  const base = `${SITE.url}/lists/${slug}`;
  return {
    title: n > 1 ? `${resolved.list.title} — page ${n}` : resolved.list.title,
    description: resolved.list.blurb,
    alternates: { canonical: n > 1 ? `${base}?page=${n}` : base },
  };
}

export default async function ListPage({ params, searchParams }: Props) {
  const [{ slug }, { page }] = await Promise.all([params, searchParams]);
  const resolved = await resolveList(slug);
  if (!resolved || !resolved.films.length) notFound();

  const { list, films } = resolved;
  const paged = paginate(films, page);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: list.title,
    description: list.blurb,
    numberOfItems: films.length,
    itemListElement: paged.items.map((t, i) => ({
      "@type": "ListItem",
      position: paged.from + i,
      name: t.title,
      url: `${SITE.url}/discover/${t.slug}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 className="display mb-3 text-3xl leading-tight">{list.title}</h1>
      {paged.page === 1 && (
        <p className="mb-6 max-w-2xl leading-relaxed text-cream/85">{list.intro}</p>
      )}
      <p className="mb-8 text-xs text-muted">
        Showing {paged.from}–{paged.to} of {paged.total} · page {paged.page} of {paged.totalPages} ·{" "}
        <Link href="/lists" className="text-brass hover:underline">all lists</Link>
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {paged.items.map((t) => <DiscoveryCard key={t.id} title={t} />)}
      </div>

      <Pagination paged={paged} basePath={`/lists/${slug}`} />
    </>
  );
}
