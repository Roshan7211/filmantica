import Link from "next/link";
import type { Metadata } from "next";
import { populatedLists } from "@/lib/lists";

export const metadata: Metadata = {
  alternates: { canonical: "/lists" },
  title: "Curated lists — free movies by genre and year",
  description: "Hand-picked lists of films you can watch free and legally right now.",
};

export default async function ListsPage() {
  const lists = await populatedLists();
  return (
    <>
      <h1 className="display mb-1 text-3xl">Lists</h1>
      <p className="mb-8 max-w-2xl text-sm text-muted">
        Everything below is free and legal to watch right now. Lists update themselves as films
        arrive on and leave free services.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {lists.map(({ list, count }) => (
          <Link key={list.slug} href={`/lists/${list.slug}`}
            className="rounded-lg border border-edge bg-ink-2 p-5 transition hover:border-brass/50">
            <h2 className="display text-lg leading-snug">{list.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{list.blurb}</p>
            <p className="mt-3 text-xs text-brass">{count} films →</p>
          </Link>
        ))}
      </div>
    </>
  );
}
