import Link from "next/link";
import { notFound } from "next/navigation";
import { discoveryByGenre, discoveryGenres, genreSlug, genreDisplayName } from "@/lib/discovery";
import { paginate } from "@/lib/paginate";
import DiscoveryCard from "@/components/DiscoveryCard";
import Pagination from "@/components/Pagination";
import { SITE } from "@/lib/site";

type Props = { params: Promise<{ name: string }>; searchParams: Promise<{ page?: string }> };

export async function generateStaticParams() {
  return (await discoveryGenres()).map((g) => ({ name: genreSlug(g.name) }));
}

export async function generateMetadata({ params, searchParams }: Props) {
  const [{ name }, { page }] = await Promise.all([params, searchParams]);
  const genre = (await genreDisplayName(name)) ?? decodeURIComponent(name);
  const n = Number(page) || 1;
  const base = `${SITE.url}/genre/${name}`;
  return {
    title: n > 1 ? `${genre} movies — page ${n}` : `${genre} movies — where to watch`,
    description: `Every legal way to stream, rent or buy ${genre.toLowerCase()} films, plus what is free right now.`,
    alternates: { canonical: n > 1 ? `${base}?page=${n}` : base },
  };
}

export default async function GenrePage({ params, searchParams }: Props) {
  const [{ name }, { page }] = await Promise.all([params, searchParams]);
  const genre = (await genreDisplayName(name)) ?? decodeURIComponent(name);
  const titles = await discoveryByGenre(name);
  if (!titles.length) notFound();

  const paged = paginate(titles, page);
  const freeCount = titles.filter((t) => t.options.free.length).length;

  return (
    <>
      <h1 className="display mb-1 text-3xl">{genre} movies</h1>
      <p className="mb-4 max-w-2xl text-sm text-muted">
        {titles.length} {genre.toLowerCase()} films and where each can legally be watched.
        {freeCount > 0 && (
          <> <strong className="text-brass">{freeCount} are free right now</strong> — see{" "}
            <Link href="/free" className="text-brass underline underline-offset-2">everything free</Link>.</>
        )}
      </p>
      <p className="mb-8 text-xs text-muted">
        Showing {paged.from}–{paged.to} of {paged.total} · page {paged.page} of {paged.totalPages}
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {paged.items.map((t) => <DiscoveryCard key={t.id} title={t} />)}
      </div>

      <Pagination paged={paged} basePath={`/genre/${name}`} />
    </>
  );
}
