export default function DiscoveryEmpty() {
  return (
    <div className="rounded border border-brass/30 bg-brass/5 p-6 text-sm leading-relaxed">
      <h2 className="display mb-2 text-lg text-cream">Discovery data not imported yet</h2>
      <p className="text-muted">
        This section lists current films and where they can legally be streamed. It reads from a
        store that a scheduled job fills — pages never call the API directly, so request usage
        scales with catalogue size rather than traffic.
      </p>
      <ol className="mt-4 list-decimal space-y-1 pl-5 text-muted">
        <li>
          Get a free key at{" "}
          <a href="https://api.watchmode.com/" target="_blank" rel="noreferrer noopener"
             className="text-brass underline underline-offset-2">api.watchmode.com</a>{" "}
          (the free tier permits commercial use)
        </li>
        <li>Add <code className="rounded bg-ink px-1">WATCHMODE_API_KEY</code> to <code className="rounded bg-ink px-1">.env.local</code></li>
        <li>Run <code className="rounded bg-ink px-1">npm run probe:watchmode</code> to confirm the response shape</li>
        <li>Run <code className="rounded bg-ink px-1">npm run import:discovery</code></li>
      </ol>
    </div>
  );
}
