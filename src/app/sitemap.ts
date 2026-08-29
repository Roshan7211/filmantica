import type { MetadataRoute } from "next";
import { allMovies, allGenres } from "@/lib/movies";
import { allDiscovery } from "@/lib/discovery";
import { SITE } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [movies, genres, discovery] = await Promise.all([allMovies(), allGenres(), allDiscovery()]);

  return [
    { url: SITE.url, changeFrequency: "daily", priority: 1 },
    { url: `${SITE.url}/movies`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE.url}/genres`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE.url}/discover`, changeFrequency: "daily", priority: 0.9 },
    // "Where to watch X" pages — high-volume search intent, so they belong in the
    // sitemap. Availability changes often, hence the weekly frequency.
    ...discovery.map((t) => ({
      url: `${SITE.url}/discover/${t.slug}`,
      lastModified: t.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...genres.map((g) => ({
      url: `${SITE.url}/genres/${encodeURIComponent(g.name.toLowerCase())}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    // The per-title pages are the traffic engine — highest priority after home.
    ...movies.flatMap((m) => [
      { url: `${SITE.url}/movies/${m.slug}`, lastModified: m.updatedAt, changeFrequency: "monthly" as const, priority: 0.8 },
      { url: `${SITE.url}/watch/${m.slug}`, lastModified: m.updatedAt, changeFrequency: "monthly" as const, priority: 0.7 },
    ]),
  ];
}
