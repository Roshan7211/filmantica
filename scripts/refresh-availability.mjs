/** Rolling availability refresh.
 *
 *  Licences begin and end continuously, so a "FREE" badge that is wrong is the
 *  one failure that would undermine the site. But refreshing every title weekly
 *  is not affordable: 1,064 titles against a 2,500 request monthly budget.
 *
 *  So this refreshes the titles checked longest ago, up to a budget, and cycles.
 *  At 500 per week the whole catalogue is re-checked roughly fortnightly and the
 *  monthly spend stays near 2,000, leaving headroom for importing new titles.
 *
 *  Only /sources/ is fetched — one request per title. Details, cast and trailers
 *  do not change, so re-fetching them would double the cost for nothing.
 *
 *  Usage: node scripts/refresh-availability.mjs --limit 500 [--dry]
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { openSync, closeSync, existsSync, unlinkSync, writeFileSync } from "node:fs";
import { mapSources } from "../src/lib/watchmode-map.ts";

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(`--${n}`); return i === -1 ? d : args[i + 1]; };
const LIMIT = Number(flag("limit", 200));
const REGION = flag("region", process.env.DISCOVERY_REGION || "IN");
const DRY = args.includes("--dry");

const KEY = process.env.WATCHMODE_API_KEY;
if (!KEY) { console.error("WATCHMODE_API_KEY is not set."); process.exit(1); }

const BASE = "https://api.watchmode.com/v1";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let calls = 0, rateLimitHits = 0;
async function api(path, attempt = 0) {
  calls++;
  const res = await fetch(`${BASE}${path}?apiKey=${KEY}`);
  const body = await res.json().catch(() => null);
  const message = body?.errorMessage || body?.statusMessage || "";
  if (res.status === 429 || /rate limit/i.test(message)) {
    rateLimitHits++;
    if (attempt >= 5) throw new Error("rate limited after 5 attempts");
    await sleep(2000 * Math.pow(2, attempt));
    return api(path, attempt + 1);
  }
  if (body && body.success === false) throw new Error(message || `HTTP ${res.status}`);
  return body;
}

const LOCK = "data/.refresh.lock";
await mkdir("data", { recursive: true });
let fd;
try { fd = openSync(LOCK, "wx"); }
catch {
  let stale = true;
  try {
    const owner = Number(await readFile(LOCK, "utf8"));
    if (Number.isFinite(owner) && owner > 0) { try { process.kill(owner, 0); stale = false; } catch {} }
  } catch {}
  if (!stale) { console.error("A refresh is already running."); process.exit(1); }
  console.warn("Clearing a stale lock left by a crashed run.");
  try { unlinkSync(LOCK); } catch {}
  fd = openSync(LOCK, "wx");
}
writeFileSync(LOCK, String(process.pid));
const release = () => { try { closeSync(fd); } catch {} try { if (existsSync(LOCK)) unlinkSync(LOCK); } catch {} };
process.on("exit", release);
process.on("SIGINT", () => { release(); process.exit(130); });

const titles = JSON.parse(await readFile("data/discovery.json", "utf8"));

/** Oldest checked first, so every title comes round in turn. */
const due = titles
  .slice()
  .sort((a, b) => String(a.checkedAt ?? a.updatedAt ?? "").localeCompare(String(b.checkedAt ?? b.updatedAt ?? "")))
  .slice(0, LIMIT);

console.log(`${titles.length} titles, refreshing the ${due.length} checked longest ago`);
console.log(`region ${REGION}, budget ~${due.length} requests\n`);

const started = Date.now();
let ok = 0, failed = 0, gainedFree = 0, lostFree = 0, changed = 0;

for (const t of due) {
  try {
    const raw = await api(`/title/${t.sourceId}/sources/`);
    await sleep(200);

    const before = JSON.stringify(t.options);
    const wasFree = t.options.free.length > 0;

    t.options = mapSources(raw, REGION);
    t.checkedAt = new Date().toISOString();

    const isFree = t.options.free.length > 0;
    const now = t.checkedAt;

    // Record the transition rather than only counting it, so the site can show
    // what is newly free and what has just gone without diffing snapshots.
    if (!wasFree && isFree) { t.freeSince = now; t.leftFreeAt = null; gainedFree++; }
    if (wasFree && !isFree) { t.leftFreeAt = now; t.freeSince = null; lostFree++; }
    // Deliberately NOT setting freeSince on first sighting: the first refresh would
    // then mark every already-free title as newly free, which is false. The feed
    // starts empty and fills with real transitions, which is the honest behaviour.
    if (JSON.stringify(t.options) !== before) changed++;
    ok++;
  } catch (err) {
    failed++;
    if (failed <= 3) console.error(`  failed ${t.sourceId}: ${err.message}`);
  }

  if ((ok + failed) % 50 === 0 || ok + failed === due.length) {
    const elapsed = (Date.now() - started) / 1000;
    const left = Math.round((due.length - ok - failed) / Math.max((ok + failed) / elapsed, 0.001));
    process.stdout.write(`  ${String(ok + failed).padStart(4)}/${due.length}  ${ok} ok  ${failed} failed  ~${left}s left\n`);
  }
}

const free = titles.filter((t) => t.options.free.length > 0).length;

console.log("\n──────── availability refresh ────────");
console.log(`refreshed        ${ok}`);
console.log(`failed           ${failed}`);
console.log(`availability changed ${changed}`);
console.log(`became free      ${gainedFree}`);
console.log(`no longer free   ${lostFree}`);
console.log(`free now         ${free} of ${titles.length}`);
console.log(`api requests     ${calls}`);
console.log(`rate limit waits ${rateLimitHits}`);

if (DRY) console.log("\n--dry: nothing written");
else {
  await writeFile("data/discovery.json", JSON.stringify(titles, null, 2));
  console.log("\nwrote data/discovery.json");
}
