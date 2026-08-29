/** Rights review queue.
 *
 *  Titles the importer could not clear automatically sit here as
 *  reviewStatus:"pending" and are never served. This is the human step the
 *  project's legal rule requires.
 *
 *  Sorted by triage band so the easy wins come first. The bands are a
 *  PRIORITISATION HINT, not a legal determination — every title still needs your
 *  judgement before it goes live.
 *
 *  Usage:
 *    node scripts/review.mjs                    the queue, best candidates first
 *    node scripts/review.mjs --band strong      only one band
 *    node scripts/review.mjs --show <slug>      full detail for one title
 *    node scripts/review.mjs --approve <slug>   publish it
 *    node scripts/review.mjs --reject <slug>    drop it permanently
 *    node scripts/review.mjs --stats            queue composition
 */
import { readFile, writeFile } from "node:fs/promises";
import { triage, bandRank } from "../src/lib/triage.ts";

const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(`--${n}`); return i === -1 ? null : args[i + 1]; };

const movies = JSON.parse(await readFile("data/movies.json", "utf8"));
const save = () => writeFile("data/movies.json", JSON.stringify(movies, null, 2));

const scored = movies
  .filter((m) => m.reviewStatus === "pending")
  .map((m) => ({
    m,
    t: triage({
      year: m.year, creator: m.creator, sourceId: m.sourceId,
      // collections, not genres — genres are Archive subject tags and were
      // silently standing in for the curated-collection signal.
      collections: m.collections ?? [], license: m.license,
    }),
  }))
  .sort((a, b) => bandRank(a.t.band) - bandRank(b.t.band) || b.t.score - a.t.score);

const BADGE = { strong: "STRONG ", likely: "LIKELY ", check: "CHECK  ", unlikely: "UNLIKELY" };

const line = ({ m, t }) =>
  `  ${BADGE[t.band]}  ${String(m.year ?? "—").padEnd(6)} ${(m.title ?? "").slice(0, 46).padEnd(48)} ${m.slug}`;

const approve = flag("approve"), reject = flag("reject"), detail = flag("show"), band = flag("band");

if (detail) {
  const row = scored.find((x) => x.m.slug === detail)
    ?? { m: movies.find((x) => x.slug === detail), t: null };
  if (!row.m) { console.error(`no title with slug "${detail}"`); process.exit(1); }
  const { m, t } = row;
  console.log(`\n  ${m.title}${m.year ? ` (${m.year})` : ""}`);
  console.log(`  slug      ${m.slug}`);
  console.log(`  licence   ${m.license}`);
  console.log(`  creator   ${m.creator ?? "—"}`);
  console.log(`  source    ${m.sourceUrl}`);
  if (t) {
    console.log(`\n  triage    ${t.band.toUpperCase()} (score ${t.score})`);
    t.notes.forEach((n) => console.log(`            · ${n}`));
  }
  console.log(`\n  ${(m.description || "(no description)").slice(0, 400)}`);
  console.log(`\n  Confirm the rights yourself before approving — collection membership`);
  console.log(`  and uploader metadata are not a clearance.`);
} else if (approve || reject) {
  const slug = approve ?? reject;
  const m = movies.find((x) => x.slug === slug);
  if (!m) { console.error(`no title with slug "${slug}"`); process.exit(1); }
  if (approve) {
    m.reviewStatus = "approved"; m.isPublic = true; m.licenseVerified = true;
  } else {
    m.reviewStatus = "rejected"; m.isPublic = false;
  }
  m.updatedAt = new Date().toISOString();
  await save();
  console.log(`${approve ? "approved and published" : "rejected and unpublished"}: ${m.title}`);
} else if (args.includes("--stats")) {
  const counts = {};
  scored.forEach(({ t }) => (counts[t.band] = (counts[t.band] ?? 0) + 1));
  console.log(`review queue: ${scored.length} titles\n`);
  for (const b of ["strong", "likely", "check", "unlikely"]) {
    const n = counts[b] ?? 0;
    console.log(`  ${BADGE[b]}  ${String(n).padStart(4)}  ${"█".repeat(Math.round((n / Math.max(scored.length, 1)) * 40))}`);
  }
  console.log(`\n  strong  = US term expired outright, or a US government work`);
  console.log(`  likely  = pre-1964, so copyright lapsed unless renewed — check renewal records`);
  console.log(`  check   = needs real investigation`);
  console.log(`  unlikely= modern work, probably still protected`);
} else {
  const shown = band ? scored.filter((x) => x.t.band === band) : scored;
  const live = movies.filter((m) => m.isPublic).length;
  console.log(`catalogue: ${movies.length} records · ${live} live · ${scored.length} awaiting review`);
  if (!shown.length) { console.log("\nnothing matching."); process.exit(0); }
  console.log(`\nbest candidates first${band ? ` (band: ${band})` : ""}:\n`);
  shown.slice(0, 40).forEach((x) => console.log(line(x)));
  if (shown.length > 40) console.log(`\n  … and ${shown.length - 40} more`);
  console.log(`\n  node scripts/review.mjs --stats            queue composition`);
  console.log(`  node scripts/review.mjs --band strong     best candidates only`);
  console.log(`  node scripts/review.mjs --show <slug>     inspect one`);
  console.log(`  node scripts/review.mjs --approve <slug>  publish it`);
}
