import type { Metadata } from "next";
import { freeToWatch } from "@/lib/discovery";
import DiscoveryCard from "@/components/DiscoveryCard";
import DiscoveryEmpty from "@/components/DiscoveryEmpty";

export const metadata: Metadata = {
  title: "Free movies to watch online in India — legally, no subscription",
  description:
    "Every film you can watch free and legally right now in India, newest first. No sign-up, no subscription.",
};

export default async function FreePage() {
  const films = await freeToWatch();
  if (!films.length) {
    return (
      <>
        <h1 className="display mb-6 text-3xl">Free to watch</h1>
        <DiscoveryEmpty />
      </>
    );
  }

  const services = [...new Set(films.flatMap((t) => t.options.free.map((o) => o.name)))];
  const recent = films.filter((t) => t.year && t.year >= 2024).length;

  return (
    <>
      <h1 className="display mb-1 text-3xl">Free to watch</h1>
      <p className="mb-10 max-w-2xl text-sm text-muted">
        {films.length} films streaming free and legally right now
        {services.length ? ` on ${services.slice(0, 4).join(", ")}` : ""} — no subscription, no
        sign-up. {recent > 0 && `${recent} released in the last two years.`} Newest first.
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {films.map((t) => <DiscoveryCard key={t.id} title={t} />)}
      </div>
    </>
  );
}
