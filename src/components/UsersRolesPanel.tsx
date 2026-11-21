import React from 'react';
import { Users, RefreshCw, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { roleLabel, type AccessRole } from '../utils/access';
import { useApp } from '../context/AppContext';

const GROUP_I18N: Record<string, [ky: string, en: string]> = {
  athletes: ['Спортчулар', 'Athletes'],
  coaches: ['Машыктыруучулар', 'Coaches'],
  referees: ['Калыстар', 'Referees'],
  scorekeepers: ['Катчылар', 'Scorekeepers'],
  medics: ['Дарыгерлер', 'Doctors'],
  admins: ['Администраторлор', 'Administrators'],
  all: ['Баары', 'All']
};

interface UserRow {
  id: string;
  email: string;
  fullName: string;
  role: AccessRole;
  clubName?: string;
  alsoCompetes?: boolean;
  createdAt: string;
}

const ASSIGNABLE: AccessRole[] = ['athlete', 'club_coach', 'tatami_referee', 'scorekeeper', 'chief_referee', 'medical_officer', 'admin'];

type Group = 'athletes' | 'coaches' | 'referees' | 'scorekeepers' | 'medics' | 'admins' | 'all';
const GROUPS: { id: Group; label: string; test?: (u: { role: AccessRole; alsoCompetes?: boolean }) => boolean }[] = [
  // Coaches who also compete appear here too, so every competitor is in one list
  { id: 'athletes', label: 'Спортсмены', test: (u) => u.role === 'athlete' || (u.role === 'club_coach' && !!u.alsoCompetes) },
  { id: 'coaches', label: 'Тренеры', test: (u) => u.role === 'club_coach' },
  { id: 'referees', label: 'Судьи', test: (u) => u.role === 'tatami_referee' || u.role === 'chief_referee' },
  { id: 'scorekeepers', label: 'Секретари', test: (u) => u.role === 'scorekeeper' },
  { id: 'medics', label: 'Врачи', test: (u) => u.role === 'medical_officer' },
  { id: 'admins', label: 'Администраторы', test: (u) => u.role === 'admin' },
  { id: 'all', label: 'Все' }
];
const inGroup = (u: { role: AccessRole; alsoCompetes?: boolean }, g: Group) => {
  const test = GROUPS.find((x) => x.id === g)?.test;
  return !test || test(u);
};
const PAGE = 50;

/** Admin-only list of accounts with role assignment (uses /api/admin/users). */
export const UsersRolesPanel: React.FC<{ currentUserId?: string }> = ({ currentUserId }) => {
  const { language } = useApp();
  const tl = (ru: string, ky: string, en: string) => (language === 'ky' ? ky : language === 'en' ? en : ru);
  const groupLabel = (id: string, ru: string) => (language === 'ky' ? GROUP_I18N[id]?.[0] || ru : language === 'en' ? GROUP_I18N[id]?.[1] || ru : ru);
  const [users, setUsers] = React.useState<UserRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');
  const [pending, setPending] = React.useState<{ user: UserRow; role: AccessRole } | null>(null);
  const [saving, setSaving] = React.useState(false);
  // No tab is open at first; a second click on the open tab closes the list again
  const [group, setGroup] = React.useState<Group | null>(null);
  const [shown, setShown] = React.useState(PAGE);
  React.useEffect(() => setShown(PAGE), [group, query]);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tl('Не удалось загрузить пользователей', 'Колдонуучуларды жүктөө мүмкүн болгон жок', 'Could not load users'));
      setUsers(data.users);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  // The select only asks; the role changes after «Да, изменить» in the dialog below.
  const askRole = (user: UserRow, role: AccessRole) => {
    if (role !== user.role) setPending({ user, role });
  };

  const changeRole = async () => {
    if (!pending) return;
    const { user, role } = pending;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || tl('Не удалось изменить роль', 'Ролду өзгөртүү мүмкүн болгон жок', 'Could not change the role'));
        return;
      }
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role } : u)));
      setNotice(`${user.fullName}: ${tl('роль', 'роль', 'role')} «${roleLabel(role, language)}»`);
      setTimeout(() => setNotice(null), 3000);
    } catch {
      setError(tl('Нет связи с сервером.', 'Сервер менен байланыш жок.', 'No connection to the server.'));
    } finally {
      setSaving(false);
      setPending(null);
    }
  };

  const q = query.trim().toLowerCase();
  const matches = (u: UserRow) => !q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.clubName || '').toLowerCase().includes(q);
  // Newest registrations first, so the people who just signed up are at the top
  // While searching with every tab closed, look through everybody
  const shownGroup: Group | null = group ?? (q ? 'all' : null);
  const filtered = users
    .filter((u) => shownGroup !== null && inGroup(u, shownGroup) && matches(u))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const visible = filtered.slice(0, shown);
  const countOf = (g: Group) => users.filter((u) => inGroup(u, g) && matches(u)).length;

  return (
    <section className="theme-keep rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 sm:p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 shrink-0 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--app-text-primary)]">{tl('Пользователи и роли', 'Колдонуучулар жана ролдор', 'Users & roles')}</h2>
            <p className="text-xs text-[var(--app-text-muted)]">
              {tl('Новые пользователи регистрируются как спортсмен или тренер. Судей, секретарей и врачей назначаете вы.', 'Жаңы колдонуучулар спортчу же машыктыруучу катары катталат. Калыстарды, катчыларды жана дарыгерлерди сиз дайындайсыз.', 'New users sign up as athletes or coaches. You assign referees, scorekeepers and doctors.')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-subtle)]">
            <Search className="w-4 h-4 text-[var(--app-text-muted)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tl('Имя, email или клуб', 'Аты, email же клуб', 'Name, email or club')}
              className="bg-transparent outline-none text-sm w-40 text-[var(--app-text-primary)]"
            />
          </label>
          <button
            onClick={load}
            className="p-2 rounded-xl border border-[var(--app-border)] text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-subtle)] cursor-pointer"
            title={tl('Обновить', 'Жаңылоо', 'Refresh')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5" role="tablist">
        {GROUPS.map((g) => (
          <button
            key={g.id}
            role="tab"
            aria-selected={group === g.id}
            onClick={() => setGroup((cur) => (cur === g.id ? null : g.id))}
            className={`shrink-0 h-9 px-3.5 rounded-full text-sm font-medium border cursor-pointer transition ${
              group === g.id
                ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                : 'bg-[var(--app-surface)] border-[var(--app-border)] text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-subtle)]'
            }`}
          >
            {groupLabel(g.id, g.label)} <span className={`ml-1 tabular-nums ${group === g.id ? 'text-white/80' : 'text-[var(--app-text-muted)]'}`}>{countOf(g.id)}</span>
            {group === g.id ? <ChevronUp className="inline w-3.5 h-3.5 ml-1 -mt-0.5" /> : <ChevronDown className="inline w-3.5 h-3.5 ml-1 -mt-0.5 opacity-50" />}
          </button>
        ))}
      </div>

      {error && <div className="mt-3 text-sm rounded-xl px-3 py-2 bg-[var(--danger-soft)] border border-[var(--danger-border)] text-[var(--app-text-primary)]">{error}</div>}
      {notice && <div className="mt-3 text-sm rounded-xl px-3 py-2 bg-[var(--accent-soft)] text-[var(--app-text-primary)]">✓ {notice}</div>}

      {shownGroup === null ? (
        <p className="mt-3 text-sm text-[var(--app-text-muted)]">{tl('Нажмите на вкладку, чтобы открыть список. Нажмите ещё раз, чтобы закрыть.', 'Тизмени ачуу үчүн өтмөктү басыңыз. Жабуу үчүн дагы бир жолу басыңыз.', 'Tap a tab to open the list. Tap again to close it.')}</p>
      ) : (
      <>
      <div className="mt-3 overflow-x-auto rounded-xl border border-[var(--app-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--app-surface-subtle)] text-[var(--app-text-secondary)] text-xs">
            <tr>
              <th className="text-left px-3 py-2 font-semibold">{tl('Пользователь', 'Колдонуучу', 'User')}</th>
              <th className="text-left px-3 py-2 font-semibold hidden sm:table-cell">Email</th>
              <th className="text-left px-3 py-2 font-semibold">{tl('Роль', 'Роль', 'Role')}</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((u) => (
              <tr key={u.id} className="border-t border-[var(--app-border)]">
                <td className="px-3 py-2 text-[var(--app-text-primary)]">
                  {u.fullName}
                  {u.id === currentUserId && <span className="ml-2 text-xs text-[var(--app-text-muted)]">{tl('(это вы)', '(бул сиз)', '(you)')}</span>}
                  {u.role === 'club_coach' && u.alsoCompetes && (
                    <span className="ml-2 inline-block rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-[11px] font-semibold px-2 py-0.5">{tl('тренер, выступает', 'машыктыруучу, өзү да чыгат', 'coach, competes')}</span>
                  )}
                  <div className="text-xs text-[var(--app-text-muted)] sm:hidden break-all">{u.email}</div>
                  {u.clubName && <div className="text-xs text-[var(--app-text-muted)]">{u.clubName}</div>}
                </td>
                <td className="px-3 py-2 text-[var(--app-text-secondary)] hidden sm:table-cell">{u.email}</td>
                <td className="px-3 py-2">
                  <select
                    value={u.role}
                    onChange={(e) => askRole(u, e.target.value as AccessRole)}
                    className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-primary)] px-2 py-1 text-sm cursor-pointer"
                  >
                    {ASSIGNABLE.map((r) => (
                      <option key={r} value={r}>
                        {roleLabel(r, language)}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && visible.length === 0 && (
          <div className="px-3 py-6 text-center text-sm text-[var(--app-text-muted)] border-t border-[var(--app-border)]">{tl('Здесь пока никого нет', 'Бул жерде азырынча эч ким жок', 'Nobody here yet')}</div>
        )}
      </div>
      {filtered.length > visible.length && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button onClick={() => setShown((n) => n + PAGE)} className="h-10 px-4 rounded-full border border-[var(--app-border)] text-sm font-medium text-[var(--app-text-primary)] hover:bg-[var(--app-surface-subtle)] cursor-pointer">
            {tl('Показать ещё', 'Дагы көрсөтүү', 'Show more')} {Math.min(PAGE, filtered.length - visible.length)}
          </button>
          <span className="text-sm text-[var(--app-text-muted)]">{tl('Показано', 'Көрсөтүлдү', 'Shown')} {visible.length} / {filtered.length}. {tl('Для быстрого поиска впишите имя или email.', 'Тез издөө үчүн атын же email жазыңыз.', 'Type a name or email to search quickly.')}</span>
        </div>
      )}
      </>
      )}
      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => !saving && setPending(null)}>
          <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-[var(--app-surface)] border border-[var(--app-border)] shadow-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[var(--app-text-primary)]">{tl('Изменить роль?', 'Ролду өзгөртөсүзбү?', 'Change the role?')}</h3>
            <p className="text-[15px] text-[var(--app-text-secondary)]">
              {tl('Изменить роль пользователя', 'Колдонуучунун ролун өзгөртүү:', 'Change the role of')} <b className="text-[var(--app-text-primary)]">{pending.user.fullName}</b>: «{roleLabel(pending.user.role, language)}» → «{roleLabel(pending.role, language)}»?
            </p>
            {pending.role === 'admin' && (
              <p className="text-sm rounded-xl px-3 py-2 bg-[var(--danger-soft)] border border-[var(--danger-border)] text-[var(--app-text-primary)]">
                {tl('Администратор получит полный доступ к сайту: сможет удалять турниры, менять роли и все данные.', 'Администратор сайтка толук кирүү укугун алат: мелдештерди өчүрүп, ролдорду жана бардык маалыматтарды өзгөртө алат.', 'An administrator gets full access: can delete tournaments, change roles and all data.')}
              </p>
            )}
            {pending.user.id === currentUserId && pending.user.role === 'admin' && (
              <p className="text-sm rounded-xl px-3 py-2 bg-[var(--danger-soft)] border border-[var(--danger-border)] text-[var(--app-text-primary)]">
                {tl('Это ваш аккаунт. После изменения вы потеряете права администратора.', 'Бул сиздин аккаунтуңуз. Өзгөртүүдөн кийин администратордун укуктарын жоготосуз.', 'This is your account. After the change you will lose administrator rights.')}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setPending(null)} disabled={saving} className="h-10 px-5 rounded-lg border border-[var(--app-border)] text-sm font-medium text-[var(--app-text-primary)] hover:bg-[var(--app-surface-subtle)] cursor-pointer">
                {tl('Нет', 'Жок', 'No')}
              </button>
              <button onClick={changeRole} disabled={saving} autoFocus className="h-10 px-5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-sm font-semibold disabled:opacity-50 cursor-pointer">
                {saving ? tl('Сохраняю…', 'Сакталууда…', 'Saving…') : tl('Да, изменить', 'Ооба, өзгөртүү', 'Yes, change')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
