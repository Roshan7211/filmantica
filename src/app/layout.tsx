import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import JsonLd from "@/components/JsonLd";
import SearchBox from "@/components/SearchBox";
import { graph, organization, website } from "@/lib/schema";
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
        {/* Site identity, stated once for the whole site. Page-level schema
            references these by @id rather than repeating them. */}
        <JsonLd data={graph(organization(), website())} />
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
            <SearchBox />
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
              {SITE.name} lists where films and series can legally be watched, and which are free
              right now. We do not host or stream any film — every link goes to a service that
              holds the rights to show it.
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
