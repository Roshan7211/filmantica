import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { DiscoveryTitle } from "./discovery-types";

/** Discovery store access (server-only).
 *
 *  Pages read from a store that a scheduled job fills — they never call a metadata
 *  API per request. That decouples API usage from traffic, which is what makes a
 *  capped free tier viable at any scale.
 *
 *  Types and pure helpers live in discovery-types.ts so the importer can share them.
 */

export type { DiscoveryTitle, WatchOption } from "./discovery-types";
export { hasAnyOption, discoverySlug } from "./discovery-types";

let cache: DiscoveryTitle[] | null = null;

async function load(): Promise<DiscoveryTitle[]> {
  if (cache) return cache;
  try {
    const raw = await readFile(path.join(process.cwd(), "data", "discovery.json"), "utf8");
    cache = JSON.parse(raw) as DiscoveryTitle[];
  } catch {
    cache = []; // no import has run yet — pages render a setup state
  }
  return cache;
}

export async function discoveryPopulated(): Promise<boolean> {
  return (await load()).length > 0;
}

export async function allDiscovery(): Promise<DiscoveryTitle[]> {
  return load();
}

export async function getDiscovery(slug: string): Promise<DiscoveryTitle | null> {
  return (await load()).find((t) => t.slug === slug) ?? null;
}

/** Genres present in the discovery store, most populated first. */
export async function discoveryGenres(): Promise<{ name: string; count: number }[]> {
  const counts = new Map<string, number>();
  for (const t of await load()) {
    for (const g of t.genres) counts.set(g, (counts.get(g) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** "Science Fiction" -> "science-fiction". A literal space in a URL encodes as
 *  %20, which is legal but reads badly when shared and splits link equity. */
export const genreSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export async function discoveryByGenre(slugOrName: string): Promise<DiscoveryTitle[]> {
  const wanted = genreSlug(slugOrName);
  return (await load())
    .filter((t) => t.genres.some((x) => genreSlug(x) === wanted))
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
}

/** Display name for a genre slug, so pages show "Science Fiction" not "science-fiction". */
export async function genreDisplayName(slug: string): Promise<string | null> {
  const wanted = genreSlug(slug);
  for (const t of await load()) {
    const hit = t.genres.find((g) => genreSlug(g) === wanted);
    if (hit) return hit;
  }
  return null;
}

/** Newest first — what the homepage leads with. */
export async function latestDiscovery(limit = 12): Promise<DiscoveryTitle[]> {
  return (await load())
    .slice()
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
    .slice(0, limit);
}

export async function searchDiscovery(q: string): Promise<DiscoveryTitle[]> {
  const term = q.trim().toLowerCase();
  if (!term) return [];
  return (await load()).filter((t) =>
    `${t.title} ${t.genres.join(" ")}`.toLowerCase().includes(term),
  );
}
