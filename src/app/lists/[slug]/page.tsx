import Link from "next/link";
import { notFound } from "next/navigation";
import { LISTS, resolveList } from "@/lib/lists";
import DiscoveryCard from "@/components/DiscoveryCard";

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return LISTS.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const resolved = await resolveList(slug);
  if (!resolved) return {};
  return {
    title: resolved.list.title,
    description: resolved.list.blurb,
    alternates: { canonical: `/lists/${slug}` },
  };
}

export default async function ListPage({ params }: Params) {
  const { slug } = await params;
  const resolved = await resolveList(slug);
  if (!resolved || !resolved.films.length) notFound();
  const { list, films } = resolved;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: list.title,
    description: list.blurb,
    numberOfItems: films.length,
    itemListElement: films.slice(0, 30).map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.title,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 className="display mb-3 text-3xl leading-tight">{list.title}</h1>
      <p className="mb-8 max-w-2xl leading-relaxed text-cream/85">{list.intro}</p>
      <p className="mb-6 text-xs text-muted">
        {films.length} films · updated automatically ·{" "}
        <Link href="/lists" className="text-brass hover:underline">all lists</Link>
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {films.map((t) => <DiscoveryCard key={t.id} title={t} />)}
      </div>
    </>
  );
}
