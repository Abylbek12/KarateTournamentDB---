// Automated checks for the draw (жеребьёвка). Run: npm run test:draw
import { seedWkfBracketWithProtection, generateProtectedWkfCategoryBouts, detectSeparation } from '../src/utils/wkfBracketSeeding';
import type { Participant, TournamentCategory, Tatami } from '../src/types/schema';

let failures = 0;
const check = (name: string, ok: boolean, detail = '') => {
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures++;
};

let idSeq = 0;
const athlete = (club: string, city: string, country = 'Кыргызстан'): Participant =>
  ({
    id: `p${++idSeq}`,
    tournamentId: 't',
    clubId: club,
    clubName: club,
    city,
    country,
    categoryId: 'c',
    firstName: 'A',
    lastName: `${club}-${idSeq}`,
    gender: 'male',
    birthDate: '2010-01-01',
    beltRank: 'blue_4kyu',
    declaredWeightKg: 40,
    actualWeightKg: 40,
    isWeighedIn: true,
    isMedicalCleared: true,
    status: 'registered',
    licenseNumber: `L${idSeq}`
  }) as Participant;

const meetRound = (i: number, j: number) => Math.floor(Math.log2(i ^ j)) + 1;

/** Earliest round in which two athletes with the same key can meet. */
function earliestMeeting(slots: (Participant | null)[], key: (p: Participant) => string) {
  let earliest = Infinity;
  for (let i = 0; i < slots.length; i++)
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i], b = slots[j];
      if (a && b && key(a) === key(b)) earliest = Math.min(earliest, meetRound(i, j));
    }
  return earliest;
}

// 1. City tournament: 8 athletes from Bishkek, club A has 4 members.
{
  const list = [
    ...Array.from({ length: 4 }, () => athlete('A', 'Бишкек')),
    ...Array.from({ length: 2 }, () => athlete('B', 'Бишкек')),
    ...Array.from({ length: 2 }, () => athlete('C', 'Бишкек'))
  ];
  const { slots, report } = seedWkfBracketWithProtection(list);
  check('city tournament: scope is local', report.scope === 'local', `scope=${report.scope}, levels=${report.separationLevels}`);
  check('city tournament: same club never meets before semi-final', earliestMeeting(slots, (p) => p.clubId) >= 2,
    `earliest=${earliestMeeting(slots, (p) => p.clubId)}`);
  const aSlots = slots.map((p, i) => (p?.clubId === 'A' ? i : -1)).filter((i) => i >= 0);
  check('city tournament: 4 club-A athletes are in 4 different first-round pairs', new Set(aSlots.map((i) => Math.floor(i / 2))).size === 4, `slots=${aSlots}`);
}

// 2. National tournament: clubs from Bishkek, Osh, Karakol; two clubs share Bishkek.
{
  const list = [
    ...Array.from({ length: 4 }, () => athlete('Тигр', 'Бишкек')),
    ...Array.from({ length: 4 }, () => athlete('Манас', 'Бишкек')),
    ...Array.from({ length: 4 }, () => athlete('Ала-Тоо', 'Ош')),
    ...Array.from({ length: 4 }, () => athlete('Самурай', 'Каракол'))
  ];
  const { slots, report } = seedWkfBracketWithProtection(list);
  check('national: scope detected', report.scope === 'national', `levels=${report.separationLevels}`);
  check('national: country level ignored (everyone from Kyrgyzstan)', !report.separationLevels?.includes('country'));
  check('national: same club meets no earlier than quarter-final', earliestMeeting(slots, (p) => p.clubId) >= 3,
    `earliest=${earliestMeeting(slots, (p) => p.clubId)}`);
  check('national: no first-round bout between athletes of one club', report.r1ConflictsCount === 0 || earliestMeeting(slots, (p) => p.clubId) > 1);
}

// 3. Odd number of athletes: everyone placed, byes paired with athletes.
{
  const list = Array.from({ length: 13 }, (_, i) => athlete(`K${i % 5}`, i % 2 ? 'Ош' : 'Бишкек'));
  const { slots, report } = seedWkfBracketWithProtection(list);
  const placed = slots.filter(Boolean).length;
  check('13 athletes: all placed', placed === 13, `placed=${placed}, size=${report.bracketSize}`);
  let doubleBye = false;
  for (let k = 0; k < slots.length; k += 2) if (!slots[k] && !slots[k + 1]) doubleBye = true;
  check('13 athletes: no empty first-round pair', !doubleBye);
}

// 4. More than 16 athletes (previously they were silently dropped).
{
  const list = Array.from({ length: 20 }, (_, i) => athlete(`K${i % 6}`, 'Бишкек'));
  const { slots, report } = seedWkfBracketWithProtection(list);
  check('20 athletes: bracket of 32, all placed', report.bracketSize === 32 && slots.filter(Boolean).length === 20, `size=${report.bracketSize}`);
}

// 5. International: separate by country as well.
{
  const list = [
    ...Array.from({ length: 4 }, (_, i) => athlete(`KG${i}`, 'Бишкек', 'Кыргызстан')),
    ...Array.from({ length: 4 }, (_, i) => athlete(`KZ${i}`, 'Алматы', 'Казахстан'))
  ];
  const { report } = seedWkfBracketWithProtection(list);
  check('international: scope detected', report.scope === 'international' && !!report.separationLevels?.includes('country'));
}

// 6. Bout generation covers the whole bracket.
{
  const tatamis = [{ id: 't1', tournamentId: 't', number: 1, name: 'Татами 1', status: 'ready' }] as Tatami[];
  const category = { id: 'c1', tournamentId: 't', discipline: 'kumite', gender: 'male' } as TournamentCategory;
  const list16 = Array.from({ length: 16 }, (_, i) => athlete(`K${i % 4}`, 'Бишкек'));
  const { bouts } = generateProtectedWkfCategoryBouts(category, list16, tatamis);
  const firstRound = bouts.filter((b) => b.roundStage === 'round_1_8');
  const inBouts = new Set(firstRound.flatMap((b) => [b.akaParticipantId, b.aoParticipantId]));
  check('16 athletes: 8 first-round bouts with all 16 athletes', firstRound.length === 8 && inBouts.size === 16, `bouts=${bouts.length}`);
  check('16 athletes: 15 elimination bouts (repechage is created after the semi-finals)', bouts.length === 15);

  const list5 = Array.from({ length: 5 }, (_, i) => athlete(`K${i}`, 'Ош'));
  const { bouts: b5 } = generateProtectedWkfCategoryBouts(category, list5, tatamis);
  const qf = b5.filter((b) => b.roundStage === 'quarter_final');
  check('5 athletes: 1 quarter-final (3 byes), semis and final exist', qf.length === 1 && b5.some((b) => b.roundStage === 'final'), `bouts=${b5.map((b) => b.roundStage).join(',')}`);
}

{
  const { scope } = detectSeparation([athlete('A', 'Бишкек'), athlete('B', 'Бишкек')]);
  check('detect: two clubs in one city = local', scope === 'local');
}

{
  const a = athlete('x', 'Ош'); a.clubId = 'id-1'; a.clubName = 'СК "Тигр"';
  const b = athlete('y', 'Ош'); b.clubId = 'id-2'; b.clubName = 'СК «Тигр»';
  const { levels } = detectSeparation([a, b, athlete('z', 'Ош')]);
  const { slots } = seedWkfBracketWithProtection([a, b, athlete('z', 'Ош'), athlete('w', 'Ош')]);
  const ia = slots.indexOf(a), ib = slots.indexOf(b);
  check('club names with different quotes are one club', Math.floor(ia / 2) !== Math.floor(ib / 2), `levels=${levels}`);
}

console.log(failures ? `\n${failures} check(s) failed` : '\nAll draw checks passed');
process.exit(failures ? 1 : 0);
