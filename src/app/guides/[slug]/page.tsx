import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticle, publishedArticles } from "@/lib/articles";
import { SITE } from "@/lib/site";
import JsonLd from "@/components/JsonLd";
import { graph, breadcrumb, ORG_ID, SITE_ID } from "@/lib/schema";

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await publishedArticles()).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const a = await getArticle(slug);
  if (!a) return {};
  return {
    title: a.title,
    description: a.description,
    alternates: { canonical: `${SITE.url}/guides/${a.slug}` },
    openGraph: { title: a.title, description: a.description, type: "article" },
  };
}

export default async function ArticlePage({ params }: Params) {
  const { slug } = await params;
  const a = await getArticle(slug);
  if (!a) notFound();

  const jsonLd = graph(
    {
      "@type": "Article",
      headline: a.title,
      description: a.description,
      datePublished: a.published,
      dateModified: a.updated ?? a.published,
      author: { "@type": "Organization", name: a.author },
      publisher: { "@id": ORG_ID },
      isPartOf: { "@id": SITE_ID },
      mainEntityOfPage: `${SITE.url}/guides/${a.slug}`,
      wordCount: a.wordCount,
      inLanguage: "en-IN",
    },
    breadcrumb([
      { name: "Guides", path: "/guides" },
      { name: a.title, path: `/guides/${a.slug}` },
    ]),
  );

  return (
    <>
      <JsonLd data={jsonLd} />

      <article className="mx-auto max-w-2xl">
        <Link href="/guides" className="text-xs text-muted transition hover:text-brass">← Guides</Link>

        <h1 className="display mt-4 text-3xl leading-tight sm:text-4xl">{a.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">{a.description}</p>
        <p className="mt-4 border-b border-edge pb-6 text-xs text-muted">
          {new Date(a.published).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          {" · "}{a.readingMinutes} min read
        </p>

        <div className="prose-article mt-8" dangerouslySetInnerHTML={{ __html: a.html }} />
      </article>
    </>
  );
}
