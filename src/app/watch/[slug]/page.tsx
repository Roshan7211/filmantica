import Link from "next/link";
import { notFound } from "next/navigation";
import { getMovie, allMovies } from "@/lib/movies";

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await allMovies()).map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const movie = await getMovie(slug);
  return movie ? { title: `Watch ${movie.title} free` } : {};
}

export default async function WatchPage({ params }: Params) {
  const { slug } = await params;
  const movie = await getMovie(slug);
  if (!movie) notFound();

  return (
    <>
      <Link href={`/movies/${movie.slug}`} className="mb-4 inline-block text-sm text-muted hover:text-brass">
        ← {movie.title}
      </Link>

      <div className="overflow-hidden rounded-md border border-edge bg-black">
        {movie.videoUrl ? (
          /* Archive.org serves progressive MP4, which plays natively. A future
             self-hosted HLS ladder would swap this for hls.js. */
          <video
            controls
            preload="metadata"
            poster={movie.posterUrl ?? undefined}
            className="aspect-video w-full bg-black"
          >
            <source src={movie.videoUrl} type="video/mp4" />
            Your browser cannot play this file.
          </video>
        ) : (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 px-6 text-center">
            <p className="display text-lg">No video source yet</p>
            <p className="max-w-md text-sm text-muted">
              This record has no verified video URL. Run the importer to populate playable
              sources from the Internet Archive.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
        <span>Licence: {movie.license}</span>
        {movie.downloadUrl && (
          <a href={movie.downloadUrl} download className="text-brass hover:underline">Download this film</a>
        )}
      </div>
    </>
  );
}
