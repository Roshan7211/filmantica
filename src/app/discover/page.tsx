import Link from "next/link";
import type { Metadata } from "next";
import { allDiscovery, discoveryPopulated } from "@/lib/discovery";
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
    title: n > 1 ? `All movies — page ${n}` : "All movies — where to watch",
    description: "Every film we track, with every legal way to stream, rent or buy it.",
    alternates: { canonical: n > 1 ? `${SITE.url}/discover?page=${n}` : `${SITE.url}/discover` },
  };
}

export default async function DiscoverPage({ searchParams }: Props) {
  if (!(await discoveryPopulated())) {
    return (
      <>
        <h1 className="display mb-6 text-3xl">Movies</h1>
        <DiscoveryEmpty />
      </>
    );
  }

  const { page } = await searchParams;
  const titles = await allDiscovery();
  const paged = paginate(titles, page);

  return (
    <>
      <h1 className="display mb-1 text-3xl">All movies</h1>
      <p className="mb-4 max-w-2xl text-sm text-muted">
        Where these films can legally be watched. Links go to licensed services — see{" "}
        <Link href="/free" className="text-brass underline underline-offset-2">what&rsquo;s free right now</Link>.
      </p>
      <p className="mb-8 text-xs text-muted">
        Showing {paged.from}–{paged.to} of {paged.total} · page {paged.page} of {paged.totalPages}
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {paged.items.map((t) => <DiscoveryCard key={t.id} title={t} />)}
      </div>

      <Pagination paged={paged} basePath="/discover" />
    </>
  );
}
