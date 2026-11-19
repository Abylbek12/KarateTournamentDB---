import React from 'react';
import { UserPlus, Search, Pencil, Archive, ArchiveRestore, Users, CheckCircle2, History, X } from 'lucide-react';
import type { AuthenticatedUserProfile, BeltRank } from '../types/schema';
import { BELT_CHOICES, BELT_LABELS, beltName } from '../utils/eventCategories';
import { formatBirthInput, parseBirthText, isoToBirthText } from '../utils/dateInput';
import { transliterate } from '../utils/names';
import { useApp } from '../context/AppContext';
import { useAthletes, fullName } from '../utils/useAthletes';
import type { ClubAthlete, ClubAthleteInput } from '../utils/athletes';

const tl = (lang: string, ru: string, ky: string, en: string) => (lang === 'ky' ? ky : lang === 'en' ? en : ru);
const field = 'w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-primary)] px-3 py-2 text-sm';
const label = 'block text-xs font-medium text-[var(--app-text-secondary)] mb-1';
const button = 'inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-[var(--app-border)] text-sm text-[var(--app-text-primary)] hover:bg-[var(--app-surface-subtle)] cursor-pointer disabled:opacity-40';

interface Draft {
  lastName: string;
  firstName: string;
  birthText: string;
  gender: 'male' | 'female';
  beltRank: BeltRank;
  beltOther: string;
  weightKg: string;
  licenseNumber: string;
  lastNameLatin: string;
  firstNameLatin: string;
}

const toDraft = (a?: ClubAthlete): Draft => ({
  lastName: a?.lastName || '',
  firstName: a?.firstName || '',
  birthText: isoToBirthText(a?.birthDate || ''),
  gender: a?.gender || 'male',
  beltRank: (a?.beltRank as BeltRank) || 'white_10kyu',
  beltOther: a?.beltOther || '',
  weightKg: a?.weightKg ? String(a.weightKg) : '',
  licenseNumber: a?.licenseNumber || '',
  lastNameLatin: a?.lastNameLatin || '',
  firstNameLatin: a?.firstNameLatin || ''
});

const fromDraft = (d: Draft): ClubAthleteInput => ({
  lastName: d.lastName,
  firstName: d.firstName,
  birthDate: parseBirthText(d.birthText),
  gender: d.gender,
  beltRank: d.beltRank,
  beltOther: d.beltRank === 'other' ? d.beltOther : undefined,
  weightKg: (d.weightKg ? Number(d.weightKg) : null) as number | undefined, // null clears the weight on the server
  licenseNumber: d.licenseNumber,
  lastNameLatin: d.lastNameLatin || transliterate(d.lastName),
  firstNameLatin: d.firstNameLatin || transliterate(d.firstName)
});

/** Card form: add a new athlete or change one. */
const AthleteEditor: React.FC<{ initial?: ClubAthlete; onSave: (input: ClubAthleteInput) => Promise<void>; onCancel: () => void }> = ({ initial, onSave, onCancel }) => {
  const { language } = useApp();
  const [d, setD] = React.useState<Draft>(() => toDraft(initial));
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const set = (patch: Partial<Draft>) => setD((x) => ({ ...x, ...patch }));
  const birthBad = d.birthText.length === 10 && !parseBirthText(d.birthText);
  const ready = d.lastName.trim() && d.firstName.trim() && parseBirthText(d.birthText);
  const id = initial?.id || 'new';

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await onSave(fromDraft(d));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-[var(--accent)] bg-[var(--app-surface)] p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-[var(--app-text-primary)]">
          {initial ? tl(language, 'Изменить спортсмена', 'Спортчуну өзгөртүү', 'Edit athlete') : tl(language, 'Новый спортсмен', 'Жаңы спортчу', 'New athlete')}
        </span>
        <span className="flex-1" />
        <button onClick={onCancel} className="p-1.5 rounded-lg text-[var(--app-text-muted)] hover:text-[var(--app-text-primary)] cursor-pointer" aria-label={tl(language, 'Закрыть', 'Жабуу', 'Close')}>
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <label className={label} htmlFor={`ath-last-${id}`}>{tl(language, 'Фамилия', 'Фамилиясы', 'Surname')}</label>
          <input id={`ath-last-${id}`} value={d.lastName} maxLength={80} onChange={(e) => set({ lastName: e.target.value })} className={field} />
        </div>
        <div className="lg:col-span-2">
          <label className={label} htmlFor={`ath-first-${id}`}>{tl(language, 'Имя', 'Аты', 'Name')}</label>
          <input id={`ath-first-${id}`} value={d.firstName} maxLength={80} onChange={(e) => set({ firstName: e.target.value })} className={field} />
        </div>
        <div className="lg:col-span-2">
          <label className={label} htmlFor={`ath-birth-${id}`}>{tl(language, 'Дата рождения', 'Туулган күнү', 'Date of birth')}</label>
          <input
            id={`ath-birth-${id}`}
            type="text"
            inputMode="numeric"
            maxLength={10}
            placeholder="20.01.2014"
            value={d.birthText}
            onChange={(e) => set({ birthText: formatBirthInput(e.target.value) })}
            aria-invalid={birthBad}
            className={field}
          />
          {birthBad && <p className="mt-1 text-xs text-red-600">{tl(language, 'Проверьте дату: день.месяц.год', 'Датаны текшериңиз: күн.ай.жыл', 'Check the date: day.month.year')}</p>}
        </div>
        <div className="lg:col-span-2">
          <label className={label} htmlFor={`ath-gender-${id}`}>{tl(language, 'Пол', 'Жынысы', 'Gender')}</label>
          <select id={`ath-gender-${id}`} value={d.gender} onChange={(e) => set({ gender: e.target.value as Draft['gender'] })} className={field}>
            <option value="male">{tl(language, 'Мужской', 'Эркек', 'Male')}</option>
            <option value="female">{tl(language, 'Женский', 'Аял', 'Female')}</option>
          </select>
        </div>
        <div className="lg:col-span-2">
          <label className={label} htmlFor={`ath-belt-${id}`}>{tl(language, 'Пояс', 'Кур', 'Belt')}</label>
          <select id={`ath-belt-${id}`} value={d.beltRank} onChange={(e) => set({ beltRank: e.target.value as BeltRank })} className={field}>
            {BELT_CHOICES.map((b) => (
              <option key={b} value={b}>{BELT_LABELS[b]}</option>
            ))}
          </select>
          {d.beltRank === 'other' && (
            <input aria-label={tl(language, 'Какой пояс', 'Кайсы кур', 'Which belt')} value={d.beltOther} maxLength={40} onChange={(e) => set({ beltOther: e.target.value })} className={`${field} mt-2`} placeholder={tl(language, 'Какой пояс', 'Кайсы кур', 'Which belt')} />
          )}
        </div>
        <div className="lg:col-span-1">
          <label className={label} htmlFor={`ath-weight-${id}`}>{tl(language, 'Вес, кг', 'Салмагы, кг', 'Weight, kg')}</label>
          <input id={`ath-weight-${id}`} type="text" inputMode="decimal" value={d.weightKg} onChange={(e) => set({ weightKg: e.target.value.replace(',', '.').replace(/[^0-9.]/g, '') })} className={field} />
        </div>
        <div className="lg:col-span-1">
          <label className={label} htmlFor={`ath-license-${id}`}>{tl(language, 'Лицензия', 'Лицензия', 'Licence')}</label>
          <input id={`ath-license-${id}`} value={d.licenseNumber} maxLength={40} onChange={(e) => set({ licenseNumber: e.target.value })} className={field} placeholder={tl(language, 'если есть', 'бар болсо', 'if any')} />
        </div>
        <div className="lg:col-span-3">
          <label className={label} htmlFor={`ath-lastlat-${id}`}>{tl(language, 'Фамилия латиницей (как в паспорте)', 'Фамилиясы латынча (паспорттогудай)', 'Surname in Latin letters (as in passport)')}</label>
          <input id={`ath-lastlat-${id}`} value={d.lastNameLatin} maxLength={80} placeholder={transliterate(d.lastName)} onChange={(e) => set({ lastNameLatin: e.target.value })} className={field} />
        </div>
        <div className="lg:col-span-3">
          <label className={label} htmlFor={`ath-firstlat-${id}`}>{tl(language, 'Имя латиницей', 'Аты латынча', 'Name in Latin letters')}</label>
          <input id={`ath-firstlat-${id}`} value={d.firstNameLatin} maxLength={80} placeholder={transliterate(d.firstName)} onChange={(e) => set({ firstNameLatin: e.target.value })} className={field} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={save} disabled={busy || !ready} className="h-10 px-5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-sm font-semibold disabled:opacity-40 cursor-pointer">
          {busy ? tl(language, 'Сохранение…', 'Сакталууда…', 'Saving…') : tl(language, 'Сохранить', 'Сактоо', 'Save')}
        </button>
        <button onClick={onCancel} className={button}>{tl(language, 'Отмена', 'Жокко чыгаруу', 'Cancel')}</button>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </section>
  );
};

/** «Мои спортсмены»: a coach or parent keeps athletes once and enters them into any tournament. */
export const AthletesPanel: React.FC<{ user: AuthenticatedUserProfile; onNewEntry: () => void }> = ({ user, onNewEntry }) => {
  const { language } = useApp();
  const roster = useAthletes(true);
  const [query, setQuery] = React.useState('');
  const [showArchived, setShowArchived] = React.useState(false);
  const [editing, setEditing] = React.useState<string | null>(null); // athlete id or 'new'
  const [suggested, setSuggested] = React.useState(0);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    roster.suggestions().then((list) => setSuggested(list.length)).catch(() => setSuggested(0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roster.athletes.length]);

  const active = roster.athletes.filter((a) => !a.archived);
  const archivedCount = roster.athletes.length - active.length;
  const q = query.trim().toLowerCase();
  const shown = (showArchived ? roster.athletes : active)
    .filter((a) => !q || `${a.lastName} ${a.firstName} ${a.lastNameLatin || ''} ${a.firstNameLatin || ''}`.toLowerCase().includes(q))
    .sort((a, b) => a.lastName.localeCompare(b.lastName, 'ru') || a.firstName.localeCompare(b.firstName, 'ru'));

  const importAll = async () => {
    setError(null);
    try {
      const added = await roster.importFromEntries();
      setMessage(`${tl(language, 'Добавлено из прошлых заявок', 'Мурунку табыштамалардан кошулду', 'Added from past entries')}: ${added}`);
      setSuggested(0);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const toggleArchive = async (a: ClubAthlete) => {
    setError(null);
    try {
      await roster.archive(a.id, !a.archived);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const isCoach = user.role === 'club_coach';

  return (
    <div className="theme-keep space-y-4 pb-8 max-w-5xl">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[220px]">
          <h1 className="text-2xl font-bold text-[var(--app-text-primary)]">{tl(language, 'Мои спортсмены', 'Менин спортчуларым', 'My athletes')}</h1>
          <p className="text-[15px] text-[var(--app-text-secondary)] mt-1">
            {isCoach
              ? tl(language, 'Внесите учеников один раз — потом заявляйте их на любой турнир в пару нажатий.', 'Окуучуларды бир жолу киргизиңиз — анан каалаган мелдешке эки баскыч менен каттаңыз.', 'Enter your athletes once, then enter them into any tournament in a couple of taps.')
              : tl(language, 'Внесите спортсмена (например, своих детей) один раз — потом заявляйте на любой турнир в пару нажатий.', 'Спортчуну (мисалы, балдарыңызды) бир жолу киргизиңиз — анан каалаган мелдешке эки баскыч менен каттаңыз.', 'Enter an athlete (for example, your children) once, then enter them into any tournament in a couple of taps.')}
          </p>
          <p className="text-xs text-[var(--app-text-muted)] mt-1">
            {tl(language, 'Эти данные видите только вы и администратор сайта.', 'Бул маалыматты сиз жана сайттын администратору гана көрөт.', 'Only you and the site administrator see this data.')}
          </p>
        </div>
        <button onClick={() => setEditing('new')} className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-sm font-semibold cursor-pointer">
          <UserPlus className="w-4 h-4" /> {tl(language, 'Добавить спортсмена', 'Спортчу кошуу', 'Add athlete')}
        </button>
      </div>

      {suggested > 0 && (
        <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-subtle)] p-4 flex flex-wrap items-center gap-3">
          <History className="w-5 h-5 text-[var(--accent)]" />
          <div className="flex-1 min-w-[200px] text-sm text-[var(--app-text-primary)]">
            {tl(language, 'В ваших прошлых заявках есть спортсмены, которых нет в базе', 'Мурунку табыштамаларыңызда базада жок спортчулар бар', 'Your past entries have athletes who are not in the list yet')}: <b>{suggested}</b>
          </div>
          <button onClick={importAll} className={button}>{tl(language, 'Добавить их в базу', 'Аларды базага кошуу', 'Add them to the list')}</button>
        </section>
      )}

      {editing === 'new' && (
        <AthleteEditor
          onCancel={() => setEditing(null)}
          onSave={async (input) => {
            const a = await roster.add(input);
            setEditing(null);
            setMessage(`${fullName(a)}: ${tl(language, 'добавлен(а)', 'кошулду', 'added')}`);
          }}
        />
      )}

      {roster.athletes.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-text-muted)]" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} className={`${field} pl-9`} placeholder={tl(language, 'Поиск по фамилии', 'Фамилиясы боюнча издөө', 'Search by surname')} aria-label={tl(language, 'Поиск по фамилии', 'Фамилиясы боюнча издөө', 'Search by surname')} />
          </label>
          <span className="text-sm text-[var(--app-text-muted)]">
            {tl(language, 'Всего', 'Баары', 'Total')}: {active.length}
          </span>
          {archivedCount > 0 && (
            <label className="inline-flex items-center gap-2 text-sm text-[var(--app-text-secondary)] cursor-pointer">
              <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
              {tl(language, 'Показать архив', 'Архивди көрсөтүү', 'Show archive')} ({archivedCount})
            </label>
          )}
        </div>
      )}

      {message && (
        <div className="text-sm text-emerald-700 inline-flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" /> {message}
        </div>
      )}
      {(error || roster.error) && <div className="text-sm text-red-600">{error || roster.error}</div>}

      {roster.loaded && roster.athletes.length === 0 && editing !== 'new' && (
        <div className="rounded-2xl border border-dashed border-[var(--app-border)] p-10 text-center">
          <Users className="w-8 h-8 mx-auto text-[var(--app-text-muted)]" />
          <div className="mt-3 font-semibold text-[var(--app-text-primary)]">{tl(language, 'Пока никого нет', 'Азырынча эч ким жок', 'Nobody here yet')}</div>
          <div className="text-sm text-[var(--app-text-muted)] mt-1">
            {tl(language, 'Нажмите «Добавить спортсмена». Спортсмены из новых заявок попадут сюда сами.', '«Спортчу кошуу» баскычын басыңыз. Жаңы табыштамалардагы спортчулар бул жерге өздөрү түшөт.', 'Tap «Add athlete». Athletes from new entries are added here automatically.')}
          </div>
        </div>
      )}

      {shown.length > 0 && (
        <ul className="space-y-2">
          {shown.map((a) =>
            editing === a.id ? (
              <li key={a.id}>
                <AthleteEditor
                  initial={a}
                  onCancel={() => setEditing(null)}
                  onSave={async (input) => {
                    await roster.update(a.id, input);
                    setEditing(null);
                    setMessage(`${fullName(input as ClubAthlete)}: ${tl(language, 'сохранено', 'сакталды', 'saved')}`);
                  }}
                />
              </li>
            ) : (
              <li key={a.id} className={`rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 flex flex-wrap items-center gap-3 ${a.archived ? 'opacity-60' : ''}`}>
                <div className="flex-1 min-w-[180px]">
                  <div className="font-medium text-[var(--app-text-primary)]">
                    {fullName(a)}
                    {a.archived && <span className="ml-2 text-xs text-[var(--app-text-muted)]">{tl(language, 'в архиве', 'архивде', 'archived')}</span>}
                  </div>
                  <div className="text-xs text-[var(--app-text-muted)]">
                    {isoToBirthText(a.birthDate)} · {a.gender === 'female' ? tl(language, 'жен.', 'аял', 'F') : tl(language, 'муж.', 'эркек', 'M')} · {beltName(a)}
                    {a.weightKg ? ` · ${a.weightKg} ${tl(language, 'кг', 'кг', 'kg')}` : ''}
                    {a.licenseNumber ? ` · ${tl(language, 'лиц.', 'лиц.', 'lic.')} ${a.licenseNumber}` : ''}
                  </div>
                </div>
                <button onClick={() => setEditing(a.id)} className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg text-sm text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-subtle)] cursor-pointer">
                  <Pencil className="w-4 h-4" /> {tl(language, 'Изменить', 'Өзгөртүү', 'Edit')}
                </button>
                <button onClick={() => toggleArchive(a)} className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg text-sm text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-subtle)] cursor-pointer">
                  {a.archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                  {a.archived ? tl(language, 'Вернуть', 'Кайтаруу', 'Restore') : tl(language, 'В архив', 'Архивге', 'Archive')}
                </button>
              </li>
            )
          )}
        </ul>
      )}

      {active.length > 0 && (
        <div className="pt-2">
          <button onClick={onNewEntry} className={button}>{tl(language, 'Заявить на турнир', 'Мелдешке каттоо', 'Enter a tournament')} →</button>
        </div>
      )}
    </div>
  );
};
