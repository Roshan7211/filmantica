/** Offline test for the TMDB layer.
 *
 *  Stubs the API so normalisation, provider mapping, slug round-tripping and the
 *  v3-key/v4-token auth switch can be verified without a key or network.
 */
process.env.TMDB_API_KEY = "test-v3-key";

let lastRequest = null;
globalThis.fetch = async (url, init) => {
  lastRequest = { url: String(url), init };
  const u = String(url);

  if (u.includes("/trending/movie/week")) {
    return { ok: true, json: async () => ({ results: [
      { id: 101, title: "Example Feature", overview: "A placeholder synopsis.",
        release_date: "2026-03-14", poster_path: "/p.jpg", vote_average: 7.844 },
      { id: 102, title: "Another Picture", release_date: "", poster_path: null, vote_average: 0 },
    ]})};
  }
  if (u.includes("/movie/101/watch/providers")) {
    return { ok: true, json: async () => ({ results: { US: {
      link: "https://www.themoviedb.org/movie/101/watch",
      flatrate: [{ provider_id: 8, provider_name: "Netflix", logo_path: "/n.jpg" }],
      rent: [{ provider_id: 2, provider_name: "Apple TV", logo_path: "/a.jpg" }],
    }, GB: { link: "https://example.invalid/gb" } }})};
  }
  if (u.match(/\/movie\/101\?/)) {
    return { ok: true, json: async () => ({
      id: 101, title: "Example Feature", overview: "A placeholder synopsis.",
      release_date: "2026-03-14", poster_path: "/p.jpg", vote_average: 7.844,
      runtime: 118, genres: [{ id: 18, name: "Drama" }, { id: 53, name: "Thriller" }] })};
  }
  if (u.includes("/movie/999")) return { ok: false, status: 404, json: async () => ({}) };
  return { ok: false, status: 404, json: async () => ({}) };
};

const t = await import("../src/lib/tmdb.ts");
const results = [];
const check = (name, cond, detail = "") => {
  results.push({ name, ok: !!cond, detail });
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
};

check("configured when key present", t.tmdbConfigured());

const tr = await t.trending();
check("trending normalises", tr.length === 2);
check("year parsed from release_date", tr[0].year === 2026, `got ${tr[0].year}`);
check("rating rounded to 1dp", tr[0].rating === 7.8, `got ${tr[0].rating}`);
check("poster becomes absolute url", tr[0].posterUrl === "https://image.tmdb.org/t/p/w500/p.jpg");
check("missing poster stays null", tr[1].posterUrl === null);
check("empty release_date -> null year", tr[1].year === null, `got ${tr[1].year}`);

const d = await t.movieDetails(101);
check("details include runtime", d.runtime === 118);
check("genres flattened to names", JSON.stringify(d.genres) === '["Drama","Thriller"]', d.genres.join("|"));

const missing = await t.movieDetails(999);
check("404 returns null, not a throw", missing === null);

const wp = await t.watchProviders(101, "US");
check("stream providers mapped", wp.stream.length === 1 && wp.stream[0].name === "Netflix");
check("rent providers mapped", wp.rent.length === 1);
check("buy empty when absent", wp.buy.length === 0);
check("provider logo sized w92", wp.stream[0].logoUrl === "https://image.tmdb.org/t/p/w92/n.jpg");
check("justwatch deep link kept", wp.link?.includes("/watch"));

const wpGb = await t.watchProviders(101, "GB");
check("region with no providers is safe", wpGb.stream.length === 0 && wpGb.link === "https://example.invalid/gb");

const wpNone = await t.watchProviders(101, "ZZ");
check("unknown region returns empty shape", wpNone.stream.length === 0 && wpNone.link === null);

const slug = t.tmdbSlug({ id: 101, title: "Example Feature: The Sequel!" });
check("slug is id-prefixed and clean", slug === "101-example-feature-the-sequel", slug);
check("id round-trips from slug", t.idFromSlug(slug) === 101);
check("garbage slug -> null id", t.idFromSlug("not-a-movie") === null);

check("v3 key sent as query param", lastRequest.url.includes("api_key=test-v3-key"));

process.env.TMDB_API_KEY = "eyJhbGciOiJIUzI1NiJ9.fake";
await t.movieDetails(101);
check("v4 token sent as bearer header",
  lastRequest.init?.headers?.Authorization === "Bearer eyJhbGciOiJIUzI1NiJ9.fake" &&
  !lastRequest.url.includes("api_key="));

delete process.env.TMDB_API_KEY;
check("no key -> not configured", !t.tmdbConfigured());
check("no key -> trending returns empty, no throw", (await t.trending()).length === 0);

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
