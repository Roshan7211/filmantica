import Link from "next/link";
import { notFound } from "next/navigation";
import { allDiscovery, getDiscovery, hasAnyOption, genreSlug, type WatchOption } from "@/lib/discovery";
import Poster from "@/components/Poster";
import TrailerPlayer from "@/components/TrailerPlayer";
import CastList from "@/components/CastList";
import JsonLd from "@/components/JsonLd";
import { graph, breadcrumb, titleSchema } from "@/lib/schema";
import { SITE } from "@/lib/site";

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await allDiscovery()).map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const t = await getDiscovery(slug);
  if (!t) return {};
  const title = `Where to watch ${t.title}${t.year ? ` (${t.year})` : ""}`;
  return {
    title,
    description: `Every legal way to stream, rent or buy ${t.title} — compared in one place.`,
    alternates: { canonical: `/discover/${t.slug}` },
  };
}

function Options({ label, items }: { label: string; items: WatchOption[] }) {
  if (!items.length) return null;
  return (
    <div className="mb-5">
      <h2 className="mb-2 text-xs uppercase tracking-[0.15em] text-brass">{label}</h2>
      <ul className="flex flex-wrap gap-2">
        {items.map((o) => {
          const body = (
            <>
              <span>{o.name}</span>
              {o.price ? <span className="text-muted">· {o.price.toFixed(2)}</span> : null}
              {o.format ? <span className="text-muted/70">· {o.format}</span> : null}
            </>
          );
          return (
            <li key={`${o.name}-${o.format ?? ""}`}>
              {o.url ? (
                <a href={o.url} target="_blank" rel="noreferrer noopener sponsored"
                   className="flex items-center gap-2 rounded border border-edge bg-ink-2 px-3 py-2 text-sm
                              transition hover:border-brass/60">
                  {body}
                </a>
              ) : (
                <span className="flex items-center gap-2 rounded border border-edge bg-ink-2 px-3 py-2 text-sm">
                  {body}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default async function WhereToWatch({ params }: Params) {
  const { slug } = await params;
  const t = await getDiscovery(slug);
  if (!t) notFound();


  const kind = t.titleType === "movie" ? "Movies" : "TV series";
  const jsonLd = graph(
    titleSchema(t),
    breadcrumb([
      { name: kind, path: t.titleType === "movie" ? "/discover" : "/tv" },
      { name: t.title, path: `/discover/${t.slug}` },
    ]),
  );

  return (
    <>
      <JsonLd data={jsonLd} />

      <div className="grid gap-8 sm:grid-cols-[200px_1fr]">
        <div className="aspect-2/3 overflow-hidden rounded-md border border-edge">
          <Poster src={t.posterUrl} title={t.title} year={t.year} />
        </div>

        <div>
          <h1 className="display text-3xl leading-tight sm:text-4xl">Where to watch {t.title}</h1>
          {/* Facts up front: people scan these before reading a synopsis. */}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted">
            {t.year && <span>{t.year}</span>}
            {t.runtime ? (
              <span>
                {t.runtime >= 60 ? `${Math.floor(t.runtime / 60)}h ${t.runtime % 60}m` : `${t.runtime}m`}
              </span>
            ) : null}
            {t.rating ? (
              <span className="rounded bg-brass/15 px-2 py-0.5 text-brass ring-1 ring-brass/30">
                ★ {t.rating.toFixed(1)}
              </span>
            ) : null}
            {t.options.free.length > 0 && (
              <span className="rounded bg-brass px-2 py-0.5 text-xs font-semibold text-ink">
                FREE TO WATCH
              </span>
            )}
            {t.certification && (
              <span className="rounded border border-edge px-2 py-0.5 text-xs uppercase tracking-wide">
                {t.certification}
              </span>
            )}
            {t.language && t.language !== "en" && (
              <span className="text-xs uppercase tracking-wide">{t.language}</span>
            )}
          </div>

          {t.genres.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {t.genres.map((g) => (
                <Link key={g} href={`/genre/${genreSlug(g)}`}
                  className="rounded-full border border-edge px-3 py-1 text-xs text-muted transition
                             hover:border-brass/60 hover:text-cream">
                  {g}
                </Link>
              ))}
            </div>
          )}

          {t.plot && <p className="mt-5 max-w-2xl leading-relaxed text-cream/85">{t.plot}</p>}

          {t.releaseDate && (
            <p className="mt-4 text-xs text-muted">
              Released{" "}
              {new Date(t.releaseDate).toLocaleDateString("en-GB", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </p>
          )}

          {t.trailerId && (
            <div className="mt-8 max-w-2xl">
              <h2 className="mb-3 text-xs uppercase tracking-[0.15em] text-brass">Trailer</h2>
              <TrailerPlayer videoId={t.trailerId} title={t.title} poster={t.backdropUrl} />
            </div>
          )}

          <div className="mt-8">
            <Options label="Free" items={t.options.free} />
            <Options label="Stream" items={t.options.stream} />
            <Options label="Rent" items={t.options.rent} />
            <Options label="Buy" items={t.options.buy} />

            {!hasAnyOption(t) && (
              <p className="rounded border border-edge bg-ink-2 p-4 text-sm text-muted">
                No streaming options listed for this region right now.
              </p>
            )}
          </div>

          <p className="mt-10 text-xs leading-relaxed text-muted">
            Availability data can change without notice. {SITE.name} does not stream this title —
            the links above go to licensed services.
          </p>

          <CastList title={t} />
        </div>
      </div>
    </>
  );
}
