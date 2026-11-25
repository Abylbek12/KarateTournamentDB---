import React from 'react';
import { ArrowLeft, ArrowRight, Check, Save } from 'lucide-react';
import type { Tournament, TournamentRules, TournamentStatus } from '../types/schema';
import { WORKFLOW_STEPS, stepText, type WorkflowStatus } from '../utils/workflow';
import { isPlainClick, manageHash } from '../utils/routes';
import { eventTitle } from '../utils/eventI18n';

const tl = (lang: string, ru: string, ky: string, en: string) => (lang === 'ky' ? ky : lang === 'en' ? en : ru);

const COUNT_WORDS: Record<number, [string, string, string]> = {
  1: ['кат.', 'кат.', 'cat.'],
  2: ['заяв.', 'табыш.', 'entries'],
  3: ['взвеш.', 'тараз.', 'weighed'],
  4: ['сеток', 'торчо', 'brackets'],
  5: ['боёв', 'беттеш', 'bouts']
};

/** A link to a stage: an ordinary click stays in the page, Ctrl/Cmd/middle click or «Open in new tab» opens it in a new tab. */
export const StageLink: React.FC<
  { eventId: string; step: number; onStep: (n: number) => void; className?: string; title?: string; children: React.ReactNode } & Pick<React.AriaAttributes, 'aria-current'>
> = ({ eventId, step, onStep, className, title, children, ...aria }) => (
  <a
    href={manageHash(eventId, step)}
    title={title}
    className={className}
    {...aria}
    onClick={(e) => {
      if (!isPlainClick(e)) return;
      e.preventDefault();
      onStep(step);
    }}
  >
    {children}
  </a>
);

/** Top of the workflow: tournament name and the numbered stages (each is a real link). */
export const WorkflowHeader: React.FC<{
  event: Tournament;
  step: number;
  status: WorkflowStatus;
  language: string;
  onStep: (n: number) => void;
  onBack: () => void;
  /** Other tournaments to switch to without leaving the workflow. */
  tournaments?: Tournament[];
  onSelectEvent?: (id: string) => void;
}> = ({ event, step, status, language, onStep, onBack, tournaments = [], onSelectEvent }) => {
  const def = WORKFLOW_STEPS[step - 1];
  const stripRef = React.useRef<HTMLOListElement>(null);
  React.useEffect(() => {
    const strip = stripRef.current;
    const item = strip?.querySelector<HTMLElement>('[aria-current="step"]');
    if (strip && item) strip.scrollTo({ left: Math.max(0, item.offsetLeft - strip.clientWidth / 2 + item.clientWidth / 2), behavior: 'smooth' });
  }, [step]);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <a
          href="#admin"
          onClick={(e) => {
            if (!isPlainClick(e)) return;
            e.preventDefault();
            onBack();
          }}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--app-text-muted)] hover:text-[var(--app-text-primary)]"
        >
          <ArrowLeft className="w-4 h-4" /> {tl(language, 'Все турниры', 'Бардык мелдештер', 'All tournaments')}
        </a>
        {onSelectEvent && tournaments.length > 1 && (
          <label className="ml-auto flex items-center gap-2 text-sm text-[var(--app-text-muted)] min-w-0">
            <span className="shrink-0">{tl(language, 'Турнир:', 'Мелдеш:', 'Tournament:')}</span>
            <select
              translate="no"
              value={event.id}
              onChange={(e) => onSelectEvent(e.target.value)}
              className="min-w-0 max-w-[60vw] sm:max-w-xs h-9 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-primary)] px-2 text-sm"
            >
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {eventTitle(t as never, language)}
                  {t.startDate ? ` · ${t.startDate}` : ''}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <h1 translate="no" className="text-2xl font-bold text-[var(--app-text-primary)] leading-snug">
        {eventTitle(event as never, language)}
      </h1>

      {/* Numbered stages: a horizontal strip that scrolls on a phone (the open stage is kept in view) */}
      <ol ref={stripRef} className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
        {WORKFLOW_STEPS.map((s) => {
          const active = s.n === step;
          const done = status.done[s.n];
          const count = status.counts[s.n];
          return (
            <li key={s.n} className="shrink-0">
              <StageLink
                eventId={event.id}
                step={s.n}
                onStep={onStep}
                aria-current={active ? 'step' : undefined}
                title={stepText(language, s.hint)}
                className={`flex items-center gap-2 h-12 pl-2 pr-3 rounded-xl border text-left transition-colors ${
                  active
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                    : 'border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-secondary)] hover:border-[var(--accent)]'
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    active ? 'bg-white text-[var(--accent)]' : done ? 'bg-emerald-600 text-white' : 'bg-[var(--app-surface-subtle)] text-[var(--app-text-primary)]'
                  }`}
                >
                  {done && !active ? <Check className="w-4 h-4" /> : s.n}
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold whitespace-nowrap">{stepText(language, s.label)}</span>
                  {COUNT_WORDS[s.n] && (
                    <span className={`text-[11px] ${active ? 'text-white' : 'text-[var(--app-text-muted)]'}`}>
                      {count} {stepText(language, COUNT_WORDS[s.n])}
                    </span>
                  )}
                </span>
              </StageLink>
            </li>
          );
        })}
      </ol>

      <div className="rounded-xl bg-[var(--app-surface-subtle)] px-4 py-2.5 text-sm text-[var(--app-text-secondary)]">
        <b className="text-[var(--app-text-primary)]">
          {tl(language, 'Этап', 'Кадам', 'Stage')} {step}. {stepText(language, def.label)}
        </b>{' '}
        — {stepText(language, def.hint)}.
        {status.current !== step && !status.done[step] && step > status.current && (
          <span className="block text-amber-800 dark:text-amber-300 mt-0.5">
            {tl(language, `Сначала стоит закончить этап ${status.current}.`, `Адегенде ${status.current}-кадамды бүтүргөн жакшы.`, `Finish stage ${status.current} first.`)}
          </span>
        )}
      </div>
    </div>
  );
};

/** Bottom of a stage: back / next as links. */
export const WorkflowFooter: React.FC<{ eventId: string; step: number; language: string; onStep: (n: number) => void }> = ({ eventId, step, language, onStep }) => {
  const prev = WORKFLOW_STEPS[step - 2];
  const next = WORKFLOW_STEPS[step];
  const btn = 'inline-flex items-center gap-2 h-11 px-4 rounded-xl text-sm font-semibold';
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--app-border)]">
      {prev ? (
        <StageLink eventId={eventId} step={prev.n} onStep={onStep} className={`${btn} border border-[var(--app-border)] text-[var(--app-text-primary)] hover:bg-[var(--app-surface-subtle)]`}>
          <ArrowLeft className="w-4 h-4" /> {prev.n}. {stepText(language, prev.label)}
        </StageLink>
      ) : (
        <span />
      )}
      {next && (
        <StageLink eventId={eventId} step={next.n} onStep={onStep} className={`${btn} bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)]`}>
          {tl(language, 'Далее', 'Кийинки', 'Next')}: {next.n}. {stepText(language, next.label)} <ArrowRight className="w-4 h-4" />
        </StageLink>
      )}
    </div>
  );
};

const field = 'w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-primary)] px-3 py-2 text-sm';
const label = 'block text-xs font-medium text-[var(--app-text-secondary)] mb-1';

/** Stage 1, part 1: the event itself and its rules — one short form. */
export const EventBasicsForm: React.FC<{ event: Tournament; language: string; onSave?: (t: Tournament) => void }> = ({ event, language, onSave }) => {
  const t3 = (ru: string, ky: string, en: string) => tl(language, ru, ky, en);
  const [form, setForm] = React.useState(() => ({
    title: event.title || '',
    city: event.city || '',
    venueName: event.venueName || '',
    startDate: event.startDate || '',
    endDate: event.endDate || '',
    tatamiCount: String(event.tatamiCount ?? 2),
    registrationDeadline: event.registrationDeadline || '',
    status: (event.status || 'registration_open') as TournamentStatus,
    rulesType: (event.rulesType || 'wkf') as TournamentRules,
    rulesLabel: event.rulesLabel || '',
    description: event.description || '',
    chiefRefereeName: event.chiefRefereeName || '',
    chiefSecretaryName: event.chiefSecretaryName || ''
  }));
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState('');
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setSaved(false);
    setForm({ ...form, [k]: e.target.value });
  };
  const save = () => {
    if (!form.title.trim()) return setError(t3('Напишите название турнира.', 'Мелдештин аталышын жазыңыз.', 'Write the tournament name.'));
    if (form.startDate && form.endDate && form.endDate < form.startDate)
      return setError(t3('Дата окончания раньше даты начала.', 'Аяктоо күнү башталыш күнүнөн эрте.', 'The end date is before the start date.'));
    const tatami = Math.min(12, Math.max(1, Math.round(Number(form.tatamiCount)) || 1));
    setError('');
    onSave?.({ ...event, ...form, title: form.title.trim(), tatamiCount: tatami });
    setSaved(true);
  };

  return (
    <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 space-y-4">
      <div>
        <h2 className="text-lg font-bold text-[var(--app-text-primary)]">1.1 {t3('Событие и регламент', 'Иш-чара жана эреже', 'Event & rules')}</h2>
        <p className="text-sm text-[var(--app-text-muted)]">{t3('Основное о турнире. Это видят тренеры и зрители.', 'Мелдеш жөнүндө негизгиси. Муну машыктыруучулар жана көрүүчүлөр көрөт.', 'The basics. Coaches and spectators see this.')}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <label className={label} htmlFor="wf-title">{t3('Название', 'Аталышы', 'Name')}</label>
          <input id="wf-title" value={form.title} onChange={set('title')} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="wf-city">{t3('Город', 'Шаар', 'City')}</label>
          <input id="wf-city" value={form.city} onChange={set('city')} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="wf-venue">{t3('Спорткомплекс', 'Спорт комплекс', 'Venue')}</label>
          <input id="wf-venue" value={form.venueName} onChange={set('venueName')} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="wf-start">{t3('Начало', 'Башталышы', 'Start')}</label>
          <input id="wf-start" type="date" value={form.startDate} onChange={set('startDate')} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="wf-end">{t3('Окончание', 'Аякташы', 'End')}</label>
          <input id="wf-end" type="date" value={form.endDate} onChange={set('endDate')} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="wf-tatami">{t3('Татами (площадок)', 'Татами (аянт)', 'Tatami (areas)')}</label>
          <input id="wf-tatami" inputMode="numeric" value={form.tatamiCount} onChange={set('tatamiCount')} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="wf-deadline">{t3('Заявки до', 'Табыштамалар чейин', 'Entries until')}</label>
          <input id="wf-deadline" type="date" value={form.registrationDeadline.slice(0, 10)} onChange={set('registrationDeadline')} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="wf-rules">{t3('Правила', 'Эрежелер', 'Rules')}</label>
          <select id="wf-rules" value={form.rulesType} onChange={set('rulesType')} className={field}>
            <option value="wkf">WKF</option>
            <option value="skif">SKIF (Shobu Ippon / Sanbon)</option>
            <option value="jka">JKA</option>
            <option value="kyokushin">Kyokushin</option>
            <option value="olympic">{t3('Олимпийская WKF', 'Олимпиадалык WKF', 'Olympic WKF')}</option>
          </select>
        </div>
        <div>
          <label className={label} htmlFor="wf-status">{t3('Статус', 'Абалы', 'Status')}</label>
          <select id="wf-status" value={form.status} onChange={set('status')} className={field}>
            <option value="draft">{t3('Черновик (не виден тренерам)', 'Каралама (машыктыруучуларга көрүнбөйт)', 'Draft (hidden from coaches)')}</option>
            <option value="registration_open">{t3('Приём заявок открыт', 'Табыштама кабыл алынат', 'Entries open')}</option>
            <option value="draw_completed">{t3('Жеребьёвка проведена', 'Чүчүкулак өттү', 'Draw done')}</option>
            <option value="in_progress">{t3('Идёт турнир', 'Мелдеш жүрүүдө', 'In progress')}</option>
            <option value="completed">{t3('Завершён', 'Аяктады', 'Finished')}</option>
            {/* A status set elsewhere (older form, import) stays visible instead of silently showing «Draft» */}
            {!['draft', 'registration_open', 'draw_completed', 'in_progress', 'completed'].includes(form.status as string) && (
              <option value={form.status}>{(form.status as string) === 'registration_closed' ? t3('Приём заявок закрыт', 'Табыштама кабыл алуу жабык', 'Entries closed') : form.status}</option>
            )}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="wf-ruleslabel">{t3('Свои правила (необязательно)', 'Өз эрежелер (милдеттүү эмес)', 'Own rules (optional)')}</label>
          <input id="wf-ruleslabel" value={form.rulesLabel} onChange={set('rulesLabel')} placeholder={t3('напр. ФКР 2026', 'мис. ФКР 2026', 'e.g. National rules 2026')} className={field} />
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="wf-chief">{t3('Главный судья (для протоколов)', 'Башкы калыс (протоколдор үчүн)', 'Chief referee (for protocols)')}</label>
          <input id="wf-chief" value={form.chiefRefereeName} onChange={set('chiefRefereeName')} placeholder={t3('напр. Кыдыралиев К.С. (3 дан)', 'мис. Кыдыралиев К.С. (3 дан)', 'e.g. Smith J. (3 dan)')} className={field} />
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="wf-secretary">{t3('Главный секретарь', 'Башкы катчы', 'Chief secretary')}</label>
          <input id="wf-secretary" value={form.chiefSecretaryName} onChange={set('chiefSecretaryName')} className={field} />
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <label className={label} htmlFor="wf-desc">{t3('Регламент допуска (для тренеров)', 'Уруксат эрежеси (машыктыруучулар үчүн)', 'Eligibility rules (for coaches)')}</label>
          <textarea id="wf-desc" rows={2} value={form.description} onChange={set('description')} className={field} />
        </div>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={!onSave} className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold disabled:opacity-40 cursor-pointer">
          <Save className="w-4 h-4" /> {t3('Сохранить', 'Сактоо', 'Save')}
        </button>
        {saved && <span className="text-sm text-emerald-700">✓ {t3('Сохранено', 'Сакталды', 'Saved')}</span>}
      </div>
    </section>
  );
};
