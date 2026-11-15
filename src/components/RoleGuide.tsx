import React from 'react';
import { BookOpen } from 'lucide-react';

type GuideKey = 'athlete' | 'coach' | 'official' | 'organizer';

const GUIDES: Record<GuideKey, { title: string; steps: string[]; tip?: string }> = {
  athlete: {
    title: 'Спортсмену (или родителю)',
    steps: [
      'Зарегистрируйтесь по ссылке для спортсменов или кнопкой «Регистрация» → роль «Спортсмен».',
      'Откройте нужный турнир в списке и посмотрите «Категории и цены»: возраст, вес, ката или кумитэ.',
      'Нажмите «Подать заявку», выберите категории и отправьте.',
      'Оплатите взнос в разделе «Мои оплаты» (если турнир платный).',
      'В день турнира пройдите взвешивание и мандатную комиссию — смотрите своё татами и время в «Сетках» и «Live».',
      'Результаты и медали появятся на странице турнира сразу после финалов.'
    ],
    tip: 'Родитель может зарегистрироваться сам и подавать заявки за ребёнка.'
  },
  coach: {
    title: 'Тренеру и клубу',
    steps: [
      'Зарегистрируйтесь по ссылке для тренеров, укажите свой клуб.',
      'Если вы сами выступаете — отметьте «Я тоже выступаю на соревнованиях» (можно включить позже в «Личном кабинете»).',
      'В «Кабинете клуба» добавьте своих учеников один раз — их данные будут использоваться на всех турнирах.',
      'Откройте турнир → «Подать заявку» → отметьте учеников (и себя, если выступаете) и их категории.',
      'Оплатите взносы за клуб одним платежом в «Оплатах».',
      'Следите за сетками и результатами своих спортсменов на странице турнира.'
    ],
    tip: 'Тренер может добавлять заявки, но не может менять или удалять чужие.'
  },
  official: {
    title: 'Судье, секретарю, врачу',
    steps: [
      'Получите у организатора секретную ссылку-приглашение и зарегистрируйтесь по ней — роль назначится автоматически.',
      'Судья татами: «Онлайн-табло» → своё татами → ведите счёт, предупреждения и Senshu.',
      'Секретарь: «Расписание татами» и «Протоколы» — вызывайте пары и подтверждайте результаты.',
      'Главный судья: видеоповторы (VR), утверждение протоколов, сетки.',
      'Врач: «Медконтроль» и допуск спортсменов на взвешивании.'
    ]
  },
  organizer: {
    title: 'Организатору (администратору)',
    steps: [
      '«Администрирование» → создайте турнир: даты, место, правила (WKF/SKIF), категории и цены.',
      'Скопируйте ссылки для спортсменов и тренеров и разошлите их.',
      'Создайте секретные ссылки для судей, секретарей и врача.',
      'После окончания приёма заявок — взвешивание, жеребьёвка и расписание татами.',
      'В день турнира следите за табло и протоколами, после — опубликуйте результаты и экспортируйте протоколы.'
    ]
  }
};

const ORDER: GuideKey[] = ['athlete', 'coach', 'official', 'organizer'];

export const RoleGuide: React.FC<{ initial?: GuideKey }> = ({ initial = 'athlete' }) => {
  const [active, setActive] = React.useState<GuideKey>(initial);
  React.useEffect(() => setActive(initial), [initial]);
  const g = GUIDES[active];
  return (
    <section id="guide" className="theme-keep rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 sm:p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[var(--app-text-primary)]">Как пользоваться сайтом</h2>
          <p className="text-sm text-[var(--app-text-muted)]">Короткая инструкция для каждого участника турнира</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {ORDER.map((k) => (
          <button
            key={k}
            onClick={() => setActive(k)}
            className={`px-3.5 py-1.5 rounded-full text-sm border transition-colors cursor-pointer ${
              active === k
                ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                : 'border-[var(--app-border)] text-[var(--app-text-secondary)] hover:border-[var(--accent)]'
            }`}
          >
            {GUIDES[k].title}
          </button>
        ))}
      </div>

      <ol className="mt-5 space-y-3">
        {g.steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="w-7 h-7 shrink-0 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-sm font-semibold flex items-center justify-center">
              {i + 1}
            </span>
            <span className="text-[15px] leading-relaxed text-[var(--app-text-primary)] pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
      {g.tip && (
        <div className="mt-4 rounded-xl bg-[var(--app-surface-subtle)] border border-[var(--app-border)] px-4 py-3 text-sm text-[var(--app-text-secondary)]">
          💡 {g.tip}
        </div>
      )}
    </section>
  );
};
