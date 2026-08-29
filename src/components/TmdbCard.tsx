import Link from "next/link";
import Poster from "./Poster";
import { tmdbSlug, type TmdbMovie } from "@/lib/tmdb";

export default function TmdbCard({ movie }: { movie: TmdbMovie }) {
  return (
    <Link
      href={`/discover/${tmdbSlug(movie)}`}
      className="group block overflow-hidden rounded-md border border-edge bg-ink-2 transition
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
          {movie.rating ? <span className="text-brass/80">★ {movie.rating}</span> : null}
        </p>
      </div>
    </Link>
  );
}
