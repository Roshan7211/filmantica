import Link from "next/link";
import Poster from "./Poster";
import type { DiscoveryTitle } from "@/lib/discovery";

/** Cards carry enough to decide without opening the page: year, length, rating,
 *  genre, and — the thing people are actually here for — whether it is free and
 *  on which service. */
export default function DiscoveryCard({ title }: { title: DiscoveryTitle }) {
  const free = title.options.free;
  const paidCount =
    title.options.stream.length + title.options.rent.length + title.options.buy.length;

  const runtime = title.runtime
    ? title.runtime >= 60
      ? `${Math.floor(title.runtime / 60)}h ${title.runtime % 60}m`
      : `${title.runtime}m`
    : null;

  return (
    <Link
      href={`/discover/${title.slug}`}
      className="group flex flex-col overflow-hidden rounded-md border border-edge bg-ink-2 transition
                 hover:border-brass/50 focus-visible:outline-2 focus-visible:outline-brass"
    >
      <div className="relative aspect-2/3 overflow-hidden">
        <Poster src={title.posterUrl} title={title.title} year={title.year}
                className="transition duration-500 group-hover:scale-105" />
        {free.length > 0 && (
          <span className="absolute left-2 top-2 rounded bg-brass px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-ink">
            FREE
          </span>
        )}
        {title.rating ? (
          <span className="absolute right-2 top-2 rounded bg-ink/85 px-1.5 py-0.5 text-[11px] font-medium text-brass ring-1 ring-brass/30">
            ★ {title.rating.toFixed(1)}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="display line-clamp-2 text-[15px] leading-snug">{title.title}</h3>

        <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-muted">
          {title.year && <span>{title.year}</span>}
          {runtime && <><span aria-hidden>·</span><span>{runtime}</span></>}
          {title.genres[0] && <><span aria-hidden>·</span><span className="truncate">{title.genres[0]}</span></>}
        </p>

        <p className="mt-auto pt-2 text-xs">
          {free.length > 0 ? (
            <span className="text-brass">Free on {free.map((o) => o.name).slice(0, 2).join(", ")}</span>
          ) : paidCount > 0 ? (
            <span className="text-muted">{paidCount} way{paidCount === 1 ? "" : "s"} to watch</span>
          ) : (
            <span className="text-muted/60">Not currently available</span>
          )}
        </p>
      </div>
    </Link>
  );
}
