import { allDiscovery, freeToWatch } from "@/lib/discovery";
import { SITE } from "@/lib/site";

export const metadata = { title: "About", alternates: { canonical: "/about" } };

export default async function AboutPage() {
  const [all, free] = await Promise.all([allDiscovery(), freeToWatch()]);
  const services = [...new Set(free.flatMap((t) => t.options.free.map((o) => o.name)))];

  return (
    <div className="max-w-2xl">
      <h1 className="display mb-6 text-3xl">About {SITE.name}</h1>
      <div className="space-y-4 leading-relaxed text-cream/85">
        <p>
          {SITE.name} answers one question: <strong>what can I watch right now, free and
          legally?</strong>
        </p>
        <p>
          We track {all.length} films and where each can be streamed, rented or bought.{" "}
          {free.length} of them are free to watch right now
          {services.length ? ` on ${services.slice(0, 4).join(", ")}` : ""}.
        </p>
        <p className="rounded border border-edge bg-ink-2 p-4 text-sm text-muted">
          We do not host or stream films. Every link goes to a licensed service that has the
          right to show it. Availability changes often — we refresh it regularly, but check the
          provider before relying on it.
        </p>
      </div>
    </div>
  );
}
