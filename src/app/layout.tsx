import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} — ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  openGraph: { siteName: SITE.name, type: "website", url: SITE.url },
  // Default canonical. Pages with query parameters or their own URL override it;
  // without this, every page lacking an explicit one had no canonical at all.
  alternates: { canonical: "/" },
};

const NAV = [
  ["Free to watch", "/free"],
  ["Just changed", "/new"],
  ["Worth it?", "/subscriptions"],
  ["TV series", "/tv"],
  ["Lists", "/lists"],
  ["Movies", "/discover"],
  ["Genres", "/genres"],
  ["Industry", "/language"],
  ["Guides", "/guides"],
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="relative">
        <header className="sticky top-0 z-50 border-b border-edge bg-ink/85 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
            <Link href="/" className="display text-xl tracking-tight">
              Film<span className="text-brass">antica</span>
            </Link>
            {/* Desktop: inline. Mobile: a scrollable strip below, because hiding
                navigation entirely on phones left most of the site unreachable. */}
            <nav className="hidden gap-5 text-sm text-muted sm:flex">
              {NAV.map(([label, href]) => (
                <Link key={href} href={href} className="transition hover:text-cream">{label}</Link>
              ))}
            </nav>
            <form action="/search" className="ml-auto">
              <input
                name="q"
                placeholder="Search films…"
                aria-label="Search films"
                className="w-36 rounded border border-edge bg-ink-2 px-3 py-1.5 text-sm outline-none
                           transition focus:w-56 focus:border-brass/60 sm:w-48"
              />
            </form>
          </div>

          <nav
            aria-label="Sections"
            className="flex gap-1 overflow-x-auto border-t border-edge px-4 pb-2 pt-1.5
                       [scrollbar-width:none] sm:hidden [&::-webkit-scrollbar]:hidden"
          >
            {NAV.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="shrink-0 rounded-full border border-edge px-3 py-1.5 text-[13px] text-muted
                           transition active:border-brass/60 active:text-cream"
              >
                {label}
              </Link>
            ))}
          </nav>
        </header>

        <main className="relative z-10 mx-auto max-w-6xl px-4 py-8">{children}</main>

        <footer className="relative z-10 mt-16 border-t border-edge">
          <div className="mx-auto max-w-6xl px-4 py-8 text-xs leading-relaxed text-muted">
            <p className="max-w-2xl">
              {SITE.name} lists where films can legally be streamed, rented or bought, and hosts
              a small free catalogue of public-domain cinema. We do not stream films we have no
              right to share — every free title carries its licence and source.
            </p>
            <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              <Link href="/about" className="transition hover:text-cream">About</Link>
              <Link href="/guides" className="transition hover:text-cream">Guides</Link>
              <Link href="/privacy" className="transition hover:text-cream">Privacy</Link>
              <Link href="/contact" className="transition hover:text-cream">Contact</Link>
            </p>
            <p className="mt-3">© {new Date().getFullYear()} {SITE.name}</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
