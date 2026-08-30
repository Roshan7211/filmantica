import { NextRequest } from "next/server";
import { getMovie } from "@/lib/movies";

/** Poster proxy.
 *
 *  The same problem as /api/stream: free-title artwork lives on archive.org, which
 *  some ISPs block at the TLS layer. The video now streams through our server, but
 *  the posters were still linked directly, so those viewers saw the fallback tile
 *  on every free film while discovery artwork (TMDB) loaded normally.
 *
 *  Images are small and immutable, so they are cached hard at the edge.
 */

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const movie = await getMovie(slug);
  if (!movie?.posterUrl) return new Response("Not found", { status: 404 });

  const cleared = movie.publicDomainTerritory;
  if (cleared) {
    const viewer = _req.headers.get("x-vercel-ip-country");
    if (viewer && viewer !== cleared) return new Response("Not available", { status: 451 });
  }

  let target: URL;
  try {
    target = new URL(movie.posterUrl);
  } catch {
    return new Response("Bad source", { status: 502 });
  }
  if (target.protocol !== "https:" || !/(^|\.)archive\.org$/.test(target.hostname)) {
    return new Response("Unsupported source", { status: 502 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      headers: { "User-Agent": "Filmantica/0.1 (+https://filmantica.com)" },
      redirect: "follow",
    });
  } catch {
    return new Response("Upstream unreachable", { status: 502 });
  }
  if (!upstream.ok) return new Response(`Upstream error ${upstream.status}`, { status: 502 });

  const type = upstream.headers.get("content-type") ?? "image/jpeg";
  if (!type.startsWith("image/")) return new Response("Not an image", { status: 502 });

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=604800, s-maxage=2592000, immutable",
    },
  });
}
