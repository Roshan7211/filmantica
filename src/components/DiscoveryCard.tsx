import Link from "next/link";
import Poster from "./Poster";
import { hasAnyOption, type DiscoveryTitle } from "@/lib/discovery";

export default function DiscoveryCard({ title }: { title: DiscoveryTitle }) {
  const count =
    title.options.free.length + title.options.stream.length +
    title.options.rent.length + title.options.buy.length;

  return (
    <Link
      href={`/discover/${title.slug}`}
      className="group block overflow-hidden rounded-md border border-edge bg-ink-2 transition
                 hover:border-brass/50 focus-visible:outline-2 focus-visible:outline-brass"
    >
      <div className="aspect-2/3 overflow-hidden">
        <Poster src={title.posterUrl} title={title.title} year={title.year}
                className="transition duration-500 group-hover:scale-105" />
      </div>
      <div className="p-3">
        <h3 className="display truncate text-[15px] leading-snug">{title.title}</h3>
        <p className="mt-1 text-xs text-muted">
          {title.year && <span>{title.year}</span>}
          {hasAnyOption(title) && (
            <span className="text-brass/80"> · {count} way{count === 1 ? "" : "s"} to watch</span>
          )}
        </p>
      </div>
    </Link>
  );
}
