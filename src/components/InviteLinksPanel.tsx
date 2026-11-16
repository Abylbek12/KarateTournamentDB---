import React from 'react';
import { NumberField } from './NumberField';
import { Link2, Copy, Check, Trash2, Plus, ShieldCheck } from 'lucide-react';
import { ROLE_LABELS, type AccessRole } from '../utils/access';

interface InviteRow {
  token: string;
  role: AccessRole;
  note?: string;
  createdAt: string;
  expiresAt: number;
  maxUses: number;
  uses: number;
  active: boolean;
}

const STAFF_ROLES: AccessRole[] = ['tatami_referee', 'scorekeeper', 'chief_referee', 'medical_officer', 'club_coach'];

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--app-border)] text-xs font-semibold text-[var(--app-text-primary)] hover:bg-[var(--app-surface-subtle)] cursor-pointer shrink-0"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Скопировано' : 'Копировать'}
    </button>
  );
};

/** Admin-only: public sign-up links (athlete / coach) and secret staff invitations. */
export const InviteLinksPanel: React.FC = () => {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const [invites, setInvites] = React.useState<InviteRow[]>([]);
  const [role, setRole] = React.useState<AccessRole>('tatami_referee');
  const [days, setDays] = React.useState(7);
  const [maxUses, setMaxUses] = React.useState(1);
  const [note, setNote] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [justCreated, setJustCreated] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const res = await fetch('/api/admin/invites');
    const data = await res.json().catch(() => ({}));
    if (res.ok) setInvites(data.invites);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    setError(null);
    const res = await fetch('/api/admin/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, days, maxUses, note })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'Не удалось создать приглашение');
      return;
    }
    setJustCreated(data.token);
    setNote('');
    load();
  };

  const revoke = async (token: string) => {
    if (!window.confirm('Отозвать эту ссылку? Ею больше нельзя будет зарегистрироваться.')) return;
    await fetch(`/api/admin/invites/${encodeURIComponent(token)}`, { method: 'DELETE' });
    load();
  };

  const linkFor = (token: string) => `${origin}/?invite=${token}`;
  const fieldCls =
    'rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-primary)] px-2.5 py-1.5 text-sm';

  return (
    <section className="theme-keep rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-sm space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
          <Link2 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[var(--app-text-primary)]">Ссылки для регистрации</h2>
          <p className="text-xs text-[var(--app-text-muted)]">
            По ссылке человек регистрируется только в той роли, которая в ней указана. Стать администратором по ссылке нельзя.
          </p>
        </div>
      </div>

      {/* Public links */}
      <div className="grid gap-3 md:grid-cols-2">
        {[
          { title: 'Для спортсменов и родителей', desc: 'Можно отправить в чаты, соцсети, на афишу турнира.', url: `${origin}/?join=athlete` },
          { title: 'Для тренеров и клубов', desc: 'Тренер регистрирует себя и потом подаёт заявки за своих учеников.', url: `${origin}/?join=coach` }
        ].map((l) => (
          <div key={l.url} className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-subtle)] p-3">
            <div className="text-sm font-semibold text-[var(--app-text-primary)]">{l.title}</div>
            <div className="text-xs text-[var(--app-text-muted)] mt-0.5">{l.desc}</div>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 truncate text-xs bg-[var(--app-surface)] border border-[var(--app-border)] rounded-lg px-2 py-1.5 text-[var(--app-text-secondary)]">
                {l.url}
              </code>
              <CopyButton text={l.url} />
            </div>
          </div>
        ))}
      </div>

      {/* Staff invites */}
      <div className="rounded-xl border border-[var(--app-border)] p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--app-text-primary)]">
          <ShieldCheck className="w-4 h-4 text-[var(--accent)]" /> Секретная ссылка для судей, секретарей и врачей
        </div>
        <p className="text-xs text-[var(--app-text-muted)] mt-1">
          Отправьте её лично (WhatsApp, Telegram). Ссылка работает ограниченное время и ограниченное число раз.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="text-xs text-[var(--app-text-secondary)] flex flex-col gap-1">
            Роль
            <select value={role} onChange={(e) => setRole(e.target.value as AccessRole)} className={fieldCls}>
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-[var(--app-text-secondary)] flex flex-col gap-1">
            Действует, дней
            <NumberField value={days} emptyValue={7} onValueChange={(n) => setDays(Math.min(60, Math.max(1, n)))} className={`${fieldCls} w-24`} />
          </label>
          <label className="text-xs text-[var(--app-text-secondary)] flex flex-col gap-1">
            Сколько человек
            <NumberField value={maxUses} emptyValue={1} onValueChange={(n) => setMaxUses(Math.min(100, Math.max(1, n)))} className={`${fieldCls} w-24`} />
          </label>
          <label className="text-xs text-[var(--app-text-secondary)] flex flex-col gap-1 flex-1 min-w-[160px]">
            Для кого (заметка)
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="напр. судьи Кубка Бишкека" className={fieldCls} />
          </label>
          <button
            onClick={create}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-sm font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Создать ссылку
          </button>
        </div>
        {error && <div className="mt-2 text-sm text-red-700">{error}</div>}
        {justCreated && (
          <div className="mt-3 rounded-lg bg-[var(--accent-soft)] p-2.5 flex items-center gap-2">
            <code className="flex-1 truncate text-xs text-[var(--app-text-primary)]">{linkFor(justCreated)}</code>
            <CopyButton text={linkFor(justCreated)} />
          </div>
        )}

        {invites.length > 0 && (
          <div className="mt-4 overflow-x-auto rounded-lg border border-[var(--app-border)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--app-surface-subtle)] text-xs text-[var(--app-text-secondary)]">
                <tr>
                  <th className="text-left px-3 py-2">Роль</th>
                  <th className="text-left px-3 py-2">Для кого</th>
                  <th className="text-left px-3 py-2">Использовано</th>
                  <th className="text-left px-3 py-2">До</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {invites.map((i) => (
                  <tr key={i.token} className={`border-t border-[var(--app-border)] ${i.active ? '' : 'opacity-50'}`}>
                    <td className="px-3 py-2 text-[var(--app-text-primary)]">{ROLE_LABELS[i.role] || i.role}</td>
                    <td className="px-3 py-2 text-[var(--app-text-secondary)]">{i.note || '—'}</td>
                    <td className="px-3 py-2 text-[var(--app-text-secondary)]">
                      {i.uses} из {i.maxUses}
                    </td>
                    <td className="px-3 py-2 text-[var(--app-text-secondary)]">
                      {i.active ? new Date(i.expiresAt).toLocaleDateString('ru-RU') : 'неактивна'}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1.5">
                        {i.active && <CopyButton text={linkFor(i.token)} />}
                        <button onClick={() => revoke(i.token)} className="p-1.5 rounded-lg text-[var(--app-text-muted)] hover:text-red-600 cursor-pointer" title="Отозвать">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};
