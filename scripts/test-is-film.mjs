import { looksLikeFilm } from "../src/lib/is-film.ts";
const r=[]; const check=(n,c,d="")=>{r.push(!!c);console.log(`${c?"PASS":"FAIL"}  ${n}${d?"  "+d:""}`)};

check("curated collection admits", looksLikeFilm({ collections: ["feature_films"] }).isFilm);
check("silent_films admits", looksLikeFilm({ collections: ["silent_films"] }).isFilm);
check("collection check is case-insensitive", looksLikeFilm({ collections: ["Feature_Films"] }).isFilm);
check("youtube rip rejected even in a collection",
  !looksLikeFilm({ sourceId: "youtube-Mainwx_6OcU", collections: ["feature_films"] }).isFilm);
check("film-ish subject admits", looksLikeFilm({ genres: ["Silent Film", "Comedy"] }).isFilm);
check("feature runtime admits", looksLikeFilm({ runtime: 78 * 60 }).isFilm);
check("short runtime alone does not", !looksLikeFilm({ runtime: 6 * 60 }).isFilm);
check("vlog tags rejected", !looksLikeFilm({ genres: ["vlogging", "BASIC", "DOS"] }).isFilm);
check("no evidence rejected", !looksLikeFilm({}).isFilm);
check("unrelated collection rejected", !looksLikeFilm({ collections: ["opensource_movies"] }).isFilm);
check("reason explains admission",
  /curated film collection/.test(looksLikeFilm({ collections: ["prelinger"] }).reason));

const failed=r.filter(x=>!x).length;
console.log(`\n${r.length-failed}/${r.length} passed`);
process.exit(failed?1:0);
