import Link from "next/link";
import type { Metadata } from "next";
import { publishedArticles } from "@/lib/articles";

export const metadata: Metadata = {
  alternates: { canonical: "/guides" },
  title: "Guides to watching films free and legally",
  description:
    "How free streaming works in India, which services carry what, and how to tell a licensed service from an unlicensed one.",
};

export default async function GuidesPage() {
  const articles = await publishedArticles();

  if (!articles.length) {
    return (
      <>
        <h1 className="display mb-3 text-3xl">Guides</h1>
        <p className="max-w-2xl rounded border border-edge bg-ink-2 p-6 text-sm leading-relaxed text-muted">
          No guides published yet. Drafts live in{" "}
          <code className="rounded bg-ink px-1">content/articles</code> and appear here once
          their front matter says <code className="rounded bg-ink px-1">reviewed: true</code>.
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="display mb-1 text-3xl">Guides</h1>
      <p className="mb-8 max-w-2xl text-sm text-muted">
        How free streaming works, what each service actually carries, and how to watch without
        paying or breaking the law.
      </p>

      <div className="flex flex-col gap-4">
        {articles.map((a) => (
          <Link key={a.slug} href={`/guides/${a.slug}`}
            className="rounded-lg border border-edge bg-ink-2 p-5 transition hover:border-brass/50">
            <h2 className="display text-lg leading-snug">{a.title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{a.description}</p>
            <p className="mt-3 text-xs text-brass">{a.readingMinutes} min read →</p>
          </Link>
        ))}
      </div>
    </>
  );
}
