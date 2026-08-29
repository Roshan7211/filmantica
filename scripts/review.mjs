/** Rights review queue.
 *
 *  Titles the importer could not clear automatically sit here as reviewStatus:"pending"
 *  and are never served. This is the human step the project's legal rule requires.
 *
 *  Usage:
 *    node scripts/review.mjs                     list what is waiting
 *    node scripts/review.mjs --show <slug>       full metadata for one title
 *    node scripts/review.mjs --approve <slug>    publish it
 *    node scripts/review.mjs --reject <slug>     drop it permanently
 */
import { readFile, writeFile } from "node:fs/promises";

const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(`--${n}`); return i === -1 ? null : args[i + 1]; };

const movies = JSON.parse(await readFile("data/movies.json", "utf8"));
const pending = movies.filter((m) => m.reviewStatus === "pending");

const save = async () => writeFile("data/movies.json", JSON.stringify(movies, null, 2));

const show = (m) => {
  console.log(`\n  ${m.title}${m.year ? ` (${m.year})` : ""}`);
  console.log(`  slug      ${m.slug}`);
  console.log(`  licence   ${m.license}`);
  console.log(`  source    ${m.sourceUrl}`);
  if (m.creator) console.log(`  creator   ${m.creator}`);
  if (m.genres?.length) console.log(`  genres    ${m.genres.join(", ")}`);
};

const approve = flag("approve");
const reject = flag("reject");
const detail = flag("show");

if (detail) {
  const m = movies.find((x) => x.slug === detail);
  if (!m) { console.error(`no title with slug "${detail}"`); process.exit(1); }
  show(m);
  console.log(`  description\n    ${(m.description || "(none)").slice(0, 500)}`);
  console.log(`\n  Before approving, confirm the rights yourself — collection membership`);
  console.log(`  and uploader metadata are not a clearance.`);
} else if (approve) {
  const m = movies.find((x) => x.slug === approve);
  if (!m) { console.error(`no title with slug "${approve}"`); process.exit(1); }
  m.reviewStatus = "approved";
  m.isPublic = true;
  m.licenseVerified = true;
  m.updatedAt = new Date().toISOString();
  await save();
  console.log(`approved and published: ${m.title}`);
} else if (reject) {
  const m = movies.find((x) => x.slug === reject);
  if (!m) { console.error(`no title with slug "${reject}"`); process.exit(1); }
  m.reviewStatus = "rejected";
  m.isPublic = false;
  m.updatedAt = new Date().toISOString();
  await save();
  console.log(`rejected and unpublished: ${m.title}`);
} else {
  const live = movies.filter((m) => m.isPublic).length;
  console.log(`catalogue: ${movies.length} records · ${live} live · ${pending.length} awaiting review`);
  if (!pending.length) { console.log("\nnothing pending."); process.exit(0); }
  console.log("\nawaiting rights review:");
  for (const m of pending) show(m);
  console.log(`\n  node scripts/review.mjs --show <slug>     inspect`);
  console.log(`  node scripts/review.mjs --approve <slug>  publish`);
}
