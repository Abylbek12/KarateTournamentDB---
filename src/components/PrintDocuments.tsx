import React from 'react';
import { Printer } from 'lucide-react';
import type { Bout, EventCategory, Participant, Tournament } from '../types/schema';
import { belongsToEvent } from '../data/sampleTournamentData';
import { computeStandings, stageLabel } from '../utils/bracketProgression';
import { bracketLayout } from '../utils/bracketLayout';
import { BracketTree, bracketCardWidth, bracketSize } from './BracketTree';
import * as E from '../utils/boutEngine';
import { categoryName, activeEntries, beltName, ageOn } from '../utils/eventCategories';
import { displayName, displayClub, localizeCategoryName, nameModeFor, participantCountry, participantFlag, participantNoc, type NameMode } from '../utils/names';
import { countryName, flagEmoji } from '../utils/countries';
import { BrandMark } from './BrandLogo';

export type PrintKind = 'bracket' | 'results' | 'medals' | 'entries' | 'bout' | 'diplomas' | 'schedule';

export interface PrintRequest {
  kind: PrintKind;
  eventId: string;
  categoryId?: string;
  boutId?: string;
  lang: 'ru' | 'ky' | 'en';
  /** Schedule only: start time of the first category on every tatami, HH:MM. */
  start?: string;
  /** Brackets / results only: categories of this tatami, in schedule order. */
  tatami?: number;
}

/** Link that opens a printable document in a new tab. */
export const printUrl = (r: Partial<PrintRequest> & { kind: PrintKind; eventId: string }) => {
  const q = new URLSearchParams({ print: r.kind, e: r.eventId });
  if (r.categoryId) q.set('c', r.categoryId);
  if (r.boutId) q.set('b', r.boutId);
  if (r.lang) q.set('lang', r.lang);
  if (r.start) q.set('t', r.start);
  if (r.tatami) q.set('tt', String(r.tatami));
  return `/?${q.toString()}`;
};

export function parsePrintRequest(search: string): PrintRequest | null {
  const q = new URLSearchParams(search);
  const kind = q.get('print') as PrintKind | null;
  const eventId = q.get('e');
  if (!kind || !eventId || !['bracket', 'results', 'medals', 'entries', 'bout', 'diplomas', 'schedule'].includes(kind)) return null;
  const lang = (q.get('lang') as PrintRequest['lang']) || 'ru';
  const t = q.get('t') || '';
  return {
    kind,
    eventId,
    categoryId: q.get('c') || undefined,
    boutId: q.get('b') || undefined,
    lang: ['ru', 'ky', 'en'].includes(lang) ? lang : 'ru',
    start: /^([01]\d|2[0-3]):[0-5]\d$/.test(t) ? t : undefined,
    tatami: /^\d{1,2}$/.test(q.get('tt') || '') ? Number(q.get('tt')) : undefined
  };
}

/**
 * Approximate time one bout takes on the tatami, with the change of athletes:
 * kumite = bout time + 2.5 min (90 s bout -> 4 min), kata ~3.7 min, team kata / team kumite ~10 min.
 * Close to how Uventex plans its timetable.
 */
export function boutSlotSeconds(c: Pick<EventCategory, 'discipline' | 'durationSeconds'> | undefined): number {
  const d = c?.discipline;
  if (d === 'team_kata' || d === 'team_kumite') return 600;
  if (d === 'kata') return 220;
  return (c?.durationSeconds || 120) + 150;
}

/** Bouts needed to decide a category of n entries (single elimination; repechage not counted, like Uventex). */
export const boutsFor = (n: number) => Math.max(0, n - 1);

/** Adds seconds to HH:MM and returns HH:MM. */
export const addToClock = (hhmm: string, seconds: number) => {
  const [h, m] = hhmm.split(':').map(Number);
  const total = Math.round((h * 60 + m) * 60 + seconds) / 60;
  const mins = Math.floor(total) % (24 * 60);
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
};

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
@page bracket { size: A4 landscape; margin: 9mm 10mm; }
.print-sheet.bracket-sheet { width: 297mm; page: bracket; }
.bracket-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; padding-bottom: 6px; }
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
  .print-sheet.bracket-sheet { width: auto; }
  .bracket-scroll { overflow: visible; }
  .bracket-zoom { zoom: var(--print-zoom, 1); }
  .no-print { display: none !important; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}`;

/** Printable official documents (A4). "Save as PDF" in the print dialog gives a PDF. */
export const PrintDocuments: React.FC<PrintDocumentsProps> = ({ request, tournaments, categories, bouts, participants }) => {
  const { kind, categoryId, boutId, lang } = request;
  const start = request.start || '09:00';
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
  // One tatami: only its categories (the tatami of the category's bouts), in the organizer's / schedule order
  const tatamiOf = (cid: string) => eventBouts.find((b) => b.categoryId === cid)?.tatamiNumber;
  const selectedCats = categoryId ? [categoryId] : request.tatami ? catIds.filter((cid) => tatamiOf(cid) === request.tatami) : catIds;

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
    const def = categories.find((c) => c.id === cid);
    // Width of the drawing → zoom so the whole bracket fits one landscape A4 sheet (277 mm ≈ 1047 px) when printed
    const people = cb.flatMap((b) => [b.akaParticipantId, b.aoParticipantId]).map(find).filter((p): p is Participant => !!p);
    const layout = bracketLayout(cb);
    const size = bracketSize(layout.columns.length, layout.firstCount, bracketCardWidth(people.map((p) => ({ name: name(p), club: club(p) }))));
    // Fit the width always; the height too (≈ 500 px under the title on a landscape sheet), but never smaller than 55 %
    const zoom = Math.min(1, 1040 / size.width, Math.max(0.55, 500 / size.height));
    return (
      <div className="print-sheet print-break bracket-sheet" key={`br-${cid}`}>
        <Header title={tr(lang, 'Турнирная сетка', 'Турнирдик торчо', 'Bracket')} />
        {/* Category in big letters: discipline, qualification, age and weight class */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '4px 14px', margin: '-4px 0 12px' }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{catTitle(cid)}</div>
          {tatamiOf(cid) && <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{tr(lang, 'Татами', 'Татами', 'Tatami')} {tatamiOf(cid)}</div>}
        </div>
        {cb.length === 0 ? (
          <p>{tr(lang, 'Жеребьёвка не проведена.', 'Чүчүкулак өткөрүлө элек.', 'The draw has not been made.')}</p>
        ) : (
          <div className="bracket-scroll">
            <div className="bracket-zoom" style={{ ['--print-zoom' as string]: zoom } as React.CSSProperties}>
              <BracketTree bouts={eventBouts} categoryId={cid} lang={lang} variant="print" thirdPlace={def?.thirdPlace} nameOf={(p) => `${name(p)} ${participantNoc(p)}`.trim()} clubOf={(p) => club(p)} find={find} />
            </div>
          </div>
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
                <td>{p.actualWeightKg || p.declaredWeightKg || ''}</td>
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
            {/* Video reviews: who asked, at which second of the bout, and the decision */}
            <tr>
              <th>{tr(lang, 'Видеоповтор (VR)', 'Видеокайталоо (VR)', 'Video review (VR)')}</th>
              <td>
                {(b.videoReviews || []).filter((r) => r.result !== 'cancelled').length === 0
                  ? tr(lang, 'не было', 'болгон жок', 'none')
                  : (b.videoReviews || [])
                      .filter((r) => r.result !== 'cancelled')
                      .map(
                        (r) =>
                          `${r.side === 'aka' ? tr(lang, 'АКА', 'АКА', 'AKA') : tr(lang, 'АО', 'АО', 'AO')}, ${E.formatClock(r.matchSecond)} — ${
                            r.result === 'awarded'
                              ? tr(lang, 'очко дано', 'упай берилди', 'score given')
                              : r.result === 'rejected'
                                ? tr(lang, 'без изменений', 'өзгөрүүсүз', 'no change')
                                : tr(lang, 'решение не внесено', 'чечим киргизилген жок', 'no decision recorded')
                          }`
                      )
                      .join('; ')}
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

  /** Timetable per tatami (like Uventex): start time of each category, in the order of the organizer's list. */
  const scheduleSheets = () => {
    const byTatami = new Map<number, string[]>();
    let undrawn = 0;
    for (const cid of catIds) {
      const first = eventBouts.find((b) => b.categoryId === cid);
      if (!first) {
        undrawn++;
        continue;
      }
      const n = first.tatamiNumber || 1;
      byTatami.set(n, [...(byTatami.get(n) || []), cid]);
    }
    const count = (cid: string) => {
      const listed = activeEntries(participants, cid).length;
      if (listed) return listed;
      const ids = new Set(eventBouts.filter((b) => b.categoryId === cid).flatMap((b) => [b.akaParticipantId, b.aoParticipantId]).filter(Boolean));
      return ids.size;
    };
    const tatamis = [...byTatami.keys()].sort((a, b) => a - b);
    if (tatamis.length === 0)
      return (
        <div className="print-sheet">
          {tr(lang, 'Расписание появится после жеребьёвки: в нём только категории, у которых уже есть сетка.', 'Күн тартиби чүчүкулактан кийин пайда болот: анда торчосу бар категориялар гана.', 'The schedule appears after the draw: it lists only categories that already have a bracket.')}
        </div>
      );
    return tatamis.map((n, i) => {
      let clock = start;
      const rows = byTatami.get(n)!.map((cid) => {
        const def = categories.find((c) => c.id === cid);
        const k = count(cid);
        const row = { cid, time: clock, k };
        clock = addToClock(clock, boutsFor(k) * boutSlotSeconds(def));
        return row;
      });
      return (
        <div className={`print-sheet${i < tatamis.length - 1 ? ' print-break' : ''}`} key={`sched-${n}`}>
          <Header title={`${tr(lang, 'Расписание', 'Күн тартиби', 'Schedule')} · ${tr(lang, 'Татами', 'Татами', 'Tatami')} #${n}`} subtitle={event.startDate} />
          <table>
            <thead>
              <tr>
                <th style={{ width: 70 }}>{tr(lang, 'Время', 'Убакыт', 'Time')}</th>
                <th>{tr(lang, 'Категория', 'Категория', 'Category')}</th>
                <th style={{ width: 90, textAlign: 'center' }}>{tr(lang, 'Участников', 'Катышуучулар', 'Entries')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.cid}>
                  <td style={{ fontWeight: 600 }}>{r.time}</td>
                  <td>{catTitle(r.cid)}</td>
                  <td style={{ textAlign: 'center' }}>{r.k}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: 10.5, color: '#555', marginTop: 8 }}>
            {tr(lang, `Время примерное. Окончание ≈ ${clock}.`, `Убакыт болжолдуу. Аякташы ≈ ${clock}.`, `Times are approximate. Finish ≈ ${clock}.`)}
            {undrawn > 0 && i === tatamis.length - 1 && ' ' + tr(lang, `Без жеребьёвки и не включены: ${undrawn} кат.`, `Чүчүкулаксыз жана кошулган жок: ${undrawn} кат.`, `Not included (no draw yet): ${undrawn} categories.`)}
          </div>
          <Signatures roles={[chief, secretary]} />
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
    diplomas: tr(lang, 'Дипломы', 'Дипломдор', 'Diplomas'),
    schedule: tr(lang, 'Расписание по татами', 'Татамилер боюнча күн тартиби', 'Schedule by tatami')
  };

  return (
    <div className="print-root">
      <style>{PRINT_CSS}</style>
      <div className="no-print" style={{ maxWidth: '210mm', margin: '0 auto 14px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, fontWeight: 700, fontSize: 16 }}>
          {titleByKind[kind]}
          {request.tatami ? ` · ${tr(lang, 'Татами', 'Татами', 'Tatami')} ${request.tatami} (${selectedCats.length})` : ''} · {event.title}
        </div>
        {(['ru', 'ky', 'en'] as const).map((l) => (
          <a
            key={l}
            href={printUrl({ kind, eventId, categoryId, boutId, lang: l, start: request.start, tatami: request.tatami })}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #9aa3ad', background: l === lang ? '#1f5fa8' : '#fff', color: l === lang ? '#fff' : '#111', fontSize: 13, textDecoration: 'none' }}
          >
            {l.toUpperCase()}
          </a>
        ))}
        {kind === 'schedule' && (
          <label style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {tr(lang, 'Начало', 'Башталышы', 'Start')}
            <input
              type="time"
              defaultValue={start}
              onChange={(e) => {
                if (/^\d{2}:\d{2}$/.test(e.target.value)) window.location.replace(printUrl({ kind, eventId, lang, start: e.target.value }));
              }}
              style={{ padding: '5px 8px', borderRadius: 8, border: '1px solid #9aa3ad', fontSize: 13 }}
            />
          </label>
        )}
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
      {kind === 'schedule' && scheduleSheets()}
      {kind === 'diplomas' && !categoryId && selectedCats.length > 0 && selectedCats.every((cid) => !computeStandings(eventBouts, cid).gold) && (
        <div className="print-sheet">{tr(lang, 'Призёры ещё не определены.', 'Байге ээлери али аныкталган жок.', 'Medalists are not decided yet.')}</div>
      )}
      {selectedCats.length === 0 && kind !== 'medals' && kind !== 'bout' && kind !== 'schedule' && (
        <div className="print-sheet">{tr(lang, 'В этом турнире пока нет категорий.', 'Бул мелдеште категориялар азырынча жок.', 'No categories in this tournament yet.')}</div>
      )}
    </div>
  );
};
