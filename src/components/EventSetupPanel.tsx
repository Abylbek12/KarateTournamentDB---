import React from 'react';
import { Plus, Trash2, Shuffle, Lock, Unlock, ChevronDown, Layers, Printer, ListChecks } from 'lucide-react';
import { printUrl } from './PrintDocuments';
import { NumberField } from './NumberField';
import { PricingEditor } from './PricingEditor';
import type { Bout, EventCategory, Gender, Participant, Tournament } from '../types/schema';
import { WKF_AGE_GROUPS, buildWkfSet, categoryName, newCategoryId, activeEntries, DISCIPLINE_LABELS, isTeamCategory } from '../utils/eventCategories';

interface EventSetupPanelProps {
  tournaments: Tournament[];
  initialTournamentId?: string;
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
}

const field = 'rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-primary)] px-2.5 py-1.5 text-sm';

/** Organizer: categories of a tournament, entries per category and the draw. */
export const EventSetupPanel: React.FC<EventSetupPanelProps> = ({
  tournaments,
  initialTournamentId,
  categories,
  onChangeCategories,
  participants,
  bouts,
  tatamiNumbers,
  onDraw,
  onWithdraw,
  currency = 'сом',
  onUpdateTournament
}) => {
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
    if (custom.discipline === 'other' && !name) return setCustomError('Напишите название дисциплины, например «Кихон».');
    if ([ageMax, wMin, wMax].some((v) => v != null && !Number.isFinite(v))) return setCustomError('В полях возраста и веса должны быть только числа.');
    if (ageMax != null && ageMax < custom.ageMin) return setCustomError('Возраст «до» не может быть меньше возраста «от».');
    if (wMin != null && wMax != null && wMin >= wMax) return setCustomError('Вес «больше» должен быть меньше веса «до».');
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
    if (same) return setCustomError(`Такая категория уже есть: «${categoryName(same)}».`);
    setCustomError(null);
    onChangeCategories([...categories, next]);
    setCustomAdded(categoryName(next));
  };
  const patch = (id: string, p: Partial<EventCategory>) => onChangeCategories(categories.map((c) => (c.id === id ? { ...c, ...p } : c)));
  const remove = (id: string) => onChangeCategories(categories.filter((c) => c.id !== id));

  const entriesTotal = cats.reduce((n, c) => n + activeEntries(participants, c.id).length, 0);

  return (
    <div className="theme-keep space-y-5 pb-8">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[240px]">
          <h1 className="text-2xl font-bold text-[var(--app-text-primary)] flex items-center gap-2">
            <Layers className="w-6 h-6 text-[var(--accent)]" /> Категории и жеребьёвка
          </h1>
          <p className="text-[15px] text-[var(--app-text-secondary)] mt-1">Создайте категории турнира, следите за заявками и проводите жеребьёвку по каждой категории.</p>
        </div>
        {tournaments.length === 0 && (
          <p className="w-full rounded-xl border border-amber-300 bg-amber-50 text-amber-900 px-4 py-3 text-sm">
            Турниров пока нет. Сначала создайте турнир (кнопка «Создать турнир» на главной или раздел «Турниры и пользователи»), потом добавляйте категории.
          </p>
        )}
        {tournaments.length > 0 && <select value={tid} onChange={(e) => setTid(e.target.value)} className={`${field} h-10 max-w-full`} aria-label="Турнир">
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 space-y-3">
          <h2 className="font-semibold text-[var(--app-text-primary)]">Стандартный набор WKF</h2>
          <div className="flex flex-wrap gap-2">
            {WKF_AGE_GROUPS.map((g) => (
              <label key={g.key} className={`px-3 py-1.5 rounded-full border text-sm cursor-pointer ${groups.includes(g.key) ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'border-[var(--app-border)] text-[var(--app-text-secondary)]'}`}>
                <input type="checkbox" className="sr-only" checked={groups.includes(g.key)} onChange={(e) => setGroups(e.target.checked ? [...groups, g.key] : groups.filter((x) => x !== g.key))} />
                {g.label}
              </label>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--app-text-primary)]">
            <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={withKata} onChange={(e) => setWithKata(e.target.checked)} /> Ката</label>
            <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={withKumite} onChange={(e) => setWithKumite(e.target.checked)} /> Кумитэ по весам</label>
            <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={withTeamKata} onChange={(e) => setWithTeamKata(e.target.checked)} /> Командное ката</label>
            <label className="inline-flex items-center gap-1.5">Взнос <NumberField value={fee} onValueChange={setFee} className={`${field} w-24`} /> {currency}</label>
          </div>
          <button onClick={addWkf} disabled={!tid || groups.length === 0} className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-sm font-semibold disabled:opacity-40 cursor-pointer">
            <Plus className="w-4 h-4" /> Добавить категории
          </button>
          <p className="text-xs text-[var(--app-text-muted)]">Весовые категории и длительность боёв — типовые WKF. Проверьте их по положению вашего турнира.</p>
        </section>

        <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 space-y-3">
          <h2 className="font-semibold text-[var(--app-text-primary)]">Своя категория</h2>
          <div className="grid grid-cols-2 gap-x-2 gap-y-2.5 text-sm">
            <label className="col-span-2 sm:col-span-1">
              <span className="block text-xs font-medium text-[var(--app-text-muted)] mb-1">Дисциплина</span>
              <select value={custom.discipline} onChange={(e) => { setCustom({ ...custom, discipline: e.target.value as EventCategory['discipline'] }); setCustomError(null); }} className={`${field} w-full`}>
                <option value="kumite">Кумитэ</option>
                <option value="kata">Ката</option>
                <option value="team_kumite">Командное кумитэ</option>
                <option value="team_kata">Командное ката</option>
                <option value="other">Другое</option>
              </select>
            </label>
            {custom.discipline === 'other' && (
              <label className="col-span-2 sm:col-span-1">
                <span className="block text-xs font-medium text-[var(--app-text-muted)] mb-1">Название дисциплины</span>
                <input autoFocus value={custom.customName} onChange={(e) => { setCustom({ ...custom, customName: e.target.value }); setCustomError(null); }} maxLength={60} className={`${field} w-full`} placeholder="напр. Кихон, Фукуго, Тамешивари" />
              </label>
            )}
            <label>
              <span className="block text-xs font-medium text-[var(--app-text-muted)] mb-1">Пол</span>
              <select value={custom.gender} onChange={(e) => setCustom({ ...custom, gender: e.target.value as Gender })} className={`${field} w-full`}>
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
                <option value="mixed">Смешанный</option>
              </select>
            </label>
            <label>
              <span className="block text-xs font-medium text-[var(--app-text-muted)] mb-1">Возраст от</span>
              <NumberField value={custom.ageMin} onValueChange={(n) => setCustom({ ...custom, ageMin: n })} className={`${field} w-full`} />
            </label>
            <label>
              <span className="block text-xs font-medium text-[var(--app-text-muted)] mb-1">Возраст до</span>
              <input inputMode="numeric" value={custom.ageMax} onChange={(e) => setCustom({ ...custom, ageMax: e.target.value.replace(/[^0-9]/g, '') })} className={`${field} w-full`} placeholder="любой" />
            </label>
            {(custom.discipline === 'kumite' || custom.discipline === 'other') && (
              <>
                <label>
                  <span className="block text-xs font-medium text-[var(--app-text-muted)] mb-1">Вес больше, кг</span>
                  <input inputMode="decimal" value={custom.weightMin} onChange={(e) => setCustom({ ...custom, weightMin: e.target.value.replace(',', '.').replace(/[^0-9.]/g, '') })} className={`${field} w-full`} placeholder="необязательно" />
                </label>
                <label>
                  <span className="block text-xs font-medium text-[var(--app-text-muted)] mb-1">Вес до, кг</span>
                  <input inputMode="decimal" value={custom.weightMax} onChange={(e) => setCustom({ ...custom, weightMax: e.target.value.replace(',', '.').replace(/[^0-9.]/g, '') })} className={`${field} w-full`} placeholder="необязательно" />
                </label>
              </>
            )}
            <label>
              <span className="block text-xs font-medium text-[var(--app-text-muted)] mb-1">Взнос, {currency}</span>
              <NumberField value={custom.fee} onValueChange={(n) => setCustom({ ...custom, fee: n })} className={`${field} w-full`} />
            </label>
            <label>
              <span className="block text-xs font-medium text-[var(--app-text-muted)] mb-1">Длительность, сек</span>
              <NumberField value={custom.duration} emptyValue={120} onValueChange={(n) => setCustom({ ...custom, duration: n })} className={`${field} w-full`} />
            </label>
          </div>
          {customError && <p className="text-sm text-red-600">{customError}</p>}
          {customAdded && !customError && <p className="text-sm text-emerald-700">Добавлено: «{customAdded}»</p>}
          <button onClick={addCustom} disabled={!tid} className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-sm font-semibold disabled:opacity-40 cursor-pointer">
            <Plus className="w-4 h-4" /> Добавить категорию
          </button>
        </section>
      </div>

      {onUpdateTournament && tournaments.find((t) => t.id === tid) && (
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
          <h2 className="font-semibold text-[var(--app-text-primary)] flex-1">Категории турнира ({cats.length})</h2>
          <span className="text-sm text-[var(--app-text-muted)]">Заявок: {entriesTotal}</span>
        </div>
        {cats.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--app-text-muted)]">Категорий пока нет. Добавьте стандартный набор WKF или свою категорию.</div>
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
                      <span className="text-sm text-[var(--app-text-primary)]">{categoryName(c)}</span>
                    </button>
                    <span className="text-xs text-[var(--app-text-muted)] w-24">{entries.length} заяв.</span>
                    <span className="text-xs text-[var(--app-text-muted)] w-20">{c.fee} {currency}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-md ${catBouts.length ? 'bg-emerald-600/10 text-emerald-700' : 'bg-[var(--app-surface-subtle)] text-[var(--app-text-muted)]'}`}>
                      {catBouts.length ? (started ? 'идут бои' : 'сетка готова') : c.isClosed ? 'приём закрыт' : 'приём заявок'}
                    </span>
                    <select value={tatami} onChange={(e) => setTatamiFor({ ...tatamiFor, [c.id]: Number(e.target.value) })} className={`${field} h-8 py-0`} title="Татами">
                      {tatamiNumbers.map((n) => (
                        <option key={n} value={n}>Татами {n}</option>
                      ))}
                    </select>
                    <button
                      disabled={entries.length < 2 || started}
                      onClick={() =>
                        setConfirm({
                          text: catBouts.length
                            ? `Провести жеребьёвку заново для «${categoryName(c)}»? Текущая сетка будет заменена.`
                            : `Провести жеребьёвку для «${categoryName(c)}» (${entries.length} участн.) на татами ${tatami}? Приём заявок в категорию закроется.`,
                          run: () => {
                            onDraw(c, tatami);
                            patch(c.id, { isClosed: true });
                          }
                        })
                      }
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-xs font-semibold disabled:opacity-40 cursor-pointer"
                      title={entries.length < 2 ? 'Нужно минимум 2 участника' : started ? 'Бои уже начались' : 'Жеребьёвка'}
                    >
                      <Shuffle className="w-3.5 h-3.5" /> {catBouts.length ? 'Заново' : 'Жеребьёвка'}
                    </button>
                    {catBouts.length > 0 && (
                      <a href={printUrl({ kind: 'bracket', eventId: c.tournamentId, categoryId: c.id })} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg text-[var(--app-text-muted)] hover:text-[var(--app-text-primary)]" title="Печать сетки / PDF">
                        <Printer className="w-4 h-4" />
                      </a>
                    )}
                    <a href={printUrl({ kind: 'entries', eventId: c.tournamentId, categoryId: c.id })} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg text-[var(--app-text-muted)] hover:text-[var(--app-text-primary)]" title="Стартовый лист / PDF">
                      <ListChecks className="w-4 h-4" />
                    </a>
                    <button onClick={() => patch(c.id, { isClosed: !c.isClosed })} className="p-1.5 rounded-lg text-[var(--app-text-muted)] hover:text-[var(--app-text-primary)] cursor-pointer" title={c.isClosed ? 'Открыть приём заявок' : 'Закрыть приём заявок'}>
                      {c.isClosed ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </button>
                    <button
                      disabled={entries.length > 0 || catBouts.length > 0}
                      onClick={() => remove(c.id)}
                      className="p-1.5 rounded-lg text-[var(--app-text-muted)] hover:text-red-600 disabled:opacity-30 cursor-pointer"
                      title={entries.length ? 'Сначала отзовите заявки' : 'Удалить категорию'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {open === c.id && (
                    <div className="px-4 pb-3">
                      {entries.length === 0 ? (
                        <div className="text-sm text-[var(--app-text-muted)] py-2">Заявок пока нет.</div>
                      ) : (
                        <table className="w-full text-sm">
                          <tbody>
                            {entries.map((p) => (
                              <tr key={p.id} className="border-t border-[var(--app-border)]">
                                <td className="py-1.5 text-[var(--app-text-primary)]">{isTeamCategory(c) ? `${p.teamName}${p.teamMembers?.length ? ` (${p.teamMembers.join(', ')})` : ''}` : `${p.lastName} ${p.firstName}`}</td>
                                <td className="py-1.5 text-[var(--app-text-muted)]">{[p.clubName, p.city, p.country].filter(Boolean).join(' · ')}</td>
                                <td className="py-1.5 text-[var(--app-text-muted)] tabular-nums">{p.birthDate}</td>
                                <td className="py-1.5 text-[var(--app-text-muted)] tabular-nums">{p.declaredWeightKg ? `${p.declaredWeightKg} кг` : ''}</td>
                                <td className="py-1.5 text-right">
                                  <button onClick={() => setConfirm({ text: `Отозвать заявку: ${p.teamName || `${p.lastName} ${p.firstName}`}?`, run: () => onWithdraw(p.id) })} className="text-xs text-[var(--app-text-muted)] hover:text-red-600 cursor-pointer">
                                    Отозвать
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
              <button onClick={() => setConfirm(null)} className="h-10 px-4 rounded-lg border border-[var(--app-border)] text-[var(--app-text-primary)] cursor-pointer">Отмена</button>
              <button onClick={() => { confirm.run(); setConfirm(null); }} className="h-10 px-4 rounded-lg bg-[var(--accent)] text-white font-semibold cursor-pointer">Подтвердить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
