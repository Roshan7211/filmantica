import { triage, publicDomainBefore } from "../src/lib/triage.ts";
const r = []; const check = (n, c, d="") => { r.push(!!c); console.log(`${c?"PASS":"FAIL"}  ${n}${d?"  "+d:""}`); };

const cutoff = publicDomainBefore();
check("cutoff is 95 years back", cutoff === new Date().getFullYear() - 95, `= ${cutoff}`);

check("1915 silent -> strong", triage({ year: 1915 }).band === "strong");
check("cutoff year itself -> strong", triage({ year: cutoff }).band === "strong");
check("year after cutoff -> not strong", triage({ year: cutoff + 1 }).band !== "strong");
check("1948 -> likely (renewal era)", triage({ year: 1948 }).band === "likely", triage({year:1948}).band);
check("1970 -> check or lower", ["check","unlikely"].includes(triage({ year: 1970 }).band));
check("2021 -> unlikely", triage({ year: 2021 }).band === "unlikely");

const gov = triage({ year: 1943, creator: "U.S. War Department" });
check("US government work lifts the band", gov.band === "strong", `${gov.band} (${gov.score})`);
check("government note explains why", gov.notes.some(n => n.includes("government")));

check("collection adds only a little",
  triage({ year: 1970, collections: ["feature_films"] }).score >
  triage({ year: 1970 }).score);
check("collection alone never reaches strong",
  triage({ year: 2020, collections: ["feature_films"] }).band !== "strong");
check("PD Mark alone never reaches strong",
  triage({ year: 2020, license: "Public Domain Mark (unverified)" }).band !== "strong");
check("no year is handled", triage({}).notes.some(n => n.includes("no year")));

const failed = r.filter(x=>!x).length;
console.log(`\n${r.length - failed}/${r.length} passed`);
process.exit(failed ? 1 : 0);
