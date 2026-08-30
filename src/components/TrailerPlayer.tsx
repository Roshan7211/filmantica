"use client";
import { useState } from "react";
import { youtubeEmbedUrl, youtubeThumb } from "@/lib/youtube";

/** Trailer player.
 *
 *  A facade rather than an iframe on load. Showing the thumbnail and swapping in
 *  the player on click means no request reaches YouTube — and no cookie is set —
 *  unless someone actually chooses to watch. That keeps the page fast and keeps
 *  our privacy disclosure honest.
 *
 *  The embed uses youtube-nocookie.com, and we do not attempt to extract the
 *  video stream into a custom player: that would breach YouTube's terms and
 *  break whenever they change anything.
 */
export default function TrailerPlayer({
  videoId,
  title,
  poster,
}: {
  videoId: string;
  title: string;
  poster?: string | null;
}) {
  const [playing, setPlaying] = useState(false);
  const thumb = poster || youtubeThumb(videoId);

  if (playing) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-md border border-edge bg-black">
        <iframe
          src={youtubeEmbedUrl(videoId)}
          title={`${title} — trailer`}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play trailer for ${title}`}
      className="group relative aspect-video w-full overflow-hidden rounded-md border border-edge bg-black
                 focus-visible:outline-2 focus-visible:outline-brass"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- remote thumbnail, deliberately unoptimised */}
      <img
        src={thumb}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover opacity-80 transition group-hover:opacity-100"
      />
      <span className="absolute inset-0 flex items-center justify-center">
        <span
          className="flex h-16 w-16 items-center justify-center rounded-full bg-brass/95 shadow-lg
                     transition group-hover:scale-105"
        >
          <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden className="ml-1 fill-ink">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
      <span
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 to-transparent p-3
                   text-left text-xs text-cream/90"
      >
        Watch trailer · plays here, loaded from YouTube only when you press play
      </span>
    </button>
  );
}
