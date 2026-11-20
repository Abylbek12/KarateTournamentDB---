import React from 'react';
import { UserCircle2, ClipboardList, Users, UserPlus, CreditCard, BookOpen, Check } from 'lucide-react';
import type { AuthenticatedUserProfile } from '../types/schema';
import { roleLabel } from '../utils/access';
import { useApp } from '../context/AppContext';
import { trLang } from '../utils/globalDomTranslator';

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
  const { language } = useApp();
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
      setError(data.error || trLang(language, 'Не удалось сохранить', 'Сактоо мүмкүн болгон жок', 'Could not save'));
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
            {roleLabel(user.role, language)}
            {isCoach && user.alsoCompetes && ` · ${trLang(language, 'также выступает', 'өзү да чыгат', 'also competes')}`}
            {user.clubName && ` · ${user.clubName}`}
          </div>
        </div>
      </div>

      {canEnter && (
        <div className={`grid gap-3 sm:grid-cols-2 ${isCoach ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
          {action(
            <ClipboardList className="w-5 h-5" />,
            isCoach ? trLang(language, 'Подать заявки', 'Табыштама берүү', 'Enter athletes') : trLang(language, 'Подать заявку', 'Табыштама берүү', 'Enter a tournament'),
            isCoach ? (user.alsoCompetes ? trLang(language, 'За учеников и за себя', 'Окуучулар жана өзүм үчүн', 'For your athletes and yourself') : trLang(language, 'За своих учеников', 'Өз окуучуларыңыз үчүн', 'For your athletes')) : trLang(language, 'Выбрать турнир и категории', 'Мелдешти жана категорияларды тандоо', 'Choose a tournament and categories'),
            'registration'
          )}
          {action(
            <UserPlus className="w-5 h-5" />,
            trLang(language, 'Мои спортсмены', 'Менин спортчуларым', 'My athletes'),
            trLang(language, 'Внести один раз, заявлять быстро', 'Бир жолу киргизип, тез каттоо', 'Enter once, register fast'),
            'athletes'
          )}
          {isCoach && action(<Users className="w-5 h-5" />, trLang(language, 'Кабинет клуба', 'Клуб кабинети', 'Club cabinet'), trLang(language, 'Ученики, команды, история', 'Окуучулар, командалар, тарых', 'Athletes, teams, history'), 'coach')}
          {action(<CreditCard className="w-5 h-5" />, trLang(language, 'Мои заявки и оплата', 'Өтүнмөлөрүм жана төлөм', 'My entries & fees'), trLang(language, 'Взносы и статус заявок', 'Төгүмдөр жана табыштамалардын абалы', 'Fees and entry status'), 'acquiring')}
          {action(<BookOpen className="w-5 h-5" />, trLang(language, 'Инструкция', 'Нускама', 'How it works'), trLang(language, 'Как всё работает, по шагам', 'Баары кантип иштейт, кадам боюнча', 'Step by step'), 'help')}
        </div>
      )}

      <div className="rounded-xl border border-[var(--app-border)] p-4 space-y-3">
        <div className="text-sm font-semibold text-[var(--app-text-primary)]">{trLang(language, 'Мои данные', 'Менин маалыматым', 'My details')}</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-[var(--app-text-secondary)] space-y-1">
            <span>{trLang(language, 'Клуб', 'Клуб', 'Club')}</span>
            <input value={clubName} onChange={(e) => setClubName(e.target.value)} className={field} placeholder={trLang(language, 'Название клуба', 'Клубдун аталышы', 'Club name')} />
          </label>
          <label className="text-xs text-[var(--app-text-secondary)] space-y-1">
            <span>{trLang(language, 'Телефон', 'Телефон', 'Phone')}</span>
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
              {trLang(language, 'Я тоже выступаю на соревнованиях', 'Мен да мелдештерге чыгам', 'I also compete')}
              <span className="block text-xs text-[var(--app-text-muted)]">
                {trLang(language, 'Тогда при подаче заявок вы сможете отметить и себя как спортсмена.', 'Анда табыштама бергенде өзүңүздү да спортчу катары белгилей аласыз.', 'Then you can enter yourself as an athlete too.')}
              </span>
            </span>
          </label>
        )}
        <div className="flex items-center gap-3">
          <button
            onClick={() => save({ clubName, phone })}
            className="px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-sm font-semibold cursor-pointer"
          >
            {trLang(language, 'Сохранить', 'Сактоо', 'Save')}
          </button>
          {saved && (
            <span className="text-sm text-emerald-600 inline-flex items-center gap-1">
              <Check className="w-4 h-4" /> {trLang(language, 'Сохранено', 'Сакталды', 'Saved')}
            </span>
          )}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </div>
    </section>
  );
};
