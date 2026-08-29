/** Content policy.
 *
 *  A licence says whether a work may be redistributed. It says nothing about what
 *  the work IS. The Internet Archive is open-upload, so organised propaganda
 *  arrives carrying perfectly valid Creative Commons grants — 36 such records
 *  reached this catalogue's review queue on the first import.
 *
 *  These are rejected outright rather than queued: nobody should have to page
 *  through them one at a time, and a bulk approval must not be able to publish
 *  them by accident.
 *
 *  Matching is on named organisations and unambiguous markers, not topics. The aim
 *  is to exclude recruitment material from designated hate movements, not
 *  documentary or historical film about them — a documentary ABOUT extremism is
 *  legitimate cinema and should reach review.
 */

const HATE_ORGS = [
  /\bwhite lives matter\b/i,
  /\bpatriot front\b/i,
  /\bblood\s*(&|and)?\s*tribe\b/i,
  /\bnational socialist movement\b/i,
  /\bnationalist social club\b/i,
  /\bcombat\s*18\b/i,
  /\batomwaffen\b/i,
  /\bthe base\b(?=.*\b(cell|recruit|accelerat))/i,
  /\bproud boys\b/i,
  /\bkkk\b|\bku klux klan\b/i,
  /\bgolden dawn\b(?=.*\b(party|rally|recruit))/i,
];

/** Signals the item is coverage OF a movement rather than material FROM it. */
const DOCUMENTARY = /\b(documentary|exposé|expose|investigation|news ?report|history of|rise and fall|archive footage|bbc|pbs|frontline|newsreel)\b/i;

export type PolicyVerdict = { allowed: boolean; reason: string | null };

export function checkContentPolicy(input: {
  title?: string | null;
  creator?: string | null;
  description?: string | null;
  genres?: string[] | null;
}): PolicyVerdict {
  const haystack = [
    input.title ?? "",
    input.creator ?? "",
    input.description ?? "",
    (input.genres ?? []).join(" "),
  ].join(" ");

  for (const org of HATE_ORGS) {
    if (org.test(haystack)) {
      // Don't exclude journalism or history about these movements.
      if (DOCUMENTARY.test(haystack)) {
        return { allowed: true, reason: null };
      }
      const name = haystack.match(org)?.[0] ?? "designated organisation";
      return { allowed: false, reason: `content policy: material from ${name.trim()}` };
    }
  }
  return { allowed: true, reason: null };
}
