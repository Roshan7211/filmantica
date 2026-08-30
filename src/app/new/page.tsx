import Link from "next/link";
import type { Metadata } from "next";
import { newlyFree, recentlyLeftFree, lastCheckedAt } from "@/lib/discovery";
import DiscoveryCard from "@/components/DiscoveryCard";

export const metadata: Metadata = {
  title: "New free films and what just left",
  description:
    "Films that have just become free to watch in India, and ones that have recently stopped being free.",
};

/** Two feeds nobody else publishes, because they require tracking availability
 *  over time rather than only reporting it now. Both come free with the refresh
 *  job — it already detects the transitions.
 */
export default async function NewPage() {
  const [arrived, left, checked] = await Promise.all([
    newlyFree(), recentlyLeftFree(), lastCheckedAt(),
  ]);

  const when = checked
    ? new Date(checked).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <>
      <h1 className="display mb-1 text-3xl">What just changed</h1>
      <p className="mb-8 max-w-2xl text-sm text-muted">
        Films move on and off free services constantly as licences begin and end. This tracks both
        directions.{" "}
        {when
          ? <>Availability last checked {when}.</>
          : <>Populates as the weekly refresh runs — nothing has been re-checked yet.</>}
      </p>

      {arrived.length === 0 && left.length === 0 && (
        <div className="rounded border border-edge bg-ink-2 p-6 text-sm leading-relaxed text-muted">
          <p className="mb-2 text-cream">Nothing to report yet.</p>
          <p>
            This page fills in as the refresh job re-checks the catalogue and spots titles moving on
            or off free services. It deliberately starts empty rather than listing everything
            currently free as though it were new — that would be untrue, and{" "}
            <Link href="/free" className="text-brass underline underline-offset-2">
              everything free is already here
            </Link>.
          </p>
        </div>
      )}

      {arrived.length > 0 && (
        <section className="mb-14">
          <h2 className="display mb-1 text-xl">Just became free</h2>
          <p className="mb-4 text-xs text-muted">
            {arrived.length} title{arrived.length === 1 ? "" : "s"} that were not free at the last check
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {arrived.slice(0, 18).map((t) => <DiscoveryCard key={t.id} title={t} />)}
          </div>
        </section>
      )}

      {left.length > 0 && (
        <section>
          <h2 className="display mb-1 text-xl">No longer free</h2>
          <p className="mb-4 text-xs text-muted">
            {left.length} title{left.length === 1 ? "" : "s"} whose free option has gone — still
            watchable, but now paid
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {left.slice(0, 18).map((t) => <DiscoveryCard key={t.id} title={t} />)}
          </div>
        </section>
      )}
    </>
  );
}
