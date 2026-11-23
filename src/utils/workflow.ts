// Tournament workflow: one numbered path for the organizer (setup → entries → weigh-in → draw → bouts → results).
// Pure functions so the stage status can be tested (scripts/test-workflow.ts).
import type { Bout, EventCategory, Participant } from '../types/schema';

export type WorkflowStepKey = 'setup' | 'entries' | 'weighin' | 'draw' | 'bouts' | 'results';

export interface WorkflowStepDef {
  n: number;
  key: WorkflowStepKey;
  label: [string, string, string]; // ru, ky, en
  hint: [string, string, string];
}

export const WORKFLOW_STEPS: WorkflowStepDef[] = [
  {
    n: 1,
    key: 'setup',
    label: ['Настройка турнира', 'Мелдешти жөндөө', 'Tournament setup'],
    hint: ['Событие, регламент, дисциплины и категории, взносы', 'Иш-чара, эреже, дисциплиналар жана категориялар, төгүмдөр', 'Event, rules, disciplines & categories, fees']
  },
  {
    n: 2,
    key: 'entries',
    label: ['Участники и команды', 'Катышуучулар жана командалар', 'Athletes & teams'],
    hint: ['Запишите спортсменов и команды', 'Спортчуларды жана командаларды жазыңыз', 'Enter athletes and teams']
  },
  {
    n: 3,
    key: 'weighin',
    label: ['Взвешивание и допуск', 'Таразалоо жана уруксат', 'Weigh-in & clearance'],
    hint: ['Вес, допуск врача, неявки', 'Салмак, дарыгердин уруксаты, келбегендер', 'Weight, medical clearance, no-shows']
  },
  {
    n: 4,
    key: 'draw',
    label: ['Жеребьёвка', 'Чүчүкулак', 'Draw'],
    hint: ['Сетки по категориям и татами, расписание', 'Категориялар жана татамилер боюнча торчолор, расписание', 'Brackets per category and tatami, schedule']
  },
  {
    n: 5,
    key: 'bouts',
    label: ['Бои и результаты', 'Беттештер жана жыйынтыктар', 'Bouts & results'],
    hint: ['Пульт секретаря: счёт и победители', 'Катчынын пульту: эсеп жана жеңүүчүлөр', 'Secretary console: score and winners']
  },
  {
    n: 6,
    key: 'results',
    label: ['Итоги и документы', 'Жыйынтыктар жана документтер', 'Results & documents'],
    hint: ['Медали, протоколы, дипломы, PDF', 'Медалдар, протоколдор, дипломдор, PDF', 'Medals, protocols, diplomas, PDF']
  }
];

export const stepText = (lang: string, t: [string, string, string]) => (lang === 'ky' ? t[1] : lang === 'en' ? t[2] : t[0]);

export interface WorkflowStatus {
  /** Stage is finished (✓ in the stepper). */
  done: Record<number, boolean>;
  /** Short counter shown under the stage name, e.g. «4 кат.», «10 заявок». */
  counts: Record<number, number>;
  /** First stage that is not finished: where the organizer should go next. */
  current: number;
}

const ACTIVE = (p: Participant) => p.status !== 'withdrawn' && p.status !== 'disqualified';

/** What is done for one tournament, from its real data. */
export function workflowStatus(eventId: string, categories: EventCategory[], participants: Participant[], bouts: Bout[]): WorkflowStatus {
  const cats = categories.filter((c) => c.tournamentId === eventId);
  const catIds = new Set(cats.map((c) => c.id));
  const entries = participants.filter((p) => p.tournamentId === eventId && ACTIVE(p) && (!p.categoryId || catIds.has(p.categoryId) || cats.length === 0));
  const evBouts = bouts.filter((b) => b.tournamentId === eventId);
  const weighed = entries.filter((p) => p.isWeighedIn);
  // Categories that can be drawn: at least two active entries
  const drawable = cats.filter((c) => entries.filter((p) => p.categoryId === c.id).length >= 2);
  const drawn = drawable.filter((c) => evBouts.some((b) => b.categoryId === c.id));
  const finished = evBouts.filter((b) => b.status === 'completed');

  const done: Record<number, boolean> = {
    1: cats.length > 0,
    2: entries.length > 0,
    3: entries.length > 0 && weighed.length === entries.length,
    4: drawable.length > 0 && drawn.length === drawable.length,
    5: evBouts.length > 0 && finished.length === evBouts.length,
    6: evBouts.length > 0 && finished.length === evBouts.length
  };
  const counts: Record<number, number> = {
    1: cats.length,
    2: entries.length,
    3: weighed.length,
    4: drawn.length,
    5: finished.length,
    6: 0
  };
  const current = WORKFLOW_STEPS.find((s) => !done[s.n])?.n ?? 6;
  return { done, counts, current };
}
