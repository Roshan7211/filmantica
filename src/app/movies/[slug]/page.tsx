import Link from "next/link";
import { notFound } from "next/navigation";
import { allMovies, getMovie } from "@/lib/movies";
import Poster from "@/components/Poster";
import { SITE } from "@/lib/site";

type Params = { params: Promise<{ slug: string }> };

/** Pre-render every title — these pages are the site's entire SEO surface. */
export async function generateStaticParams() {
  return (await allMovies()).map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const movie = await getMovie(slug);
  if (!movie) return {};
  const title = `${movie.title}${movie.year ? ` (${movie.year})` : ""} — watch free`;
  return {
    title,
    description: movie.description.slice(0, 155),
    alternates: { canonical: `/movies/${movie.slug}` },
    openGraph: { title, description: movie.description.slice(0, 155), images: movie.posterUrl ? [movie.posterUrl] : [] },
  };
}

export default async function MoviePage({ params }: Params) {
  const { slug } = await params;
  const movie = await getMovie(slug);
  if (!movie) notFound();

  /* VideoObject markup makes the page eligible for Google video rich results —
     a large click-through advantage for "<title> full movie free" queries. */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: movie.title,
    description: movie.description,
    thumbnailUrl: movie.posterUrl ? [movie.posterUrl] : undefined,
    uploadDate: movie.createdAt,
    duration: movie.duration ? `PT${Math.floor(movie.duration / 60)}M` : undefined,
    contentUrl: movie.videoUrl ?? undefined,
    embedUrl: `${SITE.url}/watch/${movie.slug}`,
    isFamilyFriendly: true,
    isAccessibleForFree: true,
    license: movie.licenseUrl ?? undefined,
    creator: movie.director ? { "@type": "Person", name: movie.director } : undefined,
    genre: movie.genres,
  };

  return (
    <>
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="grid gap-8 sm:grid-cols-[220px_1fr]">
        <div className="aspect-2/3 overflow-hidden rounded-md border border-edge">
          <Poster src={movie.posterUrl ? `/api/poster/${movie.slug}` : null} title={movie.title} year={movie.year} />
        </div>

        <div>
          <h1 className="display text-4xl leading-tight">{movie.title}</h1>
          <p className="mt-2 text-sm text-muted">
            {[movie.year, movie.director, movie.duration && `${Math.round(movie.duration / 60)} min`]
              .filter(Boolean).join(" · ")}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {movie.genres.map((g) => (
              <Link key={g} href={`/genres/${encodeURIComponent(g.toLowerCase())}`}
                className="rounded-full border border-edge px-3 py-1 text-xs text-muted transition hover:border-brass/60 hover:text-cream">
                {g}
              </Link>
            ))}
          </div>

          <p className="mt-6 max-w-2xl leading-relaxed text-cream/85">{movie.description}</p>

          {movie.cast.length > 0 && (
            <p className="mt-4 text-sm text-muted">
              <span className="text-cream/70">Cast:</span> {movie.cast.join(", ")}
            </p>
          )}

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={`/watch/${movie.slug}`}
              className="rounded bg-brass px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-brass/90">
              Watch free
            </Link>
            {movie.downloadUrl && (
              <a href={movie.downloadUrl} download
                className="rounded border border-edge px-5 py-2.5 text-sm transition hover:border-brass/60">
                Download
              </a>
            )}
          </div>

          {/* Rights provenance stays visible — it is the point of the project. */}
          <div className="mt-9 rounded border border-edge bg-ink-2 p-4 text-xs leading-relaxed text-muted">
            <div className="mb-1 flex items-center gap-2">
              <span className="uppercase tracking-widest text-brass">Rights</span>
              {movie.licenseVerified
                ? <span className="rounded bg-green-900/40 px-1.5 py-0.5 text-green-300">verified</span>
                : <span className="rounded bg-brass/15 px-1.5 py-0.5 text-brass">unverified</span>}
            </div>
            <p>Licence: {movie.license}</p>
            {movie.attributionText && <p className="mt-1">{movie.attributionText}</p>}
            <p className="mt-1">
              Source:{" "}
              <a href={movie.sourceUrl} target="_blank" rel="noreferrer noopener"
                className="text-cream/80 underline decoration-edge underline-offset-2">
                {movie.source}
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
