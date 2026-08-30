/** Discovery importer — fills data/discovery.json on a schedule.
 *
 *  Pages read the store, never the API, so request usage scales with catalogue size
 *  rather than traffic. That keeps a capped free tier viable at any traffic level.
 *
 *  Usage:
 *    node scripts/import-discovery.mjs --probe        print RAW api responses and exit
 *    node scripts/import-discovery.mjs --dry          map and report, write nothing
 *    node scripts/import-discovery.mjs --limit 40     import 40 titles (2 calls each)
 *
 *  Requires WATCHMODE_API_KEY.
 *
 *  Mapping verified against live --probe output. Shapes confirmed:
 *    /list-titles/          -> { titles: [{ id, title, year, ... }], total_results }
 *    /title/{id}/details/   -> { plot_overview, runtime_minutes, genre_names[], user_rating,
 *                                poster, posterMedium, posterLarge, release_date, ... }
 *    /title/{id}/sources/   -> BARE ARRAY of { source_id, name, type, region, web_url,
 *                                format, price, ios_url, android_url }
 *
 *  Two traps the live data revealed:
 *    - sources carry ONE ROW PER REGION. Filtering by region is mandatory, not optional;
 *      a title with CA/GB/IN rows yields nothing under a US filter.
 *    - the same provider repeats per format (HD, 4K), so de-duplication is required.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { openSync, closeSync, existsSync, unlinkSync } from "node:fs";
import { mapTitle } from "../src/lib/watchmode-map.ts";

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(`--${n}`); return i === -1 ? d : args[i + 1]; };
const PROBE = args.includes("--probe");
const DRY = args.includes("--dry");
const MAX_PER_PAGE = 250;              // Watchmode rejects anything larger
const LIMIT = Math.min(Number(flag("limit", 25)), MAX_PER_PAGE);
const PAGES = Number(flag("pages", 1));
const REGION = flag("region", process.env.DISCOVERY_REGION || "US");
const REGIONS_REPORT = args.includes("--regions");
/** Pull only titles with a free, ad-supported legal stream (Tubi, MX Player, …).
 *  This is what makes a "free to watch" section possible with current films
 *  rather than only public-domain cinema. */
const FREE_ONLY = args.includes("--free");

const KEY = process.env.WATCHMODE_API_KEY;
const BASE = "https://api.watchmode.com/v1";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (!KEY) {
  console.error("WATCHMODE_API_KEY is not set.");
  console.error("Get a free key at https://api.watchmode.com/ then add it to .env.local:");
  console.error("  WATCHMODE_API_KEY=your_key_here");
  process.exit(1);
}

let callCount = 0;
async function api(path, params = {}) {
  const qs = new URLSearchParams({ apiKey: KEY, ...params });
  callCount++;
  const res = await fetch(`${BASE}${path}?${qs}`);
  const body = await res.json().catch(() => null);
  if (body && body.success === false) {
    // Watchmode reports auth failures via errorMessage and plan/param failures
    // via statusMessage. Reading only one hides the real cause.
    throw new Error(body.errorMessage || body.statusMessage || `API rejected the request (HTTP ${res.status})`);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return body;
}

/* ---------- probe: show the real shapes, then stop ---------- */
if (PROBE) {
  console.log("Probing Watchmode with your key. This uses ~3 requests.\n");
  try {
    const list = await api("/list-titles/", { types: "movie", limit: "2", sort_by: "popularity_desc" });
    console.log("=== /list-titles/ ===");
    console.log(JSON.stringify(list, null, 2).slice(0, 1500));

    const firstId =
      list?.titles?.[0]?.id ?? list?.results?.[0]?.id ?? list?.title_results?.[0]?.id;
    if (!firstId) {
      console.log("\nCould not find an id in that response — paste the block above to Claude.");
      process.exit(0);
    }

    const details = await api(`/title/${firstId}/details/`);
    console.log("\n=== /title/{id}/details/ ===");
    console.log(JSON.stringify(details, null, 2).slice(0, 1500));

    const sources = await api(`/title/${firstId}/sources/`);
    console.log("\n=== /title/{id}/sources/ ===");
    console.log(JSON.stringify(sources, null, 2).slice(0, 1500));

    console.log(`\nUsed ${callCount} requests. Paste the three blocks above to Claude to lock the mapping.`);
  } catch (err) {
    console.error("\nProbe failed:", err.message);
    console.error("If it says the key is invalid, check .env.local. If it names a different");
    console.error("parameter than 'apiKey', paste the message to Claude.");
    process.exit(1);
  }
  process.exit(0);
}

/* ---------- preflight: is this region on the plan? ---------- */
async function assertRegionEnabled(region) {
  let regions;
  try {
    regions = await api("/regions/");
  } catch (err) {
    console.error(`Could not read /regions/: ${err.message}`);
    process.exit(1);
  }
  const row = (regions ?? []).find((r) => r.country === region);
  const enabled = (regions ?? []).filter((r) => r.plan_enabled);

  if (!row) {
    console.error(`Unknown region "${region}".`);
  } else if (!row.plan_enabled) {
    console.error(`Region "${region}" is not enabled on your Watchmode plan.`);
  } else {
    return;
  }
  console.error(`\nEnabled on your plan: ${enabled.map((r) => `${r.country} (${r.name})`).join(", ") || "none"}`);
  console.error(`Set one in .env.local, e.g.  DISCOVERY_REGION=${enabled[0]?.country ?? "GB"}`);
  process.exit(1);
}

/* ---------- region report ---------- */
if (REGIONS_REPORT) {
  const all = await api("/regions/").catch(() => []);
  const enabled = new Set((all ?? []).filter((r) => r.plan_enabled).map((r) => r.country));
  console.log(`Regions enabled on your plan: ${[...enabled].join(", ") || "none"}`);
  console.log(`Sampling ${LIMIT} titles to see which carry availability data.\n`);
  const list = await api("/list-titles/", { types: "movie", limit: String(LIMIT), sort_by: "popularity_desc" });
  const rows = list?.titles ?? [];
  const counts = new Map();
  let withAny = 0;
  for (const row of rows) {
    try {
      const srcs = await api(`/title/${row.id}/sources/`);
      await sleep(150);
      const regions = new Set((Array.isArray(srcs) ? srcs : []).map((s) => s.region).filter(Boolean));
      if (regions.size) withAny++;
      for (const r of regions) counts.set(r, (counts.get(r) ?? 0) + 1);
    } catch { /* skip */ }
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  console.log(`region   titles with availability (of ${rows.length} sampled, ${withAny} had any)`);
  for (const [region, n] of ranked.slice(0, 15)) {
    const bar = "█".repeat(Math.round((n / rows.length) * 30));
    const mark = enabled.has(region) ? "on plan " : "locked  ";
    console.log(`  ${region.padEnd(4)} ${mark} ${String(n).padStart(3)}  ${bar}`);
  }
  console.log(`\nUsed ${callCount} requests.`);
  console.log(`Pick one and set it: DISCOVERY_REGION=XX in .env.local`);
  process.exit(0);
}

/* ---------- import ---------- */

/** Two concurrent imports would both read the store, merge separately and race to
 *  write — the loser's work (and its API requests) is silently discarded. */
const LOCK = "data/.import.lock";
await mkdir("data", { recursive: true });
let lockFd;
try {
  lockFd = openSync(LOCK, "wx"); // fails if it already exists
} catch {
  console.error("Another discovery import is already running (data/.import.lock exists).");
  console.error("Wait for it to finish, or remove the lock if it crashed:");
  console.error("  rm data/.import.lock");
  process.exit(1);
}
const releaseLock = () => {
  try { closeSync(lockFd); } catch {}
  try { if (existsSync(LOCK)) unlinkSync(LOCK); } catch {}
};
process.on("exit", releaseLock);
process.on("SIGINT", () => { releaseLock(); process.exit(130); });


const existing = await readFile("data/discovery.json", "utf8").then(JSON.parse).catch(() => []);
const bySource = new Map(existing.map((t) => [t.sourceId, t]));

await assertRegionEnabled(REGION);

const rows = [];
for (let page = 1; page <= PAGES; page++) {
  let list;
  try {
    list = await api("/list-titles/", {
      types: "movie",
      limit: String(LIMIT),
      page: String(page),
      sort_by: "popularity_desc",
      regions: REGION,
      ...(FREE_ONLY ? { source_types: "free" } : {}),
    });
  } catch (err) {
    console.error(`Could not list titles (page ${page}):`, err.message);
    break;
  }
  const batch = list?.titles ?? list?.results ?? list?.title_results ?? [];
  if (!batch.length) break;
  rows.push(...batch);
  if (page === 1 && list?.total_results) {
    console.log(`${FREE_ONLY ? "free-to-watch " : ""}catalogue has ${list.total_results} movies in ${REGION}`);
  }
}
if (!rows.length) {
  console.error("The list endpoint returned no rows. Run --probe and share the output.");
  process.exit(1);
}
console.log(`listing returned ${rows.length} titles`);
console.log(`fetching details + sources for each (~${rows.length * 2} requests)\n`);
const started = Date.now();

let imported = 0, failed = 0;
let index = 0;
for (const row of rows) {
  index++;
  const id = row.id ?? row.title_id;
  if (!id) { failed++; continue; }


  try {
    const [details, sources] = [await api(`/title/${id}/details/`), await api(`/title/${id}/sources/`)];
    await sleep(150);
    const mapped = mapTitle(details, sources, REGION);
    bySource.set(mapped.sourceId, mapped);
    imported++;
  } catch (err) {
    failed++;
    if (failed === 1) console.error(`  first failure on ${id}: ${err.message}`);
  }

  // Progress, so a long run does not look hung. Printed after processing so the
  // counts shown always match the work actually done.
  if (index % 10 === 0 || index === rows.length) {
    const elapsed = (Date.now() - started) / 1000;
    const left = Math.round((rows.length - index) / Math.max(index / Math.max(elapsed, 0.001), 0.001));
    process.stdout.write(
      `  ${String(index).padStart(4)}/${rows.length}  ${imported} ok  ${failed} failed` +
      (index < rows.length ? `  ~${left}s remaining\n` : `\n`),
    );
  }
}

const out = [...bySource.values()];
const withOptions = out.filter(
  (t) => t.options.free.length + t.options.stream.length + t.options.rent.length + t.options.buy.length > 0,
).length;

const freeCount = out.filter((t) => t.options.free.length).length;
console.log("\n──────── discovery import ────────");
console.log(`imported        ${imported}`);
console.log(`failed          ${failed}`);
console.log(`total in store  ${out.length}`);
console.log(`with providers  ${withOptions}`);
console.log(`free to watch   ${freeCount}`);
console.log(`api requests    ${callCount}`);

if (withOptions === 0 && out.length > 0) {
  console.log("\n  No titles got provider options — the sources mapping is probably wrong.");
  console.log("  Run --probe and share the /sources/ block so it can be corrected.");
}

if (DRY) console.log("\n--dry: nothing written");
else {
  await mkdir("data", { recursive: true });
  await writeFile("data/discovery.json", JSON.stringify(out, null, 2));
  console.log(`\nwrote data/discovery.json`);
}
