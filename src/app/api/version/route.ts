/** Build fingerprint.
 *
 *  Vercel's "Redeploy" rebuilds the commit of the deployment you clicked, not the
 *  tip of the branch — so it is easy to believe you have shipped a fix when the
 *  same old commit was rebuilt. Feature-sniffing routes to guess what is live is
 *  slow and ambiguous; this just says.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const sha =
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.GIT_COMMIT_SHA ??
    "unknown";

  return Response.json(
    {
      commit: sha.slice(0, 7),
      commitFull: sha,
      message: process.env.VERCEL_GIT_COMMIT_MESSAGE?.split("\n")[0] ?? null,
      branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
      env: process.env.VERCEL_ENV ?? "local",
      builtAt: process.env.VERCEL_DEPLOYMENT_ID ? undefined : new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store, must-revalidate" } },
  );
}
