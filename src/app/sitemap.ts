import type { MetadataRoute } from "next";
import { allDiscovery, discoveryGenres, genreSlug } from "@/lib/discovery";
import { SITE } from "@/lib/site";
import { populatedLists } from "@/lib/lists";
import { publishedArticles } from "@/lib/articles";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [titles, genres, lists] = await Promise.all([
    allDiscovery(), discoveryGenres(), populatedLists(),
  ]);
  const articles = await publishedArticles();

  return [
    { url: SITE.url, changeFrequency: "daily", priority: 1 },
    // The free page is the site's reason to exist, so it ranks above the rest.
    { url: `${SITE.url}/free`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE.url}/discover`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE.url}/tv`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE.url}/tv?free=1`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE.url}/lists`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE.url}/guides`, changeFrequency: "weekly", priority: 0.8 },
    ...articles.map((a) => ({
      url: `${SITE.url}/guides/${a.slug}`,
      lastModified: a.updated ?? a.published,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...lists.map(({ list }) => ({
      url: `${SITE.url}/lists/${list.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    { url: `${SITE.url}/genres`, changeFrequency: "weekly", priority: 0.6 },
    ...genres.map((g) => ({
      url: `${SITE.url}/genre/${genreSlug(g.name)}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    // Per-title pages are the traffic engine: "<title> watch free" queries.
    ...titles.map((t) => ({
      url: `${SITE.url}/discover/${t.slug}`,
      lastModified: t.updatedAt,
      changeFrequency: "weekly" as const,
      priority: t.options.free.length ? 0.9 : 0.8,
    })),
  ];
}
