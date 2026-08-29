export default function NotConfigured() {
  return (
    <div className="rounded border border-brass/30 bg-brass/5 p-6 text-sm leading-relaxed">
      <h2 className="display mb-2 text-lg text-cream">Discovery needs a TMDB key</h2>
      <p className="text-muted">
        This section lists current films and where they can legally be streamed. It needs a free
        API key from{" "}
        <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer noopener"
           className="text-brass underline underline-offset-2">themoviedb.org</a>.
      </p>
      <pre className="mt-4 overflow-x-auto rounded bg-ink p-3 text-xs text-cream/80">
{`# .env.local
TMDB_API_KEY=your_key_here`}
      </pre>
      <p className="mt-3 text-muted">Restart the dev server after adding it.</p>
    </div>
  );
}
