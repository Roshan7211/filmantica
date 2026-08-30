/** Clear films whose copyright has expired in a chosen territory.
 *
 *  Copyright terms differ by country, and the difference is large for film:
 *
 *    India   60 years from publication  (Copyright Act 1957, s.26)
 *    US      95 years from publication
 *
 *  So in 2026 a 1960 film is public domain in India and still protected in the US.
 *  Which rule applies depends on where the viewer is, not where the site is
 *  hosted — clearing under a shorter term is only defensible if the audience is
 *  in that territory, and the site should be geo-restricted accordingly.
 *
 *  Usage:
 *    node scripts/approve-territory.mjs --territory IN [--dry]
 *    node scripts/approve-territory.mjs --territory US [--dry]
 */
import { readFile, writeFile } from "node:fs/promises";

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(`--${n}`); return i === -1 ? d : args[i + 1]; };
const DRY = args.includes("--dry");
const TERRITORY = (flag("territory", "US") || "US").toUpperCase();

/** Term in years from publication, for cinematograph films. */
const TERMS = {
  IN: { years: 60, note: "India — Copyright Act 1957 s.26, 60 years from publication" },
  US: { years: 95, note: "United States — 95 years from publication" },
  GB: { years: 70, note: "UK — 70 years (simplified; film term is more complex)" },
};

const term = TERMS[TERRITORY];
if (!term) {
  console.error(`Unknown territory "${TERRITORY}". Known: ${Object.keys(TERMS).join(", ")}`);
  process.exit(1);
}

const cutoff = new Date().getFullYear() - term.years;
const movies = JSON.parse(await readFile("data/movies.json", "utf8"));

const eligible = movies.filter(
  (m) => m.reviewStatus === "pending" && m.videoUrl &&
         typeof m.year === "number" && m.year >= 1888 && m.year <= cutoff,
);

console.log(`${term.note}`);
console.log(`Public domain in ${TERRITORY} for films published <= ${cutoff}\n`);
console.log(`eligible in queue: ${eligible.length}`);

let approved = 0;
for (const m of eligible) {
  m.reviewStatus = "approved";
  m.isPublic = true;
  m.licenseVerified = true;
  m.license = `Public domain in ${TERRITORY} (published ${m.year}; ${term.years}-year term expired)`;
  m.publicDomainTerritory = TERRITORY;
  m.updatedAt = new Date().toISOString();
  approved++;
}

const live = movies.filter((m) => m.isPublic).length;
console.log(`approved         ${approved}`);
console.log(`free catalogue   ${live} titles`);

if (approved) {
  console.log(`\n  These are cleared for ${TERRITORY} only. A film in the public domain there`);
  console.log(`  may still be protected elsewhere — restrict the free catalogue to ${TERRITORY}`);
  console.log(`  viewers, or clear under the longest term you serve.`);
}

if (DRY) console.log("\n--dry: nothing written");
else {
  await writeFile("data/movies.json", JSON.stringify(movies, null, 2));
  console.log("\nwrote data/movies.json");
}
