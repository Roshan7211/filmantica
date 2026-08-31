"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/** Search with type-ahead suggestions.
 *
 *  Wraps a real <form action="/search">, so with JavaScript unavailable — or
 *  before hydration, which is the commoner case — typing and pressing Enter
 *  still reaches the results page. The dropdown is an enhancement on top of
 *  that, never the only way through.
 */

type Suggestion = {
  slug: string;
  title: string;
  year: number | null;
  titleType: "movie" | "tv_series" | "tv_miniseries";
  posterUrl: string | null;
  free: boolean;
};

export default function SearchBox() {
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  /** Results carry the term they answer, so a reply can be told apart from the
   *  box's current contents without a second piece of state to keep in step. */
  const [data, setData] = useState<{ term: string; list: Suggestion[] } | null>(null);

  /** Fetch on every keystroke, debounced.
   *
   *  Two things have to be right or the list lies about what was typed. The
   *  timer is cleared on each change so only the final pause fetches; and the
   *  request is aborted, because responses can arrive out of order and a slow
   *  reply for "ba" must never overwrite a fast one for "bahubali". */
  useEffect(() => {
    const term = query.trim();
    // Nothing is set synchronously here: React flags a setState run directly in
    // an effect body, and it would also make this effect fight the render it was
    // triggered by. State is written only from the callback below.
    if (term.length < 2) return;

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        const body = await res.json();
        setData({ term, list: body.results ?? [] });
        setActive(-1);
      } catch {
        // An abort is the normal path on fast typing, not a failure. Either way
        // the box falls back to being an ordinary search field.
      }
    }, 120);

    // Clearing the timer means only the final pause fetches. Aborting matters
    // just as much: replies can arrive out of order, and a slow one for "ba"
    // must never overwrite a fast one for "bahubali".
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // A click anywhere else dismisses the list. Pointerdown rather than click so
  // the list is gone before the click lands on whatever was underneath it.
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  const go = (s: Suggestion) => {
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
    router.push(`/discover/${s.slug}`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open || !items.length) return;

    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();                       // stop the caret jumping
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (i + step + items.length + 1) % (items.length + 1));
    } else if (e.key === "Enter" && active >= 0 && active < items.length) {
      e.preventDefault();                       // take the highlighted title
      go(items[active]);                        // instead of submitting the form
    }
  };

  const term = query.trim();
  // Results from the previous keystroke stay visible while the next reply is in
  // flight — a list that blanks on every character is worse than one a moment behind.
  const items = data?.list ?? [];
  const settled = data?.term === term;
  const showList = open && term.length >= 2 && (items.length > 0 || settled);

  return (
    <div ref={rootRef} className="relative ml-auto">
      <form action="/search" role="search">
        <input
          ref={inputRef}
          name="q"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search films…"
          aria-label="Search films"
          autoComplete="off"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          className="w-36 rounded border border-edge bg-ink-2 px-3 py-1.5 text-sm outline-none
                     transition focus:w-56 focus:border-brass/60 sm:w-48"
        />
      </form>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Search suggestions"
          className="absolute right-0 top-full z-50 mt-2 max-h-[70vh] w-[min(21rem,calc(100vw-2rem))]
                     overflow-y-auto overscroll-contain rounded-md border border-edge bg-ink
                     py-1 shadow-xl shadow-black/40"
        >
          {items.map((s, i) => (
            <li
              key={s.slug}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              // Pointerdown, not click: the input's blur would otherwise close
              // the list before a click could register on it.
              onPointerDown={(e) => { e.preventDefault(); go(s); }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center gap-3 px-3 py-2 text-left transition
                          ${i === active ? "bg-ink-2" : ""}`}
            >
              <span className="h-12 w-8 shrink-0 overflow-hidden rounded-sm border border-edge bg-ink-2">
                {s.posterUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={s.posterUrl} alt="" loading="lazy" width={32} height={48}
                       className="h-full w-full object-cover" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-cream">{s.title}</span>
                <span className="mt-0.5 block text-xs text-muted">
                  {s.year ?? "—"}
                  {s.titleType !== "movie" && " · Series"}
                </span>
              </span>
              {s.free && (
                <span className="shrink-0 rounded bg-brass px-1.5 py-0.5 text-[10px] font-semibold text-ink">
                  FREE
                </span>
              )}
            </li>
          ))}

          {!items.length && settled && (
            <li role="presentation" className="px-3 py-3 text-xs text-muted">
              Nothing matched “{term}”.
            </li>
          )}

          {items.length > 0 && (
            <li
              role="option"
              aria-selected={active === items.length}
              id={`${listId}-${items.length}`}
              onPointerDown={(e) => {
                e.preventDefault();
                setOpen(false);
                router.push(`/search?q=${encodeURIComponent(term)}`);
              }}
              onMouseEnter={() => setActive(items.length)}
              className={`mt-1 cursor-pointer border-t border-edge px-3 py-2 text-xs text-brass
                          ${active === items.length ? "bg-ink-2" : ""}`}
            >
              See all results for “{term}”
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
