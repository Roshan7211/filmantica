/** Mapping tests against the REAL Watchmode response shapes captured from --probe.
 *  Plot text below is placeholder, not API content. */
import { mapSources, mapTitle } from "../src/lib/watchmode-map.ts";

const results = [];
const check = (name, cond, detail = "") => {
  results.push(!!cond);
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
};

// Exactly the shape the live API returned: one row per region, repeated per format.
const sources = [
  { source_id: 203, name: "Netflix", type: "sub", region: "CA", web_url: "https://www.netflix.com/title/1", format: "HD",  price: null,
    ios_url: "Deeplinks available for paid plans only." },
  { source_id: 203, name: "Netflix", type: "sub", region: "GB", web_url: "https://www.netflix.com/title/1", format: "4K",  price: null },
  { source_id: 203, name: "Netflix", type: "sub", region: "IN", web_url: "https://www.netflix.com/title/1", format: "4K",  price: null },
  { source_id: 349, name: "Apple TV", type: "rent", region: "IN", web_url: "https://tv.apple.com/x", format: "HD",  price: 3.99 },
  { source_id: 349, name: "Apple TV", type: "rent", region: "IN", web_url: "https://tv.apple.com/x", format: "4K",  price: 5.99 },
  { source_id: 349, name: "Apple TV", type: "buy",  region: "IN", web_url: "https://tv.apple.com/x", format: "HD",  price: 12.99 },
  { source_id: 999, name: "Tubi",     type: "free", region: "IN", web_url: "https://tubitv.com/x",  format: "SD",  price: null },
  { source_id: 111, name: "BadLink",  type: "sub",  region: "IN", web_url: "Deeplinks available for paid plans only.", format: "HD", price: null },
];

const us = mapSources(sources, "US");
check("region with no rows yields nothing", us.stream.length === 0 && us.rent.length === 0,
      `— the exact bug a US default would have caused`);

const inr = mapSources(sources, "IN");
check("sub -> stream bucket", inr.stream.some((o) => o.name === "Netflix"));
check("free -> free bucket", inr.free.length === 1 && inr.free[0].name === "Tubi");
check("rent and buy separated", inr.rent.some((o) => o.name === "Apple TV") && inr.buy.some((o) => o.name === "Apple TV"));
check("per-format duplicates collapsed", inr.rent.length === 1, `rent entries: ${inr.rent.length}`);
check("cheapest format kept", inr.rent[0].price === 3.99, `got ${inr.rent[0].price}`);
check("other regions excluded", !JSON.stringify(inr).includes('"CA"'));
check("placeholder deeplink rejected as url",
      inr.stream.find((o) => o.name === "BadLink")?.url === null);
check("real web_url kept", inr.free[0].url === "https://tubitv.com/x");
check("null price stays null", inr.stream[0].price === null);

const ca = mapSources(sources, "CA");
check("CA sees only its own row", ca.stream.length === 1 && ca.stream[0].format === "HD");

// details shape
const details = {
  id: 11092874, title: "Sample Title", original_title: "Original Sample",
  plot_overview: "  Placeholder synopsis for testing.  ",
  year: 2026, release_date: "2026-08-21", runtime_minutes: 91,
  genre_names: ["Crime", "Action", "Thriller"], user_rating: 6.9,
  poster: "https://image.tmdb.org/t/p/w342/a.jpg",
  posterMedium: "https://image.tmdb.org/t/p/w342/a.jpg",
  posterLarge: "https://image.tmdb.org/t/p/w780/a.jpg",
};

const t = mapTitle(details, sources, "IN");
check("id namespaced by provider", t.id === "watchmode:11092874");
check("slug is title + source id", t.slug === "sample-title-11092874", t.slug);
check("largest poster preferred", t.posterUrl.includes("w780"));
check("plot trimmed", t.plot === "Placeholder synopsis for testing.");
check("runtime parsed", t.runtime === 91);
check("genres carried", t.genres.length === 3);
check("rating carried", t.rating === 6.9);
check("release date carried", t.releaseDate === "2026-08-21");
check("options populated for region", t.options.stream.length > 0);

// degenerate inputs
check("non-array sources safe", JSON.stringify(mapSources({ sources: [] }, "IN")) === JSON.stringify({free:[],stream:[],rent:[],buy:[]}));
check("null sources safe", mapSources(null, "IN").stream.length === 0);
const bare = mapTitle({ id: 7 }, [], "IN");
check("missing fields fall back", bare.title === "Untitled" && bare.year === null && bare.plot === "");
check("unknown type ignored", mapSources([{ name: "X", type: "weird", region: "IN" }], "IN").stream.length === 0);

const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
