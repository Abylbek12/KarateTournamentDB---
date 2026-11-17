import React from 'react';
import { Printer } from 'lucide-react';
import type { Bout, EventCategory, Participant, Tournament } from '../types/schema';
import { belongsToEvent } from '../data/sampleTournamentData';
import { ELIMINATION_ORDER, computeStandings, repechageHalf, repechageStep, stageLabel } from '../utils/bracketProgression';
import * as E from '../utils/boutEngine';
import { categoryName, activeEntries, beltName, ageOn } from '../utils/eventCategories';
import { displayName, displayClub, localizeCategoryName, nameModeFor, participantCountry, participantFlag, participantNoc, type NameMode } from '../utils/names';
import { countryName, flagEmoji } from '../utils/countries';
import { BrandMark } from './BrandLogo';

export type PrintKind = 'bracket' | 'results' | 'medals' | 'entries' | 'bout' | 'diplomas';

export interface PrintRequest {
  kind: PrintKind;
  eventId: string;
  categoryId?: string;
  boutId?: string;
  lang: 'ru' | 'ky' | 'en';
}

/** Link that opens a printable document in a new tab. */
export const printUrl = (r: Partial<PrintRequest> & { kind: PrintKind; eventId: string }) => {
  const q = new URLSearchParams({ print: r.kind, e: r.eventId });
  if (r.categoryId) q.set('c', r.categoryId);
  if (r.boutId) q.set('b', r.boutId);
  if (r.lang) q.set('lang', r.lang);
  return `/?${q.toString()}`;
};

export function parsePrintRequest(search: string): PrintRequest | null {
  const q = new URLSearchParams(search);
  const kind = q.get('print') as PrintKind | null;
  const eventId = q.get('e');
  if (!kind || !eventId || !['bracket', 'results', 'medals', 'entries', 'bout', 'diplomas'].includes(kind)) return null;
  const lang = (q.get('lang') as PrintRequest['lang']) || 'ru';
  return { kind, eventId, categoryId: q.get('c') || undefined, boutId: q.get('b') || undefined, lang: ['ru', 'ky', 'en'].includes(lang) ? lang : 'ru' };
}

interface PrintDocumentsProps {
  request: PrintRequest;
  tournaments: Tournament[];
  categories: EventCategory[];
  bouts: Bout[];
  participants: Participant[];
}

type Lang = PrintRequest['lang'];
const tr = (lang: Lang, ru: string, ky: string, en: string) => (lang === 'ky' ? ky : lang === 'en' ? en : ru);

const PRINT_CSS = `
@page { size: A4; margin: 14mm 12mm; }
@page diploma { size: A4 landscape; margin: 0; }
.print-root { background: #e9ecef; color: #111; font-family: 'Inter', system-ui, sans-serif; min-height: 100vh; padding: 24px 12px 48px; }
.print-sheet { background: #fff; width: 210mm; max-width: 100%; margin: 0 auto 18px; padding: 14mm 12mm; box-shadow: 0 2px 12px rgba(0,0,0,.12); }
.print-sheet.landscape { width: 297mm; min-height: 210mm; padding: 0; page: diploma; }
.print-sheet table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
.print-sheet th, .print-sheet td { border: 1px solid #9aa3ad; padding: 4px 6px; text-align: left; vertical-align: top; }
.print-sheet th { background: #eef1f4; font-weight: 600; }
.print-break { break-after: page; page-break-after: always; }
.no-print { }
@media print {
  .print-root { background: #fff; padding: 0; }
  .print-sheet { box-shadow: none; margin: 0; width: auto; padding: 0; }
  .print-sheet.landscape { width: 297mm; height: 210mm; }
  .no-print { display: none !important; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}`;

/** Printable official documents (A4). "Save as PDF" in the print dialog gives a PDF. */
export const PrintDocuments: React.FC<PrintDocumentsProps> = ({ request, tournaments, categories, bouts, participants }) => {
  const { kind, categoryId, boutId, lang } = request;
  // Bouts may still carry the legacy demo id, so match the event the same way bouts are matched
  const event = tournaments.find((t) => t.id === request.eventId) || tournaments.find((t) => belongsToEvent(request.eventId, t.id));
  const eventId = event?.id ?? request.eventId;
  const eventBouts = bouts.filter((b) => belongsToEvent(b.tournamentId, eventId));
  const eventEntries = participants.filter((p) => belongsToEvent(p.tournamentId, eventId) && p.status !== 'withdrawn');
  // Same rule as the public pages: bouts decide the name style; the start list follows the entries
  const boutPeople = eventBouts.flatMap((b) => [b.akaParticipant, b.aoParticipant]) as Participant[];
  const mode: NameMode = nameModeFor(kind === 'entries' || boutPeople.length === 0 ? eventEntries : boutPeople, lang);
  const name = (p?: Participant) => (p ? displayName(p, mode) : '');
  const club = (p?: Participant) => displayClub(p, mode);
  const noc = (p?: Participant) => (p ? `${participantFlag(p)} ${participantNoc(p)}` : '');
  const find = (id?: string): Participant | undefined =>
    participants.find((p) => p.id === id) ||
    (eventBouts.find((b) => b.akaParticipantId === id)?.akaParticipant as Participant | undefined) ||
    (eventBouts.find((b) => b.aoParticipantId === id)?.aoParticipant as Participant | undefined);

  const sideP = (b: Bout, s: 'aka' | 'ao'): Participant | undefined =>
    ((s === 'aka' ? b.akaParticipant : b.aoParticipant) as Participant | undefined) || participants.find((p) => p.id === (s === 'aka' ? b.akaParticipantId : b.aoParticipantId));

  // Categories of the event: organizer categories + any category that has bouts
  const catIds = Array.from(new Set([...categories.filter((c) => c.tournamentId === eventId).map((c) => c.id), ...eventBouts.map((b) => b.categoryId)]));
  const catTitle = (id: string) => {
    const def = categories.find((c) => c.id === id);
    return localizeCategoryName(def ? categoryName(def) : eventBouts.find((b) => b.categoryId === id)?.categoryName || id, lang);
  };
  const selectedCats = categoryId ? [categoryId] : catIds;

  React.useEffect(() => {
    document.title = `${tr(lang, 'Документы', 'Документтер', 'Documents')} · ${event?.title || 'Apsatarov'}`;
  }, [event, lang]);

  if (!event) return <div style={{ padding: 40, fontFamily: 'sans-serif' }}>{tr(lang, 'Турнир не найден', 'Мелдеш табылган жок', 'Tournament not found')}</div>;

  const Header: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '2px solid #111', paddingBottom: 8, marginBottom: 12 }}>
      <BrandMark className="w-10 h-10" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: '#555' }}>
          {event.title} · {event.city}{event.venueName ? `, ${event.venueName}` : ''} · {event.startDate}
          {event.endDate && event.endDate !== event.startDate ? ` – ${event.endDate}` : ''}
        </div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: '#333' }}>{subtitle}</div>}
      </div>
      <div style={{ fontSize: 10, color: '#666', textAlign: 'right' }}>
        Apsatarov
        <br />
        {new Date().toLocaleString(lang === 'en' ? 'en-GB' : 'ru-RU')}
      </div>
    </div>
  );

  const Signatures: React.FC<{ roles: string[] }> = ({ roles }) => (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${roles.length}, 1fr)`, gap: 24, marginTop: 28, fontSize: 11 }}>
      {roles.map((r) => (
        <div key={r}>
          <div style={{ borderBottom: '1px solid #111', height: 26 }} />
          <div style={{ marginTop: 4, color: '#333' }}>{r}</div>
        </div>
      ))}
    </div>
  );
  const chief = tr(lang, 'Главный судья', 'Башкы калыс', 'Chief Referee');
  const secretary = tr(lang, 'Главный секретарь', 'Башкы катчы', 'Chief Secretary');

  // ---------- Documents ----------
  const bracketSheet = (cid: string) => {
    const cb = eventBouts.filter((b) => b.categoryId === cid);
    const rounds = ELIMINATION_ORDER.filter((s) => cb.some((b) => b.roundStage === s));
    const rep = cb.filter((b) => b.roundStage === 'repechage' || b.roundStage === 'bronze_match').sort((a, b) => repechageHalf(a) - repechageHalf(b) || repechageStep(a) - repechageStep(b));
    const boutBox = (b: Bout) => (
      <div key={b.id} style={{ border: '1px solid #555', fontSize: 10.5, marginBottom: 6, breakInside: 'avoid' }}>
        <div style={{ background: '#eef1f4', padding: '1px 4px', fontSize: 9.5 }}>#{b.boutNumber} · {b.scheduledTime}</div>
        {(['aka', 'ao'] as const).map((s) => {
          const p = sideP(b, s);
          const id = s === 'aka' ? b.akaParticipantId : b.aoParticipantId;
          const won = b.winnerId && b.winnerId === id;
          return (
            <div key={s} style={{ display: 'flex', gap: 4, padding: '2px 4px', borderTop: s === 'ao' ? '1px solid #ccc' : undefined, fontWeight: won ? 700 : 400 }}>
              <span style={{ width: 6, background: s === 'aka' ? '#c0392b' : '#1f5fa8' }} />
              <span style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{p ? `${name(p)} ${participantNoc(p)}` : '—'}</span>
              <span>{b.status !== 'scheduled' ? (s === 'aka' ? b.akaScore : b.aoScore) : ''}</span>
            </div>
          );
        })}
      </div>
    );
    return (
      <div className="print-sheet print-break" key={`br-${cid}`}>
        <Header title={tr(lang, 'Турнирная сетка', 'Турнирдик торчо', 'Bracket')} subtitle={catTitle(cid)} />
        {cb.length === 0 ? (
          <p>{tr(lang, 'Жеребьёвка не проведена.', 'Чүчүкулак өткөрүлө элек.', 'The draw has not been made.')}</p>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8 }}>
              {rounds.map((stage) => (
                <div key={stage} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{stageLabel(stage, lang)}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', flex: 1 }}>
                    {cb.filter((b) => b.roundStage === stage).sort((a, b) => a.bracketPosition - b.bracketPosition).map(boutBox)}
                  </div>
                </div>
              ))}
            </div>
            {rep.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{tr(lang, 'Утешительные бои', 'Утешителдик беттештер', 'Repechage')}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>{rep.map(boutBox)}</div>
              </div>
            )}
          </>
        )}
        <Signatures roles={[chief, secretary]} />
      </div>
    );
  };

  const resultsSheet = (cid: string) => {
    const s = computeStandings(eventBouts, cid);
    const rows = [
      { place: '1', id: s.gold },
      { place: '2', id: s.silver },
      ...s.bronze.map((id) => ({ place: '3', id }))
    ];
    return (
      <div className="print-sheet print-break" key={`res-${cid}`}>
        <Header title={tr(lang, 'Итоговый протокол', 'Жыйынтык протокол', 'Official Results')} subtitle={catTitle(cid)} />
        <table>
          <thead>
            <tr>
              <th style={{ width: 50 }}>{tr(lang, 'Место', 'Орун', 'Place')}</th>
              <th>{tr(lang, 'Спортсмен', 'Спортчу', 'Athlete')}</th>
              <th>{tr(lang, 'Клуб', 'Клуб', 'Club')}</th>
              <th style={{ width: 70 }}>{tr(lang, 'Страна', 'Өлкө', 'NOC')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const p = find(r.id);
              return (
                <tr key={i}>
                  <td style={{ fontWeight: 700 }}>{r.place}</td>
                  <td>{p ? name(p) : tr(lang, 'не определено', 'аныкталган жок', 'not decided')}</td>
                  <td>{club(p)}</td>
                  <td>{noc(p)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!s.complete && <p style={{ fontSize: 11, marginTop: 6 }}>{tr(lang, 'Категория ещё не завершена.', 'Категория бүтө элек.', 'Category not finished yet.')}</p>}
        <h3 style={{ fontSize: 13, fontWeight: 700, margin: '14px 0 6px' }}>{tr(lang, 'Поединки', 'Беттештер', 'Bouts')}</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>{tr(lang, 'Круг', 'Айлампа', 'Round')}</th>
              <th>{tr(lang, 'АКА', 'АКА', 'AKA')}</th>
              <th>{tr(lang, 'Счёт', 'Эсеп', 'Score')}</th>
              <th>{tr(lang, 'АО', 'АО', 'AO')}</th>
              <th>{tr(lang, 'Победа', 'Жеңиш', 'Winner')}</th>
            </tr>
          </thead>
          <tbody>
            {eventBouts
              .filter((b) => b.categoryId === cid)
              .sort((a, b) => a.boutNumber - b.boutNumber)
              .map((b) => (
                <tr key={b.id}>
                  <td>{b.boutNumber}</td>
                  <td>{stageLabel(b.roundStage, lang)}</td>
                  <td>{name(sideP(b, 'aka'))}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{b.status === 'scheduled' ? '' : `${b.akaScore} : ${b.aoScore}`}</td>
                  <td>{name(sideP(b, 'ao'))}</td>
                  <td>{b.winnerId ? `${b.winnerId === b.akaParticipantId ? tr(lang, 'АКА', 'АКА', 'AKA') : tr(lang, 'АО', 'АО', 'AO')} · ${b.winReason ? E.winReasonLabel(b.winReason, lang) : ''}` : ''}</td>
                </tr>
              ))}
          </tbody>
        </table>
        <Signatures roles={[chief, secretary]} />
      </div>
    );
  };

  const medalsSheet = () => {
    const tally = (key: (p: Participant) => string) => {
      const rows = new Map<string, { name: string; g: number; s: number; b: number }>();
      const add = (id: string | undefined, m: 'g' | 's' | 'b') => {
        const p = find(id);
        if (!p) return;
        const k = key(p) || '—';
        const r = rows.get(k) || { name: k, g: 0, s: 0, b: 0 };
        r[m]++;
        rows.set(k, r);
      };
      for (const cid of catIds) {
        const st = computeStandings(eventBouts, cid);
        add(st.gold, 'g');
        add(st.silver, 's');
        st.bronze.forEach((id) => add(id, 'b'));
      }
      return [...rows.values()].sort((a, b) => b.g - a.g || b.s - a.s || b.b - a.b || a.name.localeCompare(b.name));
    };
    const table = (title: string, rows: ReturnType<typeof tally>) => (
      <>
        <h3 style={{ fontSize: 13, fontWeight: 700, margin: '12px 0 6px' }}>{title}</h3>
        <table>
          <thead>
            <tr>
              <th style={{ width: 30 }}>#</th>
              <th>{tr(lang, 'Название', 'Аталышы', 'Name')}</th>
              <th style={{ width: 50 }}>{tr(lang, 'Золото', 'Алтын', 'Gold')}</th>
              <th style={{ width: 50 }}>{tr(lang, 'Серебро', 'Күмүш', 'Silver')}</th>
              <th style={{ width: 50 }}>{tr(lang, 'Бронза', 'Коло', 'Bronze')}</th>
              <th style={{ width: 50 }}>{tr(lang, 'Всего', 'Баары', 'Total')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.name}>
                <td>{i + 1}</td>
                <td>{r.name}</td>
                <td>{r.g}</td>
                <td>{r.s}</td>
                <td>{r.b}</td>
                <td style={{ fontWeight: 700 }}>{r.g + r.s + r.b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
    return (
      <div className="print-sheet" key="medals">
        <Header title={tr(lang, 'Медальный зачёт', 'Медалдык эсеп', 'Medal Standings')} />
        {table(tr(lang, 'По странам', 'Өлкөлөр боюнча', 'By country'), tally((p) => {
          const c = participantCountry(p);
          return c ? `${flagEmoji(c.iso2)} ${countryName(c, lang)} (${c.noc})` : p.country;
        }))}
        {table(tr(lang, 'По клубам', 'Клубдар боюнча', 'By club'), tally((p) => club(p)))}
        <Signatures roles={[chief, secretary]} />
      </div>
    );
  };

  const entriesSheet = (cid: string) => {
    const list = activeEntries(eventEntries, cid).sort((a, b) => (a.clubName || '').localeCompare(b.clubName || '') || a.lastName.localeCompare(b.lastName));
    return (
      <div className="print-sheet print-break" key={`ent-${cid}`}>
        <Header title={tr(lang, 'Стартовый лист', 'Старттык тизме', 'Start List')} subtitle={`${catTitle(cid)} · ${list.length} ${tr(lang, 'участн.', 'катыш.', 'entries')}`} />
        <table>
          <thead>
            <tr>
              <th style={{ width: 26 }}>#</th>
              <th>{tr(lang, 'Спортсмен / команда', 'Спортчу / команда', 'Athlete / team')}</th>
              <th style={{ width: 70 }}>{tr(lang, 'Год рожд.', 'Туулган жыл', 'Born')}</th>
              <th>{tr(lang, 'Клуб', 'Клуб', 'Club')}</th>
              <th style={{ width: 60 }}>NOC</th>
              <th style={{ width: 80 }}>{tr(lang, 'Пояс', 'Кур', 'Belt')}</th>
              <th style={{ width: 70 }}>{tr(lang, 'Вес', 'Салмак', 'Weight')}</th>
              <th style={{ width: 70 }}>{tr(lang, 'Допуск', 'Уруксат', 'Cleared')}</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p, i) => (
              <tr key={p.id}>
                <td>{i + 1}</td>
                <td>{name(p)}{p.teamMembers?.length ? ` (${p.teamMembers.join(', ')})` : ''}</td>
                <td>{p.birthDate ? `${p.birthDate.slice(0, 4)} (${ageOn(p.birthDate, event.startDate)})` : ''}</td>
                <td>{club(p)}</td>
                <td>{noc(p)}</td>
                <td style={{ fontSize: 10 }}>{beltName(p)}</td>
                <td>{p.actualWeightKg ?? (p.declaredWeightKg || '')}</td>
                <td>{p.isWeighedIn ? (p.isMedicalCleared ? '✓' : '✗') : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Signatures roles={[tr(lang, 'Председатель мандатной комиссии', 'Мандаттык комиссиянын төрагасы', 'Accreditation Chair'), secretary]} />
      </div>
    );
  };

  const boutSheet = () => {
    const b = eventBouts.find((x) => x.id === boutId) || bouts.find((x) => x.id === boutId);
    if (!b) return <div className="print-sheet">{tr(lang, 'Поединок не найден', 'Беттеш табылган жок', 'Bout not found')}</div>;
    const side = (s: 'aka' | 'ao') => {
      const p = sideP(b, s);
      const isAka = s === 'aka';
      return [
        [tr(lang, 'Спортсмен', 'Спортчу', 'Athlete'), name(p)],
        [tr(lang, 'Клуб', 'Клуб', 'Club'), club(p)],
        ['NOC', noc(p)],
        [tr(lang, 'Очки', 'Упай', 'Score'), String(isAka ? b.akaScore : b.aoScore)],
        ['Senshu', (isAka ? b.akaSenshu : b.aoSenshu) ? '✓' : '—'],
        ['C1', E.PENALTY_LEVELS[isAka ? b.akaPenaltiesC1 : b.aoPenaltiesC1]],
        ['C2', E.PENALTY_LEVELS[isAka ? b.akaPenaltiesC2 : b.aoPenaltiesC2]]
      ];
    };
    const aka = side('aka');
    const ao = side('ao');
    return (
      <div className="print-sheet">
        <Header
          title={`${tr(lang, 'Протокол поединка', 'Беттештин протоколу', 'Bout Protocol')} #${b.boutNumber}`}
          subtitle={`${localizeCategoryName(b.categoryName, lang)} · ${stageLabel(b.roundStage, lang)} · ${tr(lang, 'Татами', 'Татами', 'Tatami')} ${b.tatamiNumber ?? ''}`}
        />
        <table>
          <thead>
            <tr>
              <th style={{ width: '20%' }} />
              <th style={{ background: '#f6dcdc' }}>{tr(lang, 'АКА (красный)', 'АКА (кызыл)', 'AKA (red)')}</th>
              <th style={{ background: '#dce6f6' }}>{tr(lang, 'АО (синий)', 'АО (көк)', 'AO (blue)')}</th>
            </tr>
          </thead>
          <tbody>
            {aka.map((row, i) => (
              <tr key={row[0]}>
                <th>{row[0]}</th>
                <td>{row[1]}</td>
                <td>{ao[i][1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <table style={{ marginTop: 10 }}>
          <tbody>
            <tr>
              <th style={{ width: '20%' }}>{tr(lang, 'Победитель', 'Жеңүүчү', 'Winner')}</th>
              <td style={{ fontWeight: 700 }}>
                {b.winnerId ? `${b.winnerId === b.akaParticipantId ? tr(lang, 'АКА', 'АКА', 'AKA') : tr(lang, 'АО', 'АО', 'AO')} — ${name(find(b.winnerId))}` : tr(lang, 'бой не завершён', 'беттеш бүтө элек', 'not finished')}
              </td>
            </tr>
            <tr>
              <th>{tr(lang, 'Причина', 'Себеби', 'Decision')}</th>
              <td>{b.winReason ? E.winReasonLabel(b.winReason, lang) : ''}</td>
            </tr>
            <tr>
              <th>{tr(lang, 'Время', 'Убакыт', 'Time')}</th>
              <td>
                {tr(lang, 'начало', 'башталышы', 'start')} {b.actualStartTime || '—'} · {tr(lang, 'окончание', 'аягы', 'end')} {b.actualEndTime || '—'} ·{' '}
                {tr(lang, 'длительность боя', 'беттештин узактыгы', 'bout length')} {E.formatClock(b.durationSeconds ?? 180)}
              </td>
            </tr>
          </tbody>
        </table>
        <Signatures roles={[tr(lang, 'Рефери (Shushin)', 'Рефери (Shushin)', 'Referee (Shushin)'), tr(lang, 'Секретарь татами', 'Татами катчысы', 'Tatami Secretary'), chief]} />
      </div>
    );
  };

  const diplomaSheets = (cid: string) => {
    const s = computeStandings(eventBouts, cid);
    const medalists = [
      { place: 1, id: s.gold },
      { place: 2, id: s.silver },
      ...s.bronze.map((id) => ({ place: 3, id }))
    ].filter((m) => m.id);
    if (medalists.length === 0 && !categoryId) return null;
    if (medalists.length === 0) return <div className="print-sheet" key={`dip-empty-${cid}`}>{tr(lang, 'Призёры ещё не определены.', 'Байге ээлери али аныкталган жок.', 'Medalists are not decided yet.')}</div>;
    const placeWord = (n: number) => tr(lang, `${n} место`, `${n}-орун`, `${n === 1 ? '1st' : n === 2 ? '2nd' : '3rd'} place`);
    const color = (n: number) => (n === 1 ? '#b8860b' : n === 2 ? '#7d8790' : '#a0522d');
    return medalists.map((m, i) => {
      const p = find(m.id);
      return (
        <div className="print-sheet landscape print-break" key={`dip-${cid}-${i}`}>
          <div style={{ height: '100%', minHeight: '210mm', border: `10px double ${color(m.place)}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '16mm', gap: 10 }}>
            <BrandMark className="w-20 h-20" />
            <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: 6, color: color(m.place) }}>{tr(lang, 'ДИПЛОМ', 'ДИПЛОМ', 'DIPLOMA')}</div>
            <div style={{ fontSize: 20 }}>{tr(lang, 'награждается', 'сыйланат', 'is awarded to')}</div>
            <div style={{ fontSize: 34, fontWeight: 700 }}>{name(p)}</div>
            <div style={{ fontSize: 16, color: '#333' }}>{[club(p), p ? `${participantFlag(p)} ${participantNoc(p)}` : ''].filter(Boolean).join(' · ')}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: color(m.place), marginTop: 8 }}>{placeWord(m.place)}</div>
            <div style={{ fontSize: 16 }}>{catTitle(cid)}</div>
            <div style={{ fontSize: 15, color: '#333' }}>
              {event.title} · {event.city} · {event.startDate}
            </div>
            <div style={{ display: 'flex', gap: 80, marginTop: 30, fontSize: 13 }}>
              {[chief, tr(lang, 'Организатор', 'Уюштуруучу', 'Organizer')].map((r) => (
                <div key={r} style={{ width: 200 }}>
                  <div style={{ borderBottom: '1px solid #111', height: 30 }} />
                  {r}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    });
  };

  const titleByKind: Record<PrintKind, string> = {
    bracket: tr(lang, 'Сетки', 'Торчолор', 'Brackets'),
    results: tr(lang, 'Итоговые протоколы', 'Жыйынтык протоколдор', 'Results'),
    medals: tr(lang, 'Медальный зачёт', 'Медалдык эсеп', 'Medal standings'),
    entries: tr(lang, 'Стартовые листы', 'Старттык тизмелер', 'Start lists'),
    bout: tr(lang, 'Протокол поединка', 'Беттештин протоколу', 'Bout protocol'),
    diplomas: tr(lang, 'Дипломы', 'Дипломдор', 'Diplomas')
  };

  return (
    <div className="print-root">
      <style>{PRINT_CSS}</style>
      <div className="no-print" style={{ maxWidth: '210mm', margin: '0 auto 14px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, fontWeight: 700, fontSize: 16 }}>{titleByKind[kind]} · {event.title}</div>
        {(['ru', 'ky', 'en'] as const).map((l) => (
          <a
            key={l}
            href={printUrl({ kind, eventId, categoryId, boutId, lang: l })}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #9aa3ad', background: l === lang ? '#1f5fa8' : '#fff', color: l === lang ? '#fff' : '#111', fontSize: 13, textDecoration: 'none' }}
          >
            {l.toUpperCase()}
          </a>
        ))}
        <button
          onClick={() => window.print()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#1f5fa8', color: '#fff', fontWeight: 600, border: 0, cursor: 'pointer' }}
        >
          <Printer size={16} /> {tr(lang, 'Печать / сохранить PDF', 'Басып чыгаруу / PDF', 'Print / save PDF')}
        </button>
      </div>

      {kind === 'bracket' && selectedCats.map(bracketSheet)}
      {kind === 'results' && selectedCats.map(resultsSheet)}
      {kind === 'medals' && medalsSheet()}
      {kind === 'entries' && selectedCats.map(entriesSheet)}
      {kind === 'bout' && boutSheet()}
      {kind === 'diplomas' && selectedCats.map(diplomaSheets)}
      {kind === 'diplomas' && !categoryId && selectedCats.length > 0 && selectedCats.every((cid) => !computeStandings(eventBouts, cid).gold) && (
        <div className="print-sheet">{tr(lang, 'Призёры ещё не определены.', 'Байге ээлери али аныкталган жок.', 'Medalists are not decided yet.')}</div>
      )}
      {selectedCats.length === 0 && kind !== 'medals' && kind !== 'bout' && (
        <div className="print-sheet">{tr(lang, 'В этом турнире пока нет категорий.', 'Бул мелдеште категориялар азырынча жок.', 'No categories in this tournament yet.')}</div>
      )}
    </div>
  );
};
