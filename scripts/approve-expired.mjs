/** Bulk-approve titles whose US copyright term has demonstrably expired.
 *
 *  This is the one rights call that is a matter of arithmetic rather than
 *  judgement: US works published 95+ years ago are in the public domain, full
 *  stop. In 2026 that means 1931 and earlier.
 *
 *  Everything else — lapsed renewals, non-US works, restored copyrights — still
 *  needs a person, and is left in the queue.
 *
 *  Usage: node scripts/approve-expired.mjs [--dry]
 */
import { readFile, writeFile } from "node:fs/promises";
import { publicDomainBefore } from "../src/lib/triage.ts";

const DRY = process.argv.includes("--dry");
const cutoff = publicDomainBefore();
const movies = JSON.parse(await readFile("data/movies.json", "utf8"));

const eligible = movies.filter(
  (m) =>
    m.reviewStatus === "pending" &&
    m.videoUrl &&
    typeof m.year === "number" &&
    m.year <= cutoff &&
    m.year >= 1888,
);

/** Non-US works can still be protected in their country of origin even when the
 *  US term has run — flagged so they can be reviewed rather than silently shipped. */
const FOREIGN_HINT = /[^\x00-\x7F]|\b(la|le|les|el|der|die|das|il|una|espa|fran|deutsch|qinghai|nihon)\b/i;

console.log(`US 95-year term has expired for works published <= ${cutoff}\n`);
console.log(`eligible in queue: ${eligible.length}`);

let approved = 0;
const flagged = [];
for (const m of eligible) {
  if (FOREIGN_HINT.test(m.title ?? "")) {
    flagged.push(m);
    continue;
  }
  m.reviewStatus = "approved";
  m.isPublic = true;
  m.licenseVerified = true;
  m.license = `Public domain (published ${m.year}, US term expired)`;
  m.updatedAt = new Date().toISOString();
  approved++;
}

console.log(`approving        ${approved}`);
console.log(`held (non-US?)   ${flagged.length}`);
if (flagged.length) {
  console.log("\n  held for review — US term expired but origin may differ:");
  flagged.slice(0, 10).forEach((m) => console.log(`    ${m.year}  ${(m.title ?? "").slice(0, 46)}`));
}

const live = movies.filter((m) => m.isPublic).length;
console.log(`\nfree catalogue: ${live} titles`);

if (DRY) console.log("\n--dry: nothing written");
else {
  await writeFile("data/movies.json", JSON.stringify(movies, null, 2));
  console.log("wrote data/movies.json");
}
