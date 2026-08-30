import Link from "next/link";
import type { Metadata } from "next";
import { freeToWatch } from "@/lib/discovery";
import { allMovies } from "@/lib/movies";
import DiscoveryCard from "@/components/DiscoveryCard";
import MovieCard from "@/components/MovieCard";

export const metadata: Metadata = {
  title: "Free movies to watch online — legally, no subscription",
  description:
    "Films you can watch free and legally right now, plus public-domain cinema you can stream and download here directly.",
};

/** Two kinds of free, kept visually distinct because the user experience differs:
 *  titles we host and can be downloaded, versus recent films that are free to
 *  stream on an ad-supported service we link out to. Conflating them would
 *  promise a download we cannot deliver. */
export default async function FreePage() {
  const [streams, hosted] = await Promise.all([freeToWatch(), allMovies()]);

  const services = [...new Set(streams.flatMap((t) => t.options.free.map((o) => o.name)))];

  return (
    <>
      <h1 className="display mb-1 text-3xl">Free to watch</h1>
      <p className="mb-10 max-w-2xl text-sm text-muted">
        {streams.length > 0
          ? <>Films streaming free and legally right now{services.length ? ` on ${services.slice(0, 3).join(", ")}` : ""} — no subscription, no sign-up here.</>
          : <>Run <code className="rounded bg-ink px-1">npm run import:free</code> to populate this section.</>}
      </p>

      {streams.length > 0 && (
        <section className="mb-16">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="display text-xl">Streaming free now</h2>
            <span className="text-xs text-muted">{streams.length} films · newest first</span>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {streams.map((t) => <DiscoveryCard key={t.id} title={t} />)}
          </div>
        </section>
      )}

      {hosted.length > 0 && (
        <section>
          <div className="mb-1 flex items-baseline justify-between">
            <h2 className="display text-xl">Watch and download here</h2>
            <Link href="/movies" className="text-xs text-muted transition hover:text-brass">See all →</Link>
          </div>
          <p className="mb-4 text-xs text-muted">
            {hosted.length} public-domain films we host ourselves — stream or download, no account
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {hosted.slice(0, 10).map((m) => <MovieCard key={m.id} movie={m} />)}
          </div>
        </section>
      )}
    </>
  );
}
