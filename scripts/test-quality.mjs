import { assessQuality, meetsPublishBar, uniqueSlug, cleanTitle, parseRuntime, splitGenres, safeDescription, descriptionIsBorrowed } from "../src/lib/quality.ts";
const r = [];
const check = (n, c, d = "") => { r.push(!!c); console.log(`${c ? "PASS" : "FAIL"}  ${n}${d ? "  " + d : ""}`); };
const good = { title: "The Monster Walks", year: 1932, description: "x".repeat(120) };

check("a real film passes", assessQuality(good).ok);

// the exact titles that got published
for (const t of ["IMG 0057", "VID 20250819 WA 0001", "Tech music.com_1724087158410(480p)",
                 "intervall_hoeren_singen_ueben_230217_480", "DSC_1234", "Screen Recording 5"]) {
  const v = assessQuality({ ...good, title: t });
  check(`rejects "${t.slice(0, 34)}"`, !v.ok, v.reasons[0] ?? "");
}

check("rejects pre-cinema year", !assessQuality({ ...good, year: 1843 }).ok);
check("rejects year 1845", !assessQuality({ ...good, year: 1845 }).ok);
check("accepts 1888", assessQuality({ ...good, year: 1888 }).ok);
check("rejects far-future year", !assessQuality({ ...good, year: 2099 }).ok);
// Tier separation: sparse metadata must NOT hard-reject a real film.
check("thin description survives tier 1", assessQuality({ ...good, description: "" }).ok);
check("thin description fails the publish bar", !meetsPublishBar({ ...good, description: "" }).ok);
check("missing year survives tier 1", assessQuality({ ...good, year: null }).ok);
check("missing year fails the publish bar", !meetsPublishBar({ ...good, year: null }).ok);
check("a rich real film clears the publish bar", meetsPublishBar(good).ok);
check("junk fails BOTH tiers",
  !assessQuality({ title: "IMG 0057", year: 1843 }).ok && !meetsPublishBar({ title: "IMG 0057", year: 1843 }).ok);
check("no title rejected", !assessQuality({ ...good, title: "" }).ok);
check("collects multiple reasons", assessQuality({ title: "IMG 001", year: 1800 }).reasons.length === 2);

// slug uniqueness — the hurt-hurt_202 x3 bug
const taken = new Set();
const a = uniqueSlug("hurt", taken, "hurt_202");
const b = uniqueSlug("hurt", taken, "hurt_202");
const c = uniqueSlug("hurt", taken, "hurt_202");
check("slugs stay unique across collisions", new Set([a, b, c]).size === 3, `${a} / ${b} / ${c}`);
check("first collision keeps the clean slug", a === "hurt");
check("empty base falls back to id", uniqueSlug("", new Set(), "abc123") === "abc123");


// --- title cleaning ---
const tc = [
  ["Bed Time / Dave Fleischer / DVD / x264 / MKV", "Bed Time"],
  ["Felix in Hollywood / Otto Messmer / DVD / DivX / AVI", "Felix in Hollywood"],
  ['"Home, Sweet Home" (1914) director D. W. Griffith', "Home, Sweet Home"],
  ['"Picking Peaches" (1924) starring Harry Langdon', "Picking Peaches"],
  ["Up the River", "Up the River"],
  ["Mabel and Fatty's Wash Day", "Mabel and Fatty's Wash Day"],
  ["Why We Fight: Divide and Conquer", "Why We Fight: Divide and Conquer"],
  ["Some Film (480p)", "Some Film"],
  ["Nosferatu 1080p", "Nosferatu"],
  ["The General - Restored", "The General"],
];
for (const [input, want] of tc) {
  const got = cleanTitle(input);
  check(`clean: ${input.slice(0, 40)}`, got === want, got === want ? "" : `got "${got}"`);
}
check("empty title safe", cleanTitle("") === "" && cleanTitle(null) === "");

// --- runtime parsing ---
for (const [input, want] of [
  ["1:23:45", 5025], ["83:00", 4980], ["12:30", 750], [4980, 4980], ["4980", 4980],
  ["83 min", 4980], ["83 minutes", 4980], ["1.5 hours", 5400], ["45 sec", 45],
  [null, null], ["", null], ["nonsense", null], [0, null], ["-5", null],
]) check(`runtime ${JSON.stringify(input)}`, parseRuntime(input) === want, `got ${parseRuntime(input)}`);

// --- genre splitting ---
check("splits semicolon blob",
  JSON.stringify(splitGenres("retro programming;vlogging;BASIC")) === '["retro programming","vlogging","BASIC"]');
check("splits commas", splitGenres("Monsanto, Glyphosate").length === 2);
check("handles arrays", splitGenres(["Horror", "Silent"]).length === 2);
check("array of blobs flattened", splitGenres(["Horror;Silent", "Comedy"]).length === 3);
check("dedupes case-insensitively", splitGenres("Horror;horror;HORROR").length === 1);
check("drops 1-char noise", splitGenres("a;Horror").length === 1);
check("caps the count", splitGenres("a1;b2;c3;d4;e5;f6;g7;h8").length === 6);
check("null safe", splitGenres(null).length === 0);

// --- borrowed descriptions ---
check("detects IMDb-sourced text", descriptionIsBorrowed("Taken from IMDB: Engineers manage to..."));
check("detects Wikipedia-sourced text", descriptionIsBorrowed("This article is from Wikipedia."));
check("detects a bare imdb.com reference", descriptionIsBorrowed("see imdb.com/title/tt1"));
check("leaves original text alone", !descriptionIsBorrowed("A hitchhiking pianist heads west."));
check("borrowed text is blanked", safeDescription("Taken from IMDB: something") === "");
check("original text survives", safeDescription("  A real synopsis.  ") === "A real synopsis.");
check("null safe", safeDescription(null) === "");

const failed = r.filter(x => !x).length;
console.log(`\n${r.length - failed}/${r.length} passed`);
process.exit(failed ? 1 : 0);
