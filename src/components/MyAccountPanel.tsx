import React from 'react';
import { UserCircle2, ClipboardList, Users, CreditCard, BookOpen, Check } from 'lucide-react';
import type { AuthenticatedUserProfile } from '../types/schema';
import { ROLE_LABELS } from '../utils/access';

interface MyAccountPanelProps {
  user: AuthenticatedUserProfile;
  onNavigate: (tab: string) => void;
  onUserUpdated: (user: AuthenticatedUserProfile) => void;
}

/** Personal cabinet header for athletes, coaches and officials. */
export const MyAccountPanel: React.FC<MyAccountPanelProps> = ({ user, onNavigate, onUserUpdated }) => {
  const [clubName, setClubName] = React.useState(user.clubName || '');
  const [phone, setPhone] = React.useState(user.phone || '');
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const isCoach = user.role === 'club_coach';
  const canEnter = user.role === 'athlete' || isCoach;

  const save = async (patch: Record<string, unknown>) => {
    setError(null);
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'Не удалось сохранить');
      return;
    }
    onUserUpdated(data.user);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const action = (icon: React.ReactNode, title: string, desc: string, tab: string) => (
    <button
      onClick={() => onNavigate(tab)}
      className="text-left rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-subtle)] hover:border-[var(--accent)] p-4 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-2 text-[var(--accent)]">{icon}</div>
      <div className="mt-2 text-sm font-semibold text-[var(--app-text-primary)]">{title}</div>
      <div className="text-xs text-[var(--app-text-muted)] mt-0.5">{desc}</div>
    </button>
  );

  const field = 'rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-primary)] px-3 py-2 text-sm w-full';

  return (
    <section className="theme-keep rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 sm:p-6 shadow-sm space-y-5">
      <div className="flex flex-wrap items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
          <UserCircle2 className="w-7 h-7" />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-[var(--app-text-primary)]">{user.fullName}</h2>
          <div className="text-sm text-[var(--app-text-muted)]">
            {ROLE_LABELS[user.role]}
            {isCoach && user.alsoCompetes && ' · также выступает'}
            {user.clubName && ` · ${user.clubName}`}
          </div>
        </div>
      </div>

      {canEnter && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {action(
            <ClipboardList className="w-5 h-5" />,
            isCoach ? 'Подать заявки' : 'Подать заявку',
            isCoach ? (user.alsoCompetes ? 'За учеников и за себя' : 'За своих учеников') : 'Выбрать турнир и категории',
            'registration'
          )}
          {isCoach && action(<Users className="w-5 h-5" />, 'Кабинет клуба', 'Ученики, команды, история', 'coach')}
          {action(<CreditCard className="w-5 h-5" />, 'Мои оплаты', 'Взносы и квитанции', 'acquiring')}
          {action(<BookOpen className="w-5 h-5" />, 'Инструкция', 'Как всё работает, по шагам', 'help')}
        </div>
      )}

      <div className="rounded-xl border border-[var(--app-border)] p-4 space-y-3">
        <div className="text-sm font-semibold text-[var(--app-text-primary)]">Мои данные</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-[var(--app-text-secondary)] space-y-1">
            <span>Клуб</span>
            <input value={clubName} onChange={(e) => setClubName(e.target.value)} className={field} placeholder="Название клуба" />
          </label>
          <label className="text-xs text-[var(--app-text-secondary)] space-y-1">
            <span>Телефон</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={field} placeholder="+996 …" />
          </label>
        </div>
        {isCoach && (
          <label className="flex items-start gap-3 rounded-lg bg-[var(--app-surface-subtle)] px-3 py-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={!!user.alsoCompetes}
              onChange={(e) => save({ alsoCompetes: e.target.checked })}
              className="mt-0.5 w-4 h-4"
            />
            <span className="text-sm text-[var(--app-text-primary)]">
              Я тоже выступаю на соревнованиях
              <span className="block text-xs text-[var(--app-text-muted)]">
                Тогда при подаче заявок вы сможете отметить и себя как спортсмена.
              </span>
            </span>
          </label>
        )}
        <div className="flex items-center gap-3">
          <button
            onClick={() => save({ clubName, phone })}
            className="px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-sm font-semibold cursor-pointer"
          >
            Сохранить
          </button>
          {saved && (
            <span className="text-sm text-emerald-600 inline-flex items-center gap-1">
              <Check className="w-4 h-4" /> Сохранено
            </span>
          )}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </div>
    </section>
  );
};
