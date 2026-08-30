import Link from "next/link";
import type { Metadata } from "next";
import { allDiscovery, discoveryPopulated } from "@/lib/discovery";
import DiscoveryCard from "@/components/DiscoveryCard";
import DiscoveryEmpty from "@/components/DiscoveryEmpty";

export const metadata: Metadata = {
  title: "What's on — where to watch",
  description:
    "Current films and every legal way to stream, rent or buy them. Plus a free catalogue of classic cinema.",
};

export default async function DiscoverPage() {
  if (!(await discoveryPopulated())) {
    return (
      <>
        <h1 className="display mb-6 text-3xl">What&rsquo;s on</h1>
        <DiscoveryEmpty />
      </>
    );
  }

  const titles = await allDiscovery();

  return (
    <>
      <h1 className="display mb-1 text-3xl">What&rsquo;s on</h1>
      <p className="mb-8 max-w-2xl text-sm text-muted">
        Where these films can legally be watched. Links go to licensed services — see{" "}
        <Link href="/free" className="text-brass underline underline-offset-2">what&rsquo;s free right now</Link>.
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {titles.map((t) => <DiscoveryCard key={t.id} title={t} />)}
      </div>
    </>
  );
}
