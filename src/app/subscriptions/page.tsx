import type { Metadata } from "next";
import { auditPayload } from "@/lib/audit";
import SubscriptionAudit from "@/components/SubscriptionAudit";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Are your streaming subscriptions worth it?",
  description:
    "Pick the services you pay for and see how much of what they offer is already free to watch somewhere else in India.",
};

export default async function SubscriptionsPage() {
  const data = await auditPayload();

  return (
    <>
      <h1 className="display mb-2 text-3xl">Are your subscriptions worth it?</h1>
      <p className="mb-8 max-w-2xl text-sm leading-relaxed text-muted">
        India has far more streaming viewers than paid subscriptions, and the commonest reason
        people overpay is simply not knowing what is already free. Pick what you subscribe to and
        this will show you the overlap.
      </p>

      <SubscriptionAudit data={data} />

      <section className="mt-14 max-w-2xl border-t border-edge pt-8">
        <h2 className="display mb-3 text-lg">How this is worked out</h2>
        <div className="space-y-3 text-sm leading-relaxed text-muted">
          <p>
            For every title we track, we know which services carry it free with advertising and
            which carry it on a subscription. Selecting your services counts how many of those
            titles you can reach, then how many of them are free somewhere regardless.
          </p>
          <p>
            &ldquo;Unique titles&rdquo; is the stricter number: films only that one service can
            give you, that are not free anywhere and that none of your other subscriptions carry.
            A service with a low count is one you are largely paying twice for.
          </p>
          <p>
            It counts only what {SITE.name} tracks, so read it as a sample rather than a full
            audit. It also cannot know how much you actually watch — a service with few unique
            titles may still be worth keeping if those are the ones you watch most.
          </p>
        </div>
      </section>
    </>
  );
}
