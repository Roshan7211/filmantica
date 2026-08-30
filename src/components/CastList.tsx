import type { DiscoveryTitle } from "@/lib/discovery";
import { directorsOf, writersOf } from "@/lib/credits";

/** Cast and key crew.
 *
 *  Names are shown without headshots deliberately: portrait images would mean
 *  another third-party image host on every page, for information a name already
 *  conveys.
 */
export default function CastList({ title }: { title: DiscoveryTitle }) {
  const cast = title.cast ?? [];
  const crew = title.crew ?? [];
  if (!cast.length && !crew.length) return null;

  // Directors and writers first — the credits people actually look for.
  // Parsed rather than substring-matched: "Director of Photography" is not a director.
  const directors = directorsOf(crew);
  const writers = writersOf(crew);

  return (
    <section className="mt-10 border-t border-edge pt-6">
      {(directors.length > 0 || writers.length > 0) && (
        <div className="mb-6 flex flex-wrap gap-x-10 gap-y-3 text-sm">
          {directors.length > 0 && (
            <div>
              <h3 className="mb-1 text-xs uppercase tracking-[0.14em] text-brass">
                {directors.length > 1 ? "Directors" : "Director"}
              </h3>
              <p className="text-cream/85">{directors.map((d) => d.name).join(", ")}</p>
            </div>
          )}
          {writers.length > 0 && (
            <div>
              <h3 className="mb-1 text-xs uppercase tracking-[0.14em] text-brass">
                {writers.length > 1 ? "Writers" : "Writer"}
              </h3>
              <p className="text-cream/85">{writers.map((w) => w.name).join(", ")}</p>
            </div>
          )}
        </div>
      )}

      {cast.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs uppercase tracking-[0.14em] text-brass">Cast</h3>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
            {cast.map((p) => (
              <li key={p.name} className="text-sm leading-snug">
                <span className="text-cream/90">{p.name}</span>
                {p.role && <span className="block text-xs text-muted">{p.role}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
