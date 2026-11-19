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
const FEE_STYLE: Record<FeeStatus, string> = {
  pending: 'bg-amber-500/10 text-amber-700',
  paid: 'bg-emerald-600/10 text-emerald-700',
  exempt: 'bg-sky-600/10 text-sky-700',
  refunded: 'bg-[var(--app-surface-subtle)] text-[var(--app-text-muted)]'
};

const field = 'h-9 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-primary)] px-2.5 text-sm';
const card = 'rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)]';
const feeOf = (p: Participant) => p.feePaymentStatus || 'pending';

const catTitle = (categories: EventCategory[], id?: string) => {
  const def = categories.find((c) => c.id === id);
  return def ? categoryName(def) : id || '—';
};

const Badge: React.FC<{ s: FeeStatus }> = ({ s }) => <span className={`text-xs px-2 py-0.5 rounded-md whitespace-nowrap ${FEE_STYLE[s]}`}>{FEE_LABEL[s]}</span>;

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
            <ClipboardList className="w-6 h-6 text-[var(--accent)]" /> Мои заявки и оплата
          </h1>
          <p className="text-[15px] text-[var(--app-text-secondary)] mt-1">
            Заявки, поданные с вашего аккаунта. Взнос оплачивается так, как указал организатор (по реквизитам или на мандатной комиссии); статус оплаты отмечает организатор.
          </p>
        </div>
        <button onClick={onNewEntry} className="h-10 px-4 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-sm font-semibold cursor-pointer">
          Подать заявку
        </button>
      </div>

      {byEvent.length === 0 ? (
        <div className={`${card} border-dashed p-10 text-center text-sm text-[var(--app-text-muted)]`}>Вы ещё не подавали заявок.</div>
      ) : (
        byEvent.map(({ t, list }) => {
          const due = list.filter((p) => p.status !== 'withdrawn' && feeOf(p) === 'pending').reduce((s, p) => s + entryFee(p, categories.find((c) => c.id === p.categoryId)), 0);
          return (
            <section key={t.id} className={`${card} overflow-hidden`}>
              <div className="px-4 py-3 border-b border-[var(--app-border)] flex flex-wrap items-center gap-2">
                <div className="flex-1 min-w-[200px]">
                  <div className="font-semibold text-[var(--app-text-primary)]">{t.title}</div>
                  <div className="text-xs text-[var(--app-text-muted)]">{t.city} · {t.startDate}</div>
                </div>
                {due > 0 && <span className="text-sm text-amber-700">К оплате: {due} {currency}</span>}
              </div>
              <ul className="divide-y divide-[var(--app-border)]">
                {list.map((p) => {
                  const drawn = bouts.some((b) => b.categoryId === p.categoryId && (b.akaParticipantId === p.id || b.aoParticipantId === p.id));
                  const withdrawn = p.status === 'withdrawn';
                  return (
                    <li key={p.id} className={`px-4 py-2.5 flex flex-wrap items-center gap-2 text-sm ${withdrawn ? 'opacity-50' : ''}`}>
                      <div className="flex-1 min-w-[200px]">
                        <div className="text-[var(--app-text-primary)]">{p.teamName || `${p.lastName} ${p.firstName}`}</div>
                        <div className="text-xs text-[var(--app-text-muted)]">{catTitle(categories, p.categoryId)}</div>
                      </div>
                      <span className="text-xs text-[var(--app-text-muted)] w-28">
                        {withdrawn ? 'отозвана' : drawn ? 'в сетке' : p.isWeighedIn ? 'прошёл взвешивание' : 'принята'}
                      </span>
                      <Badge s={feeOf(p)} />
                      {!withdrawn && !drawn && (
                        confirmId === p.id ? (
                          <span className="flex gap-1">
                            <button onClick={() => { onWithdraw(p.id); setConfirmId(null); }} className="h-8 px-2.5 rounded-lg bg-red-600 text-white text-xs cursor-pointer">Отозвать</button>
                            <button onClick={() => setConfirmId(null)} className="h-8 px-2.5 rounded-lg border border-[var(--app-border)] text-xs cursor-pointer text-[var(--app-text-primary)]">Нет</button>
                          </span>
                        ) : (
                          <button onClick={() => setConfirmId(p.id)} className="h-8 px-2.5 rounded-lg border border-[var(--app-border)] text-xs text-[var(--app-text-secondary)] cursor-pointer">Отозвать</button>
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
  categories: EventCategory[];
  participants: Participant[];
  currency: string;
  onSetFee: (participantId: string, status: FeeStatus) => void;
}

export const FeesPanel: React.FC<FeesProps> = ({ tournaments, initialTournamentId, categories, participants, currency, onSetFee }) => {
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
            <Wallet className="w-6 h-6 text-[var(--accent)]" /> Взносы
          </h1>
          <p className="text-[15px] text-[var(--app-text-secondary)] mt-1">
            Отмечайте оплату взносов по заявкам. Онлайн-оплата картой на сайте не подключена: взносы принимаются по вашим реквизитам или на мандатной комиссии.
          </p>
        </div>
        <select value={tid} onChange={(e) => setTid(e.target.value)} className={`${field} w-full sm:w-auto sm:min-w-[240px] max-w-full`}>
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>{t.title}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {([['paid', 'Оплачено'], ['pending', 'Ожидается'], ['exempt', 'Освобождены'], ['refunded', 'Возвращено']] as [FeeStatus, string][]).map(([s, label]) => (
          <div key={s} className={`${card} p-4`}>
            <div className="text-xs text-[var(--app-text-muted)]">{label}</div>
            <div className="text-xl font-bold text-[var(--app-text-primary)]">{sum(s)} {currency}</div>
            <div className="text-xs text-[var(--app-text-muted)]">{entries.filter((p) => feeOf(p) === s).length} заявок</div>
          </div>
        ))}
      </div>

      <section className={`${card} overflow-hidden`}>
        <div className="px-4 py-3 border-b border-[var(--app-border)] flex flex-wrap gap-2 items-center">
          <label className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-[var(--app-text-muted)]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Спортсмен или клуб" className={`${field} w-full pl-8`} />
          </label>
          <select value={filter} onChange={(e) => setFilter(e.target.value as 'all' | FeeStatus)} className={field}>
            <option value="all">Все</option>
            {(Object.keys(FEE_LABEL) as FeeStatus[]).map((s) => (
              <option key={s} value={s}>{FEE_LABEL[s]}</option>
            ))}
          </select>
        </div>
        {shown.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--app-text-muted)]">Заявок нет.</div>
        ) : (
          <ul className="divide-y divide-[var(--app-border)]">
            {shown.map((p) => (
              <li key={p.id} className="px-4 py-2.5 flex flex-wrap items-center gap-2 text-sm">
                <div className="flex-1 min-w-[220px]">
                  <div className="text-[var(--app-text-primary)]">{p.teamName || `${p.lastName} ${p.firstName}`} <span className="text-[var(--app-text-muted)]">· {p.clubName || '—'}</span></div>
                  <div className="text-xs text-[var(--app-text-muted)]">{catTitle(categories, p.categoryId)}</div>
                </div>
                <span className="w-24 text-right text-[var(--app-text-secondary)]">{fee(p)} {currency}</span>
                <select value={feeOf(p)} onChange={(e) => onSetFee(p.id, e.target.value as FeeStatus)} className={`${field} h-8`}>
                  {(Object.keys(FEE_LABEL) as FeeStatus[]).map((s) => (
                    <option key={s} value={s}>{FEE_LABEL[s]}</option>
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
