/** Review-queue triage.
 *
 *  Ranks pending titles by how likely they are to clear a rights check, so the
 *  easy wins are reviewed first instead of working alphabetically through 266 films.
 *
 *  This is a PRIORITISATION HINT, not a legal determination and not advice. Every
 *  title still needs a human decision before publication — that is the whole point
 *  of the queue. The rules below encode US copyright, which is the relevant law for
 *  most Internet Archive film collections but not for every work in them.
 */

export type TriageBand = "strong" | "likely" | "check" | "unlikely";

export type Triage = {
  band: TriageBand;
  score: number;
  notes: string[];
};

const BAND_ORDER: Record<TriageBand, number> = { strong: 0, likely: 1, check: 2, unlikely: 3 };
export const bandRank = (b: TriageBand) => BAND_ORDER[b];

/** US works published this long ago are out of copyright (95-year term).
 *  In 2026 that means 1930 and earlier. */
export const publicDomainBefore = () => new Date().getFullYear() - 95;

const GOVERNMENT = /\b(u\.?s\.?\s*(army|navy|air force|government|department|office)|united states|office of war information|national archives|nasa|usda|department of defense|war department)\b/i;

/** Collections whose curation is a meaningful signal, though never a clearance. */
const TRUSTED_COLLECTIONS = /\b(prelinger|feature_films|silent_films|film_noir|classic_cartoons|sci_fi_horror)\b/i;

export function triage(input: {
  year?: number | null;
  creator?: string | null;
  sourceId?: string | null;
  collections?: string[] | null;
  license?: string | null;
}): Triage {
  const notes: string[] = [];
  let score = 0;

  const cutoff = publicDomainBefore();
  const year = input.year ?? null;
  const creator = input.creator ?? "";
  const collections = (input.collections ?? []).join(" ");

  // Strongest signal: old enough that the US term has expired outright.
  if (year != null && year <= cutoff) {
    score += 60;
    notes.push(`published ${year} — before ${cutoff + 1}, so the US 95-year term has expired`);
  } else if (year != null && year <= 1963) {
    // Pre-1964 US works needed a renewal; a large share were never renewed.
    score += 30;
    notes.push(`published ${year} — pre-1964, so copyright lapsed unless renewed; check renewal records`);
  } else if (year != null && year <= 1977) {
    score += 10;
    notes.push(`published ${year} — renewal was automatic by then, likely still protected`);
  } else if (year != null) {
    score -= 20;
    notes.push(`published ${year} — modern work, almost certainly still protected`);
  } else {
    notes.push("no year — cannot assess term");
  }

  // US government works carry no copyright.
  if (GOVERNMENT.test(creator)) {
    score += 35;
    notes.push("creator looks like a US government body — such works are not copyrighted");
  }

  if (TRUSTED_COLLECTIONS.test(collections)) {
    score += 10;
    notes.push("in a curated film collection (curation, not clearance)");
  }

  if (/public domain mark/i.test(input.license ?? "")) {
    score += 5;
    notes.push("uploader applied Public Domain Mark — an assertion only");
  }

  const band: TriageBand =
    score >= 60 ? "strong" :
    score >= 30 ? "likely" :
    score >= 10 ? "check"  : "unlikely";

  return { band, score, notes };
}
