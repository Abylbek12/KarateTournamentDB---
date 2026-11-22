import React from 'react';
import { CheckCircle2, Circle, Clock3, ArrowRight, ListChecks, AlertTriangle } from 'lucide-react';
import type { Bout, EventCategory, Participant, Tournament } from '../types/schema';
import { useApp } from '../context/AppContext';
import { belongsToEvent } from '../data/sampleTournamentData';
import { eventTitle } from '../utils/eventI18n';

type Lang = 'ru' | 'ky' | 'en';
type Status = 'done' | 'progress' | 'todo';

interface Step {
  id: string;
  title: string;
  text: string;
  status: Status;
  /** What the site counted, e.g. «12 из 20 взвешены». */
  info?: string;
  /** Steps the site cannot check by itself: the organizer ticks them. */
  manual?: boolean;
  optional?: boolean;
  warning?: string;
  go: { tab: string; label: string };
}

const MANUAL_KEY = (eventId: string) => `tatami_plan_${eventId}`;
const readManual = (eventId: string): string[] => {
  try {
    return JSON.parse(localStorage.getItem(MANUAL_KEY(eventId)) || '[]');
  } catch {
    return [];
  }
};
const writeManual = (eventId: string, ids: string[]) => {
  try {
    localStorage.setItem(MANUAL_KEY(eventId), JSON.stringify(ids));
  } catch {
    /* private mode: not remembered */
  }
};

const daysBetween = (a?: string, b?: string) => {
  if (!a || !b) return 0;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000) + 1;
};

/**
 * «План турнира»: the organizer's step-by-step checklist from creating the tournament to diplomas.
 * Most steps are checked from the data (categories, entries, weigh-in, draw, bouts); the rest are ticked by hand.
 */
export const TournamentPlan: React.FC<{
  event: Tournament;
  categories: EventCategory[];
  participants: Participant[];
  bouts: Bout[];
  onGo: (tab: string) => void;
}> = ({ event, categories, participants, bouts, onGo }) => {
  const { language } = useApp();
  const lang = (language || 'ru') as Lang;
  const t = (ru: string, ky: string, en: string) => (lang === 'ky' ? ky : lang === 'en' ? en : ru);
  const [manual, setManual] = React.useState<string[]>(() => readManual(event.id));
  React.useEffect(() => setManual(readManual(event.id)), [event.id]);
  const toggle = (id: string) => {
    const next = manual.includes(id) ? manual.filter((x) => x !== id) : [...manual, id];
    setManual(next);
    writeManual(event.id, next);
  };

  const cats = categories.filter((c) => c.tournamentId === event.id);
  const entries = participants.filter((p) => belongsToEvent(p.tournamentId, event.id) && p.status !== 'withdrawn');
  const eventBouts = bouts.filter((b) => belongsToEvent(b.tournamentId, event.id));
  const weighed = entries.filter((p) => p.isWeighedIn).length;
  const entriesByCat = (id: string) => entries.filter((p) => p.categoryId === id).length;
  const drawable = cats.filter((c) => entriesByCat(c.id) >= 2);
  const drawnIds = new Set(eventBouts.map((b) => b.categoryId));
  const drawn = drawable.filter((c) => drawnIds.has(c.id)).length;
  const finished = eventBouts.filter((b) => b.status === 'completed').length;
  const length = daysBetween(event.startDate, event.endDate);
  const ticked = (id: string) => manual.includes(id);
  const manualStatus = (id: string): Status => (ticked(id) ? 'done' : 'todo');

  const steps: Step[] = [
    {
      id: 'create',
      title: t('Турнир создан', 'Мелдеш түзүлдү', 'Tournament created'),
      text: t(
        'Название, даты, город, правила и число татами. При желании — название на кыргызском и английском.',
        'Аталышы, даталары, шаары, эрежелери жана татами саны. Кааласаңыз — кыргызча жана англисче аталышы.',
        'Title, dates, city, rules and number of tatami. Optionally the title in Kyrgyz and English.'
      ),
      status: 'done',
      info: `${event.startDate || '—'} — ${event.endDate || '—'} · ${t('татами', 'татами', 'tatami')}: ${event.tatamiCount || 1}`,
      warning:
        length > 7
          ? t(`Турнир длится ${length} дн. Проверьте дату окончания.`, `Мелдеш ${length} күн созулат. Аяктоо датасын текшериңиз.`, `The tournament lasts ${length} days. Check the end date.`)
          : undefined,
      go: { tab: 'admin', label: t('Изменить турнир', 'Мелдешти өзгөртүү', 'Edit tournament') }
    },
    {
      id: 'categories',
      title: t('Категории и взносы', 'Категориялар жана төгүмдөр', 'Categories and fees'),
      text: t(
        'Добавьте стандартный набор WKF или свои категории, укажите взнос. Без категорий заявки не принимаются.',
        'WKF стандарттык топтомун же өз категорияларыңызды кошуп, төгүмдү көрсөтүңүз. Категориясыз табыштама кабыл алынбайт.',
        'Add the standard WKF set or your own categories and set the fee. Entries need categories.'
      ),
      status: cats.length > 0 ? 'done' : 'todo',
      info: cats.length > 0 ? `${t('Категорий', 'Категориялар', 'Categories')}: ${cats.length}` : undefined,
      go: { tab: 'event_setup', label: t('Категории и жеребьёвка', 'Категориялар жана чүчүкулак', 'Categories & draw') }
    },
    {
      id: 'links',
      title: t('Разослать ссылки для регистрации', 'Катталуу шилтемелерин жөнөтүү', 'Send the sign-up links'),
      text: t(
        'Скопируйте ссылки для спортсменов и тренеров и отправьте в чаты клуба, WhatsApp, Telegram.',
        'Спортчулар жана машыктыруучулар үчүн шилтемелерди көчүрүп, клубдун чаттарына, WhatsApp, Telegramга жөнөтүңүз.',
        'Copy the athlete and coach links and send them to club chats, WhatsApp, Telegram.'
      ),
      status: entries.length > 0 ? 'done' : manualStatus('links'),
      manual: entries.length === 0,
      go: { tab: 'admin', label: t('Ссылки для регистрации', 'Катталуу шилтемелери', 'Sign-up links') }
    },
    {
      id: 'entries',
      title: t('Приём заявок', 'Табыштамаларды кабыл алуу', 'Entries'),
      text: t(
        'Спортсмены и тренеры подают заявки сами. Вы видите их по категориям; при желании закройте приём.',
        'Спортчулар жана машыктыруучулар табыштаманы өздөрү беришет. Сиз аларды категориялар боюнча көрөсүз.',
        'Athletes and coaches enter themselves. You see the entries by category and can close entries.'
      ),
      status: entries.length === 0 ? 'todo' : drawable.length > 0 ? 'done' : 'progress',
      info:
        entries.length > 0
          ? `${t('Заявок', 'Табыштамалар', 'Entries')}: ${entries.length} · ${t('категорий с 2+ участниками', '2+ катышуучусу бар категориялар', 'categories with 2+ athletes')}: ${drawable.length}`
          : undefined,
      go: { tab: 'event_setup', label: t('Смотреть заявки', 'Табыштамаларды көрүү', 'View entries') }
    },
    {
      id: 'staff',
      title: t('Судьи, секретари, врач', 'Калыстар, катчылар, дарыгер', 'Referees, scorekeepers, doctor'),
      text: t(
        'Создайте секретную ссылку-приглашение и отправьте лично. Для клубного турнира хватит секретаря на каждое татами.',
        'Жашыруун чакыруу шилтемесин түзүп, жеке жөнөтүңүз. Клубдук мелдешке ар бир татамиге бир катчы жетиштүү.',
        'Create a secret invitation link and send it personally. A club event needs one scorekeeper per tatami.'
      ),
      status: manualStatus('staff'),
      manual: true,
      go: { tab: 'admin', label: t('Приглашения', 'Чакыруулар', 'Invitations') }
    },
    {
      id: 'weighin',
      title: t('Взвешивание и допуск', 'Таразалоо жана уруксат', 'Weigh-in & clearance'),
      text: t(
        'В день турнира или накануне: фактический вес и медицинский допуск. Не прошедших по весу можно перевести в другую категорию.',
        'Мелдеш күнү же мурунку күнү: чыныгы салмак жана медициналык уруксат. Салмагы туура келбегендерди башка категорияга которсо болот.',
        'On the day or the day before: actual weight and medical clearance. Athletes off the weight can move to another category.'
      ),
      status: ticked('weighin') ? 'done' : entries.length > 0 && weighed === entries.length ? 'done' : weighed > 0 ? 'progress' : 'todo',
      info: entries.length > 0 ? `${t('Взвешено', 'Таразаланды', 'Weighed')}: ${weighed} / ${entries.length}` : undefined,
      optional: true,
      manual: true,
      go: { tab: 'participants', label: t('Взвешивание', 'Таразалоо', 'Weigh-in') }
    },
    {
      id: 'draw',
      title: t('Жеребьёвка', 'Чүчүкулак', 'Draw'),
      text: t(
        'По каждой категории нажмите «Жеребьёвка» и выберите татами — появятся сетки и поединки.',
        'Ар бир категория боюнча «Чүчүкулак» баскычын басып, татамини тандаңыз — торчолор жана беттештер пайда болот.',
        'For each category press «Draw» and choose a tatami — brackets and bouts appear.'
      ),
      status: drawable.length > 0 && drawn === drawable.length ? 'done' : drawn > 0 ? 'progress' : 'todo',
      info: drawable.length > 0 ? `${t('Проведена', 'Өткөрүлдү', 'Done')}: ${drawn} / ${drawable.length}` : undefined,
      go: { tab: 'event_setup', label: t('Провести жеребьёвку', 'Чүчүкулак өткөрүү', 'Run the draw') }
    },
    {
      id: 'screens',
      title: t('Табло и пульты у татами', 'Татамидеги табло жана пульттар', 'Scoreboards and consoles'),
      text: t(
        'Секретарь сканирует QR-код пульта, телевизор открывает табло. Один компьютер без телевизора — в пульте «Один экран»; зрители смотрят счёт на телефонах в «Идут бои».',
        'Катчы пульттун QR-кодун сканерлейт, телевизор табло ачат. Телевизорсуз бир компьютер — пультта «Бир экран»; көрүүчүлөр эсепти телефондон «Түз эфирден» көрөт.',
        'The scorekeeper scans the console QR code, the TV opens the scoreboard. One computer without a TV — «Single screen» in the console; spectators follow the score on their phones in «Live now».'
      ),
      status: manualStatus('screens'),
      manual: true,
      go: { tab: 'screens', label: t('Экраны и QR-коды', 'Экрандар жана QR', 'Screens & QR') }
    },
    {
      id: 'day',
      title: t('День турнира: поединки', 'Мелдеш күнү: беттештер', 'Tournament day: bouts'),
      text: t(
        'Следите за татами: кто на ковре, кто следующий. Пульт можно открыть и здесь.',
        'Татамилерди көзөмөлдөңүз: ким килемде, ким кийинки. Пультту ушул жерден да ачса болот.',
        'Watch the tatami: who is on, who is next. You can open the console here too.'
      ),
      status: eventBouts.length > 0 && finished === eventBouts.length ? 'done' : finished > 0 ? 'progress' : 'todo',
      info: eventBouts.length > 0 ? `${t('Завершено боёв', 'Аяктаган беттештер', 'Bouts finished')}: ${finished} / ${eventBouts.length}` : undefined,
      go: { tab: 'scoreboard', label: t('Татами', 'Татами', 'Tatami') }
    },
    {
      id: 'results',
      title: t('Итоги, протоколы и дипломы', 'Жыйынтыктар, протоколдор жана дипломдор', 'Results, protocols and diplomas'),
      text: t(
        'Распечатайте итоговые протоколы, медальный зачёт и дипломы (или сохраните PDF). Скачайте резервную копию.',
        'Жыйынтык протоколдорду, медалдык эсепти жана дипломдорду басып чыгарыңыз (же PDF сактаңыз). Камдык көчүрмөнү жүктөп алыңыз.',
        'Print the final protocols, medal table and diplomas (or save PDF). Download a backup.'
      ),
      status: manualStatus('results'),
      manual: true,
      go: { tab: 'exports', label: t('Документы и печать', 'Документтер жана басып чыгаруу', 'Documents & printing') }
    }
  ];

  const doneCount = steps.filter((s) => s.status === 'done').length;
  const next = steps.find((s) => s.status !== 'done');
  const icon = (s: Status) =>
    s === 'done' ? (
      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
    ) : s === 'progress' ? (
      <Clock3 className="w-6 h-6 text-amber-500" />
    ) : (
      <Circle className="w-6 h-6 text-[var(--app-text-muted)]" />
    );

  return (
    <div className="theme-keep space-y-5 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--app-text-primary)] flex items-center gap-2">
          <ListChecks className="w-6 h-6 text-[var(--accent)]" /> {t('План турнира', 'Мелдештин планы', 'Tournament plan')}
        </h1>
        <p className="mt-1 text-[15px] text-[var(--app-text-secondary)]">
          {t('Шаг за шагом от создания турнира до дипломов для', 'Мелдешти түзүүдөн дипломдорго чейин кадам боюнча:', 'Step by step from creating the tournament to diplomas for')}{' '}
          <b translate="no">{eventTitle(event, lang)}</b>
        </p>
      </div>

      <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 space-y-3">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-semibold text-[var(--app-text-primary)]">
            {t('Готово', 'Даяр', 'Done')}: {doneCount} / {steps.length}
          </span>
          {next && (
            <button onClick={() => onGo(next.go.tab)} className="inline-flex items-center gap-1.5 text-[var(--accent)] font-semibold hover:underline cursor-pointer">
              {t('Следующий шаг', 'Кийинки кадам', 'Next step')}: {next.title} <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="h-2.5 rounded-full bg-[var(--app-surface-subtle)] overflow-hidden">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.round((doneCount / steps.length) * 100)}%` }} />
        </div>
      </section>

      <ol className="space-y-3">
        {steps.map((s, i) => {
          const isNext = next?.id === s.id;
          return (
            <li
              key={s.id}
              className={`rounded-2xl border bg-[var(--app-surface)] p-4 flex gap-3 ${isNext ? 'border-[var(--accent)] ring-2 ring-[var(--accent-soft)]' : 'border-[var(--app-border)]'}`}
            >
              <div className="shrink-0 pt-0.5">{icon(s.status)}</div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-[var(--app-text-muted)]">{i + 1}.</span>
                  <h2 className="font-semibold text-[var(--app-text-primary)]">{s.title}</h2>
                  {s.optional && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--app-surface-subtle)] text-[var(--app-text-muted)]">
                      {t('по желанию', 'каалоо боюнча', 'optional')}
                    </span>
                  )}
                  {isNext && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--accent)] text-white font-semibold">
                      {t('сейчас', 'азыр', 'now')}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[var(--app-text-secondary)]">{s.text}</p>
                {s.info && <p className="text-sm font-medium text-[var(--app-text-primary)]">{s.info}</p>}
                {s.warning && (
                  <p className="text-sm text-amber-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> {s.warning}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={() => onGo(s.go.tab)}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-sm font-semibold cursor-pointer"
                  >
                    {s.go.label} <ArrowRight className="w-4 h-4" />
                  </button>
                  {s.manual && (
                    <label className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-[var(--app-border)] text-sm text-[var(--app-text-secondary)] cursor-pointer">
                      <input type="checkbox" checked={ticked(s.id)} onChange={() => toggle(s.id)} />
                      {t('Отметить как сделано', 'Аткарылды деп белгилөө', 'Mark as done')}
                    </label>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="text-xs text-[var(--app-text-muted)]">
        {t(
          'Галочки «Отметить как сделано» запоминаются в этом браузере. Остальные шаги сайт проверяет сам по данным турнира.',
          '«Аткарылды деп белгилөө» белгилери ушул браузерде сакталат. Калган кадамдарды сайт мелдештин маалыматы боюнча өзү текшерет.',
          '«Mark as done» ticks are remembered in this browser. The other steps are checked by the site from the tournament data.'
        )}
      </p>
    </div>
  );
};
