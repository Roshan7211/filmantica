import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

/** Articles.
 *
 *  Stored as markdown in content/articles so they can be edited without touching
 *  code — which matters because every one has to be read and corrected by a person
 *  before it is published. Unreviewed machine-written text is a documented reason
 *  for ad-network rejection, so the editing step is the point, not a formality.
 */

export type Article = {
  slug: string;
  title: string;
  description: string;
  published: string;      // ISO date
  updated?: string;
  author: string;
  /** Set true once a human has read and corrected it. Drafts stay off the site. */
  reviewed: boolean;
  readingMinutes: number;
  wordCount: number;
  html: string;
};

const DIR = path.join(process.cwd(), "content", "articles");

let cache: Article[] | null = null;

async function loadAll(): Promise<Article[]> {
  if (cache) return cache;

  let files: string[] = [];
  try {
    files = (await readdir(DIR)).filter((f) => f.endsWith(".md"));
  } catch {
    cache = [];
    return cache;
  }

  const parsed = await Promise.all(
    files.map(async (file) => {
      const raw = await readFile(path.join(DIR, file), "utf8");
      const { data, content } = matter(raw);
      const words = content.trim().split(/\s+/).filter(Boolean).length;

      return {
        slug: (data.slug as string) ?? file.replace(/\.md$/, ""),
        title: (data.title as string) ?? "Untitled",
        description: (data.description as string) ?? "",
        published: (data.published as string) ?? new Date().toISOString().slice(0, 10),
        updated: data.updated as string | undefined,
        author: (data.author as string) ?? "Filmantica",
        reviewed: data.reviewed === true,
        wordCount: words,
        readingMinutes: Math.max(1, Math.round(words / 220)),
        html: await marked.parse(content, { async: true }),
      } satisfies Article;
    }),
  );

  cache = parsed.sort((a, b) => b.published.localeCompare(a.published));
  return cache;
}

/** Only reviewed articles are served. A draft on a live site is worse than no
 *  article, both for readers and for an ad review. */
export async function publishedArticles(): Promise<Article[]> {
  return (await loadAll()).filter((a) => a.reviewed);
}

export async function allArticles(): Promise<Article[]> {
  return loadAll();
}

export async function getArticle(slug: string): Promise<Article | null> {
  return (await publishedArticles()).find((a) => a.slug === slug) ?? null;
}

/** Target length. Long-form pieces rank better for the questions this site
 *  answers, and give an ad reviewer more to judge than a thin post does. */
export const MIN_WORDS = 1500;

/** Progress toward the ~18 articles an ad network expects. */
export async function articleStats() {
  const all = await loadAll();
  const reviewed = all.filter((a) => a.reviewed);
  return {
    total: all.length,
    reviewed: reviewed.length,
    drafts: all.length - reviewed.length,
    words: all.reduce((n, a) => n + a.wordCount, 0),
    shortOnes: all.filter((a) => a.wordCount < MIN_WORDS).map((a) => `${a.slug} (${a.wordCount}w)`),
  };
}
