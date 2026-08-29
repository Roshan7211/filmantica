import Link from "next/link";
import { notFound } from "next/navigation";
import { discoveryByGenre, discoveryGenres } from "@/lib/discovery";
import DiscoveryCard from "@/components/DiscoveryCard";

type Params = { params: Promise<{ name: string }> };

export async function generateStaticParams() {
  return (await discoveryGenres()).map((g) => ({ name: g.name.toLowerCase() }));
}

export async function generateMetadata({ params }: Params) {
  const { name } = await params;
  const genre = decodeURIComponent(name);
  const title = `${genre[0]?.toUpperCase()}${genre.slice(1)} movies — where to watch`;
  return { title, description: `Every legal way to stream, rent or buy ${genre} films.` };
}

export default async function GenrePage({ params }: Params) {
  const { name } = await params;
  const genre = decodeURIComponent(name);
  const titles = await discoveryByGenre(genre);
  if (!titles.length) notFound();

  return (
    <>
      <h1 className="display mb-1 text-3xl capitalize">{genre}</h1>
      <p className="mb-8 text-sm text-muted">
        {titles.length} films · newest first ·{" "}
        <Link href="/movies" className="text-brass underline underline-offset-2">
          see what&rsquo;s free to watch here
        </Link>
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {titles.map((t) => <DiscoveryCard key={t.id} title={t} />)}
      </div>
    </>
  );
}
