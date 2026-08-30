import Link from "next/link";
import type { Metadata } from "next";
import { populatedLanguages } from "@/lib/languages";

export const metadata: Metadata = {
  alternates: { canonical: "/language" },
  title: "Browse by industry — Bollywood, Hollywood, Korean and more",
  description:
    "Films and series by language and industry, with every legal way to watch and which are free right now in India.",
};

export default async function LanguagesPage() {
  const rows = await populatedLanguages();

  return (
    <>
      <h1 className="display mb-1 text-3xl">Browse by industry</h1>
      <p className="mb-8 max-w-2xl text-sm text-muted">
        By language and industry, free titles counted separately so you can see what costs nothing.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(({ lang, count, free }) => (
          <Link
            key={lang.slug}
            href={`/language/${lang.slug}`}
            className="rounded-lg border border-edge bg-ink-2 p-5 transition hover:border-brass/50"
          >
            <h2 className="display text-lg leading-snug">{lang.name}</h2>
            <p className="mt-1 text-sm text-muted">{lang.blurb}</p>
            <p className="mt-3 text-xs">
              <span className="text-cream/80">{count} titles</span>
              {free > 0 && <span className="text-brass"> · {free} free</span>}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
