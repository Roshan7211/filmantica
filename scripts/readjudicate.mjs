/** Re-apply the current gates to records already imported.
 *
 *  The importer decides a title's fate at import time. When the gates change —
 *  as they did when Public Domain Mark stopped auto-publishing — records already
 *  on disk keep their old verdict and stay live. This re-runs the decision over
 *  the existing catalogue without touching the network.
 *
 *  NOTE: the looksLikeFilm() whitelist is deliberately NOT applied here. It keys on
 *  collection membership and runtime, neither of which existed when the current
 *  records were imported — applying it retroactively would reject 154 of 202 real
 *  pre-1970 films for missing inputs rather than for merit. Records predating those
 *  fields must be re-imported, not re-judged.
 *
 *  Usage:
 *    node scripts/readjudicate.mjs --dry    report what would change
 *    node scripts/readjudicate.mjs          apply it
 */
import { readFile, writeFile } from "node:fs/promises";
import { evaluateLicence } from "../src/lib/licence.ts";
import { checkContentPolicy } from "../src/lib/content-policy.ts";
import { assessQuality, meetsPublishBar, cleanTitle, uniqueSlug, splitGenres, safeDescription } from "../src/lib/quality.ts";

const DRY = process.argv.includes("--dry");
const movies = JSON.parse(await readFile("data/movies.json", "utf8"));

// Snapshot before the loop — records are mutated in place below, so counting
// afterwards would report post-mutation state as the "before".
const before = { total: movies.length, live: movies.filter((m) => m.isPublic).length };

const changes = { published: 0, toReview: 0, dropped: 0, retitled: 0, regenred: 0, textStripped: 0, unchanged: 0 };
const reasons = {};
const note = (k) => (reasons[k] = (reasons[k] ?? 0) + 1);

const kept = [];
for (const m of movies) {
  // A decision already made is never overridden by a machine.
  //
  // The earlier version also required source !== "internetarchive", which meant
  // it did NOT protect approvals of Archive titles — so a re-adjudication silently
  // reverted 48 films whose US copyright term had been confirmed expired. An
  // approval is a decision; only content policy and tier-1 junk may override it.
  if (m.reviewStatus === "approved") {
    const policyCheck = checkContentPolicy({
      title: m.title, creator: m.creator, description: m.description, genres: m.genres,
    });
    const junkCheck = assessQuality({ title: m.title, description: m.description, year: m.year });
    if (policyCheck.allowed && junkCheck.ok) {
      kept.push(m); changes.unchanged++; continue;
    }
    note(`approved title overridden: ${policyCheck.reason ?? junkCheck.reasons[0]}`);
  }

  const tidied = cleanTitle(m.title);
  if (tidied && tidied !== m.title) { m.title = tidied; changes.retitled++; }

  // Backfill: early imports stored the raw delimited subject string as one genre.
  const tidyGenres = splitGenres(m.genres);
  if (JSON.stringify(tidyGenres) !== JSON.stringify(m.genres)) { m.genres = tidyGenres; changes.regenred++; }

  const safe = safeDescription(m.description);
  if (safe !== (m.description ?? "").trim()) { m.description = safe; changes.textStripped++; }

  const candidate = { title: m.title, description: m.description, year: m.year };

  // Content policy — removed outright, never left in the queue.
  const policy = checkContentPolicy({
    title: m.title, creator: m.creator, description: m.description, genres: m.genres,
  });
  if (!policy.allowed) {
    changes.dropped++; note(policy.reason);
    continue;
  }

  // Tier 1 — not a film at all.
  const quality = assessQuality(candidate);
  if (!quality.ok) {
    changes.dropped++; note(`dropped: ${quality.reasons[0]}`);
    continue; // removed from the catalogue entirely
  }

  // Licence, re-evaluated under the current rules.
  //
  // IMPORTANT: a stored record does not carry the collection membership that
  // originally routed it to review — the importer discards it. So a "reject"
  // verdict here can simply mean the inputs are missing, not that the title is
  // bad. Acting on that deleted 101 genuine films (Up the River, Why We Fight,
  // Mabel and Fatty's Wash Day) on the first attempt.
  //
  // Therefore: re-adjudication may PROMOTE to publish or DEMOTE to review, but it
  // never deletes on a licence verdict. Only tier-1 junk is dropped, because that
  // is the one signal fully reconstructable from the record itself.
  const v = evaluateLicence({
    licenseurl: m.licenseUrl,
    rights: null,
    possibleCopyrightStatus: /public domain/i.test(m.license ?? "") ? "Public Domain" : null,
    collection: m.collections ?? null,
  });

  const clearsBar = meetsPublishBar(candidate).ok;
  const wasPublic = m.isPublic;

  if (v.action === "publish" && clearsBar) {
    m.isPublic = true; m.reviewStatus = "approved"; m.licenseVerified = true;
    if (!wasPublic) changes.published++;
  } else {
    m.isPublic = false;
    m.reviewStatus = "pending";
    m.licenseVerified = false;
    if (wasPublic) changes.toReview++;
    note(v.action === "publish" ? "to review: below publish bar"
         : v.action === "review" ? `to review: ${v.normalised}`
         : "to review: licence unclear from stored record");
  }
  kept.push(m);
}

// Slug collisions predate the uniqueness fix and would put several records on one
// URL. Re-slug the duplicates, keeping the first occurrence's clean slug.
const taken = new Set();
let reslugged = 0;
const normaliseSlug = (x) =>
  (x ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
for (const m of kept) {
  // Early imports used the raw Archive identifier, leaving uppercase and
  // underscores in URLs — which search engines treat as distinct from the
  // lowercase form. Compare against the ORIGINAL, not the normalised value:
  // otherwise a clean-but-unclaimed slug is computed and then thrown away.
  const original = m.slug;
  const wanted = normaliseSlug(original) || original;
  const assigned = uniqueSlug(wanted, taken, normaliseSlug(m.sourceId).slice(0, 12));
  if (assigned !== original) { m.slug = assigned; m.id = assigned; reslugged++; }
}

const live = kept.filter((m) => m.isPublic).length;
const pending = kept.filter((m) => m.reviewStatus === "pending").length;

console.log("──────── re-adjudication ────────");
console.log(`before          ${before.total} records, ${before.live} live`);
console.log(`after           ${kept.length} records, ${live} live, ${pending} pending`);
console.log(`unpublished     ${changes.toReview}`);
console.log(`dropped         ${changes.dropped}`);
console.log(`titles cleaned  ${changes.retitled}`);
console.log(`slugs de-duped  ${reslugged}`);
console.log(`genres split    ${changes.regenred}`);
console.log(`borrowed text   ${changes.textStripped} stripped`);
const top = Object.entries(reasons).sort((a, b) => b[1] - a[1]).slice(0, 10);
if (top.length) {
  console.log("\nwhy:");
  for (const [why, n] of top) console.log(`  ${String(n).padStart(4)}  ${why}`);
}

if (DRY) console.log("\n--dry: nothing written");
else {
  await writeFile("data/movies.json", JSON.stringify(kept, null, 2));
  console.log(`\nwrote data/movies.json`);
}
