import React from 'react';
import { Users, RefreshCw, Search } from 'lucide-react';
import { ROLE_LABELS, type AccessRole } from '../utils/access';

interface UserRow {
  id: string;
  email: string;
  fullName: string;
  role: AccessRole;
  clubName?: string;
  createdAt: string;
}

const ASSIGNABLE: AccessRole[] = ['athlete', 'club_coach', 'tatami_referee', 'scorekeeper', 'chief_referee', 'medical_officer', 'admin'];

/** Admin-only list of accounts with role assignment (uses /api/admin/users). */
export const UsersRolesPanel: React.FC<{ currentUserId?: string }> = ({ currentUserId }) => {
  const [users, setUsers] = React.useState<UserRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Не удалось загрузить пользователей');
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

  const changeRole = async (user: UserRow, role: AccessRole) => {
    if (role === user.role) return;
    if (role === 'admin' && !window.confirm(`Сделать ${user.fullName} администратором? Он получит полный доступ к сайту.`)) return;
    setError(null);
    const res = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'Не удалось изменить роль');
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role } : u)));
    setNotice(`${user.fullName}: роль «${ROLE_LABELS[role]}»`);
    setTimeout(() => setNotice(null), 3000);
  };

  const q = query.trim().toLowerCase();
  const visible = users.filter((u) => !q || u.fullName.toLowerCase().includes(q) || u.email.includes(q));

  return (
    <section className="theme-keep rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--app-text-primary)]">Пользователи и роли</h2>
            <p className="text-xs text-[var(--app-text-muted)]">
              Новые пользователи регистрируются как спортсмен или тренер. Судей, секретарей и врачей назначаете вы.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-subtle)]">
            <Search className="w-4 h-4 text-[var(--app-text-muted)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Имя или email"
              className="bg-transparent outline-none text-sm w-40 text-[var(--app-text-primary)]"
            />
          </label>
          <button
            onClick={load}
            className="p-2 rounded-xl border border-[var(--app-border)] text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-subtle)] cursor-pointer"
            title="Обновить"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && <div className="mt-3 text-sm rounded-xl px-3 py-2 bg-[var(--danger-soft)] border border-[var(--danger-border)] text-[var(--app-text-primary)]">{error}</div>}
      {notice && <div className="mt-3 text-sm rounded-xl px-3 py-2 bg-[var(--accent-soft)] text-[var(--app-text-primary)]">✓ {notice}</div>}

      <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--app-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--app-surface-subtle)] text-[var(--app-text-secondary)] text-xs">
            <tr>
              <th className="text-left px-3 py-2 font-semibold">Пользователь</th>
              <th className="text-left px-3 py-2 font-semibold">Email</th>
              <th className="text-left px-3 py-2 font-semibold">Роль</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((u) => (
              <tr key={u.id} className="border-t border-[var(--app-border)]">
                <td className="px-3 py-2 text-[var(--app-text-primary)]">
                  {u.fullName}
                  {u.id === currentUserId && <span className="ml-2 text-xs text-[var(--app-text-muted)]">(это вы)</span>}
                </td>
                <td className="px-3 py-2 text-[var(--app-text-secondary)]">{u.email}</td>
                <td className="px-3 py-2">
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u, e.target.value as AccessRole)}
                    className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-primary)] px-2 py-1 text-sm cursor-pointer"
                  >
                    {ASSIGNABLE.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {!loading && visible.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-[var(--app-text-muted)]">
                  Пользователи не найдены
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
