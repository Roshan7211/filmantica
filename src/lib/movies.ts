import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Movie } from "./types";

/** Data access layer.
 *
 *  Backed by a JSON file the importer writes, so the app runs with zero
 *  credentials. Every read goes through these functions, so swapping in
 *  Firestore later means reimplementing this file only — no page changes.
 */

let cache: Movie[] | null = null;

async function load(): Promise<Movie[]> {
  if (cache) return cache;
  const file = path.join(process.cwd(), "data", "movies.json");
  const raw = await readFile(file, "utf8");
  cache = JSON.parse(raw) as Movie[];
  return cache;
}

/** Only titles cleared for publication ever reach a page. */
export async function allMovies(): Promise<Movie[]> {
  return (await load()).filter((m) => m.isPublic);
}

export async function getMovie(slug: string): Promise<Movie | null> {
  return (await allMovies()).find((m) => m.slug === slug) ?? null;
}

export async function featured(): Promise<Movie | null> {
  const all = await allMovies();
  return all.find((m) => m.isFeatured) ?? all[0] ?? null;
}

export async function byGenre(genre: string): Promise<Movie[]> {
  const g = genre.toLowerCase();
  return (await allMovies()).filter((m) => m.genres.some((x) => x.toLowerCase() === g));
}

export async function allGenres(): Promise<{ name: string; count: number }[]> {
  const counts = new Map<string, number>();
  for (const m of await allMovies()) {
    for (const g of m.genres) counts.set(g, (counts.get(g) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export async function search(q: string): Promise<Movie[]> {
  const term = q.trim().toLowerCase();
  if (!term) return [];
  return (await allMovies()).filter((m) =>
    [m.title, m.description, m.director ?? "", ...m.cast, ...m.genres]
      .join(" ")
      .toLowerCase()
      .includes(term),
  );
}

/** True when the catalogue is still placeholder data rather than importer output. */
export async function isSeedData(): Promise<boolean> {
  return (await load()).every((m) => m.source === "seed-demo");
}

/** Titles imported but held back pending a human rights decision. Never served. */
export async function pendingReview(): Promise<Movie[]> {
  return (await load()).filter((m) => m.reviewStatus === "pending");
}

export async function stats() {
  const all = await load();
  return {
    total: all.length,
    published: all.filter((m) => m.isPublic).length,
    verified: all.filter((m) => m.licenseVerified).length,
    pending: all.filter((m) => m.reviewStatus === "pending").length,
  };
}
