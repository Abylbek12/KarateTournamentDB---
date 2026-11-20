// Automated checks for «Мои спортсмены» (club athlete database). Run: npm test
// Part 1: the shared rules (src/utils/athletes.ts). Part 2: the real server in a throwaway data folder,
// checking that a card is seen only by its owner and the admin, and that entries use the card.
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { sanitizeAthlete, findSameAthlete, suggestFromEntries, visibleAthletes, type ClubAthlete } from '../src/utils/athletes';

let failures = 0;
const check = (name: string, ok: boolean, detail = '') => {
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures++;
};

// ---------------- Part 1: rules ----------------
const good = sanitizeAthlete({ lastName: '  Асанов ', firstName: 'Бек', birthDate: '2014-03-05', gender: 'male', beltRank: 'green_6kyu', weightKg: '34.56', countryCode: 'kgz' });
check('sanitize: valid card', good.ok && good.value.lastName === 'Асанов' && good.value.weightKg === 34.6 && good.value.countryCode === 'KGZ');
check('sanitize: no surname → error', !sanitizeAthlete({ firstName: 'Бек', birthDate: '2014-03-05', gender: 'male' }).ok);
check('sanitize: bad birth date → error', !sanitizeAthlete({ lastName: 'А', firstName: 'Б', birthDate: '05.03.2014', gender: 'male' }).ok);
check('sanitize: future birth date → error', !sanitizeAthlete({ lastName: 'А', firstName: 'Б', birthDate: '2999-01-01', gender: 'male' }).ok);
check('sanitize: no gender → error', !sanitizeAthlete({ lastName: 'А', firstName: 'Б', birthDate: '2014-03-05' }).ok);
const odd = sanitizeAthlete({ lastName: 'А', firstName: 'Б', birthDate: '2014-03-05', gender: 'female', beltRank: 'hacker', weightKg: 900, licenseNumber: '' });
check('sanitize: unknown belt → white, silly weight dropped, empty licence optional', odd.ok && odd.value.beltRank === 'white_10kyu' && odd.value.weightKg === undefined && odd.value.licenseNumber === undefined);
const belt = sanitizeAthlete({ lastName: 'А', firstName: 'Б', birthDate: '2014-03-05', gender: 'female', beltRank: 'yellow_8kyu', beltOther: 'x' });
check('sanitize: beltOther only for «other»', belt.ok && belt.value.beltOther === undefined);

const card = (id: string, ownerId: string, lastName: string, firstName: string, birthDate: string): ClubAthlete => ({
  id, ownerId, lastName, firstName, birthDate, gender: 'male', beltRank: 'white_10kyu', createdAt: '', updatedAt: ''
});
const roster = [card('a1', 'u1', 'Асанов', 'Бек', '2014-03-05'), card('a2', 'u2', 'Асанов', 'Бек', '2014-03-05')];
check('same athlete: case-insensitive, per owner', findSameAthlete(roster, 'u1', { lastName: 'асанов', firstName: 'БЕК', birthDate: '2014-03-05' })?.id === 'a1');
check('same athlete: other birth date is someone else', !findSameAthlete(roster, 'u1', { lastName: 'Асанов', firstName: 'Бек', birthDate: '2014-03-06' }));
check('same athlete: editing itself is not a duplicate', !findSameAthlete(roster, 'u1', roster[0], 'a1'));
check('visible: owner sees only own', visibleAthletes(roster, { id: 'u1', role: 'club_coach' }).map((a) => a.id).join() === 'a1');
check('visible: ownerId ignored for non-admin', visibleAthletes(roster, { id: 'u1', role: 'club_coach' }, 'u2').map((a) => a.id).join() === 'a1');
check('visible: admin may look at one owner', visibleAthletes(roster, { id: 'adm', role: 'admin' }, 'u2').map((a) => a.id).join() === 'a2');

const entries = [
  { createdBy: 'u1', lastName: 'Асанов', firstName: 'Бек', birthDate: '2014-03-05', gender: 'male', beltRank: 'white_10kyu' },
  { createdBy: 'u1', lastName: 'Иванова', firstName: 'Анна', birthDate: '2012-01-01', gender: 'female', beltRank: 'blue_4kyu', declaredWeightKg: 40, createdAt: '2026-01-01' },
  { createdBy: 'u1', lastName: 'Иванова', firstName: 'Анна', birthDate: '2012-01-01', gender: 'female', beltRank: 'brown_3kyu', declaredWeightKg: 42, createdAt: '2026-06-01' },
  { createdBy: 'u1', teamName: 'Команда', lastName: '', firstName: 'Команда', birthDate: '' },
  { createdBy: 'u2', lastName: 'Чужой', firstName: 'Спортсмен', birthDate: '2010-01-01', gender: 'male' }
];
const sug = suggestFromEntries(entries, roster, 'u1');
check('suggest: skips roster, teams and other accounts', sug.length === 1 && sug[0].lastName === 'Иванова', sug.map((s) => s.lastName).join());
check('suggest: newest entry wins', sug[0]?.beltRank === 'brown_3kyu' && sug[0]?.weightKg === 42);

// ---------------- Part 2: the server ----------------
const PORT = 3900 + Math.floor(Math.random() * 90);
const BASE = `http://127.0.0.1:${PORT}`;
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'athletes-test-'));
const ADMIN = { email: 'admin@test.localhost', password: 'test-admin-password-1' };

type Client = { cookie: string; call: (method: string, url: string, body?: unknown) => Promise<{ status: number; data: any }> };
const client = (): Client => {
  const c: Client = {
    cookie: '',
    async call(method, url, body) {
      const res = await fetch(BASE + url, {
        method,
        headers: { 'Content-Type': 'application/json', ...(c.cookie ? { Cookie: c.cookie } : {}) },
        body: body === undefined ? undefined : JSON.stringify(body)
      });
      const set = res.headers.get('set-cookie');
      if (set) c.cookie = set.split(';')[0];
      return { status: res.status, data: await res.json().catch(() => ({})) };
    }
  };
  return c;
};

async function main() {
  const env = { ...process.env, PORT: String(PORT), DATA_DIR: dataDir, ADMIN_EMAIL: ADMIN.email, ADMIN_PASSWORD: ADMIN.password, DATABASE_URL: '', POSTGRES_URL: '', ANTHROPIC_API_KEY: '' };
  delete (env as any).VERCEL;
  const server = spawn(process.execPath, ['--import', 'tsx', 'server.ts', '--production'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  server.stdout.on('data', (d) => (log += d));
  server.stderr.on('data', (d) => (log += d));
  try {
    for (let i = 0; i < 100; i++) {
      try {
        if ((await fetch(`${BASE}/api/health`)).ok) break;
      } catch {}
      await new Promise((r) => setTimeout(r, 200));
    }

    const admin = client();
    const coach = client();
    const other = client();
    const referee = client();
    const login = await admin.call('POST', '/api/auth/login', ADMIN);
    check('server: admin signs in', login.status === 200, login.status === 200 ? '' : log.slice(-500));
    await coach.call('POST', '/api/auth/register', { fullName: 'Тренер Один', email: 'coach1@test.localhost', password: 'coach-pass-1', role: 'club_coach', clubName: 'Клуб А' });
    await other.call('POST', '/api/auth/register', { fullName: 'Тренер Два', email: 'coach2@test.localhost', password: 'coach-pass-2', role: 'club_coach' });
    const ref = await referee.call('POST', '/api/auth/register', { fullName: 'Судья', email: 'ref@test.localhost', password: 'ref-pass-123', role: 'athlete' });
    await admin.call('PUT', `/api/admin/users/${ref.data.user.id}/role`, { role: 'scorekeeper' });

    // tournament + two categories
    await admin.call('POST', '/api/events', { id: 'ev-test', title: 'Тест', startDate: '2099-05-01', endDate: '2099-05-02' });
    const cats = await admin.call('GET', '/api/state/categories');
    const kumite = { id: 'c-kumite', tournamentId: 'ev-test', discipline: 'kumite', gender: 'male', fee: 1000, name: 'Кумитэ' };
    const kata = { id: 'c-kata', tournamentId: 'ev-test', discipline: 'kata', gender: 'male', fee: 1000, name: 'Ката' };
    check('server: categories saved', (await admin.call('PUT', '/api/state/categories', { baseVersion: cats.data.version, value: [kumite, kata] })).status === 200);

    // add / duplicate / read
    const athlete = { lastName: 'Асанов', firstName: 'Бек', birthDate: '2014-03-05', gender: 'male', beltRank: 'green_6kyu', weightKg: 34 };
    const added = await coach.call('POST', '/api/athletes', athlete);
    check('add: 201', added.status === 201 && added.data.athlete?.ownerId !== undefined);
    const id = added.data.athlete?.id;
    check('add: same athlete again → 409', (await coach.call('POST', '/api/athletes', { ...athlete, lastName: 'АСАНОВ' })).status === 409);
    check('add: bad data → 400', (await coach.call('POST', '/api/athletes', { lastName: 'X' })).status === 400);
    check('add: guest → 401', (await client().call('POST', '/api/athletes', athlete)).status === 401);
    check('add: secretary role → 403', (await referee.call('POST', '/api/athletes', athlete)).status === 403);
    check('list: owner sees the card', (await coach.call('GET', '/api/athletes')).data.athletes?.length === 1);
    check('list: other coach sees nothing', (await other.call('GET', '/api/athletes')).data.athletes?.length === 0);
    check('list: other coach cannot peek with ownerId', (await other.call('GET', `/api/athletes?ownerId=${added.data.athlete.ownerId}`)).data.athletes?.length === 0);
    check('list: admin can look at the owner', (await admin.call('GET', `/api/athletes?ownerId=${added.data.athlete.ownerId}`)).data.athletes?.length === 1);

    // change / archive
    check('edit: other coach → 404', (await other.call('PUT', `/api/athletes/${id}`, { beltRank: 'black_1dan' })).status === 404);
    const edited = await coach.call('PUT', `/api/athletes/${id}`, { beltRank: 'blue_4kyu', ownerId: 'hijack', id: 'x' });
    check('edit: owner changes belt, cannot change owner or id', edited.status === 200 && edited.data.athlete.beltRank === 'blue_4kyu' && edited.data.athlete.ownerId === added.data.athlete.ownerId && edited.data.athlete.id === id);
    check('archive: other coach → 404', (await other.call('POST', `/api/athletes/${id}/archive`, {})).status === 404);
    check('archive: owner', (await coach.call('POST', `/api/athletes/${id}/archive`, {})).data.athlete?.archived === true);
    check('archive: back', (await coach.call('POST', `/api/athletes/${id}/archive`, { archived: false })).data.athlete?.archived === undefined);

    // entries with athleteId
    check('entry: someone else’s athleteId → 404', (await other.call('POST', '/api/entries', { entries: [{ categoryId: 'c-kumite', athleteId: id }] })).status === 404);
    const entry = await coach.call('POST', '/api/entries', { entries: [{ categoryId: 'c-kumite', athleteId: id, lastName: 'Подмена', birthDate: '2000-01-01', declaredWeightKg: 36 }] });
    const p = entry.data.entries?.[0];
    check('entry: data from the card, not from the request', entry.status === 201 && p.lastName === 'Асанов' && p.birthDate === '2014-03-05' && p.beltRank === 'blue_4kyu' && p.athleteId === id, JSON.stringify(p));
    check('entry: weight from the entry updates the card', (await coach.call('GET', '/api/athletes')).data.athletes?.[0]?.weightKg === 36);
    const visibleToOther = (await other.call('GET', '/api/state/participants')).data.value?.find((x: any) => x.id === p?.id);
    check('entry: athleteId and birth date hidden from other coaches', visibleToOther && !('athleteId' in visibleToOther) && visibleToOther.birthDate === '');

    // a new athlete typed by hand lands in the roster, once
    const hand = { categoryId: 'c-kumite', lastName: 'Иванов', firstName: 'Петр', birthDate: '2013-02-02', gender: 'male', beltRank: 'white_10kyu', declaredWeightKg: 40 };
    const typed = await coach.call('POST', '/api/entries', { entries: [hand, { ...hand, categoryId: 'c-kata' }] });
    const roster2 = (await coach.call('GET', '/api/athletes')).data.athletes || [];
    check('entry by hand: card created once for two categories', typed.status === 201 && roster2.length === 2 && typed.data.entries.every((e: any) => e.athleteId === roster2.find((a: any) => a.lastName === 'Иванов')?.id));
    check('entry by hand: server reports the roster changed', typed.data.rosterChanged === true);
    const adminEntry = await admin.call('POST', '/api/entries', { entries: [{ ...hand, lastName: 'Организаторов' }] });
    check('entry by the organizer: card lands in the organizer roster', adminEntry.status === 201 && (await admin.call('GET', '/api/athletes')).data.athletes?.length === 1);
    const secretaryEntry = await referee.call('POST', '/api/entries', { entries: [{ ...hand, lastName: 'Секретарев' }] });
    check('entry by the secretary: no automatic card', secretaryEntry.status === 201 && !secretaryEntry.data.entries?.[0]?.athleteId);

    // import from past entries
    check('suggest: nothing new for coach (already in roster)', (await coach.call('GET', '/api/athletes/suggest-from-entries')).data.candidates?.length === 0);

    // launch reset clears the roster
    const reset = await admin.call('POST', '/api/admin/launch-reset', { confirm: 'ЗАПУСК' });
    check('launch reset: ok', reset.status === 200);
    const status = await admin.call('GET', '/api/admin/launch-status');
    check('launch reset: no athlete cards left', status.data.counts?.athletes === 0);
  } finally {
    server.kill();
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
  console.log(failures ? `\n${failures} check(s) failed` : '\nAll athlete database checks passed');
  process.exit(failures ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
