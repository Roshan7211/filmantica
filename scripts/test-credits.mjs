import { isDirector, isWriter, directorsOf, writersOf } from "../src/lib/credits.ts";
const r=[]; const c=(n,x,d="")=>{r.push(!!x);console.log(`${x?"PASS":"FAIL"}  ${n}${d?"  "+d:""}`)};

c("plain Director", isDirector("Director"));
c("Director in a list", isDirector("Director, Producer"));
c("Director of Photography is NOT a director", !isDirector("Director of Photography"),
  "the bug this module exists to fix");
c("Casting Director is not a director", !isDirector("Casting Director"));
c("Art Director is not a director", !isDirector("Art Director"));
c("Assistant Director is not a director", !isDirector("Assistant Director"));
c("Co-Director counts", isDirector("Co-Director"));
c("case insensitive", isDirector("director, writer"));

c("plain Writer", isWriter("Writer"));
c("Screenplay counts", isWriter("Screenplay"));
c("Writer in a list", isWriter("Director, Writer"));
c("Producer is not a writer", !isWriter("Producer"));
c("Executive Producer is not a writer", !isWriter("Executive Producer"));

const crew = [
  { name: "Gore Verbinski", role: "Director, Producer" },
  { name: "James Whitaker", role: "Director of Photography" },
  { name: "Erwin Stoff", role: "Producer" },
  { name: "Denise Chamian", role: "Casting, Producer" },
  { name: "A. Writer", role: "Screenplay" },
  { name: "Gore Verbinski", role: "Writer" },
];
const dirs = directorsOf(crew);
c("only the real director", dirs.length === 1 && dirs[0].name === "Gore Verbinski",
  dirs.map(d => d.name).join(", ") || "none");
const wri = writersOf(crew);
c("writers found, deduped", wri.length === 2, wri.map(w => w.name).join(", "));
c("empty crew safe", directorsOf([]).length === 0 && writersOf().length === 0);

const f=r.filter(x=>!x).length;
console.log(`\n${r.length-f}/${r.length} passed`);
process.exit(f?1:0);
