import { localizeCategoryName } from '../utils/names';
import { eventTitle, placeName } from '../utils/eventI18n';
import { useApp } from '../context/AppContext';
import React from 'react';
import { entryFee } from '../utils/pricing';
import { ClipboardList, Wallet, Search } from 'lucide-react';
import type { AuthenticatedUserProfile, Bout, EventCategory, Participant, Tournament } from '../types/schema';
import { belongsToEvent } from '../data/sampleTournamentData';
import { categoryName } from '../utils/eventCategories';

type FeeStatus = NonNullable<Participant['feePaymentStatus']>;

const FEE_LABEL: Record<FeeStatus, string> = {
  pending: 'Не оплачено',
  paid: 'Оплачено',
  exempt: 'Освобождён',
  refunded: 'Возвращено'
};
const FEE_LABEL_I18N: Record<FeeStatus, [ky: string, en: string]> = {
  pending: ['Төлөнгөн жок', 'Not paid'],
  paid: ['Төлөндү', 'Paid'],
  exempt: ['Бошотулган', 'Exempt'],
  refunded: ['Кайтарылды', 'Refunded']
};
const feeLabel = (s: FeeStatus, lang: string) => (lang === 'ky' ? FEE_LABEL_I18N[s][0] : lang === 'en' ? FEE_LABEL_I18N[s][1] : FEE_LABEL[s]);
const tl = (lang: string, ru: string, ky: string, en: string) => (lang === 'ky' ? ky : lang === 'en' ? en : ru);
const FEE_STYLE: Record<FeeStatus, string> = {
  pending: 'bg-amber-500/10 text-amber-700',
  paid: 'bg-emerald-600/10 text-emerald-700',
  exempt: 'bg-sky-600/10 text-sky-700',
  refunded: 'bg-[var(--app-surface-subtle)] text-[var(--app-text-muted)]'
};

const field = 'h-9 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-primary)] px-2.5 text-sm';
const card = 'rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)]';
const feeOf = (p: Participant) => p.feePaymentStatus || 'pending';

const catTitle = (categories: EventCategory[], id?: string, lang: string = 'ru') => {
  const def = categories.find((c) => c.id === id);
  return def ? localizeCategoryName(categoryName(def), lang as 'ru' | 'ky' | 'en') : id || '—';
};

const Badge: React.FC<{ s: FeeStatus }> = ({ s }) => {
  const { language } = useApp();
  return <span className={`text-xs px-2 py-0.5 rounded-md whitespace-nowrap ${FEE_STYLE[s]}`}>{feeLabel(s, language)}</span>;
};

// ---------------------------------------------------------------------------
// Athlete / parent / coach: the entries this account submitted
// ---------------------------------------------------------------------------

interface MyEntriesProps {
  user: AuthenticatedUserProfile;
  tournaments: Tournament[];
  categories: EventCategory[];
  participants: Participant[];
  bouts: Bout[];
  currency: string;
  onWithdraw: (entryId: string) => void;
  onNewEntry: () => void;
}

export const MyEntriesPanel: React.FC<MyEntriesProps> = ({ user, tournaments, categories, participants, bouts, currency, onWithdraw, onNewEntry }) => {
  const { language } = useApp();
  const mine = participants.filter((p) => p.createdBy === user.id);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const byEvent = tournaments
    .map((t) => ({ t, list: mine.filter((p) => belongsToEvent(p.tournamentId, t.id)) }))
    .filter((g) => g.list.length > 0);

  return (
    <div className="theme-keep space-y-5 pb-8">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[240px]">
          <h1 className="text-2xl font-bold text-[var(--app-text-primary)] flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-[var(--accent)]" /> {tl(language, 'Мои заявки и оплата', 'Өтүнмөлөрүм жана төлөм', 'My entries & fees')}
          </h1>
          <p className="text-[15px] text-[var(--app-text-secondary)] mt-1">
            {tl(
              language,
              'Заявки, поданные с вашего аккаунта. Взнос оплачивается так, как указал организатор (по реквизитам или на мандатной комиссии); статус оплаты отмечает организатор.',
              'Аккаунтуңуздан берилген табыштамалар. Төгүм уюштуруучу көрсөткөндөй төлөнөт (реквизиттер боюнча же мандаттык комиссияда); төлөмдүн абалын уюштуруучу белгилейт.',
              'Entries sent from your account. The fee is paid the way the organizer says (bank details or at registration desk); the organizer marks the payment.'
            )}
          </p>
        </div>
        <button onClick={onNewEntry} className="h-10 px-4 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-sm font-semibold cursor-pointer">
          {tl(language, 'Подать заявку', 'Табыштама берүү', 'Enter a tournament')}
        </button>
      </div>

      {byEvent.length === 0 ? (
        <div className={`${card} border-dashed p-10 text-center text-sm text-[var(--app-text-muted)]`}>{tl(language, 'Вы ещё не подавали заявок.', 'Сиз азырынча табыштама берген жоксуз.', 'You have not entered yet.')}</div>
      ) : (
        byEvent.map(({ t, list }) => {
          const due = list.filter((p) => p.status !== 'withdrawn' && feeOf(p) === 'pending').reduce((s, p) => s + entryFee(p, categories.find((c) => c.id === p.categoryId)), 0);
          return (
            <section key={t.id} className={`${card} overflow-hidden`}>
              <div className="px-4 py-3 border-b border-[var(--app-border)] flex flex-wrap items-center gap-2">
                <div className="flex-1 min-w-[200px]">
                  <div translate="no" className="font-semibold text-[var(--app-text-primary)]">{eventTitle(t, language)}</div>
                  <div className="text-xs text-[var(--app-text-muted)]">{placeName(t.city, language)} · {t.startDate}</div>
                </div>
                {due > 0 && <span className="text-sm text-amber-700">{tl(language, 'К оплате', 'Төлөөгө', 'To pay')}: {due} {language === 'en' && currency === 'сом' ? 'KGS' : currency}</span>}
              </div>
              <ul className="divide-y divide-[var(--app-border)]">
                {list.map((p) => {
                  const drawn = bouts.some((b) => b.categoryId === p.categoryId && (b.akaParticipantId === p.id || b.aoParticipantId === p.id));
                  const withdrawn = p.status === 'withdrawn';
                  return (
                    <li key={p.id} className={`px-4 py-2.5 flex flex-wrap items-center gap-2 text-sm ${withdrawn ? 'opacity-50' : ''}`}>
                      <div className="flex-1 min-w-[200px]">
                        <div className="text-[var(--app-text-primary)]">{p.teamName || `${p.lastName} ${p.firstName}`}</div>
                        <div className="text-xs text-[var(--app-text-muted)]">{catTitle(categories, p.categoryId, language)}</div>
                      </div>
                      <span className="text-xs text-[var(--app-text-muted)] w-28">
                        {withdrawn ? tl(language, 'отозвана', 'кайтарылды', 'withdrawn') : drawn ? tl(language, 'в сетке', 'торчодо', 'in bracket') : p.isWeighedIn ? tl(language, 'прошёл взвешивание', 'таразадан өттү', 'weighed in') : tl(language, 'принята', 'кабыл алынды', 'accepted')}
                      </span>
                      <Badge s={feeOf(p)} />
                      {!withdrawn && !drawn && (
                        confirmId === p.id ? (
                          <span className="flex gap-1">
                            <button onClick={() => { onWithdraw(p.id); setConfirmId(null); }} className="h-8 px-2.5 rounded-lg bg-red-600 text-white text-xs cursor-pointer">{tl(language, 'Отозвать', 'Кайтарып алуу', 'Withdraw')}</button>
                            <button onClick={() => setConfirmId(null)} className="h-8 px-2.5 rounded-lg border border-[var(--app-border)] text-xs cursor-pointer text-[var(--app-text-primary)]">{tl(language, 'Нет', 'Жок', 'No')}</button>
                          </span>
                        ) : (
                          <button onClick={() => setConfirmId(p.id)} className="h-8 px-2.5 rounded-lg border border-[var(--app-border)] text-xs text-[var(--app-text-secondary)] cursor-pointer">{tl(language, 'Отозвать', 'Кайтарып алуу', 'Withdraw')}</button>
                        )
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Organizer: entry fees of a tournament
// ---------------------------------------------------------------------------

interface FeesProps {
  tournaments: Tournament[];
  initialTournamentId?: string;
  /** The tournament is chosen in the common «Турнир» bar at the top; hide this screen's own picker. */
  hidePicker?: boolean;
  categories: EventCategory[];
  participants: Participant[];
  currency: string;
  onSetFee: (participantId: string, status: FeeStatus) => void;
}

export const FeesPanel: React.FC<FeesProps> = ({ tournaments, initialTournamentId, categories, participants, currency: currencyRu, onSetFee, hidePicker }) => {
  const { language } = useApp();
  const tl = (ru: string, ky: string, en: string) => (language === 'ky' ? ky : language === 'en' ? en : ru);
  const currency = language === 'en' && currencyRu === 'сом' ? 'KGS' : currencyRu;
  const [tid, setTid] = React.useState(initialTournamentId || tournaments[0]?.id || '');
  const [filter, setFilter] = React.useState<'all' | FeeStatus>('all');
  const [q, setQ] = React.useState('');
  const entries = participants.filter((p) => belongsToEvent(p.tournamentId, tid) && p.status !== 'withdrawn');
  const fee = (p: Participant) => entryFee(p, categories.find((c) => c.id === p.categoryId));
  const sum = (s: FeeStatus) => entries.filter((p) => feeOf(p) === s).reduce((a, p) => a + fee(p), 0);
  const shown = entries
    .filter((p) => filter === 'all' || feeOf(p) === filter)
    .filter((p) => !q || `${p.lastName} ${p.firstName} ${p.teamName || ''} ${p.clubName || ''}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (a.clubName || '').localeCompare(b.clubName || '') || a.lastName.localeCompare(b.lastName));

  return (
    <div className="theme-keep space-y-5 pb-8">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[240px]">
          <h1 className="text-2xl font-bold text-[var(--app-text-primary)] flex items-center gap-2">
            <Wallet className="w-6 h-6 text-[var(--accent)]" /> {tl('Взносы', 'Төгүмдөр', 'Entry fees')}
          </h1>
          <p className="text-[15px] text-[var(--app-text-secondary)] mt-1">
            {tl('Отмечайте оплату взносов по заявкам. Онлайн-оплата картой на сайте не подключена: взносы принимаются по вашим реквизитам или на мандатной комиссии.', 'Табыштамалар боюнча төгүмдөрдүн төлөнүшүн белгилеңиз. Сайтта карта менен онлайн төлөө туташтырылган эмес: төгүмдөр реквизиттериңиз боюнча же мандаттык комиссияда кабыл алынат.', 'Mark entry fee payments. Online card payment is not connected: fees are paid to your bank details or at the registration desk.')}
          </p>
        </div>
        {!hidePicker && (
          <select value={tid} onChange={(e) => setTid(e.target.value)} className={`${field} w-full sm:w-auto sm:min-w-[240px] max-w-full`}>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        )}
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {([['paid', tl('Оплачено', 'Төлөндү', 'Paid')], ['pending', tl('Ожидается', 'Күтүлүүдө', 'Pending')], ['exempt', tl('Освобождены', 'Бошотулган', 'Exempt')], ['refunded', tl('Возвращено', 'Кайтарылды', 'Refunded')]] as [FeeStatus, string][]).map(([s, label]) => (
          <div key={s} className={`${card} p-4`}>
            <div className="text-xs text-[var(--app-text-muted)]">{label}</div>
            <div className="text-xl font-bold text-[var(--app-text-primary)]">{sum(s)} {currency}</div>
            <div className="text-xs text-[var(--app-text-muted)]">{entries.filter((p) => feeOf(p) === s).length} {tl('заявок', 'табыштама', 'entries')}</div>
          </div>
        ))}
      </div>

      <section className={`${card} overflow-hidden`}>
        <div className="px-4 py-3 border-b border-[var(--app-border)] flex flex-wrap gap-2 items-center">
          <label className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-[var(--app-text-muted)]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tl('Спортсмен или клуб', 'Спортчу же клуб', 'Athlete or club')} className={`${field} w-full pl-8`} />
          </label>
          <select value={filter} onChange={(e) => setFilter(e.target.value as 'all' | FeeStatus)} className={field}>
            <option value="all">{tl('Все', 'Баары', 'All')}</option>
            {(Object.keys(FEE_LABEL) as FeeStatus[]).map((s) => (
              <option key={s} value={s}>{feeLabel(s, language)}</option>
            ))}
          </select>
        </div>
        {shown.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--app-text-muted)]">{tl('Заявок нет.', 'Табыштама жок.', 'No entries.')}</div>
        ) : (
          <ul className="divide-y divide-[var(--app-border)]">
            {shown.map((p) => (
              <li key={p.id} className="px-4 py-2.5 flex flex-wrap items-center gap-2 text-sm">
                <div className="flex-1 min-w-[220px]">
                  <div className="text-[var(--app-text-primary)]">{p.teamName || `${p.lastName} ${p.firstName}`} <span className="text-[var(--app-text-muted)]">· {p.clubName || '—'}</span></div>
                  <div className="text-xs text-[var(--app-text-muted)]">{catTitle(categories, p.categoryId, language)}</div>
                </div>
                <span className="w-24 text-right text-[var(--app-text-secondary)]">{fee(p)} {currency}</span>
                <select value={feeOf(p)} onChange={(e) => onSetFee(p.id, e.target.value as FeeStatus)} className={`${field} h-8`}>
                  {(Object.keys(FEE_LABEL) as FeeStatus[]).map((s) => (
                    <option key={s} value={s}>{feeLabel(s, language)}</option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
