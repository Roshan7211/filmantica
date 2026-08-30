import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import JsonLd from "@/components/JsonLd";
import { graph, breadcrumb, webPage } from "@/lib/schema";

export const metadata: Metadata = {
  alternates: { canonical: "/privacy" },
  title: "Privacy policy",
  description: "What data this site collects, why, and what your choices are.",
};

/** Required by ad networks, and genuinely required by law in several territories.
 *
 *  IMPORTANT: this describes the site as it is built today — no accounts, no
 *  analytics, no advertising, and YouTube trailers that load only on click.
 *  Adding advertising will oblige you to disclose third-party cookies and provide
 *  a consent mechanism. Update this page at the same time you make that change,
 *  not afterwards.
 */
export default function PrivacyPage() {
  const updated = "30 August 2026";


  const jsonLd = graph(
    webPage({ name: "Privacy policy", description: "What Filmantica collects, what it stores in your browser, and what it does not.", path: "/privacy" }),
    breadcrumb([{ name: "Privacy policy", path: "/privacy" }]),
  );

  return (
    <div className="max-w-2xl">
      <JsonLd data={jsonLd} />
      <h1 className="display mb-2 text-3xl">Privacy policy</h1>
      <p className="mb-8 text-xs text-muted">Last updated {updated}</p>

      <div className="prose-article">
        <p>
          This page explains what information {SITE.name} collects when you use it, what we do
          with it, and what control you have. It describes the site as it currently operates. If
          that changes, this page changes with it.
        </p>

        <h2>What we collect</h2>
        <p>
          {SITE.name} has no accounts, no sign-up and no login. We do not ask for your name, email
          address, phone number or payment details, and we have no way to store them.
        </p>
        <p>
          We do not currently run analytics or advertising, so we do not set cookies of our own and
          do not build a profile of your visit. The only third-party content on the site is
          trailers, and those load only if you press play — see below.
        </p>

        <h2>What our hosting provider records</h2>
        <p>
          Like any website, requests to {SITE.name} reach a server, and that server keeps standard
          logs. These typically include your IP address, the page requested, the time, and your
          browser and device type. Our hosting provider generates these automatically as part of
          delivering the site and protecting it from abuse.
        </p>
        <p>
          We use these only to keep the site working. We do not use them to identify individuals or
          combine them with anything else.
        </p>

        <h2>Links to other services</h2>
        <p>
          {SITE.name} tells you where films can legally be watched, and links out to the services
          that hold those rights. When you follow one of those links you leave this site, and the
          service you arrive at collects data under its own policy, not ours.
        </p>
        <p>
          We have no control over and no visibility into what those services do. Their privacy
          policies apply from the moment you arrive, and they are worth reading if that matters to
          you.
        </p>

        <h2>What your browser stores</h2>
        <p>
          The subscription tool on this site remembers which services you selected, so the page is
          not blank each time you return. That choice is written to your browser&rsquo;s local
          storage on your own device.
        </p>
        <p>
          It is never sent to us and we cannot read it. Clearing your browser data removes it, and
          the tool works normally if your browser blocks storage entirely — it simply forgets your
          selection. Nothing else on the site stores anything.
        </p>

        <h2>Trailers</h2>
        <p>
          Some film pages include a trailer hosted by YouTube. The trailer does not load when you
          open the page. We show a still image and a play button, and nothing is requested from
          YouTube until you choose to press play.
        </p>
        <p>
          If you do press play, the video is served by YouTube using their privacy-enhanced
          domain, which avoids setting tracking cookies for viewers who have not played anything.
          Once playback begins, YouTube receives your IP address and can set cookies under Google&rsquo;s
          privacy policy rather than ours. We receive nothing from this and cannot see what you
          watched.
        </p>
        <p>
          If you would rather no request reach YouTube at all, simply do not press play — no
          trailer loads on its own.
        </p>

        <h2>Where our film data comes from</h2>
        <p>
          Information about films, series and where they can be watched comes from a licensed
          third-party availability provider. That data is about films rather than about you — no
          information about your visit is sent to them.
        </p>

        <h2>Children</h2>
        <p>
          {SITE.name} is not directed at children and collects no information from anyone. We do
          not knowingly hold data about children because we do not knowingly hold data about
          anyone.
        </p>

        <h2>Your rights</h2>
        <p>
          Data protection law in several territories gives you rights to access, correct and delete
          personal data held about you. Because we hold no accounts and no personal records, there
          is in practice nothing to access or delete beyond server logs, which are retained briefly
          and then discarded.
        </p>
        <p>
          If you believe we hold information about you and want it removed, contact us and we will
          look into it.
        </p>

        <h2>If this changes</h2>
        <p>
          If we add advertising, analytics or accounts, this page will be updated before those
          changes go live, and the date at the top will change. Advertising in particular would
          mean third parties setting cookies, and we would say so here and provide a way to
          control it.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about this policy can be sent through our{" "}
          <a href="/contact">contact page</a>.
        </p>
      </div>
    </div>
  );
}
