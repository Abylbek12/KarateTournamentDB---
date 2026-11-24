// Checks of the organizer rules: an organizer changes only the tournaments they created. Run: npm test
import { mergeOrganizerList, ownedEventIds } from '../server/ownership';
import { canAccess } from '../src/utils/access';

let failures = 0;
const check = (name: string, ok: boolean, detail = '') => {
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures++;
};

const events = [
  { id: 'own-1', ownerId: 'org-a' },
  { id: 'own-2', ownerId: 'org-a' },
  { id: 'other', ownerId: 'org-b' },
  { id: 'admin-made' }
];
const owned = ownedEventIds(events, 'org-a');
check('owned: only the tournaments the organizer created', owned.size === 2 && owned.has('own-1') && owned.has('own-2'));
check('owned: a tournament without owner belongs to nobody', !ownedEventIds(events, 'org-b').has('admin-made'));

const server = [
  { id: 'p1', tournamentId: 'own-1', name: 'A' },
  { id: 'p2', tournamentId: 'other', name: 'B', birthDate: '2014-01-01' },
  { id: 'p3', tournamentId: 'admin-made', name: 'C' }
];
// The organizer's copy: other tournaments' personal data hidden, an own record changed, one added, one foreign removed
const incoming = [
  { id: 'p1', tournamentId: 'own-1', name: 'A changed' },
  { id: 'p2', tournamentId: 'other', name: 'B', birthDate: '' },
  { id: 'p4', tournamentId: 'own-2', name: 'D' },
  { id: 'p5', tournamentId: 'other', name: 'sneaked in' }
];
const { value, ignored } = mergeOrganizerList(server, incoming, owned);
const byId = Object.fromEntries(value.map((x: any) => [x.id, x]));
check('merge: own record changes', byId.p1?.name === 'A changed');
check('merge: own new record is added', !!byId.p4);
check('merge: other tournament stays exactly as on the server (hidden data not saved)', byId.p2?.birthDate === '2014-01-01');
check('merge: a record cannot be added to another tournament', !byId.p5);
check('merge: another tournament cannot be deleted from', !!byId.p3);
check('merge: ignored records counted', ignored === 2, String(ignored));

check('access: organizer opens «Управление турниром»', canAccess('manage', 'organizer'));
check('access: organizer opens weigh-in and the tatami console', canAccess('participants', 'organizer') && canAccess('scoreboard', 'organizer'));
check('access: organizer has no offline server / screens', !canAccess('lan', 'organizer') && !canAccess('screens', 'organizer'));

console.log(failures ? `\n${failures} organizer check(s) FAILED` : '\nAll organizer checks passed');
process.exit(failures ? 1 : 0);
