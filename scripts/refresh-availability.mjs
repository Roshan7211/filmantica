/** Rolling availability refresh.
 *
 *  Licences begin and end continuously, so a "FREE" badge that is wrong is the
 *  one failure that would undermine the site. But refreshing every title weekly
 *  is not affordable: 1,888 titles against a 2,500 request monthly budget.
 *
 *  So this refreshes the titles checked longest ago, up to a budget, and cycles.
 *  At 500 per week the whole catalogue is re-checked about every four weeks and
 *  the monthly spend is 2,000 to 2,500, which leaves little for importing.
 *
 *  Only /sources/ is fetched — one request per title. Details, cast and trailers
 *  do not change, so re-fetching them would double the cost for nothing.
 *
 *  Usage: node scripts/refresh-availability.mjs --limit 500 [--dry] [--force]
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { openSync, closeSync, existsSync, unlinkSync, writeFileSync } from "node:fs";
import { mapSources } from "../src/lib/watchmode-map.ts";

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(`--${n}`); return i === -1 ? d : args[i + 1]; };
const LIMIT = Number(flag("limit", 200));
const REGION = flag("region", process.env.DISCOVERY_REGION || "IN");
const DRY = args.includes("--dry");
const FORCE = args.includes("--force");

const KEY = process.env.WATCHMODE_API_KEY;
if (!KEY) { console.error("WATCHMODE_API_KEY is not set."); process.exit(1); }

const BASE = "https://api.watchmode.com/v1";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Without a timeout one stalled connection hangs the run forever. In CI that is
 *  six hours until GitHub kills the job, and nothing is written. */
const REQUEST_TIMEOUT_MS = 30_000;
/** A failing API (quota spent, key revoked, outage) fails every title, and each
 *  rate-limit retry sequence costs ~a minute: 500 titles is ~8 hours. Stop early
 *  and keep what was refreshed instead. */
const MAX_CONSECUTIVE_FAILURES = 10;
/** A rate limit is on the account, not the title: once one title has waited out
 *  its retries (~a minute), the next will too. Ten of them is ten minutes and
 *  sixty requests for nothing. */
const MAX_CONSECUTIVE_RATE_LIMITED = 3;
/** A title loses a provider now and then. It does not lose every provider at
 *  once, and hundreds do not do so in the same week. On 12 Oct 2026 the API
 *  returned no sources for the region for 202 of 500 titles, among them films
 *  still on Prime Video, JioHotstar and Apple TV. Writing that would have taken
 *  down 199 correct FREE badges.
 *
 *  So an empty answer is judged by the company it keeps. Past this share of the
 *  run, the empty answers are not believed: those titles keep their listings and
 *  are asked again next time round, and everything else is written as normal.
 *  Below it, a title that came back empty really has gone. --force believes the
 *  API regardless. */
const MAX_EMPTIED_SHARE = 0.15;
/** Fewer titles than this is too few to take a share of, which is no reason to
 *  believe an empty answer either. */
const MIN_SAMPLE_FOR_SHARE = 20;
const listed = (options) => Object.values(options).some((list) => list.length > 0);
/** Longer than this and the API is not asking for a pause, it is saying no. */
const MAX_RETRY_WAIT_MS = 60_000;

/** A 429 is either a short burst limit or a spent monthly quota, and only the
 *  response says which. Reporting both as "rate limited" left a failed run with
 *  no way to tell what had gone wrong, so keep everything the API said. */
function describe(res, message) {
  const h = (n) => res.headers.get(n);
  return [
    `HTTP ${res.status}`,
    message && `"${message}"`,
    h("retry-after") && `retry-after ${h("retry-after")}`,
    h("x-account-quota") && `quota ${h("x-account-quota-used")} of ${h("x-account-quota")} used`,
    h("x-ratelimit-limit") && `rate limit ${h("x-ratelimit-remaining")} of ${h("x-ratelimit-limit")} left`,
  ].filter(Boolean).join(", ");
}

/** Quota for the month, straight from the API. /status/ is not billed. */
async function readQuota() {
  const res = await fetch(`${BASE}/status/?apiKey=${KEY}`, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  const status = await res.json().catch(() => null);
  if (Number.isFinite(status?.quota) && Number.isFinite(status?.quotaUsed)) return { quota: status.quota, used: status.quotaUsed };
  throw new Error(`/status/ answered ${describe(res, status?.errorMessage || status?.statusMessage || "")}`);
}

let calls = 0, rateLimitHits = 0;
async function api(path, attempt = 0) {
  calls++;
  const res = await fetch(`${BASE}${path}?apiKey=${KEY}`, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  const body = await res.json().catch(() => null);
  const message = body?.errorMessage || body?.statusMessage || "";
  if (res.status === 429 || /rate limit/i.test(message)) {
    rateLimitHits++;
    const refused = (why, props) => Object.assign(new Error(`${why}: ${describe(res, message)}`), props);

    // A spent quota is a clean stop and a burst limit is a fault, so do not guess
    // which from the wording: take it from the headers, or ask.
    const quota = Number(res.headers.get("x-account-quota"));
    const used = Number(res.headers.get("x-account-quota-used"));
    let spent = quota > 0 && used >= quota;
    if (!spent && attempt === 0) spent = await readQuota().then((q) => q.used >= q.quota, () => false);
    if (spent) throw refused("quota spent", { quotaSpent: true });

    // Wait as long as the API asks when it says; guess only when it does not.
    const retryAfter = Number(res.headers.get("retry-after"));
    const wait = retryAfter > 0 ? retryAfter * 1000 : 2000 * Math.pow(2, attempt);
    if (attempt >= 5) throw refused("rate limited after 5 attempts", { rateLimited: true });
    if (wait > MAX_RETRY_WAIT_MS) throw refused("rate limited for longer than this run can wait", { rateLimited: true });
    await sleep(wait);
    return api(path, attempt + 1);
  }
  if (body && body.success === false) throw new Error(message || `HTTP ${res.status}`);
  // An error page or an error object is not "this title has no sources". Read as
  // one it empties the title's listings, and too few of them to trip the share.
  if (!res.ok) throw new Error(describe(res, message));
  if (!Array.isArray(body)) throw new Error(`not a list of sources: ${describe(res, message || JSON.stringify(body)?.slice(0, 80))}`);
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

/** Spend only what is left this month. An import can use the whole quota, and
 *  refreshing into a spent quota just fails every title. /status/ is not billed. */
let remaining = Infinity;
try {
  const { quota, used } = await readQuota();
  remaining = quota - used;
  console.log(`quota: ${used} of ${quota} used this month`);
} catch (err) {
  // Unknown: fall back to LIMIT, and the failure streak guards the rest.
  console.warn(`quota unknown: ${err.message}`);
}

if (remaining <= 0) {
  console.log("::notice::API quota is spent for this month; skipping the refresh until it resets.");
  process.exit(0);
}

const titles = JSON.parse(await readFile("data/discovery.json", "utf8"));

/** Oldest checked first, so every title comes round in turn. A held title counts
 *  as asked, or the held ones would fill the front of the queue every week. */
const lastAsked = (t) => String([t.checkedAt, t.heldAt].filter(Boolean).sort().pop() ?? t.updatedAt ?? "");
const due = titles
  .slice()
  .sort((a, b) => lastAsked(a).localeCompare(lastAsked(b)))
  .slice(0, Math.min(LIMIT, remaining));

console.log(`${titles.length} titles, refreshing the ${due.length} checked longest ago`);
console.log(`region ${REGION}, budget ~${due.length} requests\n`);

const started = Date.now();
let ok = 0, failed = 0, gainedFree = 0, lostFree = 0, changed = 0, failStreak = 0, rateLimitedStreak = 0, aborted = false, quotaSpent = false;
let hadOptions = 0;
/** Titles that had listings and came back with none, waiting on the verdict. */
const emptied = [];

function apply(t, options, now) {
  const before = JSON.stringify(t.options);
  const wasFree = t.options.free.length > 0;

  t.options = options;
  t.checkedAt = now;
  delete t.heldAt;

  const isFree = t.options.free.length > 0;

  // Record the transition rather than only counting it, so the site can show
  // what is newly free and what has just gone without diffing snapshots.
  if (!wasFree && isFree) { t.freeSince = now; t.leftFreeAt = null; gainedFree++; }
  if (wasFree && !isFree) { t.leftFreeAt = now; t.freeSince = null; lostFree++; }
  // Deliberately NOT setting freeSince on first sighting: the first refresh would
  // then mark every already-free title as newly free, which is false. The feed
  // starts empty and fills with real transitions, which is the honest behaviour.
  if (JSON.stringify(t.options) !== before) changed++;
}

for (const t of due) {
  if (quotaSpent) break;
  if (failStreak >= MAX_CONSECUTIVE_FAILURES || rateLimitedStreak >= MAX_CONSECUTIVE_RATE_LIMITED) {
    aborted = true;
    console.error(`\n${failStreak} failures in a row: the API is unusable right now. Stopping and keeping what was refreshed.`);
    break;
  }
  try {
    const raw = await api(`/title/${t.sourceId}/sources/`);
    await sleep(200);

    const options = mapSources(raw, REGION);
    const now = new Date().toISOString();

    if (listed(t.options)) hadOptions++;
    if (listed(t.options) && !listed(options)) emptied.push({ t, options, now });
    else apply(t, options, now);
    ok++;
    failStreak = 0;
    rateLimitedStreak = 0;
  } catch (err) {
    failed++;
    failStreak++;
    rateLimitedStreak = err.rateLimited ? rateLimitedStreak + 1 : 0;
    quotaSpent = Boolean(err.quotaSpent);
    if (failed <= 3) console.error(`  failed ${t.sourceId}: ${err.message}`);
  }

  if ((ok + failed) % 50 === 0 || ok + failed === due.length) {
    const elapsed = (Date.now() - started) / 1000;
    const left = Math.round((due.length - ok - failed) / Math.max((ok + failed) / elapsed, 0.001));
    process.stdout.write(`  ${String(ok + failed).padStart(4)}/${due.length}  ${ok} ok  ${failed} failed  ~${left}s left\n`);
  }
}

const distrusted = !FORCE && emptied.length > 0
  && (hadOptions < MIN_SAMPLE_FOR_SHARE || emptied.length / hadOptions > MAX_EMPTIED_SHARE);
for (const { t, options, now } of emptied) {
  if (distrusted) t.heldAt = now;
  else apply(t, options, now);
}

const free = titles.filter((t) => t.options.free.length > 0).length;

console.log("\n──────── availability refresh ────────");
console.log(`refreshed        ${ok}`);
console.log(`failed           ${failed}`);
console.log(`availability changed ${changed}`);
console.log(`became free      ${gainedFree}`);
console.log(`no longer free   ${lostFree}`);
console.log(`free now         ${free} of ${titles.length}`);
console.log(`lost every option ${emptied.length} of ${hadOptions}${distrusted ? " (not believed: listings kept)" : ""}`);
console.log(`api requests     ${calls}`);
console.log(`rate limit waits ${rateLimitHits}`);

if (distrusted) {
  const why = hadOptions < MIN_SAMPLE_FOR_SHARE
    ? "That is too few titles to tell a real removal from the API losing data"
    : `That is the API losing data, not ${emptied.length} licences ending`;
  console.log(`::warning::${emptied.length} of ${hadOptions} titles came back with nothing to watch in ${REGION}. ${why}, so those titles kept their listings and will be asked again. Pass --force if it is real.`);
}

if (DRY) console.log("\n--dry: nothing written");
else {
  await writeFile("data/discovery.json", JSON.stringify(titles, null, 2));
  console.log("\nwrote data/discovery.json");
}

// Running out of quota is expected, not a fault: the same outcome as finding it
// already spent before starting.
if (quotaSpent) console.log(`::notice::API quota ran out after ${ok} of ${due.length} titles; the rest wait until it resets.`);

// Failed titles keep their place at the front of the queue, so a title that
// fails every week should be seen, not buried in a green run.
if (failed > 0 && !aborted && !quotaSpent) console.log(`::warning::${failed} of ${due.length} titles could not be refreshed and will be tried again next run.`);

// A partial run still exits 0 so CI commits what it got; the ::warning:: line
// surfaces on the Actions run. Nothing refreshed at all is a failure.
if (aborted) {
  console.log(`::warning::Refresh stopped early after ${ok} of ${due.length} titles: the API kept failing.`);
  if (ok === 0) process.exit(1);
}
