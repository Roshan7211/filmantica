/** Credit role parsing.
 *
 *  Roles arrive as comma-separated lists — "Director, Producer", "Casting,
 *  Producer" — so a substring test is wrong: /director/i matches "Director of
 *  Photography", which credits the cinematographer as the film's director.
 *
 *  Roles are split and matched as whole tokens instead.
 */

export type Credit = { name: string; role: string };

const splitRoles = (role: string) =>
  role.split(",").map((r) => r.trim().toLowerCase()).filter(Boolean);

const DIRECTOR = new Set(["director", "co-director"]);
const WRITER = new Set(["writer", "screenplay", "story", "co-writer", "author"]);

export const isDirector = (role: string) => splitRoles(role).some((r) => DIRECTOR.has(r));
export const isWriter = (role: string) => splitRoles(role).some((r) => WRITER.has(r));

/** De-duplicates by name: someone credited "Director, Writer" would otherwise
 *  appear in both lists, which is correct, but twice in one list is not. */
function unique(credits: Credit[]): Credit[] {
  const seen = new Set<string>();
  return credits.filter((c) => {
    const key = c.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const directorsOf = (crew: Credit[] = []) => unique(crew.filter((c) => isDirector(c.role)));
export const writersOf = (crew: Credit[] = []) => unique(crew.filter((c) => isWriter(c.role)));
