import React from 'react';
import { UserPlus, Trash2, Users, CheckCircle2, AlertTriangle, ClipboardList, X } from 'lucide-react';
import type { AuthenticatedUserProfile, BeltRank, EventCategory, Gender, Participant, Tournament } from '../types/schema';
import { BELT_LABELS, BELT_CHOICES, categoryFits, categoryName, isTeamCategory } from '../utils/eventCategories';
import { COUNTRIES, flagEmoji, countryByNoc } from '../utils/countries';
import { transliterate } from '../utils/names';
import { formatBirthInput, parseBirthText } from '../utils/dateInput';
import { useApp } from '../context/AppContext';
import { sanitizePricing, quoteEntries, countPaidBefore, athleteKey, bishkekDate, categoryPrice, currentPeriod, type QuoteLine } from '../utils/pricing';
import { clockNow } from '../utils/serverClock';

const tl = (lang: string, ru: string, ky: string, en: string) => (lang === 'ky' ? ky : lang === 'en' ? en : ru);

interface EntryFormProps {
  tournaments: Tournament[];
  categories: EventCategory[];
  participants: Participant[];
  currentUser: AuthenticatedUserProfile;
  initialTournamentId?: string;
  currency?: string;
}

interface AthleteDraft {
  key: string;
  lastName: string;
  firstName: string;
  birthDate: string; // ГГГГ-ММ-ДД, заполняется только когда дата введена правильно
  birthText: string; // что набрал человек: ДД.ММ.ГГГГ
  gender: Gender;
  weightKg: string;
  beltRank: BeltRank;
  beltOther: string;
  categoryIds: string[];
  lastNameLatin: string;
  firstNameLatin: string;
}

const blankAthlete = (): AthleteDraft => ({
  key: Math.random().toString(36).slice(2),
  lastName: '',
  firstName: '',
  birthDate: '',
  birthText: '',
  gender: 'male',
  weightKg: '',
  beltRank: 'white_10kyu',
  beltOther: '',
  categoryIds: [],
  lastNameLatin: '',
  firstNameLatin: ''
});

const field = 'w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-primary)] px-3 py-2 text-sm';
const label = 'block text-xs font-medium text-[var(--app-text-secondary)] mb-1';

/** Entry form for athletes, parents and coaches (coach: many athletes and teams at once). */
export const EntryForm: React.FC<EntryFormProps> = ({ tournaments, categories, participants, currentUser, initialTournamentId, currency = 'сом' }) => {
  const isCoach = currentUser.role === 'club_coach' || currentUser.role === 'admin' || currentUser.role === 'chief_referee' || currentUser.role === 'scorekeeper';
  const open = tournaments.filter((t) => categories.some((c) => c.tournamentId === t.id && !c.isClosed) && t.status !== 'completed');
  const [tournamentId, setTournamentId] = React.useState(
    open.some((t) => t.id === initialTournamentId) ? initialTournamentId! : open[0]?.id || ''
  );
  const tournament = tournaments.find((t) => t.id === tournamentId);
  const cats = categories.filter((c) => c.tournamentId === tournamentId && !c.isClosed);
  const teamCats = cats.filter(isTeamCategory);

  const [club, setClub] = React.useState(currentUser.clubName || '');
  const [city, setCity] = React.useState('');
  const [countryCode, setCountryCode] = React.useState('KGZ');
  const country = countryByNoc(countryCode)?.ru || '';
  const [athletes, setAthletes] = React.useState<AthleteDraft[]>(() => {
    if (isCoach) return [blankAthlete()];
    const [last = '', first = ''] = currentUser.fullName.split(' ');
    return [{ ...blankAthlete(), lastName: last, firstName: first }];
  });
  const [teams, setTeams] = React.useState<{ key: string; categoryId: string; teamName: string; members: string }[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<string | null>(null);

  const update = (key: string, patch: Partial<AthleteDraft>) =>
    setAthletes((list) => list.map((a) => (a.key === key ? { ...a, ...patch } : a)));

  const addSelf = () => {
    const [last = '', first = ''] = currentUser.fullName.split(' ');
    setAthletes((list) => [...list, { ...blankAthlete(), lastName: last, firstName: first }]);
  };

  const individualCats = cats.filter((c) => !isTeamCategory(c));
  const eligibleFor = (a: AthleteDraft) =>
    individualCats.map((c) => ({
      c,
      fit: categoryFits(c, { birthDate: a.birthDate, gender: a.gender, weightKg: a.weightKg ? Number(a.weightKg) : null, beltRank: a.beltRank }, tournament?.startDate || '')
    }));

  const entries = [
    ...athletes.flatMap((a) =>
      a.categoryIds
        .filter((id) => cats.some((c) => c.id === id))
        .map((categoryId) => ({
          categoryId,
          lastName: a.lastName,
          firstName: a.firstName,
          birthDate: a.birthDate,
          gender: a.gender,
          declaredWeightKg: a.weightKg ? Number(a.weightKg) : 0,
          beltRank: a.beltRank,
          beltOther: a.beltRank === 'other' ? a.beltOther.trim() : undefined,
          lastNameLatin: a.lastNameLatin || transliterate(a.lastName),
          firstNameLatin: a.firstNameLatin || transliterate(a.firstName),
          clubName: club,
          city,
          country,
          countryCode
        }))
    ),
    ...teams
      .filter((t) => t.categoryId && t.teamName.trim())
      .map((t) => ({
        categoryId: t.categoryId,
        teamName: t.teamName,
        teamMembers: t.members.split(',').map((m) => m.trim()).filter(Boolean),
        gender: cats.find((c) => c.id === t.categoryId)?.gender,
        clubName: club,
        city,
        country,
        countryCode
      }))
  ];
  // Fee estimate: price period of today and the next-category discount. The server recalculates and fixes the amount.
  const { language } = useApp();
  const pricing = sanitizePricing(tournament?.pricing);
  const today = bishkekDate(new Date(clockNow()));
  const period = currentPeriod(pricing, today);
  const quoteKeys: string[] = [];
  const quote = quoteEntries(
    [
      ...athletes.flatMap((a) =>
        a.categoryIds
          .map((id) => cats.find((c) => c.id === id))
          .filter((c): c is EventCategory => Boolean(c))
          .map((c) => {
            quoteKeys.push(`${a.key}:${c.id}`);
            return { category: c, athleteKey: athleteKey(a.lastName, a.firstName, a.birthDate) };
          })
      ),
      ...teams
        .filter((t) => t.categoryId && t.teamName.trim())
        .map((t) => cats.find((c) => c.id === t.categoryId))
        .filter((c): c is EventCategory => Boolean(c))
        .map((c) => {
          quoteKeys.push(`team:${c.id}`);
          return { category: c, athleteKey: null };
        })
    ],
    pricing,
    today,
    countPaidBefore(participants, categories, tournamentId)
  );
  const lineFor = new Map<string, QuoteLine>(quoteKeys.map((k, i) => [k, quote.lines[i]]));
  const total = quote.total;
  const discounted = quote.lines.filter((l) => l.kind === 'additional').length;

  const submit = async () => {
    setError(null);
    setDone(null);
    if (entries.length === 0) {
      setError('Отметьте хотя бы одну категорию.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Заявка не отправлена');
      const due = (data.entries as { feeAmount?: number }[]).reduce((sum, e) => sum + (e.feeAmount || 0), 0);
      setDone(`${tl(language, 'Отправлено заявок', 'Жөнөтүлгөн табыштамалар', 'Entries sent')}: ${data.entries.length}. ${due > 0 ? `${tl(language, 'К оплате', 'Төлөөгө', 'To pay')}: ${due} ${currency}.` : ''}`);
      setAthletes(isCoach ? [blankAthlete()] : athletes.map((a) => ({ ...a, categoryIds: [] })));
      setTeams([]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const withdraw = async (id: string) => {
    const res = await fetch(`/api/entries/${encodeURIComponent(id)}/withdraw`, { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) setError(data.error || 'Не удалось отозвать заявку');
  };

  const mine = participants
    .filter((p) => p.createdBy === currentUser.id && p.tournamentId === tournamentId)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  if (open.length === 0) {
    return (
      <div className="theme-keep rounded-2xl border border-dashed border-[var(--app-border)] p-10 text-center">
        <ClipboardList className="w-8 h-8 mx-auto text-[var(--app-text-muted)]" />
        <div className="mt-3 font-semibold text-[var(--app-text-primary)]">Сейчас нет турниров с открытым приёмом заявок</div>
        <div className="text-sm text-[var(--app-text-muted)] mt-1">Как только организатор добавит категории, здесь можно будет подать заявку.</div>
      </div>
    );
  }

  return (
    <div className="theme-keep space-y-5 pb-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--app-text-primary)]">Подать заявку</h1>
        <p className="text-[15px] text-[var(--app-text-secondary)] mt-1">
          {isCoach
            ? 'Добавьте учеников — сайт сам покажет подходящие категории по возрасту, полу и весу.'
            : 'Заполните данные — сайт сам покажет подходящие категории по возрасту, полу и весу.'}
        </p>
      </div>

      <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 grid gap-3 md:grid-cols-4">
        <div className="md:col-span-4">
          <label className={label} htmlFor="entry-tournament">Турнир</label>
          <select id="entry-tournament" value={tournamentId} onChange={(e) => setTournamentId(e.target.value)} className={field}>
            {open.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} — {t.city}, {t.startDate}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="entry-club">Клуб</label>
          <input id="entry-club" value={club} onChange={(e) => setClub(e.target.value)} className={field} placeholder="СК «Тигр»" />
        </div>
        <div>
          <label className={label} htmlFor="entry-city">Город</label>
          <input id="entry-city" value={city} onChange={(e) => setCity(e.target.value)} className={field} placeholder="Бишкек" />
        </div>
        <div className="md:col-span-2">
          <label className={label} htmlFor="entry-country">Страна (код NOC)</label>
          <select id="entry-country" value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className={field}>
            {COUNTRIES.map((c) => (
              <option key={c.noc} value={c.noc}>
                {flagEmoji(c.iso2)} {c.ru} · {c.noc}
              </option>
            ))}
          </select>
        </div>
      </section>

      {athletes.map((a, idx) => {
        const options = eligibleFor(a);
        const fits = options.filter((o) => o.fit.ok);
        const filled = a.birthDate && (a.lastName || a.firstName);
        return (
          <section key={a.key} className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[var(--app-text-primary)]">Спортсмен {athletes.length > 1 ? idx + 1 : ''}</span>
              <span className="flex-1" />
              {athletes.length > 1 && (
                <button onClick={() => setAthletes((l) => l.filter((x) => x.key !== a.key))} className="p-1.5 rounded-lg text-[var(--app-text-muted)] hover:text-red-600 cursor-pointer" title="Убрать">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <div className="lg:col-span-2">
                <label className={label} htmlFor={`a-last-${a.key}`}>Фамилия</label>
                <input id={`a-last-${a.key}`} value={a.lastName} onChange={(e) => update(a.key, { lastName: e.target.value })} className={field} />
              </div>
              <div className="lg:col-span-2">
                <label className={label} htmlFor={`a-first-${a.key}`}>Имя</label>
                <input id={`a-first-${a.key}`} value={a.firstName} onChange={(e) => update(a.key, { firstName: e.target.value })} className={field} />
              </div>
              <div className="lg:col-span-2">
                <label className={label} htmlFor={`a-birth-${a.key}`}>Дата рождения</label>
                <input
                  id={`a-birth-${a.key}`}
                  type="text"
                  inputMode="numeric"
                  autoComplete="bday"
                  maxLength={10}
                  placeholder="20.01.1991"
                  value={a.birthText}
                  onChange={(e) => {
                    const birthText = formatBirthInput(e.target.value);
                    update(a.key, { birthText, birthDate: parseBirthText(birthText), categoryIds: [] });
                  }}
                  aria-invalid={a.birthText.length === 10 && !a.birthDate}
                  className={field}
                />
                {a.birthText.length === 10 && !a.birthDate && (
                  <p className="mt-1 text-xs text-red-600">Проверьте дату: день.месяц.год, например 20.01.1991</p>
                )}
              </div>
              <div className="lg:col-span-2">
                <label className={label} htmlFor={`a-gender-${a.key}`}>Пол</label>
                <select id={`a-gender-${a.key}`} value={a.gender} onChange={(e) => update(a.key, { gender: e.target.value as Gender, categoryIds: [] })} className={field}>
                  <option value="male">Мужской</option>
                  <option value="female">Женский</option>
                </select>
              </div>
              <div className="lg:col-span-2">
                <label className={label} htmlFor={`a-weight-${a.key}`}>Вес, кг</label>
                <input id={`a-weight-${a.key}`} type="text" inputMode="decimal" value={a.weightKg} onChange={(e) => update(a.key, { weightKg: e.target.value.replace(',', '.').replace(/[^0-9.]/g, ''), categoryIds: [] })} className={field} />
              </div>
              <div className="lg:col-span-2">
                <label className={label} htmlFor={`a-belt-${a.key}`}>Пояс</label>
                <select id={`a-belt-${a.key}`} value={a.beltRank} onChange={(e) => update(a.key, { beltRank: e.target.value as BeltRank, categoryIds: [] })} className={field}>
                  {BELT_CHOICES.map((b) => (
                    <option key={b} value={b}>
                      {BELT_LABELS[b]}
                    </option>
                  ))}
                </select>
                {a.beltRank === 'other' && (
                  <input
                    aria-label="Укажите ваш пояс"
                    value={a.beltOther}
                    maxLength={40}
                    placeholder="Укажите ваш пояс"
                    onChange={(e) => update(a.key, { beltOther: e.target.value })}
                    className={`${field} mt-2`}
                  />
                )}
              </div>
              <div className="lg:col-span-3">
                <label className={label} htmlFor={`a-lastlat-${a.key}`}>Фамилия латиницей (как в паспорте)</label>
                <input id={`a-lastlat-${a.key}`} value={a.lastNameLatin} placeholder={transliterate(a.lastName) || 'напр. Abdykadyrov'} onChange={(e) => update(a.key, { lastNameLatin: e.target.value })} className={field} />
              </div>
              <div className="lg:col-span-3">
                <label className={label} htmlFor={`a-firstlat-${a.key}`}>Имя латиницей</label>
                <input id={`a-firstlat-${a.key}`} value={a.firstNameLatin} placeholder={transliterate(a.firstName) || 'напр. Adilet'} onChange={(e) => update(a.key, { firstNameLatin: e.target.value })} className={field} />
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-[var(--app-text-primary)] mb-2">Категории</div>
              {!filled ? (
                <div className="text-sm text-[var(--app-text-muted)]">Укажите имя и дату рождения — появятся подходящие категории.</div>
              ) : fits.length === 0 ? (
                <div className="text-sm text-amber-700 inline-flex items-start gap-1.5">
                  <AlertTriangle className="w-4 h-4 mt-0.5" />
                  Нет подходящих категорий: {Array.from(new Set(options.flatMap((o) => o.fit.reasons))).slice(0, 3).join('; ') || 'проверьте данные'}.
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {fits.map(({ c }) => {
                    const checked = a.categoryIds.includes(c.id);
                    const line = checked ? lineFor.get(`${a.key}:${c.id}`) : undefined;
                    const price = line ? line.amount : categoryPrice(c, period);
                    return (
                      <label key={c.id} className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 cursor-pointer ${checked ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--app-border)]'}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => update(a.key, { categoryIds: e.target.checked ? [...a.categoryIds, c.id] : a.categoryIds.filter((x) => x !== c.id) })}
                        />
                        <span className="flex-1 text-sm text-[var(--app-text-primary)]">{categoryName(c)}</span>
                        <span className="text-xs text-[var(--app-text-muted)] whitespace-nowrap text-right">
                          {c.fee ? `${price} ${currency}` : tl(language, 'бесплатно', 'акысыз', 'free')}
                          {line?.kind === 'additional' && <span className="block text-emerald-700">{tl(language, 'след. категория', 'кийинки категория', 'next category')}</span>}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        );
      })}

      {isCoach && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setAthletes((l) => [...l, blankAthlete()])} className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-[var(--app-border)] text-sm text-[var(--app-text-primary)] hover:bg-[var(--app-surface-subtle)] cursor-pointer">
            <UserPlus className="w-4 h-4" /> Добавить спортсмена
          </button>
          {currentUser.alsoCompetes && (
            <button onClick={addSelf} className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-[var(--app-border)] text-sm text-[var(--app-text-primary)] hover:bg-[var(--app-surface-subtle)] cursor-pointer">
              <UserPlus className="w-4 h-4" /> Добавить себя
            </button>
          )}
          {teamCats.length > 0 && (
            <button
              onClick={() => setTeams((l) => [...l, { key: Math.random().toString(36).slice(2), categoryId: teamCats[0].id, teamName: '', members: '' }])}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-[var(--app-border)] text-sm text-[var(--app-text-primary)] hover:bg-[var(--app-surface-subtle)] cursor-pointer"
            >
              <Users className="w-4 h-4" /> Добавить команду
            </button>
          )}
        </div>
      )}

      {teams.map((t) => (
        <section key={t.key} className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 grid gap-3 md:grid-cols-3">
          <div>
            <label className={label} htmlFor={`t-cat-${t.key}`}>Командная категория</label>
            <select id={`t-cat-${t.key}`} value={t.categoryId} onChange={(e) => setTeams((l) => l.map((x) => (x.key === t.key ? { ...x, categoryId: e.target.value } : x)))} className={field}>
              {teamCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {categoryName(c)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor={`t-name-${t.key}`}>Название команды</label>
            <input id={`t-name-${t.key}`} value={t.teamName} onChange={(e) => setTeams((l) => l.map((x) => (x.key === t.key ? { ...x, teamName: e.target.value } : x)))} className={field} placeholder="СК «Тигр» 1" />
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className={label} htmlFor={`t-members-${t.key}`}>Участники (через запятую)</label>
              <input id={`t-members-${t.key}`} value={t.members} onChange={(e) => setTeams((l) => l.map((x) => (x.key === t.key ? { ...x, members: e.target.value } : x)))} className={field} />
            </div>
            <button onClick={() => setTeams((l) => l.filter((x) => x.key !== t.key))} className="h-10 w-10 rounded-lg text-[var(--app-text-muted)] hover:text-red-600 cursor-pointer" title="Убрать">
              <X className="w-4 h-4 mx-auto" />
            </button>
          </div>
        </section>
      ))}

      <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] text-[var(--app-text-primary)]">
          <div className="font-semibold">Заявок: {entries.length}</div>
          <div className="text-sm text-[var(--app-text-muted)]">
            {tl(language, 'Взнос', 'Төлөм', 'Fee')}: {total} {currency}
            {period && ` · ${period.name || tl(language, 'текущий период', 'учурдагы мезгил', 'current period')}`}
            {discounted > 0 && ` · ${tl(language, 'со скидкой за следующие категории', 'кийинки категорияларга арзандатуу менен', 'with next-category discount')}: ${discounted}`}
          </div>
          {total > 0 && (
            <div className="text-xs text-[var(--app-text-muted)]">
              {tl(language, 'Точную сумму сайт посчитает при отправке и покажет в «Мои заявки».', 'Так сумманы сайт жөнөтүүдө эсептеп, «Менин табыштамаларым» бөлүмүндө көрсөтөт.', 'The exact amount is calculated when you submit and shown in «My entries».')}
            </div>
          )}
        </div>
        <button onClick={submit} disabled={busy || entries.length === 0} className="h-11 px-6 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white font-semibold disabled:opacity-40 cursor-pointer">
          {busy ? 'Отправка…' : 'Отправить заявку'}
        </button>
        {error && <div className="w-full text-sm text-red-600">{error}</div>}
        {done && (
          <div className="w-full text-sm text-emerald-700 inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> {done}
          </div>
        )}
      </section>

      {mine.length > 0 && (
        <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] overflow-hidden">
          <h2 className="px-4 py-3 font-semibold text-[var(--app-text-primary)] border-b border-[var(--app-border)]">Мои заявки на этот турнир</h2>
          <ul className="divide-y divide-[var(--app-border)]">
            {mine.map((p) => {
              const c = categories.find((x) => x.id === p.categoryId);
              return (
                <li key={p.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <div className="flex-1 min-w-0">
                    <div className="text-[var(--app-text-primary)] truncate">{p.teamName || `${p.lastName} ${p.firstName}`}</div>
                    <div className="text-xs text-[var(--app-text-muted)] truncate">{c ? categoryName(c) : 'категория удалена'}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-md ${p.status === 'withdrawn' ? 'bg-[var(--app-surface-subtle)] text-[var(--app-text-muted)]' : 'bg-emerald-600/10 text-emerald-700'}`}>
                    {p.status === 'withdrawn' ? 'отозвана' : p.status === 'registered' ? 'принята' : 'в сетке'}
                  </span>
                  {p.status === 'registered' && (
                    <button onClick={() => withdraw(p.id)} className="text-xs text-[var(--app-text-muted)] hover:text-red-600 cursor-pointer">
                      Отозвать
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
};
