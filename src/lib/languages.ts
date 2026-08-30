import "server-only";
import { allDiscovery, type DiscoveryTitle } from "./discovery";

/** Language categories.
 *
 *  People search by industry — "Bollywood movies", "Hollywood movies", "Korean
 *  movies" — far more than by language code. These map the codes we store onto
 *  the terms people actually type.
 *
 *  One honest caveat baked into the copy: Hindi cinema is Bollywood, so that
 *  label is accurate. "Hollywood" for all English-language film is not — it
 *  sweeps in British, Australian, Irish and independent work. The pages use the
 *  searched term but say plainly what they contain.
 */

export type LanguageCategory = {
  slug: string;
  code: string;
  /** What the page is called. */
  name: string;
  /** One line under the heading. */
  blurb: string;
  /** Shown when the label is a rough fit, so the page does not overclaim. */
  caveat?: string;
};

export const LANGUAGES: LanguageCategory[] = [
  {
    slug: "bollywood",
    code: "hi",
    name: "Bollywood movies",
    blurb: "Hindi-language cinema, free ones marked.",
  },
  {
    slug: "hollywood",
    code: "en",
    name: "Hollywood movies",
    blurb: "English-language cinema, free ones marked.",
    caveat:
      "This covers English-language film generally, so it includes British, Australian and " +
      "independent titles alongside Hollywood studio releases.",
  },
  { slug: "korean", code: "ko", name: "Korean movies and series", blurb: "Korean cinema and drama." },
  { slug: "japanese", code: "ja", name: "Japanese movies and anime", blurb: "Japanese-language titles, anime included." },
  { slug: "telugu", code: "te", name: "Telugu movies", blurb: "Telugu-language cinema." },
  { slug: "tamil", code: "ta", name: "Tamil movies", blurb: "Tamil-language cinema." },
  { slug: "malayalam", code: "ml", name: "Malayalam movies", blurb: "Malayalam-language cinema." },
  { slug: "marathi", code: "mr", name: "Marathi movies", blurb: "Marathi-language cinema." },
  { slug: "kannada", code: "kn", name: "Kannada movies", blurb: "Kannada-language cinema." },
  { slug: "spanish", code: "es", name: "Spanish-language movies", blurb: "Spanish-language cinema." },
  { slug: "french", code: "fr", name: "French movies", blurb: "French-language cinema." },
  { slug: "chinese", code: "zh", name: "Chinese movies", blurb: "Chinese-language cinema." },
  { slug: "turkish", code: "tr", name: "Turkish movies and series", blurb: "Turkish-language titles." },
];

export const getLanguage = (slug: string) => LANGUAGES.find((l) => l.slug === slug) ?? null;

export async function titlesInLanguage(code: string): Promise<DiscoveryTitle[]> {
  return (await allDiscovery())
    .filter((t) => t.language === code)
    .sort((a, b) => {
      // Free first, then newest — the site's ordering everywhere else.
      const af = a.options.free.length > 0, bf = b.options.free.length > 0;
      if (af !== bf) return af ? -1 : 1;
      return (b.year ?? 0) - (a.year ?? 0);
    });
}

/** Categories with enough titles to be worth a page, with their counts. */
export async function populatedLanguages() {
  const all = await allDiscovery();
  return LANGUAGES.map((lang) => {
    const titles = all.filter((t) => t.language === lang.code);
    return {
      lang,
      count: titles.length,
      free: titles.filter((t) => t.options.free.length > 0).length,
    };
  })
    .filter((x) => x.count >= 8)
    .sort((a, b) => b.count - a.count);
}
