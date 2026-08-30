/** Pagination.
 *
 *  Long grids are hard to scan and slow to render — 510 cards on one page is a
 *  lot of markup and a lot of scrolling. Splitting into pages of ~18 keeps each
 *  view quick and gives search engines more, tighter pages to index.
 */

export const PER_PAGE = 18;

export type Paged<T> = {
  items: T[];
  page: number;
  totalPages: number;
  total: number;
  hasPrev: boolean;
  hasNext: boolean;
  from: number;
  to: number;
};

/** Clamps out-of-range and non-numeric input rather than 404ing: ?page=abc or
 *  ?page=999 should still show something sensible. */
export function paginate<T>(all: T[], rawPage: string | number | undefined, perPage = PER_PAGE): Paged<T> {
  const total = all.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const requested = Number(rawPage);
  const page = Number.isFinite(requested) ? Math.min(Math.max(Math.trunc(requested), 1), totalPages) : 1;

  const start = (page - 1) * perPage;
  const items = all.slice(start, start + perPage);

  return {
    items, page, totalPages, total,
    hasPrev: page > 1,
    hasNext: page < totalPages,
    from: total === 0 ? 0 : start + 1,
    to: start + items.length,
  };
}

/** Page numbers to render: first, last, and a window around the current page,
 *  with gaps marked null so the UI can show an ellipsis. */
export function pageWindow(page: number, totalPages: number, span = 1): (number | null)[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const out: (number | null)[] = [];
  const push = (n: number | null) => { if (out[out.length - 1] !== n) out.push(n); };

  push(1);
  if (page - span > 2) push(null);
  for (let n = Math.max(2, page - span); n <= Math.min(totalPages - 1, page + span); n++) push(n);
  if (page + span < totalPages - 1) push(null);
  push(totalPages);
  return out;
}
