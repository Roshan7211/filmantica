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

export async function searchDiscovery(q: string): Promise<DiscoveryTitle[]> {
  const term = q.trim().toLowerCase();
  if (!term) return [];
  return (await load()).filter((t) =>
    `${t.title} ${t.genres.join(" ")}`.toLowerCase().includes(term),
  );
}
