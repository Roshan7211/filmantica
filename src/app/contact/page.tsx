import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `How to reach ${SITE.name} — corrections, questions and rights enquiries.`,
};

/** TODO before launch: replace the placeholder address below with a real mailbox
 *  you monitor. An ad network will check that a contact route exists and works,
 *  and a rights holder needs somewhere to reach you. */
const EMAIL = "hello@filmantica.com";

export default function ContactPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="display mb-2 text-3xl">Contact</h1>
      <p className="mb-8 text-sm text-muted">
        We read everything sent here, and corrections are especially welcome.
      </p>

      <div className="prose-article">
        <h2>Get in touch</h2>
        <p>
          Email <a href={`mailto:${EMAIL}`}>{EMAIL}</a>. There is no form, no account and no
          ticketing system — a plain email reaches a person.
        </p>

        <h2>Reporting a wrong listing</h2>
        <p>
          If a page here says a film is free and it is not, that is a genuine error and we want to
          know. Availability changes when licences expire, and our data can lag behind that.
        </p>
        <p>
          Including the film title and the service you checked makes it much faster to fix. We
          would rather correct one listing than have you conclude the site is unreliable — which,
          if it says free and delivers a paywall, would be a fair conclusion.
        </p>

        <h2>Rights holders</h2>
        <p>
          {SITE.name} does not host, store or stream any film. Every link points to a service that
          holds the rights to show what it shows, and we list availability information rather than
          content.
        </p>
        <p>
          If you hold rights in a title and believe something here is inaccurate or should not be
          listed, write to us at the address above and we will respond promptly. Please include the
          title and what specifically is wrong.
        </p>

        <h2>Corrections to our writing</h2>
        <p>
          Our guides are written by people and contain the errors that implies. If you find
          something factually wrong, tell us and we will correct it and note the change.
        </p>

        <h2>Everything else</h2>
        <p>
          Questions, suggestions for lists or guides, and requests for services or regions we do
          not currently cover are all welcome at the same address.
        </p>
      </div>
    </div>
  );
}
