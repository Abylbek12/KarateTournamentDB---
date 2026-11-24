// Organizer role: a person invited by the site owner who runs only their own tournaments.
// They see other tournaments like any visitor, but every change of shared data is limited to their own.
// Pure functions (tested in scripts/test-organizer.ts).

/** Tournaments created by this account. */
export function ownedEventIds(events: { id: string; ownerId?: string }[], userId: string): Set<string> {
  return new Set(events.filter((e) => e.ownerId && e.ownerId === userId).map((e) => e.id));
}

/**
 * An organizer saves a whole list (categories, entries, bouts, protocols), but the list they got from
 * the server has other tournaments' personal data hidden. So their copy of other tournaments is ignored:
 * other tournaments' records stay exactly as on the server, only their own tournaments' records are taken.
 * New records for another tournament are dropped, and nothing of another tournament can be deleted.
 */
export function mergeOrganizerList(current: unknown, incoming: unknown[], owned: Set<string>): { value: any[]; ignored: number } {
  const before = Array.isArray(current) ? (current as any[]) : [];
  const isOwn = (x: any) => !!x && typeof x === 'object' && owned.has(String(x.tournamentId));
  const keepOthers = before.filter((x) => !isOwn(x));
  const ownIncoming = incoming.filter(isOwn);
  return { value: [...keepOthers, ...ownIncoming], ignored: incoming.length - ownIncoming.length };
}

/** Participants as an organizer may see them: own tournaments in full, others like any visitor. */
export function splitByOwnership<T extends { tournamentId?: string }>(list: T[], owned: Set<string>): { own: T[]; others: T[] } {
  const own: T[] = [];
  const others: T[] = [];
  for (const p of list) (p && owned.has(String(p.tournamentId)) ? own : others).push(p);
  return { own, others };
}
