import { checkContentPolicy } from "../src/lib/content-policy.ts";
const r = []; const check = (n,c,d="")=>{r.push(!!c);console.log(`${c?"PASS":"FAIL"}  ${n}${d?"  "+d:""}`)};

check("blocks WLM recruitment material",
  !checkContentPolicy({ title: "Activism Compilation 18", creator: "White Lives Matter Pennsylvania" }).allowed);
check("blocks Patriot Front", !checkContentPolicy({ creator: "Patriot Front" }).allowed);
check("blocks Atomwaffen", !checkContentPolicy({ title: "Atomwaffen Division footage" }).allowed);
check("reason names the organisation",
  /white lives matter/i.test(checkContentPolicy({ creator: "White Lives Matter Ohio" }).reason ?? ""));

// Journalism and history about these movements must still reach review.
check("allows a documentary about the movement",
  checkContentPolicy({ title: "Documentary: The Rise of Patriot Front", description: "A BBC investigation" }).allowed);
check("allows historical newsreel",
  checkContentPolicy({ title: "Ku Klux Klan", description: "1965 newsreel archive footage" }).allowed);

// No false positives on ordinary cinema.
for (const t of ["The Monster Walks", "Up the River", "Why We Fight: Divide and Conquer",
                 "In the Park", "Transatlantic Tunnel", "Mabel and Fatty's Wash Day"]) {
  check(`allows "${t}"`, checkContentPolicy({ title: t }).allowed);
}
check("empty input allowed", checkContentPolicy({}).allowed);

const failed = r.filter(x=>!x).length;
console.log(`\n${r.length-failed}/${r.length} passed`);
process.exit(failed?1:0);
