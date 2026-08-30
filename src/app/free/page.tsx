import type { Metadata } from "next";
import { freeToWatch } from "@/lib/discovery";
import { paginate } from "@/lib/paginate";
import DiscoveryCard from "@/components/DiscoveryCard";
import DiscoveryEmpty from "@/components/DiscoveryEmpty";
import Pagination from "@/components/Pagination";
import { SITE } from "@/lib/site";

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
  const films = await freeToWatch();

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

  return (
    <>
      <h1 className="display mb-1 text-3xl">Free to watch</h1>
      <p className="mb-4 max-w-2xl text-sm text-muted">
        {films.length} films streaming free and legally right now
        {services.length ? ` on ${services.slice(0, 4).join(", ")}` : ""} — no subscription, no
        sign-up. {recent > 0 && `${recent} released in the last two years.`} Newest first.
      </p>
      <p className="mb-8 text-xs text-muted">
        Showing {paged.from}–{paged.to} of {paged.total} · page {paged.page} of {paged.totalPages}
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {paged.items.map((t) => <DiscoveryCard key={t.id} title={t} />)}
      </div>

      <Pagination paged={paged} basePath="/free" />
    </>
  );
}
