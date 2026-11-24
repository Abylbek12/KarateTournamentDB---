import React from 'react';
import { NumberField } from './NumberField';
import { Link2, Copy, Check, Trash2, Plus, ShieldCheck, Users, Award } from 'lucide-react';
import { roleLabel, type AccessRole } from '../utils/access';
import { useApp } from '../context/AppContext';

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

// «Организатор»: runs only the tournaments they create (to let others try the site safely)
const STAFF_ROLES: AccessRole[] = ['organizer', 'tatami_referee', 'scorekeeper', 'chief_referee', 'medical_officer', 'club_coach'];

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const { language } = useApp();
  const tl = (ru: string, ky: string, en: string) => (language === 'ky' ? ky : language === 'en' ? en : ru);
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold cursor-pointer shrink-0 transition ${
        copied ? 'bg-emerald-600 text-white' : 'bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white'
      }`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? tl('Скопировано', 'Көчүрүлдү', 'Copied') : tl('Копировать', 'Көчүрүү', 'Copy')}
    </button>
  );
};

/** Admin-only: public sign-up links (athlete / coach) and secret staff invitations. */
export const InviteLinksPanel: React.FC = () => {
  const { language } = useApp();
  const tl = (ru: string, ky: string, en: string) => (language === 'ky' ? ky : language === 'en' ? en : ru);
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
      setError(data.error || tl('Не удалось создать приглашение', 'Чакырууну түзүү мүмкүн болгон жок', 'Could not create the invitation'));
      return;
    }
    setJustCreated(data.token);
    setNote('');
    load();
  };

  const revoke = async (token: string) => {
    if (!window.confirm(tl('Отозвать эту ссылку? Ею больше нельзя будет зарегистрироваться.', 'Бул шилтемени кайтарып аласызбы? Аны менен мындан ары катталууга болбойт.', 'Revoke this link? Nobody will be able to sign up with it.'))) return;
    await fetch(`/api/admin/invites/${encodeURIComponent(token)}`, { method: 'DELETE' });
    load();
  };

  const linkFor = (token: string) => `${origin}/?invite=${token}`;
  const fieldCls =
    'h-10 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-primary)] px-3 text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]';

  return (
    <section className="theme-keep rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 sm:p-6 shadow-sm space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 shrink-0 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
          <Link2 className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-[var(--app-text-primary)]">{tl('Ссылки для регистрации', 'Катталуу шилтемелери', 'Sign-up links')}</h2>
          <p className="text-sm text-[var(--app-text-muted)]">
            {tl('Общие ссылки заранее выбирают роль спортсмена или тренера (её можно сменить). Секретная ссылка задаёт роль организатора, судьи, секретаря или врача. Организатор ведёт только свои турниры, чужие только смотрит. Стать администратором по ссылке нельзя.', 'Жалпы шилтемелер спортчу же машыктыруучу ролун алдын ала тандайт (аны өзгөртсө болот). Жашыруун шилтеме уюштуруучу, калыс, катчы же дарыгер ролун берет. Уюштуруучу өз мелдештерин гана жүргүзөт, башкаларды көрөт гана. Шилтеме аркылуу администратор болууга болбойт.', 'Public links pre-select the athlete or coach role (it can be changed). A secret link sets the organizer, referee, scorekeeper or doctor role. An organizer runs only their own tournaments and only views the others. Nobody can become an administrator by a link.')}
          </p>
        </div>
      </div>

      {/* Public links */}
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { title: tl('Спортсмены и родители', 'Спортчулар жана ата-энелер', 'Athletes and parents'), desc: tl('Для чатов, соцсетей и афиши турнира.', 'Чаттар, соцтармактар жана мелдештин афишасы үчүн.', 'For chats, social media and the tournament poster.'), url: `${origin}/?join=athlete`, Icon: Users },
          { title: tl('Тренеры и клубы', 'Машыктыруучулар жана клубдар', 'Coaches and clubs'), desc: tl('Тренер подаёт заявки за своих учеников.', 'Машыктыруучу өз окуучулары үчүн табыштама берет.', 'A coach enters their own athletes.'), url: `${origin}/?join=coach`, Icon: Award }
        ].map(({ title, desc, url, Icon }) => (
          <div key={url} className="min-w-0 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-subtle)] p-4">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 shrink-0 rounded-xl bg-[var(--app-surface)] border border-[var(--app-border)] text-[var(--accent)] flex items-center justify-center">
                <Icon className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-bold text-[var(--app-text-primary)]">{title}</div>
                <div className="text-xs text-[var(--app-text-muted)]">{desc}</div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 rounded-full bg-[var(--app-surface)] border border-[var(--app-border)] pl-3.5 pr-1 py-1">
              <span className="flex-1 min-w-0 truncate text-xs text-[var(--app-text-secondary)]">{url.replace(/^https?:\/\//, '')}</span>
              <CopyButton text={url} />
            </div>
          </div>
        ))}
      </div>

      {/* Staff invites */}
      <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-subtle)] p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[var(--app-text-primary)]">
          <ShieldCheck className="w-4 h-4 text-[var(--accent)]" /> {tl('Секретная ссылка для организаторов, судей, секретарей и врачей', 'Уюштуруучулар, калыстар, катчылар жана дарыгерлер үчүн жашыруун шилтеме', 'Secret link for organizers, referees, scorekeepers and doctors')}
        </div>
        <p className="text-xs text-[var(--app-text-muted)] mt-1">
          {tl('Отправьте её лично (WhatsApp, Telegram). Ссылка работает ограниченное время и ограниченное число раз.', 'Аны жеке жөнөтүңүз (WhatsApp, Telegram). Шилтеме чектелген убакытта жана чектелген санда иштейт.', 'Send it personally (WhatsApp, Telegram). The link works for a limited time and a limited number of people.')}
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="text-xs text-[var(--app-text-secondary)] flex flex-col gap-1">
            {tl('Роль', 'Роль', 'Role')}
            <select value={role} onChange={(e) => setRole(e.target.value as AccessRole)} className={fieldCls}>
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r}>
                  {roleLabel(r, language)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-[var(--app-text-secondary)] flex flex-col gap-1">
            {tl('Действует, дней', 'Жарактуу, күн', 'Valid, days')}
            <NumberField value={days} emptyValue={7} onValueChange={(n) => setDays(Math.min(60, Math.max(1, n)))} className={`${fieldCls} w-24`} />
          </label>
          <label className="text-xs text-[var(--app-text-secondary)] flex flex-col gap-1">
            {tl('Сколько человек', 'Канча адам', 'How many people')}
            <NumberField value={maxUses} emptyValue={1} onValueChange={(n) => setMaxUses(Math.min(100, Math.max(1, n)))} className={`${fieldCls} w-24`} />
          </label>
          <label className="text-xs text-[var(--app-text-secondary)] flex flex-col gap-1 flex-1 min-w-[160px]">
            {tl('Для кого (заметка)', 'Ким үчүн (белги)', 'For whom (note)')}
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={tl('напр. судьи Кубка Бишкека', 'мис. Бишкек Кубогунун калыстары', 'e.g. Bishkek Cup referees')} className={fieldCls} />
          </label>
          <button
            onClick={create}
            className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-sm font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4" /> {tl('Создать ссылку', 'Шилтеме түзүү', 'Create link')}
          </button>
        </div>
        {error && <div className="mt-2 text-sm text-red-700">{error}</div>}
        {justCreated && (
          <div className="mt-3 rounded-full bg-[var(--accent-soft)] pl-3.5 pr-1 py-1 flex items-center gap-2">
            <span className="flex-1 min-w-0 truncate text-xs font-medium text-[var(--app-text-primary)]">{linkFor(justCreated)}</span>
            <CopyButton text={linkFor(justCreated)} />
          </div>
        )}

        {invites.length > 0 && (
          <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--app-surface-subtle)] text-xs text-[var(--app-text-secondary)]">
                <tr>
                  <th className="text-left px-3 py-2">{tl('Роль', 'Роль', 'Role')}</th>
                  <th className="text-left px-3 py-2">{tl('Для кого', 'Ким үчүн', 'For whom')}</th>
                  <th className="text-left px-3 py-2">{tl('Использовано', 'Колдонулду', 'Used')}</th>
                  <th className="text-left px-3 py-2">{tl('До', 'Чейин', 'Until')}</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {invites.map((i) => (
                  <tr key={i.token} className={`border-t border-[var(--app-border)] ${i.active ? '' : 'opacity-50'}`}>
                    <td className="px-3 py-2 text-[var(--app-text-primary)]">{roleLabel(i.role, language)}</td>
                    <td className="px-3 py-2 text-[var(--app-text-secondary)]">{i.note || '—'}</td>
                    <td className="px-3 py-2 text-[var(--app-text-secondary)]">
                      {i.uses} / {i.maxUses}
                    </td>
                    <td className="px-3 py-2 text-[var(--app-text-secondary)]">
                      {i.active ? new Date(i.expiresAt).toLocaleDateString(language === 'en' ? 'en-GB' : 'ru-RU') : tl('неактивна', 'активдүү эмес', 'inactive')}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1.5">
                        {i.active && <CopyButton text={linkFor(i.token)} />}
                        <button onClick={() => revoke(i.token)} className="p-1.5 rounded-lg text-[var(--app-text-muted)] hover:text-red-600 cursor-pointer" title={tl('Отозвать', 'Кайтарып алуу', 'Revoke')}>
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
