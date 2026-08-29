/** Internet Archive importer.
 *
 *  Discovers candidates across several strategies, pulls full metadata, routes each
 *  through the licence gate, and writes the result to data/movies.json.
 *
 *    publish -> isPublic true, live immediately
 *    review  -> isPublic false, queued for `npm run review`
 *    reject  -> dropped, counted in the summary
 *
 *  Usage:
 *    node scripts/import.mjs --dry                  report only, write nothing
 *    node scripts/import.mjs --rows 200 --pages 10  real run
 *    node scripts/import.mjs --strategy cc          only the auto-publishable strategy
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { evaluateLicence, attributionFor } from "../src/lib/licence.ts";
import { assessQuality, meetsPublishBar, uniqueSlug, cleanTitle, parseRuntime, splitGenres, safeDescription } from "../src/lib/quality.ts";
import { checkContentPolicy } from "../src/lib/content-policy.ts";
import { looksLikeFilm } from "../src/lib/is-film.ts";

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(`--${n}`); return i === -1 ? d : args[i + 1]; };
const ROWS = Number(flag("rows", 100));
const PAGES = Number(flag("pages", 3));
const ONLY = flag("strategy", null);
const DRY = args.includes("--dry");

const SEARCH = "https://archive.org/advancedsearch.php";
const META = "https://archive.org/metadata";
const UA = "Filmantica/0.1 (catalogue importer; contact: hello@filmantica.com)";

/** Two distinct hunting grounds.
 *
 *  "cc"      — openly licensed film anywhere on IA. Small, but auto-publishable.
 *  "curated" — IA's public-domain film collections. Large and full of the classics
 *              this site exists to show, but almost none carry licence metadata,
 *              so these land in the review queue rather than going live.
 */
const STRATEGIES = {
  cc: {
    label: "Openly licensed film (auto-publish candidates)",
    // Scoped to film collections. Without this, mediatype:(movies) returns every
    // moving image on the Archive — vlogs, screen recordings, phone clips — which
    // is exactly how home videos got published as public-domain cinema.
    q: 'mediatype:(movies) AND licenseurl:(*creativecommons*) AND -licenseurl:(*by-nc*)'
       + ' AND collection:(feature_films OR silent_films OR film_noir OR sci_fi_horror'
       + ' OR classic_cartoons OR more_animation OR prelinger OR short_films)',
  },
  curated: {
    label: "Curated public-domain collections (review candidates)",
    q: 'mediatype:(movies) AND collection:(feature_films OR silent_films OR film_noir'
       + ' OR sci_fi_horror OR classic_cartoons OR prelinger)',
  },
};

const slugify = (s) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
const first = (v) => (Array.isArray(v) ? v[0] : v) ?? null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Formats a browser can actually play. IA also stores MPEG-2 and lossless masters. */
const PLAYABLE = [/^h\.264$/i, /^h\.264 ia$/i, /^mpeg4$/i, /^512kb mpeg4$/i];

export function pickVideo(files, identifier) {
  const ok = files.filter(
    (f) => PLAYABLE.some((p) => p.test(f.format ?? "")) && /\.(mp4|m4v)$/i.test(f.name ?? ""),
  );
  if (!ok.length) return null;
  ok.sort((a, b) => Number(b.size ?? 0) - Number(a.size ?? 0));
  return `https://archive.org/download/${identifier}/${encodeURIComponent(ok[0].name)}`;
}

async function fetchJson(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (res.status === 429) { await sleep(5000 * (i + 1)); continue; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i === tries - 1) throw err;
      await sleep(1000 * (i + 1));
    }
  }
  throw new Error("retries exhausted");
}

async function discover(query, page) {
  const params = new URLSearchParams({ q: query, rows: String(ROWS), page: String(page), output: "json" });
  for (const f of ["identifier", "title", "year", "collection", "licenseurl", "downloads"]) {
    params.append("fl[]", f);
  }
  const data = await fetchJson(`${SEARCH}?${params}`);
  return { docs: data?.response?.docs ?? [], numFound: data?.response?.numFound ?? 0 };
}

const tally = { found: 0, published: 0, queued: 0, rejected: 0, duplicates: 0, noVideo: 0, skippedKnownBad: 0, errors: [] };
const reasons = {};
const note = (k) => { reasons[k] = (reasons[k] ?? 0) + 1; };

const existing = await readFile("data/movies.json", "utf8").then(JSON.parse).catch(() => []);
/** Identifiers already judged unusable. Cached so repeat runs and later strategies
 *  don't re-fetch metadata for items that can never qualify. */
const rejectedCache = new Set(
  await readFile("data/rejected.json", "utf8").then(JSON.parse).catch(() => []),
);
const keep = existing.filter((m) => m.source !== "seed-demo"); // placeholders are replaced
const seen = new Set(keep.map((m) => `${m.source}:${m.sourceId}`));
const out = [...keep];
const slugs = new Set(out.map((m) => m.slug));

for (const [name, strat] of Object.entries(STRATEGIES)) {
  if (ONLY && ONLY !== name) continue;
  console.log(`\n=== ${name}: ${strat.label} ===`);

  for (let page = 1; page <= PAGES; page++) {
    let batch;
    try {
      batch = await discover(strat.q, page);
    } catch (err) {
      tally.errors.push(`discover ${name} p${page}: ${err.message}`);
      break;
    }
    if (page === 1) console.log(`matched ${batch.numFound} items in total`);
    if (!batch.docs.length) break;
    console.log(`page ${page}: ${batch.docs.length} candidates`);

    for (const doc of batch.docs) {
      tally.found++;
      const key = `internetarchive:${doc.identifier}`;
      if (seen.has(key)) { tally.duplicates++; continue; }
      if (rejectedCache.has(doc.identifier)) { tally.skippedKnownBad++; continue; }

      let meta;
      try {
        meta = await fetchJson(`${META}/${doc.identifier}`);
        await sleep(120); // stay a polite guest on a free API
      } catch (err) {
        tally.errors.push(`${doc.identifier}: ${err.message}`);
        continue;
      }

      const md = meta?.metadata ?? {};
      const v = evaluateLicence({
        licenseurl: md.licenseurl,
        rights: md.rights,
        possibleCopyrightStatus: md["possible-copyright-status"],
        collection: md.collection ?? doc.collection,
        year: Number(first(md.year)) || null,
      });

      if (v.action === "reject") {
        tally.rejected++; note(`reject: ${v.normalised}`); rejectedCache.add(doc.identifier); continue;
      }

      // A licence cannot tell a film from a camera roll. These can.
      const candidate = {
        title: cleanTitle(first(md.title)),
        description: safeDescription((first(md.description) ?? "").replace(/<[^>]+>/g, "")),
        year: Number(first(md.year)) || Number(doc.year) || null,
      };

      // WHITELIST FIRST: is this cinema at all? Every other filter here is a
      // blacklist, which only ever catches junk already seen. This admits nothing
      // without positive evidence — curated collection membership above all.
      const filmCheck = looksLikeFilm({
        sourceId: doc.identifier,
        collections: [md.collection ?? doc.collection].flat().filter(Boolean).map(String),
        genres: splitGenres(md.subject),
        runtime: parseRuntime(first(md.runtime) ?? first(md.length)),
      });
      if (!filmCheck.isFilm) {
        tally.rejected++; note(`not a film: ${filmCheck.reason}`);
        rejectedCache.add(doc.identifier); continue;
      }

      // Content policy: a valid licence is no reason to host propaganda.
      const policy = checkContentPolicy({
        title: candidate.title,
        creator: first(md.creator),
        description: candidate.description,
        genres: splitGenres(md.subject),
      });
      if (!policy.allowed) {
        tally.rejected++; note(policy.reason); rejectedCache.add(doc.identifier); continue;
      }

      // Tier 1: not a film at all -> dropped, never queued.
      const quality = assessQuality(candidate);
      if (!quality.ok) {
        tally.rejected++;
        note(`reject: ${quality.reasons[0]}`);
        rejectedCache.add(doc.identifier);
        continue;
      }

      // Tier 2: the published bar. Falling short downgrades to review — a sparse
      // record can still be a good page once a person confirms it.
      const bar = meetsPublishBar(candidate);
      if (v.action === "publish" && !bar.ok) {
        v.action = "review";
        // Overwrite the reason too: the licence verdict's text says the licence
        // passed, which is misleading once the record is queued for metadata.
        v.reason = `licence is fine, but below the published bar: ${bar.reasons.join("; ")}`;
        v.normalised = `${v.normalised} (below publish bar)`;
      }

      const videoUrl = pickVideo(meta?.files ?? [], doc.identifier);
      if (!videoUrl) {
        tally.noVideo++; note("reject: no browser-playable file"); rejectedCache.add(doc.identifier); continue;
      }

      const title = cleanTitle(first(md.title)) || doc.identifier;
      const creator = first(md.creator);
      const sourceUrl = `https://archive.org/details/${doc.identifier}`;
      const now = new Date().toISOString();
      const publish = v.action === "publish";

      const slug = uniqueSlug(slugify(title), slugs, doc.identifier.slice(0, 12).toLowerCase());

      out.push({
        id: slug,
        title, slug,
        description: safeDescription((first(md.description) ?? "").replace(/<[^>]+>/g, "")).slice(0, 1200),
        year: Number(first(md.year)) || Number(doc.year) || null,
        duration: parseRuntime(first(md.runtime) ?? first(md.length))
                  ?? parseRuntime((meta?.files ?? []).find((f) => f.name === videoUrl.split("/").pop())?.length),
        language: first(md.language),
        director: first(md.director) ?? null,
        cast: [md.cast].flat().filter(Boolean),
        genres: splitGenres(md.subject),
        posterUrl: `https://archive.org/services/img/${doc.identifier}`,
        backdropUrl: null,
        source: "internetarchive",
        sourceId: doc.identifier,
        sourceUrl,
        collections: [md.collection ?? doc.collection].flat().filter(Boolean).map(String),
        videoUrl,
        downloadUrl: videoUrl,
        license: v.normalised,
        licenseUrl: first(md.licenseurl),
        licenseVerified: publish,
        creator,
        attributionText: v.requiresAttribution
          ? attributionFor({ title, creator, license: v.normalised, sourceUrl })
          : null,
        reviewStatus: publish ? "approved" : "pending",
        isPublic: publish,
        isFeatured: false,
        createdAt: now,
        updatedAt: now,
      });

      seen.add(key);
      if (publish) { tally.published++; } else { tally.queued++; note(`review: ${v.reason}`); }
    }
  }
}

console.log("\n──────── import summary ────────");
console.log(`inspected        ${tally.found}`);
console.log(`published live   ${tally.published}`);
console.log(`queued to review ${tally.queued}`);
console.log(`rejected         ${tally.rejected + tally.noVideo}`);
console.log(`already known    ${tally.duplicates}`);
console.log(`skipped (cached)  ${tally.skippedKnownBad}`);
const top = Object.entries(reasons).sort((a, b) => b[1] - a[1]).slice(0, 12);
if (top.length) {
  console.log("\nbreakdown:");
  for (const [why, n] of top) console.log(`  ${String(n).padStart(5)}  ${why}`);
}
if (tally.errors.length) {
  const offline = tally.errors.some((e) => /fetch failed|ENOTFOUND|ECONNREFUSED|access denied|certificate/i.test(e));
  if (offline && tally.found === 0) {
    console.log("\n  Could not reach archive.org — nothing was inspected.");
    console.log("  Check: are you online, and can this machine reach archive.org?");
    console.log("      curl -sI https://archive.org/advancedsearch.php | head -1");
    console.log("  A VPN, corporate proxy or content filter will also cause this.");
  } else {
    console.log(`\nerrors ${tally.errors.length}; first: ${tally.errors[0]}`);
  }
}

if (DRY) {
  console.log("\n--dry: nothing written");
} else {
  await mkdir("data", { recursive: true });
  await writeFile("data/movies.json", JSON.stringify(out, null, 2));
  await writeFile("data/rejected.json", JSON.stringify([...rejectedCache], null, 2));
  console.log(`\nwrote data/movies.json — ${out.length} records ` +
    `(${out.filter((m) => m.isPublic).length} live, ${out.filter((m) => m.reviewStatus === "pending").length} pending)`);
}
