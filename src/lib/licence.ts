/** Licence gate.
 *
 *  Three outcomes, not two:
 *
 *    publish  Licence positively permits commercial reuse. Goes live automatically.
 *    review   Plausibly free but not provable from metadata (e.g. an old film in a
 *             public-domain collection with no licence field). Imported but NOT public,
 *             pending a human decision.
 *    reject   Known-incompatible or no signal at all. Dropped.
 *
 *  The whitelist is the only route to "publish". An uploader ticking "public domain"
 *  never reaches it — that is what "review" exists for.
 */

export type LicenceAction = "publish" | "review" | "reject";

export type LicenceVerdict = {
  action: LicenceAction;
  normalised: string;
  reason: string;
  requiresAttribution: boolean;
  shareAlike: boolean;
};

const verdict = (
  action: LicenceAction,
  normalised: string,
  reason: string,
  requiresAttribution = false,
  shareAlike = false,
): LicenceVerdict => ({ action, normalised, reason, requiresAttribution, shareAlike });

/** Licences permitting commercial use — actual RIGHTS GRANTS by a rights holder.
 *
 *  NonCommercial variants are absent by design: ad revenue makes this commercial.
 *  Public Domain Mark is absent too, and that is deliberate — see PD_MARK below. */
const ALLOWED: { pattern: RegExp; name: string; attribution: boolean; shareAlike: boolean }[] = [
  { pattern: /creativecommons\.org\/publicdomain\/zero/i, name: "CC0", attribution: false, shareAlike: false },
  { pattern: /creativecommons\.org\/licenses\/by\/\d/i, name: "CC BY", attribution: true, shareAlike: false },
  { pattern: /creativecommons\.org\/licenses\/by-sa\//i, name: "CC BY-SA", attribution: true, shareAlike: true },
  { pattern: /creativecommons\.org\/licenses\/by-nd\//i, name: "CC BY-ND", attribution: true, shareAlike: false },
];

/** Must be tested before the plain CC BY pattern, since "by-nc" contains "by". */
const NONCOMMERCIAL = /creativecommons\.org\/licenses\/by-nc/i;

/** Public Domain Mark is NOT a licence. It is a label anyone can apply to assert a
 *  work is already out of copyright, and on the Internet Archive it is uploader-set
 *  and unverified. Treating it as a grant published 281 home videos and vlogs as
 *  "public domain films". It routes to review, never to publish. */
const PD_MARK = /creativecommons\.org\/publicdomain\/mark/i;

/** Creative Commons' pre-2010 Public Domain Dedication, retired in favour of CC0.
 *  A real dedication by a rights holder, but the old URL carries no version and is
 *  often applied loosely on legacy uploads — so it earns review, never auto-publish.
 *  Previously it matched nothing and such titles were dropped outright. */
const LEGACY_PD_DEDICATION = /creativecommons\.org\/licenses\/publicdomain/i;

/** IA collections curated as public-domain film. Membership is a reason to review,
 *  never a reason to publish — collection curation is not a rights clearance. */
export const REVIEWABLE_COLLECTIONS = new Set([
  "feature_films",
  "silent_films",
  "film_noir",
  "sci_fi_horror",
  "classic_cartoons",
  "more_animation",
  "prelinger",
  "publicmovies212",
]);

const first = (v: string | string[] | null | undefined) =>
  (Array.isArray(v) ? v[0] : v)?.toString().trim() ?? "";

export function evaluateLicence(input: {
  licenseurl?: string | string[] | null;
  rights?: string | string[] | null;
  possibleCopyrightStatus?: string | string[] | null;
  collection?: string | string[] | null;
  year?: number | null;
}): LicenceVerdict {
  const url = first(input.licenseurl);
  const rights = first(input.rights);
  const status = first(input.possibleCopyrightStatus);
  const collections = [input.collection].flat().filter(Boolean).map(String);

  // 1. Explicitly incompatible licences lose immediately.
  if (url && NONCOMMERCIAL.test(url)) {
    return verdict("reject", "CC BY-NC", "NonCommercial licence cannot be used on an ad-supported service");
  }

  // 2. The whitelist — the only path to automatic publication.
  for (const entry of ALLOWED) {
    if (url && entry.pattern.test(url)) {
      return verdict("publish", entry.name, "Licence URL matched the commercial-use whitelist",
        entry.attribution, entry.shareAlike);
    }
  }

  // 3. Plausible but unproven. Held for a human.
  const inCurated = collections.some((c) => REVIEWABLE_COLLECTIONS.has(c));
  const claimsPD = /public\s*domain/i.test(status) || /public\s*domain/i.test(rights);
  const markedPD = url ? PD_MARK.test(url) : false;
  const legacyPD = url ? LEGACY_PD_DEDICATION.test(url) : false;

  if (markedPD || legacyPD || inCurated || claimsPD) {
    const why = [
      markedPD && "Public Domain Mark is an uploader assertion, not a rights grant",
      legacyPD && "legacy CC Public Domain Dedication (pre-CC0) — real but unversioned",
      inCurated && `member of curated collection (${collections.filter((c) => REVIEWABLE_COLLECTIONS.has(c)).join(", ")})`,
      claimsPD && "metadata asserts public domain",
    ].filter(Boolean).join("; ");
    return verdict("review",
      markedPD ? "Public Domain Mark (unverified)"
      : legacyPD ? "Legacy CC Public Domain Dedication"
      : "Unverified — needs review",
      `Held for manual rights review: ${why}`);
  }

  // 4. No usable signal.
  if (!url && !rights && !status) {
    return verdict("reject", "None", "No licence metadata present");
  }
  return verdict("reject", url || rights || status, "Licence not on the commercial-use whitelist");
}

export function attributionFor(m: {
  title: string;
  creator: string | null;
  license: string;
  sourceUrl: string;
}): string {
  return `"${m.title}" by ${m.creator ?? "Unknown creator"} — ${m.license}. Source: ${m.sourceUrl}`;
}
