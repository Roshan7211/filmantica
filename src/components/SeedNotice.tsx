export default function SeedNotice() {
  return (
    <div className="mb-6 rounded border border-brass/30 bg-brass/5 px-4 py-3 text-sm">
      <strong className="text-brass">Placeholder catalogue.</strong>{" "}
      <span className="text-muted">
        These are demo records with unverified rights, shown so the interface is browsable.
        Run <code className="rounded bg-ink px-1 py-0.5 text-cream">npm run import</code> to
        replace them with licence-verified titles from the Internet Archive.
      </span>
    </div>
  );
}
