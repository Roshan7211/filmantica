import "server-only";
import { allDiscovery } from "./discovery";

/** Data for the subscription audit.
 *
 *  The question the tool answers: of what your subscriptions give you, how much
 *  is already free somewhere else? That is the number nobody publishes, because
 *  the incumbents are partly funded by the services it would tell you to cancel.
 *
 *  Sent to the browser as service *indices* rather than repeated name strings —
 *  1,064 titles with full names would be a needlessly large payload for what is
 *  a small amount of information.
 */

export type AuditPayload = {
  /** Service names, indexed. */
  services: string[];
  /** Per title: [indices of services offering it free, indices offering it on a subscription] */
  titles: [number[], number[]][];
};

/** Services with too few titles are noise in a chooser and are dropped. */
const MIN_TITLES = 8;

export async function auditPayload(): Promise<AuditPayload> {
  const all = await allDiscovery();

  const counts = new Map<string, number>();
  for (const t of all) {
    for (const o of [...t.options.free, ...t.options.stream]) {
      counts.set(o.name, (counts.get(o.name) ?? 0) + 1);
    }
  }

  const services = [...counts.entries()]
    .filter(([, n]) => n >= MIN_TITLES)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);

  const index = new Map(services.map((s, i) => [s, i]));
  const idx = (names: { name: string }[]) =>
    [...new Set(names.map((o) => index.get(o.name)).filter((i): i is number => i !== undefined))];

  const titles = all
    .map((t) => [idx(t.options.free), idx(t.options.stream)] as [number[], number[]])
    // A title with neither is irrelevant to the calculation.
    .filter(([f, s]) => f.length > 0 || s.length > 0);

  return { services, titles };
}
