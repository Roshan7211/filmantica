import { suggestDiscovery } from "@/lib/discovery";

/** Type-ahead suggestions.
 *
 *  Server-side rather than shipping a search index to the browser: the catalogue
 *  is already over a thousand titles and grows every week, and a client index
 *  would have to be re-downloaded whenever it changed. A query returns at most
 *  eight trimmed rows, so the response stays small however large the catalogue
 *  gets.
 */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const results = await suggestDiscovery(q);

  return Response.json(
    { results },
    {
      headers: {
        // The same prefix returns the same rows until the catalogue changes, so
        // the edge can serve repeats without waking a function. Kept short
        // because availability shifts, and revalidated in the background so a
        // stale hit is never a slow one.
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    },
  );
}
