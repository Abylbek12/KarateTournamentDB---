import React from 'react';
import { FileText, Printer, Trophy, Medal, ListChecks, Award, Network } from 'lucide-react';
import type { Bout, EventCategory, Tournament } from '../types/schema';
import { belongsToEvent } from '../data/sampleTournamentData';
import { categoryName } from '../utils/eventCategories';
import { computeStandings } from '../utils/bracketProgression';
import { printUrl, type PrintKind, type PrintRequest } from './PrintDocuments';
import { useApp } from '../context/AppContext';
import { localizeCategoryName } from '../utils/names';

interface DocumentsPanelProps {
  tournaments: Tournament[];
  initialTournamentId?: string;
  /** The tournament is chosen in the common «Турнир» bar at the top; hide this screen's own picker. */
  hidePicker?: boolean;
  categories: EventCategory[];
  bouts: Bout[];
}

const field = 'rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-primary)] px-2.5 py-1.5 text-sm';
const btn = 'inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[var(--app-border)] text-sm text-[var(--app-text-primary)] hover:bg-[var(--app-surface-subtle)]';

/** Organizer: official documents of a tournament — print or save as PDF. */
export const DocumentsPanel: React.FC<DocumentsPanelProps> = ({ tournaments, initialTournamentId, categories, bouts, hidePicker }) => {
  const [tid, setTid] = React.useState(initialTournamentId || tournaments[0]?.id || '');
  const { language } = useApp();
  const tl = (ru: string, ky: string, en: string) => (language === 'ky' ? ky : language === 'en' ? en : ru);
  // Documents are printed in the interface language by default
  const [lang, setLang] = React.useState<PrintRequest['lang']>((language as PrintRequest['lang']) || 'ru');
  const eventBouts = bouts.filter((b) => belongsToEvent(b.tournamentId, tid));
  const catIds = Array.from(new Set([...categories.filter((c) => c.tournamentId === tid).map((c) => c.id), ...eventBouts.map((b) => b.categoryId)]));
  const title = (id: string) => {
    const def = categories.find((c) => c.id === id);
    return localizeCategoryName(def ? categoryName(def) : eventBouts.find((b) => b.categoryId === id)?.categoryName || id, language as 'ru' | 'ky' | 'en');
  };
  const link = (kind: PrintKind, categoryId?: string) => printUrl({ kind, eventId: tid, categoryId, lang });

  const whole: { kind: PrintKind; label: string; hint: string; icon: React.ReactNode }[] = [
    { kind: 'entries', label: tl('Стартовые листы', 'Старттык тизмелер', 'Start lists'), hint: tl('Все категории — для мандатной комиссии и взвешивания', 'Бардык категориялар — мандаттык комиссия жана таразалоо үчүн', 'All categories — for the registration desk and weigh-in'), icon: <ListChecks className="w-5 h-5" /> },
    { kind: 'bracket', label: tl('Все сетки', 'Бардык торчолор', 'All brackets'), hint: tl('Сетки всех категорий, по одной на лист', 'Бардык категориялардын торчолору, ар бири өз барагында', 'Brackets of all categories, one per page'), icon: <Network className="w-5 h-5" /> },
    { kind: 'results', label: tl('Итоговые протоколы', 'Жыйынтык протоколдор', 'Final protocols'), hint: tl('Места и все поединки по каждой категории', 'Ар бир категория боюнча орундар жана бардык беттештер', 'Places and all bouts in each category'), icon: <Trophy className="w-5 h-5" /> },
    { kind: 'medals', label: tl('Медальный зачёт', 'Медалдык эсеп', 'Medal table'), hint: tl('По странам и по клубам', 'Өлкөлөр жана клубдар боюнча', 'By country and by club'), icon: <Medal className="w-5 h-5" /> },
    { kind: 'diplomas', label: tl('Все дипломы', 'Бардык дипломдор', 'All diplomas'), hint: tl('По диплому на каждого призёра (A4 альбомная)', 'Ар бир байге ээсине диплом (A4 туурасынан)', 'A diploma for each medallist (A4 landscape)'), icon: <Award className="w-5 h-5" /> }
  ];

  return (
    <div className="theme-keep space-y-5 pb-8">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[240px]">
          <h1 className="text-2xl font-bold text-[var(--app-text-primary)] flex items-center gap-2">
            <FileText className="w-6 h-6 text-[var(--accent)]" /> {tl('Документы и печать', 'Документтер жана басып чыгаруу', 'Documents & printing')}
          </h1>
          <p className="text-[15px] text-[var(--app-text-secondary)] mt-1">
            {tl('Официальные документы турнира на листах A4. Откройте документ и нажмите «Печать / сохранить PDF» — в окне печати выберите принтер или «Сохранить как PDF».', 'Мелдештин A4 барактагы расмий документтери. Документти ачып, «Басып чыгаруу / PDF сактоо» баскычын басыңыз — терезеде принтерди же «PDF катары сактоону» тандаңыз.', 'Official tournament documents on A4. Open a document and press «Print / save PDF» — choose a printer or «Save as PDF» in the print window.')}
          </p>
        </div>
        {!hidePicker && (
          <label className="text-sm text-[var(--app-text-secondary)] flex flex-col gap-1 min-w-0 max-w-full">
            {tl('Турнир', 'Мелдеш', 'Tournament')}
            <select value={tid} onChange={(e) => setTid(e.target.value)} className={`${field} w-full sm:w-auto sm:min-w-[240px] max-w-full`}>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </label>
        )}
        <label className="text-sm text-[var(--app-text-secondary)] flex flex-col gap-1">
          {tl('Язык документов', 'Документтердин тили', 'Document language')}
          <select value={lang} onChange={(e) => setLang(e.target.value as PrintRequest['lang'])} className={field}>
            <option value="ru">Русский</option>
            <option value="ky">Кыргызча</option>
            <option value="en">{tl('English (международный)', 'English (эл аралык)', 'English (international)')}</option>
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {whole.map((d) => (
          <a
            key={d.kind}
            href={link(d.kind)}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 flex gap-3 items-start hover:border-[var(--accent)] transition-colors"
          >
            <span className="text-[var(--accent)] mt-0.5">{d.icon}</span>
            <span className="flex-1">
              <span className="block font-semibold text-[var(--app-text-primary)]">{d.label}</span>
              <span className="block text-sm text-[var(--app-text-muted)]">{d.hint}</span>
            </span>
            <Printer className="w-4 h-4 text-[var(--app-text-muted)]" />
          </a>
        ))}
      </div>

      <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--app-border)]">
          <h2 className="font-semibold text-[var(--app-text-primary)]">{tl('По категориям', 'Категориялар боюнча', 'By category')} ({catIds.length})</h2>
        </div>
        {catIds.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--app-text-muted)]">{tl('В этом турнире пока нет категорий. Создайте их в разделе «Категории и жеребьёвка».', 'Бул мелдеште азырынча категориялар жок. Аларды «Категориялар жана чүчүкулак» бөлүмүндө түзүңүз.', 'This tournament has no categories yet. Create them in «Categories & draw».')}</div>
        ) : (
          <ul className="divide-y divide-[var(--app-border)]">
            {catIds.map((id) => {
              const st = computeStandings(eventBouts, id);
              const drawn = eventBouts.some((b) => b.categoryId === id);
              return (
                <li key={id} className="px-4 py-3 flex flex-wrap items-center gap-2">
                  <div className="flex-1 min-w-[220px]">
                    <div className="font-medium text-[var(--app-text-primary)]">{title(id)}</div>
                    <div className="text-xs text-[var(--app-text-muted)]">{!drawn ? tl('жеребьёвка не проведена', 'чүчүкулак өткөрүлгөн жок', 'no draw yet') : st.complete ? tl('категория завершена', 'категория аяктады', 'category finished') : tl('идут поединки', 'беттештер жүрүүдө', 'bouts running')}</div>
                  </div>
                  <a className={btn} href={link('entries', id)} target="_blank" rel="noreferrer"><ListChecks className="w-4 h-4" /> {tl('Стартовый лист', 'Старттык тизме', 'Start list')}</a>
                  {drawn && <a className={btn} href={link('bracket', id)} target="_blank" rel="noreferrer"><Network className="w-4 h-4" /> {tl('Сетка', 'Торчо', 'Bracket')}</a>}
                  {drawn && <a className={btn} href={link('results', id)} target="_blank" rel="noreferrer"><Trophy className="w-4 h-4" /> {tl('Протокол', 'Протокол', 'Protocol')}</a>}
                  {st.gold && <a className={btn} href={link('diplomas', id)} target="_blank" rel="noreferrer"><Award className="w-4 h-4" /> {tl('Дипломы', 'Дипломдор', 'Diplomas')}</a>}
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <p className="text-xs text-[var(--app-text-muted)]">
        {tl('Протокол отдельного поединка печатается из пульта секретаря после окончания боя. На международном турнире (или на английском) имена печатаются латиницей в формате WKF: «ФАМИЛИЯ Имя».', 'Өзүнчө беттештин протоколу беттеш аяктагандан кийин катчынын пультунан басылат. Эл аралык мелдеште (же англисче) аттар WKF форматында латынча басылат: «ФАМИЛИЯ Аты».', 'A single-bout protocol is printed from the scorekeeper console after the bout. At international tournaments (or in English) names are printed in Latin, WKF style: «SURNAME Name».')}
      </p>
    </div>
  );
};
