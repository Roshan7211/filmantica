import { stats } from "@/lib/movies";
import { SITE } from "@/lib/site";

export const metadata = { title: "About" };

export default async function AboutPage() {
  const s = await stats();
  return (
    <div className="max-w-2xl">
      <h1 className="display mb-6 text-3xl">About {SITE.name}</h1>
      <div className="space-y-4 leading-relaxed text-cream/85">
        <p>
          {SITE.name} streams classic cinema that is free to share — films in the public domain,
          and films released under licences that permit commercial reuse.
        </p>
        <p>
          Every title is checked before it is published. The importer reads licence metadata from
          the source, and a title is published only if its licence appears on an explicit
          whitelist. NonCommercial licences are rejected, because this site carries advertising.
          A licence field that merely asserts &ldquo;public domain&rdquo; is held for manual
          review rather than trusted.
        </p>
        <p className="rounded border border-edge bg-ink-2 p-4 text-sm text-muted">
          Catalogue: <strong className="text-cream">{s.total}</strong> records ·{" "}
          <strong className="text-cream">{s.published}</strong> published ·{" "}
          <strong className="text-cream">{s.verified}</strong> licence-verified
        </p>
        <p className="text-sm text-muted">
          If you hold rights in something published here and believe it should not be, contact us
          and it will be removed while the claim is reviewed.
        </p>
      </div>
    </div>
  );
}
