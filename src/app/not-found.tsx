import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata = { title: "Page not found" };

/** A 404 that recovers the visitor instead of stranding them.
 *
 *  Most arrivals here are a film that has left the catalogue or a mistyped URL,
 *  so the useful response is routes back into browsing rather than an apology.
 */
export default function NotFound() {
  const routes: [string, string, string][] = [
    ["Free to watch", "/free", "Everything streaming free right now"],
    ["TV series", "/tv", "Series and miniseries, free ones marked"],
    ["Lists", "/lists", "Curated by genre, service and year"],
    ["Guides", "/guides", "How free streaming works"],
  ];

  return (
    <div className="mx-auto max-w-2xl py-10">
      <p className="mb-2 text-xs uppercase tracking-[0.2em] text-brass">404</p>
      <h1 className="display text-3xl leading-tight sm:text-4xl">
        We couldn&rsquo;t find that page
      </h1>
      <p className="mt-4 leading-relaxed text-cream/85">
        It may have been a film that has since left the catalogue — availability changes as
        licences expire — or a link that was mistyped. Either way, here is the way back.
      </p>

      <form action="/search" className="mt-8 flex gap-2">
        <input
          name="q"
          placeholder="Search for a film or series…"
          aria-label="Search"
          className="w-full rounded border border-edge bg-ink-2 px-4 py-2.5 text-sm outline-none
                     transition focus:border-brass/60"
        />
        <button
          type="submit"
          className="rounded bg-brass px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-brass/90"
        >
          Search
        </button>
      </form>

      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        {routes.map(([label, href, blurb]) => (
          <Link
            key={href}
            href={href}
            className="rounded-lg border border-edge bg-ink-2 p-4 transition hover:border-brass/50"
          >
            <span className="display block text-[15px]">{label}</span>
            <span className="mt-1 block text-xs text-muted">{blurb}</span>
          </Link>
        ))}
      </div>

      <p className="mt-10 text-xs text-muted">
        If you followed a link from elsewhere on {SITE.name} and landed here, that is a bug on our
        side — <Link href="/contact" className="text-brass hover:underline">tell us</Link> and we
        will fix it.
      </p>
    </div>
  );
}
