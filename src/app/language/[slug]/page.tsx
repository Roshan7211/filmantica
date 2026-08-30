import Link from "next/link";
import { notFound } from "next/navigation";
import { LANGUAGES, getLanguage, titlesInLanguage } from "@/lib/languages";
import { paginate } from "@/lib/paginate";
import DiscoveryCard from "@/components/DiscoveryCard";
import Pagination from "@/components/Pagination";
import { SITE } from "@/lib/site";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

export async function generateStaticParams() {
  return LANGUAGES.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params, searchParams }: Props) {
  const [{ slug }, { page }] = await Promise.all([params, searchParams]);
  const lang = getLanguage(slug);
  if (!lang) return {};
  const n = Number(page) || 1;
  const base = `${SITE.url}/language/${slug}`;
  return {
    title: n > 1 ? `${lang.name} — page ${n}` : `${lang.name} — where to watch, free options marked`,
    description: `${lang.blurb} Every legal way to stream, rent or buy, and what is free right now in India.`,
    alternates: { canonical: n > 1 ? `${base}?page=${n}` : base },
  };
}

export default async function LanguagePage({ params, searchParams }: Props) {
  const [{ slug }, { page }] = await Promise.all([params, searchParams]);
  const lang = getLanguage(slug);
  if (!lang) notFound();

  const titles = await titlesInLanguage(lang.code);
  if (!titles.length) notFound();

  const paged = paginate(titles, page);
  const free = titles.filter((t) => t.options.free.length > 0).length;

  return (
    <>
      <h1 className="display mb-1 text-3xl">{lang.name}</h1>
      <p className="mb-3 max-w-2xl text-sm text-muted">
        {titles.length} titles.
        {free > 0 && (
          <> <strong className="text-brass">{free} are free to watch right now</strong> — see{" "}
            <Link href="/free" className="text-brass underline underline-offset-2">everything free</Link>.</>
        )}
      </p>

      {/* Said plainly rather than letting the page overclaim what it contains. */}
      {lang.caveat && (
        <p className="mb-6 max-w-2xl rounded border border-edge bg-ink-2 px-4 py-3 text-xs leading-relaxed text-muted">
          {lang.caveat}
        </p>
      )}

      <p className="mb-8 text-xs text-muted">
        Showing {paged.from}–{paged.to} of {paged.total} · page {paged.page} of {paged.totalPages} ·
        free titles first
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {paged.items.map((t) => <DiscoveryCard key={t.id} title={t} />)}
      </div>

      <Pagination paged={paged} basePath={`/language/${slug}`} />
    </>
  );
}
