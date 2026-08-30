import { NextRequest } from "next/server";
import { getMovie } from "@/lib/movies";

/** Video proxy.
 *
 *  Free titles live on archive.org. Some ISPs — including those serving this
 *  project's primary audience — block archive.org at the TLS layer, so a browser
 *  on those networks cannot load the file even though the URL is perfectly valid.
 *  The player just spins.
 *
 *  Our server is not on that network, so it fetches the file and streams it to the
 *  viewer. Range requests are forwarded intact, which is what makes seeking and
 *  progressive playback work — without it the browser downloads the whole file
 *  before showing a frame, and the scrubber does nothing.
 */

export const dynamic = "force-dynamic";

const HOP_BY_HOP = new Set([
  "connection", "keep-alive", "transfer-encoding", "upgrade", "proxy-authenticate",
]);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const movie = await getMovie(slug);

  // Only ever proxy titles we have published — never an arbitrary URL.
  if (!movie?.videoUrl) {
    return new Response("Not found", { status: 404 });
  }

  // Defence in depth: the stored URL must point at the expected host.
  let target: URL;
  try {
    target = new URL(movie.videoUrl);
  } catch {
    return new Response("Bad source", { status: 502 });
  }
  if (target.protocol !== "https:" || !/(^|\.)archive\.org$/.test(target.hostname)) {
    return new Response("Unsupported source", { status: 502 });
  }

  // Copyright terms differ by country. Titles cleared under a territory's shorter
  // term (India: 60 years for film, vs 95 in the US) are public domain THERE and
  // may still be protected elsewhere. Distribution is the act that matters, so the
  // check belongs here rather than on the page.
  const cleared = movie.publicDomainTerritory;
  if (cleared) {
    const viewer = req.headers.get("x-vercel-ip-country");
    // Absent header = local dev or an unknown edge; allow rather than break dev.
    if (viewer && viewer !== cleared) {
      return new Response(
        `This film is in the public domain in ${cleared} and may still be under ` +
        `copyright in ${viewer}, so it is not available in your country.`,
        { status: 451, headers: { "Content-Type": "text/plain; charset=utf-8" } },
      );
    }
  }

  const range = req.headers.get("range");

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      headers: {
        ...(range ? { Range: range } : {}),
        "User-Agent": "Filmantica/0.1 (+https://filmantica.com)",
      },
      // Let the platform stream rather than buffer the whole file.
      cache: "no-store",
    });
  } catch {
    return new Response("Upstream unreachable", { status: 502 });
  }

  if (!upstream.ok && upstream.status !== 206) {
    return new Response(`Upstream error ${upstream.status}`, { status: 502 });
  }

  const headers = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) headers.set(key, value);
  });
  headers.set("Accept-Ranges", "bytes");
  headers.set("Content-Type", upstream.headers.get("content-type") ?? "video/mp4");
  // Public-domain files never change; let the CDN and browser hold onto them.
  headers.set("Cache-Control", "public, max-age=86400, s-maxage=604800");

  return new Response(upstream.body, { status: upstream.status, headers });
}
