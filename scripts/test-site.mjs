/** The site URL is consumed by new URL() at module evaluation, so a bad value
 *  fails the build rather than the page. These cover every way it can be bad. */
const cases = [
  ["unset",                        {},                                                  "https://filmantica.com"],
  ["empty string",                 { NEXT_PUBLIC_SITE_URL: "" },                        "https://filmantica.com"],
  ["whitespace only",              { NEXT_PUBLIC_SITE_URL: "   " },                     "https://filmantica.com"],
  ["valid https",                  { NEXT_PUBLIC_SITE_URL: "https://example.com" },     "https://example.com"],
  ["trailing slash normalised",    { NEXT_PUBLIC_SITE_URL: "https://example.com/" },    "https://example.com"],
  ["host without scheme",          { NEXT_PUBLIC_SITE_URL: "example.com" },             "https://example.com"],
  ["malformed falls through",      { NEXT_PUBLIC_SITE_URL: "ht!tp://%%%" },             "https://filmantica.com"],
  ["bare word rejected",           { NEXT_PUBLIC_SITE_URL: "notahost" },                "https://filmantica.com"],
  ["spaces rejected",              { NEXT_PUBLIC_SITE_URL: "my site.com" },             "https://filmantica.com"],
  ["localhost allowed",            { NEXT_PUBLIC_SITE_URL: "http://localhost:3000" },   "http://localhost:3000"],
  ["subdomain allowed",            { NEXT_PUBLIC_SITE_URL: "www.a.co.uk" },             "https://www.a.co.uk"],
  ["vercel production host",       { VERCEL_PROJECT_PRODUCTION_URL: "film.vercel.app" },"https://film.vercel.app"],
  ["vercel preview host",          { VERCEL_URL: "film-abc123.vercel.app" },            "https://film-abc123.vercel.app"],
  ["explicit beats vercel",        { NEXT_PUBLIC_SITE_URL: "https://a.com", VERCEL_URL: "b.vercel.app" }, "https://a.com"],
  ["empty explicit falls to vercel", { NEXT_PUBLIC_SITE_URL: "", VERCEL_URL: "b.vercel.app" }, "https://b.vercel.app"],
];

let pass = 0;
for (const [label, env, want] of cases) {
  for (const k of ["NEXT_PUBLIC_SITE_URL", "VERCEL_PROJECT_PRODUCTION_URL", "VERCEL_URL"]) delete process.env[k];
  Object.assign(process.env, env);
  const mod = await import(`../src/lib/site.ts?bust=${Math.random()}`);
  const got = mod.SITE.url;
  const ok = got === want;
  if (ok) pass++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label.padEnd(32)} ${got}${ok ? "" : `   (wanted ${want})`}`);
  // The real failure mode: this must never throw.
  try { new URL(got); } catch { console.log(`FAIL  ${label} -> new URL() threw`); }
}
console.log(`\n${pass}/${cases.length} passed`);
process.exit(pass === cases.length ? 0 : 1);
