import { paginate, pageWindow, PER_PAGE } from "../src/lib/paginate.ts";
const r=[]; const check=(n,c,d="")=>{r.push(!!c);console.log(`${c?"PASS":"FAIL"}  ${n}${d?"  "+d:""}`)};
const items = Array.from({ length: 50 }, (_, i) => i + 1);

const p1 = paginate(items, 1, 18);
check("page 1 size", p1.items.length === 18);
check("page 1 range", p1.from === 1 && p1.to === 18, `${p1.from}-${p1.to}`);
check("total pages", p1.totalPages === 3, String(p1.totalPages));
check("no prev on first", !p1.hasPrev && p1.hasNext);

const p3 = paginate(items, 3, 18);
check("last page partial", p3.items.length === 14, String(p3.items.length));
check("last page has no next", p3.hasPrev && !p3.hasNext);
check("last page range", p3.from === 37 && p3.to === 50, `${p3.from}-${p3.to}`);

check("page 0 clamps to 1", paginate(items, 0, 18).page === 1);
check("negative clamps to 1", paginate(items, -5, 18).page === 1);
check("overflow clamps to last", paginate(items, 999, 18).page === 3);
check("garbage defaults to 1", paginate(items, "abc", 18).page === 1);
check("undefined defaults to 1", paginate(items, undefined, 18).page === 1);
check("float truncates", paginate(items, 2.7, 18).page === 2);

const empty = paginate([], 1, 18);
check("empty list safe", empty.totalPages === 1 && empty.items.length === 0 && empty.from === 0);
check("exact multiple", paginate(Array(36).fill(0), 2, 18).totalPages === 2);
check("default PER_PAGE is 18", PER_PAGE === 18);

check("window small stays full", JSON.stringify(pageWindow(1, 5)) === "[1,2,3,4,5]");
const w = pageWindow(10, 20);
check("window has first and last", w[0] === 1 && w[w.length - 1] === 20, JSON.stringify(w));
check("window marks gaps", w.includes(null));
check("window includes current", w.includes(10));
check("window near start has no leading gap", pageWindow(2, 20)[1] !== null);

const failed=r.filter(x=>!x).length;
console.log(`\n${r.length-failed}/${r.length} passed`);
process.exit(failed?1:0);
