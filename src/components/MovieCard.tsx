import Link from "next/link";
import Poster from "./Poster";
import type { Movie } from "@/lib/types";

export default function MovieCard({ movie }: { movie: Movie }) {
  return (
    <Link
      href={`/movies/${movie.slug}`}
      className="group relative block overflow-hidden rounded-md border border-edge bg-ink-2 transition
                 hover:border-brass/50 focus-visible:outline-2 focus-visible:outline-brass"
    >
      <div className="aspect-2/3 overflow-hidden">
        <Poster src={movie.posterUrl} title={movie.title} year={movie.year}
                className="transition duration-500 group-hover:scale-105" />
      </div>
      <div className="p-3">
        <h3 className="display truncate text-[15px] leading-snug">{movie.title}</h3>
        <p className="mt-1 flex items-center gap-2 text-xs text-muted">
          {movie.year && <span>{movie.year}</span>}
          {movie.duration && <span>· {Math.round(movie.duration / 60)}m</span>}
        </p>
      </div>
      {!movie.licenseVerified && (
        <span className="absolute right-2 top-2 rounded bg-ink/85 px-1.5 py-0.5 text-[10px] tracking-wide text-brass ring-1 ring-brass/30">
          UNVERIFIED
        </span>
      )}
    </Link>
  );
}
