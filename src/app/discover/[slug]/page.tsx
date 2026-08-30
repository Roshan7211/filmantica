import Link from "next/link";
import { notFound } from "next/navigation";
import { allDiscovery, getDiscovery, hasAnyOption, type WatchOption } from "@/lib/discovery";
import Poster from "@/components/Poster";
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


  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: t.title,
    description: t.plot || undefined,
    image: t.posterUrl ?? undefined,
    datePublished: t.year ? String(t.year) : undefined,
    genre: t.genres.length ? t.genres : undefined,
    duration: t.runtime ? `PT${t.runtime}M` : undefined,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="grid gap-8 sm:grid-cols-[200px_1fr]">
        <div className="aspect-2/3 overflow-hidden rounded-md border border-edge">
          <Poster src={t.posterUrl} title={t.title} year={t.year} />
        </div>

        <div>
          <h1 className="display text-3xl leading-tight sm:text-4xl">Where to watch {t.title}</h1>
          <p className="mt-2 text-sm text-muted">
            {[t.year, t.runtime && `${t.runtime} min`, t.genres.slice(0, 3).join(", ")]
              .filter(Boolean).join(" · ")}
          </p>

          {t.plot && <p className="mt-5 max-w-2xl leading-relaxed text-cream/85">{t.plot}</p>}

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
        </div>
      </div>
    </>
  );
}
