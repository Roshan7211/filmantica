/** Backfills trailer, cast, crew, backdrop and certification onto existing records.
 *
 *  These were added to the mapper after the catalogue was imported, so records
 *  carry availability but none of the detail. Re-running the full importer would
 *  refetch everything; this fetches only what is missing.
 *
 *  Costs 2 requests per title (details + cast-crew), so it is budgeted and
 *  prioritised: free titles first, then newest, since those are the pages people
 *  actually land on.
 *
 *  Usage: node scripts/enrich-discovery.mjs --limit 400 [--dry]
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { openSync, closeSync, existsSync, unlinkSync, writeFileSync } from "node:fs";
import { youtubeId } from "../src/lib/youtube.ts";

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(`--${n}`); return i === -1 ? d : args[i + 1]; };
const LIMIT = Number(flag("limit", 100));
const DRY = args.includes("--dry");

const KEY = process.env.WATCHMODE_API_KEY;
if (!KEY) { console.error("WATCHMODE_API_KEY is not set."); process.exit(1); }

const BASE = "https://api.watchmode.com/v1";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let calls = 0;
let rateLimitHits = 0;

/** Watchmode enforces a short-window rate limit separately from the monthly quota.
 *  Hitting it returns success:false rather than a 429, so it has to be detected in
 *  the body. Without backoff a fast loop burns quota producing only failures. */
async function api(path, attempt = 0) {
  calls++;
  const res = await fetch(`${BASE}${path}${path.includes("?") ? "&" : "?"}apiKey=${KEY}`);
  const body = await res.json().catch(() => null);

  const message = body?.errorMessage || body?.statusMessage || "";
  const limited = res.status === 429 || /rate limit/i.test(message);

  if (limited) {
    rateLimitHits++;
    if (attempt >= 5) throw new Error("rate limited after 5 attempts");
    const wait = 2000 * Math.pow(2, attempt);   // 2s, 4s, 8s, 16s, 32s
    await sleep(wait);
    return api(path, attempt + 1);
  }

  if (body && body.success === false) throw new Error(message || `HTTP ${res.status}`);
  return body;
}

const LOCK = "data/.enrich.lock";
await mkdir("data", { recursive: true });

/** The lock records its owner's pid so a crashed run can be detected rather than
 *  blocking every future run until someone deletes the file by hand. */
let fd;
try {
  fd = openSync(LOCK, "wx");
} catch {
  let stale = true;
  try {
    const owner = Number(await readFile(LOCK, "utf8"));
    if (Number.isFinite(owner) && owner > 0) {
      try { process.kill(owner, 0); stale = false; } catch { stale = true; }
    }
  } catch { /* unreadable lock counts as stale */ }

  if (!stale) {
    console.error("Another enrichment is running. Wait for it to finish.");
    process.exit(1);
  }
  console.warn("Clearing a stale lock left by a crashed run.");
  try { unlinkSync(LOCK); } catch {}
  fd = openSync(LOCK, "wx");
}
writeFileSync(LOCK, String(process.pid));
const release = () => { try { closeSync(fd); } catch {} try { if (existsSync(LOCK)) unlinkSync(LOCK); } catch {} };
process.on("exit", release);
process.on("SIGINT", () => { release(); process.exit(130); });

const titles = JSON.parse(await readFile("data/discovery.json", "utf8"));

/** Free first, then newest — those are the pages that get traffic. */
const needsWork = titles
  .filter((t) => t.trailerId === undefined || t.cast === undefined)
  .sort((a, b) => {
    const af = a.options.free.length > 0, bf = b.options.free.length > 0;
    if (af !== bf) return af ? -1 : 1;
    return (b.year ?? 0) - (a.year ?? 0);
  })
  .slice(0, LIMIT);

console.log(`${titles.length} titles in store, ${needsWork.length} selected for enrichment`);
console.log(`budget: ~${needsWork.length * 2} requests\n`);

const started = Date.now();
let done = 0, failed = 0, withTrailer = 0, withCast = 0;

for (const t of needsWork) {
  try {
    const details = await api(`/title/${t.sourceId}/details/`);
    await sleep(350);
    const people = await api(`/title/${t.sourceId}/cast-crew/`);
    await sleep(350);

    t.backdropUrl = details?.backdrop ?? t.backdropUrl ?? null;
    t.certification = details?.us_rating ?? t.certification ?? null;
    t.language = details?.original_language ?? t.language ?? null;
    t.imdbId = details?.imdb_id ?? t.imdbId ?? null;
    t.trailerUrl = details?.trailer ?? null;
    t.trailerId = youtubeId(details?.trailer);
    if (t.trailerId) withTrailer++;

    const rows = Array.isArray(people) ? people : [];
    t.cast = rows
      .filter((p) => String(p.type).toLowerCase() === "cast")
      .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
      .slice(0, 12)
      .map((p) => ({ name: p.full_name, role: p.role ?? null }));
    t.crew = rows
      .filter((p) => /director|writer|screenplay|producer/i.test(p.role ?? ""))
      .slice(0, 6)
      .map((p) => ({ name: p.full_name, role: p.role }));
    if (t.cast.length) withCast++;

    t.updatedAt = new Date().toISOString();
    done++;
  } catch (err) {
    // Deliberately leave trailerId/cast undefined so this title is picked up by
    // the next run. Writing null here would mark it enriched and skip it forever.
    failed++;
    if (failed <= 3) console.error(`  failed ${t.sourceId}: ${err.message}`);
  }

  if (done % 25 === 0 || done + failed === needsWork.length) {
    const elapsed = (Date.now() - started) / 1000;
    const left = Math.round((needsWork.length - done - failed) / Math.max((done + failed) / elapsed, 0.001));
    process.stdout.write(`  ${String(done + failed).padStart(4)}/${needsWork.length}  ${done} ok  ${failed} failed  ~${left}s left\n`);
  }
}

console.log("\n──────── enrichment ────────");
console.log(`enriched        ${done}`);
console.log(`failed          ${failed}`);
console.log(`with trailer    ${withTrailer}`);
console.log(`with cast       ${withCast}`);
console.log(`api requests    ${calls}`);
console.log(`rate limit waits ${rateLimitHits}`);

if (DRY) console.log("\n--dry: nothing written");
else {
  await writeFile("data/discovery.json", JSON.stringify(titles, null, 2));
  console.log("\nwrote data/discovery.json");
}
