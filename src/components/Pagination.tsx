import Link from "next/link";
import { pageWindow, type Paged } from "@/lib/paginate";

/** `basePath` is the route without a query string; page is carried as ?page=N so
 *  each list needs only one route. */
export default function Pagination<T>({ paged, basePath }: { paged: Paged<T>; basePath: string }) {
  if (paged.totalPages <= 1) return null;

  const href = (n: number) => (n === 1 ? basePath : `${basePath}?page=${n}`);
  const cls =
    "flex h-9 min-w-9 items-center justify-center rounded border px-3 text-sm transition";

  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
      {paged.hasPrev ? (
        <Link href={href(paged.page - 1)} rel="prev"
          className={`${cls} border-edge text-cream hover:border-brass/60`}>← Prev</Link>
      ) : (
        <span className={`${cls} border-edge/50 text-muted/40`}>← Prev</span>
      )}

      {pageWindow(paged.page, paged.totalPages).map((n, i) =>
        n === null ? (
          <span key={`gap-${i}`} className="px-1 text-muted">…</span>
        ) : n === paged.page ? (
          <span key={n} aria-current="page"
            className={`${cls} border-brass bg-brass/15 font-medium text-brass`}>{n}</span>
        ) : (
          <Link key={n} href={href(n)} className={`${cls} border-edge text-cream hover:border-brass/60`}>
            {n}
          </Link>
        ),
      )}

      {paged.hasNext ? (
        <Link href={href(paged.page + 1)} rel="next"
          className={`${cls} border-edge text-cream hover:border-brass/60`}>Next →</Link>
      ) : (
        <span className={`${cls} border-edge/50 text-muted/40`}>Next →</span>
      )}
    </nav>
  );
}
