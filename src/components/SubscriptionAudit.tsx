"use client";
import { useMemo, useSyncExternalStore, useCallback } from "react";
import Link from "next/link";
import type { AuditPayload } from "@/lib/audit";

/** Subscription audit.
 *
 *  Entirely in the browser: selections live in localStorage, nothing is sent
 *  anywhere, and no account is needed. That is deliberate — asking people to
 *  register before telling them they are overpaying would be absurd, and it
 *  keeps the privacy policy true.
 *
 *  Reading localStorage into state inside an effect cascades renders, so the
 *  store is read through useSyncExternalStore instead: it handles the
 *  server/client split properly and returns a stable snapshot.
 */
const STORAGE_KEY = "filmantica.subscriptions";
const CHANGED = "filmantica:subscriptions-changed";

function read(): string {
  try { return localStorage.getItem(STORAGE_KEY) ?? "[]"; }
  catch { return "[]"; }   // private browsing and blocked storage both throw
}

function subscribe(onChange: () => void) {
  // `storage` covers other tabs; the custom event covers this one.
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGED, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGED, onChange);
  };
}

/** Must be a stable string, not a fresh array: React compares snapshots by
 *  identity and would loop forever on a new object each call. */
const getSnapshot = () => read();
const getServerSnapshot = () => "[]";

export default function SubscriptionAudit({ data }: { data: AuditPayload }) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const selected = useMemo<number[]>(() => {
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((n): n is number => typeof n === "number") : [];
    } catch {
      return [];
    }
  }, [raw]);

  const write = useCallback((next: number[]) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
    window.dispatchEvent(new Event(CHANGED));
  }, []);

  const toggle = (i: number) =>
    write(selected.includes(i) ? selected.filter((x) => x !== i) : [...selected, i]);

  const result = useMemo(() => {
    const chosen = new Set(selected);

    let reachable = 0;      // titles your subscriptions give you
    let alsoFree = 0;       // ...of those, how many are free somewhere anyway
    const uniqueTo = new Map<number, number>();  // titles only one chosen service has

    for (const [freeOn, subOn] of data.titles) {
      const mine = subOn.filter((i) => chosen.has(i));
      if (mine.length === 0) continue;

      reachable++;
      if (freeOn.length > 0) alsoFree++;

      // Not free anywhere, and only one of your services carries it: that service
      // is the only reason you can watch it.
      if (freeOn.length === 0 && mine.length === 1) {
        uniqueTo.set(mine[0], (uniqueTo.get(mine[0]) ?? 0) + 1);
      }
    }

    const ranked = selected
      .map((i) => ({ service: data.services[i], index: i, unique: uniqueTo.get(i) ?? 0 }))
      .sort((a, b) => a.unique - b.unique);

    return { reachable, alsoFree, ranked };
  }, [selected, data]);

  const pct = result.reachable ? Math.round((result.alsoFree / result.reachable) * 100) : 0;

  return (
    <div>
      <h2 className="display mb-1 text-lg">Which of these do you pay for?</h2>
      <p className="mb-4 text-xs text-muted">
        Nothing is sent anywhere — your selection stays in this browser.
      </p>

      <div className="mb-10 flex flex-wrap gap-2">
        {data.services.map((name, i) => {
          const on = selected.includes(i);
          return (
            <button
              key={name}
              type="button"
              onClick={() => toggle(i)}
              aria-pressed={on}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                on
                  ? "border-brass bg-brass/15 text-brass"
                  : "border-edge text-muted hover:border-brass/50 hover:text-cream"
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>

      {selected.length === 0 ? (
        <p className="rounded border border-edge bg-ink-2 p-6 text-sm text-muted">
          Pick the services you subscribe to and we will show how much of what they give you is
          already free somewhere else.
        </p>
      ) : (
        <div className="space-y-6">
          <div className="grid overflow-hidden rounded-lg border border-edge sm:grid-cols-3">
            <div className="border-b border-edge bg-ink-2 p-5 sm:border-b-0 sm:border-r">
              <p className="text-xs uppercase tracking-[0.14em] text-muted">Your subscriptions reach</p>
              <p className="display mt-1 text-3xl tabular-nums">{result.reachable}</p>
              <p className="mt-1 text-xs text-muted">titles we track</p>
            </div>
            <div className="border-b border-edge bg-ink-2 p-5 sm:border-b-0 sm:border-r">
              <p className="text-xs uppercase tracking-[0.14em] text-brass">Free somewhere anyway</p>
              <p className="display mt-1 text-3xl tabular-nums text-brass">{result.alsoFree}</p>
              <p className="mt-1 text-xs text-muted">{pct}% of what you are paying for</p>
            </div>
            <div className="bg-ink-2 p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-muted">Only via subscription</p>
              <p className="display mt-1 text-3xl tabular-nums">{result.reachable - result.alsoFree}</p>
              <p className="mt-1 text-xs text-muted">what you are genuinely buying</p>
            </div>
          </div>

          <div>
            <h3 className="display mb-1 text-base">What each one uniquely gives you</h3>
            <p className="mb-3 text-xs text-muted">
              Titles no other service you have can reach, and that are not free anywhere. Fewest
              first — that is the one to question.
            </p>
            <ul className="divide-y divide-edge overflow-hidden rounded-lg border border-edge">
              {result.ranked.map(({ service, unique }) => (
                <li key={service} className="flex items-baseline justify-between bg-ink-2 px-4 py-3">
                  <span className="text-sm">{service}</span>
                  <span className="text-sm tabular-nums text-muted">
                    <strong className={unique === 0 ? "text-risk" : "text-cream"}>{unique}</strong>{" "}
                    unique title{unique === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs leading-relaxed text-muted">
            This counts only the {data.titles.length} titles we track, so treat it as a sample
            rather than your whole library. See{" "}
            <Link href="/free" className="text-brass underline underline-offset-2">
              what is free right now
            </Link>{" "}
            before renewing anything.
          </p>
        </div>
      )}
    </div>
  );
}
