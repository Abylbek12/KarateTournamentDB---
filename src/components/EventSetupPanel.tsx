import React from 'react';
import { Plus, Trash2, Shuffle, Lock, Unlock, ChevronDown, Layers, Printer, ListChecks } from 'lucide-react';
import { printUrl } from './PrintDocuments';
import { useApp } from '../context/AppContext';
import { localizeCategoryName } from '../utils/names';
import { NumberField } from './NumberField';
import { PricingEditor } from './PricingEditor';
import type { Bout, EventCategory, Gender, Participant, Tournament } from '../types/schema';
import { WKF_AGE_GROUPS, buildWkfSet, categoryName, newCategoryId, activeEntries, DISCIPLINE_LABELS, isTeamCategory } from '../utils/eventCategories';

interface EventSetupPanelProps {
  tournaments: Tournament[];
  initialTournamentId?: string;
  /** The tournament is chosen in the common «Турнир» bar at the top; hide this screen's own picker. */
  hidePicker?: boolean;
  categories: EventCategory[];
  onChangeCategories: (next: EventCategory[]) => void;
  participants: Participant[];
  bouts: Bout[];
  tatamiNumbers: number[];
  onDraw: (category: EventCategory, tatamiNumber: number) => void;
  onWithdraw: (entryId: string) => void;
  currency?: string;
  /** Saves tournament fields (price periods). Without it the price editor is hidden. */
  onUpdateTournament?: (t: Tournament) => void;
  /**
   * Inside the tournament workflow: 'setup' (stage 1) shows only category creation, fees and the list;
   * 'draw' (stage 4) shows only the list with the draw. Default: everything, as before.
   */
  mode?: 'all' | 'setup' | 'draw';
}

const field = 'rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-primary)] px-2.5 py-1.5 text-sm';

/** Organizer: categories of a tournament, entries per category and the draw. */
export const EventSetupPanel: React.FC<EventSetupPanelProps> = ({
  tournaments,
  initialTournamentId,
  hidePicker,
  categories,
  onChangeCategories,
  participants,
  bouts,
  tatamiNumbers,
  onDraw,
  onWithdraw,
  currency: currencyRu = 'сом',
  onUpdateTournament, mode = 'all'}) => {
  const { language } = useApp();
  const tl = (ru: string, ky: string, en: string) => (language === 'ky' ? ky : language === 'en' ? en : ru);
  const currency = language === 'en' && currencyRu === 'сом' ? 'KGS' : currencyRu;
  // Category names on screen in the interface language (stored names stay Russian)
  const catName = (c: EventCategory) => localizeCategoryName(categoryName(c), language as 'ru' | 'ky' | 'en');
  const AGE_GROUP_I18N: Record<string, [ky: string, en: string]> = {
    u10: ['Балдар 8–9 жаш', 'Children 8–9'],
    u12: ['Балдар 10–11 жаш', 'Children 10–11'],
    u14: ['Балдар 12–13 жаш', 'Children 12–13'],
    cadet: ['Кадеттер 14–15 жаш', 'Cadets 14–15'],
    junior: ['Юниорлор 16–17 жаш', 'Juniors 16–17'],
    u21: ['U21: 18–20 жаш', 'U21: 18–20'],
    senior: ['Чоңдор 18+', 'Seniors 18+']
  };
  const groupLabel = (g: { key: string; label: string }) =>
    language === 'ky' ? AGE_GROUP_I18N[g.key]?.[0] || g.label : language === 'en' ? AGE_GROUP_I18N[g.key]?.[1] || g.label : g.label;
  const [tid, setTid] = React.useState(initialTournamentId && tournaments.some((t) => t.id === initialTournamentId) ? initialTournamentId : tournaments[0]?.id || '');
  const cats = categories.filter((c) => c.tournamentId === tid);
  const [groups, setGroups] = React.useState<string[]>(['cadet', 'junior', 'senior']);
  const [fee, setFee] = React.useState(1500);
  const [withKata, setWithKata] = React.useState(true);
  const [withKumite, setWithKumite] = React.useState(true);
  const [withTeamKata, setWithTeamKata] = React.useState(false);
  const [open, setOpen] = React.useState<string | null>(null);
  const [tatamiFor, setTatamiFor] = React.useState<Record<string, number>>({});
  const [confirm, setConfirm] = React.useState<{ text: string; run: () => void } | null>(null);
  const [custom, setCustom] = React.useState({ discipline: 'kumite' as EventCategory['discipline'], customName: '', gender: 'male' as Gender, ageMin: 18, ageMax: '' as string, weightMin: '' as string, weightMax: '' as string, fee: 1500, duration: 180 });
  const [customError, setCustomError] = React.useState<string | null>(null);
  const [customAdded, setCustomAdded] = React.useState<string | null>(null);

  const addWkf = () => onChangeCategories([...categories, ...buildWkfSet(tid, groups, fee, { kata: withKata, kumite: withKumite, teamKata: withTeamKata })]);
  const num = (v: string) => (v.trim() === '' ? null : Number(v.replace(',', '.')));
  const addCustom = () => {
    setCustomAdded(null);
    const weighted = custom.discipline === 'kumite' || custom.discipline === 'other';
    const ageMax = num(custom.ageMax);
    const wMin = weighted ? num(custom.weightMin) : null;
    const wMax = weighted ? num(custom.weightMax) : null;
    const name = custom.customName.trim();
    if (custom.discipline === 'other' && !name) return setCustomError(tl('Напишите название дисциплины, например «Кихон».', 'Дисциплинанын аталышын жазыңыз, мисалы «Кихон».', 'Write the discipline name, e.g. «Kihon».'));
    if ([ageMax, wMin, wMax].some((v) => v != null && !Number.isFinite(v))) return setCustomError(tl('В полях возраста и веса должны быть только числа.', 'Жаш жана салмак талааларында сандар гана болушу керек.', 'Age and weight fields must contain numbers only.'));
    if (ageMax != null && ageMax < custom.ageMin) return setCustomError(tl('Возраст «до» не может быть меньше возраста «от».', '«Чейин» жашы «баштап» жашынан кичине боло албайт.', 'Age «to» cannot be less than age «from».'));
    if (wMin != null && wMax != null && wMin >= wMax) return setCustomError(tl('Вес «больше» должен быть меньше веса «до».', '«Ашык» салмак «чейин» салмагынан кичине болушу керек.', 'Weight «over» must be less than weight «up to».'));
    const next: EventCategory = {
      id: newCategoryId(),
      tournamentId: tid,
      discipline: custom.discipline,
      ...(custom.discipline === 'other' ? { customDiscipline: name.slice(0, 60) } : {}),
      gender: custom.gender,
      ageMin: Number(custom.ageMin) || 0,
      ageMax,
      weightMin: wMin,
      weightMax: wMax,
      fee: Number(custom.fee) || 0,
      durationSeconds: Number(custom.duration) || 180
    };
    const same = cats.find((c) => categoryName(c).toLowerCase() === categoryName(next).toLowerCase());
    if (same) return setCustomError(`${tl('Такая категория уже есть', 'Мындай категория бар', 'This category already exists')}: «${catName(same)}».`);
    setCustomError(null);
    onChangeCategories([...categories, next]);
    setCustomAdded(categoryName(next));
  };
  const patch = (id: string, p: Partial<EventCategory>) => onChangeCategories(categories.map((c) => (c.id === id ? { ...c, ...p } : c)));
  const remove = (id: string) => onChangeCategories(categories.filter((c) => c.id !== id));

  const entriesTotal = cats.reduce((n, c) => n + activeEntries(participants, c.id).length, 0);

  return (
    <div className="theme-keep space-y-5 pb-8">
      {mode === 'all' && <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[240px]">
          <h1 className="text-2xl font-bold text-[var(--app-text-primary)] flex items-center gap-2">
            <Layers className="w-6 h-6 text-[var(--accent)]" /> {tl('Категории и жеребьёвка', 'Категориялар жана чүчүкулак', 'Categories & draw')}
          </h1>
          <p className="text-[15px] text-[var(--app-text-secondary)] mt-1">{tl('Создайте категории турнира, следите за заявками и проводите жеребьёвку по каждой категории.', 'Мелдештин категорияларын түзүңүз, табыштамаларды көзөмөлдөп, ар бир категория боюнча чүчүкулак өткөрүңүз.', 'Create the tournament categories, follow the entries and run the draw for each category.')}</p>
        </div>
        {tournaments.length === 0 && (
          <p className="w-full rounded-xl border border-amber-300 bg-amber-50 text-amber-900 px-4 py-3 text-sm">
            {tl('Турниров пока нет. Сначала создайте турнир (кнопка «Создать турнир» на главной или раздел «Турниры и пользователи»), потом добавляйте категории.', 'Азырынча мелдештер жок. Адегенде мелдеш түзүңүз («Мелдеш түзүү» баскычы же «Мелдештер жана колдонуучулар» бөлүмү), андан кийин категорияларды кошуңуз.', 'No tournaments yet. Create one first («Create tournament» or «Events & users»), then add categories.')}
          </p>
        )}
        {tournaments.length > 0 && !hidePicker && <select value={tid} onChange={(e) => setTid(e.target.value)} className={`${field} h-10 max-w-full`} aria-label={tl('Турнир', 'Мелдеш', 'Tournament')}>
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>}
      </div>}

      {mode !== 'draw' && <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 space-y-3">
          <h2 className="font-semibold text-[var(--app-text-primary)]">{tl('Стандартный набор WKF', 'WKF стандарттык топтому', 'Standard WKF set')}</h2>
          <div className="flex flex-wrap gap-2">
            {WKF_AGE_GROUPS.map((g) => (
              <label key={g.key} className={`px-3 py-1.5 rounded-full border text-sm cursor-pointer ${groups.includes(g.key) ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'border-[var(--app-border)] text-[var(--app-text-secondary)]'}`}>
                <input type="checkbox" className="sr-only" checked={groups.includes(g.key)} onChange={(e) => setGroups(e.target.checked ? [...groups, g.key] : groups.filter((x) => x !== g.key))} />
                {groupLabel(g)}
              </label>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--app-text-primary)]">
            <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={withKata} onChange={(e) => setWithKata(e.target.checked)} /> {tl('Ката', 'Ката', 'Kata')}</label>
            <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={withKumite} onChange={(e) => setWithKumite(e.target.checked)} /> {tl('Кумитэ по весам', 'Салмак боюнча кумитэ', 'Kumite by weight')}</label>
            <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={withTeamKata} onChange={(e) => setWithTeamKata(e.target.checked)} /> {tl('Командное ката', 'Командалык ката', 'Team kata')}</label>
            <label className="inline-flex items-center gap-1.5">{tl('Взнос', 'Төгүм', 'Fee')} <NumberField value={fee} onValueChange={setFee} className={`${field} w-24`} /> {currency}</label>
          </div>
          <button onClick={addWkf} disabled={!tid || groups.length === 0} className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-sm font-semibold disabled:opacity-40 cursor-pointer">
            <Plus className="w-4 h-4" /> {tl('Добавить категории', 'Категорияларды кошуу', 'Add categories')}
          </button>
          <p className="text-xs text-[var(--app-text-muted)]">{tl('Весовые категории и длительность боёв — типовые WKF. Проверьте их по положению вашего турнира.', 'Салмак категориялары жана беттештин узактыгы — WKF стандарты. Мелдешиңиздин жобосу боюнча текшериңиз.', 'Weight classes and bout durations are standard WKF. Check them against your tournament rules.')}</p>
        </section>

        <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 space-y-3">
          <h2 className="font-semibold text-[var(--app-text-primary)]">{tl('Своя категория', 'Өз категорияңыз', 'Custom category')}</h2>
          <div className="grid grid-cols-2 gap-x-2 gap-y-2.5 text-sm">
            <label className="col-span-2 sm:col-span-1">
              <span className="block text-xs font-medium text-[var(--app-text-muted)] mb-1">{tl('Дисциплина', 'Дисциплина', 'Discipline')}</span>
              <select value={custom.discipline} onChange={(e) => { setCustom({ ...custom, discipline: e.target.value as EventCategory['discipline'] }); setCustomError(null); }} className={`${field} w-full`}>
                <option value="kumite">{tl('Кумитэ', 'Кумитэ', 'Kumite')}</option>
                <option value="kata">{tl('Ката', 'Ката', 'Kata')}</option>
                <option value="team_kumite">{tl('Командное кумитэ', 'Командалык кумитэ', 'Team kumite')}</option>
                <option value="team_kata">{tl('Командное ката', 'Командалык ката', 'Team kata')}</option>
                <option value="other">{tl('Другое', 'Башка', 'Other')}</option>
              </select>
            </label>
            {custom.discipline === 'other' && (
              <label className="col-span-2 sm:col-span-1">
                <span className="block text-xs font-medium text-[var(--app-text-muted)] mb-1">{tl('Название дисциплины', 'Дисциплинанын аталышы', 'Discipline name')}</span>
                <input autoFocus value={custom.customName} onChange={(e) => { setCustom({ ...custom, customName: e.target.value }); setCustomError(null); }} maxLength={60} className={`${field} w-full`} placeholder={tl('напр. Кихон, Фукуго, Тамешивари', 'мис. Кихон, Фукуго, Тамешивари', 'e.g. Kihon, Fukugo, Tameshiwari')} />
              </label>
            )}
            <label>
              <span className="block text-xs font-medium text-[var(--app-text-muted)] mb-1">{tl('Пол', 'Жынысы', 'Gender')}</span>
              <select value={custom.gender} onChange={(e) => setCustom({ ...custom, gender: e.target.value as Gender })} className={`${field} w-full`}>
                <option value="male">{tl('Мужской', 'Эркек', 'Male')}</option>
                <option value="female">{tl('Женский', 'Аял', 'Female')}</option>
                <option value="mixed">{tl('Смешанный', 'Аралаш', 'Mixed')}</option>
              </select>
            </label>
            <label>
              <span className="block text-xs font-medium text-[var(--app-text-muted)] mb-1">{tl('Возраст от', 'Жашы баштап', 'Age from')}</span>
              <NumberField value={custom.ageMin} onValueChange={(n) => setCustom({ ...custom, ageMin: n })} className={`${field} w-full`} />
            </label>
            <label>
              <span className="block text-xs font-medium text-[var(--app-text-muted)] mb-1">{tl('Возраст до', 'Жашы чейин', 'Age to')}</span>
              <input inputMode="numeric" value={custom.ageMax} onChange={(e) => setCustom({ ...custom, ageMax: e.target.value.replace(/[^0-9]/g, '') })} className={`${field} w-full`} placeholder={tl('любой', 'каалаган', 'any')} />
            </label>
            {(custom.discipline === 'kumite' || custom.discipline === 'other') && (
              <>
                <label>
                  <span className="block text-xs font-medium text-[var(--app-text-muted)] mb-1">{tl('Вес больше, кг', 'Салмак ашык, кг', 'Weight over, kg')}</span>
                  <input inputMode="decimal" value={custom.weightMin} onChange={(e) => setCustom({ ...custom, weightMin: e.target.value.replace(',', '.').replace(/[^0-9.]/g, '') })} className={`${field} w-full`} placeholder={tl('необязательно', 'милдеттүү эмес', 'optional')} />
                </label>
                <label>
                  <span className="block text-xs font-medium text-[var(--app-text-muted)] mb-1">{tl('Вес до, кг', 'Салмак чейин, кг', 'Weight up to, kg')}</span>
                  <input inputMode="decimal" value={custom.weightMax} onChange={(e) => setCustom({ ...custom, weightMax: e.target.value.replace(',', '.').replace(/[^0-9.]/g, '') })} className={`${field} w-full`} placeholder={tl('необязательно', 'милдеттүү эмес', 'optional')} />
                </label>
              </>
            )}
            <label>
              <span className="block text-xs font-medium text-[var(--app-text-muted)] mb-1">{tl('Взнос', 'Төгүм', 'Fee')}, {currency}</span>
              <NumberField value={custom.fee} onValueChange={(n) => setCustom({ ...custom, fee: n })} className={`${field} w-full`} />
            </label>
            <label>
              <span className="block text-xs font-medium text-[var(--app-text-muted)] mb-1">{tl('Длительность, сек', 'Узактыгы, сек', 'Duration, sec')}</span>
              <NumberField value={custom.duration} emptyValue={120} onValueChange={(n) => setCustom({ ...custom, duration: n })} className={`${field} w-full`} />
            </label>
          </div>
          {customError && <p className="text-sm text-red-600">{customError}</p>}
          {customAdded && !customError && <p className="text-sm text-emerald-700">{tl('Добавлено', 'Кошулду', 'Added')}: «{customAdded}»</p>}
          <button onClick={addCustom} disabled={!tid} className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-sm font-semibold disabled:opacity-40 cursor-pointer">
            <Plus className="w-4 h-4" /> {tl('Добавить категорию', 'Категория кошуу', 'Add category')}
          </button>
        </section>
      </div>}

      {mode !== 'draw' && onUpdateTournament && tournaments.find((t) => t.id === tid) && (
        <PricingEditor
          tournament={tournaments.find((t) => t.id === tid)!}
          categories={cats}
          currency={currency}
          onSave={(pricing) => {
            const current = tournaments.find((t) => t.id === tid);
            // An empty object (not undefined) so that clearing all periods is sent to the server too
            if (current) onUpdateTournament({ ...current, pricing: pricing || { periods: [], additionalDiscount: 0 } });
          }}
        />
      )}

      <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--app-border)] flex flex-wrap items-center gap-2">
          <h2 className="font-semibold text-[var(--app-text-primary)] flex-1">{tl('Категории турнира', 'Мелдештин категориялары', 'Tournament categories')} ({cats.length})</h2>
          <span className="text-sm text-[var(--app-text-muted)]">{tl('Заявок', 'Табыштамалар', 'Entries')}: {entriesTotal}</span>
        </div>
        {cats.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--app-text-muted)]">{tl('Категорий пока нет. Добавьте стандартный набор WKF или свою категорию.', 'Азырынча категориялар жок. WKF стандарттык топтомун же өз категорияңызды кошуңуз.', 'No categories yet. Add the standard WKF set or your own category.')}</div>
        ) : (
          <ul className="divide-y divide-[var(--app-border)]">
            {cats.map((c) => {
              const entries = activeEntries(participants, c.id);
              const catBouts = bouts.filter((b) => b.categoryId === c.id);
              const started = catBouts.some((b) => b.status !== 'scheduled');
              const tatami = tatamiFor[c.id] ?? tatamiNumbers[0] ?? 1;
              return (
                <li key={c.id}>
                  <div className="flex flex-wrap items-center gap-2 px-4 py-2.5">
                    <button onClick={() => setOpen(open === c.id ? null : c.id)} className="flex-1 min-w-[220px] text-left flex items-center gap-2 cursor-pointer">
                      <ChevronDown className={`w-4 h-4 text-[var(--app-text-muted)] transition-transform ${open === c.id ? 'rotate-180' : ''}`} />
                      <span className="text-sm text-[var(--app-text-primary)]">{catName(c)}</span>
                    </button>
                    <span className="text-xs text-[var(--app-text-muted)] w-24">{entries.length} {tl('заяв.', 'табыш.', 'entries')}</span>
                    <span className="text-xs text-[var(--app-text-muted)] w-20">{c.fee} {currency}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-md ${catBouts.length ? 'bg-emerald-600/10 text-emerald-700' : 'bg-[var(--app-surface-subtle)] text-[var(--app-text-muted)]'}`}>
                      {catBouts.length ? (started ? tl('идут бои', 'беттештер жүрүүдө', 'bouts running') : tl('сетка готова', 'торчо даяр', 'bracket ready')) : c.isClosed ? tl('приём закрыт', 'кабыл алуу жабык', 'entries closed') : tl('приём заявок', 'табыштама кабыл алынат', 'entries open')}
                    </span>
                    {mode !== 'setup' && <><select value={tatami} onChange={(e) => setTatamiFor({ ...tatamiFor, [c.id]: Number(e.target.value) })} className={`${field} h-8 py-0`} title={tl('Татами', 'Татами', 'Tatami')}>
                      {tatamiNumbers.map((n) => (
                        <option key={n} value={n}>{tl('Татами', 'Татами', 'Tatami')} {n}</option>
                      ))}
                    </select>
                    <button
                      disabled={entries.length < 2 || started}
                      onClick={() =>
                        setConfirm({
                          text: catBouts.length
                            ? `${tl('Провести жеребьёвку заново для', 'Чүчүкулакты кайра өткөрөсүзбү:', 'Redo the draw for')} «${catName(c)}»? ${tl('Текущая сетка будет заменена.', 'Учурдагы торчо алмаштырылат.', 'The current bracket will be replaced.')}`
                            : `${tl('Провести жеребьёвку для', 'Чүчүкулак өткөрөсүзбү:', 'Run the draw for')} «${catName(c)}» (${entries.length} ${tl('участн.', 'катыш.', 'athletes')}) — ${tl('татами', 'татами', 'tatami')} ${tatami}? ${tl('Приём заявок в категорию закроется.', 'Категорияга табыштама кабыл алуу жабылат.', 'Entries for this category will close.')}`,
                          run: () => {
                            onDraw(c, tatami);
                            patch(c.id, { isClosed: true });
                          }
                        })
                      }
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-xs font-semibold disabled:opacity-40 cursor-pointer"
                      title={entries.length < 2 ? tl('Нужно минимум 2 участника', 'Кеминде 2 катышуучу керек', 'At least 2 athletes needed') : started ? tl('Бои уже начались', 'Беттештер башталып калды', 'Bouts have started') : tl('Жеребьёвка', 'Чүчүкулак', 'Draw')}
                    >
                      <Shuffle className="w-3.5 h-3.5" /> {catBouts.length ? tl('Заново', 'Кайра', 'Redo') : tl('Жеребьёвка', 'Чүчүкулак', 'Draw')}
                    </button></>}
                    {catBouts.length > 0 && (
                      <a href={printUrl({ kind: 'bracket', eventId: c.tournamentId, categoryId: c.id, lang: language as 'ru' | 'ky' | 'en' })} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg text-[var(--app-text-muted)] hover:text-[var(--app-text-primary)]" title={tl('Печать сетки / PDF', 'Торчону басып чыгаруу / PDF', 'Print bracket / PDF')}>
                        <Printer className="w-4 h-4" />
                      </a>
                    )}
                    <a href={printUrl({ kind: 'entries', eventId: c.tournamentId, categoryId: c.id, lang: language as 'ru' | 'ky' | 'en' })} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg text-[var(--app-text-muted)] hover:text-[var(--app-text-primary)]" title={tl('Стартовый лист / PDF', 'Старттык тизме / PDF', 'Start list / PDF')}>
                      <ListChecks className="w-4 h-4" />
                    </a>
                    <button onClick={() => patch(c.id, { isClosed: !c.isClosed })} className="p-1.5 rounded-lg text-[var(--app-text-muted)] hover:text-[var(--app-text-primary)] cursor-pointer" title={c.isClosed ? tl('Открыть приём заявок', 'Табыштама кабыл алууну ачуу', 'Open entries') : tl('Закрыть приём заявок', 'Табыштама кабыл алууну жабуу', 'Close entries')}>
                      {c.isClosed ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </button>
                    <button
                      disabled={entries.length > 0 || catBouts.length > 0}
                      onClick={() => remove(c.id)}
                      className="p-1.5 rounded-lg text-[var(--app-text-muted)] hover:text-red-600 disabled:opacity-30 cursor-pointer"
                      title={entries.length ? tl('Сначала отзовите заявки', 'Адегенде табыштамаларды кайтарыңыз', 'Withdraw the entries first') : tl('Удалить категорию', 'Категорияны өчүрүү', 'Delete category')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {open === c.id && (
                    <div className="px-4 pb-3">
                      {entries.length === 0 ? (
                        <div className="text-sm text-[var(--app-text-muted)] py-2">{tl('Заявок пока нет.', 'Азырынча табыштама жок.', 'No entries yet.')}</div>
                      ) : (
                        <table className="w-full text-sm">
                          <tbody>
                            {entries.map((p) => (
                              <tr key={p.id} className="border-t border-[var(--app-border)]">
                                <td className="py-1.5 text-[var(--app-text-primary)]">{isTeamCategory(c) ? `${p.teamName}${p.teamMembers?.length ? ` (${p.teamMembers.join(', ')})` : ''}` : `${p.lastName} ${p.firstName}`}</td>
                                <td className="py-1.5 text-[var(--app-text-muted)]">{[p.clubName, p.city, p.country].filter(Boolean).join(' · ')}</td>
                                <td className="py-1.5 text-[var(--app-text-muted)] tabular-nums">{p.birthDate}</td>
                                <td className="py-1.5 text-[var(--app-text-muted)] tabular-nums">{p.declaredWeightKg ? `${p.declaredWeightKg} ${tl('кг', 'кг', 'kg')}` : ''}</td>
                                <td className="py-1.5 text-right">
                                  <button onClick={() => setConfirm({ text: `${tl('Отозвать заявку', 'Табыштаманы кайтаруу', 'Withdraw entry')}: ${p.teamName || `${p.lastName} ${p.firstName}`}?`, run: () => onWithdraw(p.id) })} className="text-xs text-[var(--app-text-muted)] hover:text-red-600 cursor-pointer">
                                    {tl('Отозвать', 'Кайтарып алуу', 'Withdraw')}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {confirm && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[var(--app-surface)] border border-[var(--app-border)] p-5 space-y-4">
            <div className="text-[var(--app-text-primary)] font-semibold">{confirm.text}</div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirm(null)} className="h-10 px-4 rounded-lg border border-[var(--app-border)] text-[var(--app-text-primary)] cursor-pointer">{tl('Отмена', 'Жокко чыгаруу', 'Cancel')}</button>
              <button onClick={() => { confirm.run(); setConfirm(null); }} className="h-10 px-4 rounded-lg bg-[var(--accent)] text-white font-semibold cursor-pointer">{tl('Подтвердить', 'Ырастоо', 'Confirm')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
