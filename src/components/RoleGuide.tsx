import React from 'react';
import { BookOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';

type GuideKey = 'athlete' | 'coach' | 'official' | 'organizer';

type L3 = [ru: string, ky: string, en: string];

const GUIDES: Record<GuideKey, { title: L3; steps: L3[]; tip?: L3 }> = {
  athlete: {
    title: ['Спортсмену (или родителю)', 'Спортчуга (же ата-энеге)', 'Athlete (or parent)'],
    steps: [
      [
        'Зарегистрируйтесь: «Войти» → «Регистрация» → кнопка «Я спортсмен».',
        'Катталыңыз: «Кирүү» → «Катталуу» → «Мен спортчумун» баскычы.',
        'Sign up: «Sign in» → «Sign up» → the «I’m an athlete» button.'
      ],
      [
        'Откройте турнир в списке и посмотрите «Категории»: возраст, вес, ката или кумитэ.',
        'Тизмеден мелдешти ачып, «Категорияларды» караңыз: жаш, салмак, ката же кумитэ.',
        'Open the tournament and check «Categories»: age, weight, kata or kumite.'
      ],
      [
        'Нажмите «Подать заявку», выберите категории и отправьте.',
        '«Табыштама берүү» баскычын басып, категорияларды тандап, жөнөтүңүз.',
        'Press «Enter», choose the categories and send.'
      ],
      [
        'Взнос и статус заявки — в разделе «Мои заявки и оплата».',
        'Төгүм жана табыштаманын абалы — «Өтүнмөлөрүм жана төлөм» бөлүмүндө.',
        'Fee and entry status are in «My entries & fees».'
      ],
      [
        'В день турнира пройдите взвешивание; своё татами и время смотрите в «Сетках» и «Идут бои».',
        'Мелдеш күнү таразадан өтүңүз; татамиңизди жана убакытты «Торчолордон» жана «Түз эфирден» караңыз.',
        'On the day, pass the weigh-in; see your tatami and time in «Brackets» and «Live now».'
      ],
      [
        'Результаты и медали появятся на странице турнира сразу после финалов.',
        'Жыйынтыктар жана медалдар финалдан кийин дароо мелдештин барагында чыгат.',
        'Results and medals appear on the tournament page right after the finals.'
      ]
    ],
    tip: [
      'Родитель может зарегистрироваться сам и подавать заявки за ребёнка.',
      'Ата-эне өзү катталып, баласы үчүн табыштама бере алат.',
      'A parent can sign up and enter their child.'
    ]
  },
  coach: {
    title: ['Тренеру и клубу', 'Машыктыруучуга жана клубга', 'Coach and club'],
    steps: [
      [
        'Зарегистрируйтесь кнопкой «Я тренер» и укажите свой клуб.',
        '«Мен машыктыруучумун» баскычы менен катталып, клубуңузду жазыңыз.',
        'Sign up with the «I’m a coach» button and enter your club.'
      ],
      [
        'Если выступаете сами — отметьте «Я тоже выступаю на соревнованиях» (можно включить позже в «Личном кабинете»).',
        'Өзүңүз да чыксаңыз — «Мен да мелдештерге чыгам» белгисин коюңуз («Жеке кабинетте» кийин да күйгүзсө болот).',
        'If you also compete, tick «I also compete» (you can turn it on later in «My account»).'
      ],
      [
        'В «Мои спортсмены» добавьте учеников один раз — их данные подставятся на всех турнирах.',
        '«Менин спортчуларым» бөлүмүнө окуучуларды бир жолу кошуңуз — алардын маалыматы бардык мелдештерде өзү толтурулат.',
        'Add your athletes once in «My athletes» — their data is reused for every tournament.'
      ],
      [
        '«Подать заявку» → отметьте учеников (и себя кнопкой «Добавить себя») и их категории.',
        '«Табыштама берүү» → окуучуларды (жана «Өзүмдү кошуу» менен өзүңүздү) жана категорияларын белгилеңиз.',
        '«Enter» → tick your athletes (and yourself with «Add myself») and their categories.'
      ],
      [
        'Взносы за клуб — в «Мои заявки и оплата».',
        'Клуб үчүн төгүмдөр — «Өтүнмөлөрүм жана төлөм» бөлүмүндө.',
        'Club fees are in «My entries & fees».'
      ],
      [
        'Сетки и результаты своих спортсменов смотрите на странице турнира.',
        'Спортчуларыңыздын торчолорун жана жыйынтыктарын мелдештин барагынан караңыз.',
        'Follow your athletes’ brackets and results on the tournament page.'
      ]
    ],
    tip: [
      'Тренер подаёт заявки за своих учеников, но не может менять чужие.',
      'Машыктыруучу өз окуучулары үчүн табыштама берет, бирок башкалардыкын өзгөртө албайт.',
      'A coach enters their own athletes but cannot change other clubs’ entries.'
    ]
  },
  official: {
    title: ['Судье, секретарю, врачу', 'Калыска, катчыга, дарыгерге', 'Referee, scorekeeper, doctor'],
    steps: [
      [
        'Получите у организатора секретную ссылку-приглашение и зарегистрируйтесь по ней — роль назначится сама.',
        'Уюштуруучудан жашыруун чакыруу шилтемесин алып, ал аркылуу катталыңыз — роль өзү дайындалат.',
        'Get a secret invitation link from the organizer and sign up with it — the role is set automatically.'
      ],
      [
        'Секретарь и судья татами: раздел «Татами» → «Открыть пульт» или QR-код своего татами. Ведите счёт, Senshu, предупреждения и часы.',
        'Катчы жана татами калысы: «Татами» бөлүмү → «Пультту ачуу» же татамиңиздин QR-коду. Эсепти, Senshu, эскертүүлөрдү жана саатты жүргүзүңүз.',
        'Scorekeeper and tatami referee: «Tatami» → «Open console» or scan your tatami’s QR code. Keep score, Senshu, penalties and the clock.'
      ],
      [
        'Если на татами один компьютер и один экран — в пульте нажмите «Один экран».',
        'Татамиде бир компьютер жана бир экран болсо — пультта «Бир экран» баскычын басыңыз.',
        'One computer and one screen at the tatami? Press «Single screen» in the console.'
      ],
      [
        'Главный судья: «Категории и жеребьёвка», исправление результата в пульте, печать протоколов в «Документах и печати».',
        'Башкы калыс: «Категориялар жана чүчүкулак», пультта жыйынтыкты оңдоо, «Документтер жана басып чыгаруу» бөлүмүндө протоколдорду басуу.',
        'Chief referee: «Categories & draw», correcting results in the console, printing protocols in «Documents & printing».'
      ],
      [
        'Врач: «Взвешивание и допуск» — отмечайте медицинский допуск.',
        'Дарыгер: «Таразалоо жана уруксат» — медициналык уруксатты белгилеңиз.',
        'Doctor: «Weigh-in & clearance» — mark the medical clearance.'
      ]
    ]
  },
  organizer: {
    title: ['Организатору (администратору)', 'Уюштуруучуга (администраторго)', 'Organizer (administrator)'],
    steps: [
      [
        '«Турниры и пользователи» → «Создать турнир»: даты, место, правила, при желании название на кыргызском и английском.',
        '«Мелдештер жана колдонуучулар» → «Мелдеш түзүү»: даталар, орун, эрежелер, кааласаңыз кыргызча жана англисче аталышы.',
        '«Events & users» → «Create tournament»: dates, venue, rules, optionally the title in Kyrgyz and English.'
      ],
      [
        '«Категории и жеребьёвка»: добавьте категории и цены.',
        '«Категориялар жана чүчүкулак»: категорияларды жана бааларды кошуңуз.',
        '«Categories & draw»: add categories and prices.'
      ],
      [
        'Разошлите ссылки для спортсменов и тренеров; создайте секретные ссылки для судей, секретарей и врача.',
        'Спортчулар жана машыктыруучулар үчүн шилтемелерди жөнөтүңүз; калыстар, катчылар жана дарыгер үчүн жашыруун шилтемелерди түзүңүз.',
        'Send the athlete and coach links; create secret links for referees, scorekeepers and the doctor.'
      ],
      [
        'После приёма заявок — взвешивание, жеребьёвка, «Экраны, QR-коды и видео» для татами.',
        'Табыштамалар кабыл алынгандан кийин — таразалоо, чүчүкулак, татамилер үчүн «Экрандар, QR жана видео».',
        'After entries close: weigh-in, draw, and «Screens, QR codes & video» for the tatami.'
      ],
      [
        'В день турнира следите за татами; после — печатайте протоколы в «Документах и печати».',
        'Мелдеш күнү татамилерди көзөмөлдөңүз; андан кийин протоколдорду «Документтер жана басып чыгаруу» бөлүмүнөн басыңыз.',
        'On the day, watch the tatami; afterwards print protocols in «Documents & printing».'
      ]
    ]
  }
};

const ORDER: GuideKey[] = ['athlete', 'coach', 'official', 'organizer'];

export const RoleGuide: React.FC<{ initial?: GuideKey }> = ({ initial = 'athlete' }) => {
  const [active, setActive] = React.useState<GuideKey>(initial);
  React.useEffect(() => setActive(initial), [initial]);
  const g = GUIDES[active];
  const { language } = useApp();
  const pick = (x: L3) => (language === 'ky' ? x[1] : language === 'en' ? x[2] : x[0]);
  return (
    <section id="guide" translate="no" className="theme-keep rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 sm:p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[var(--app-text-primary)]">{pick(['Как пользоваться сайтом', 'Сайтты кантип колдонуу керек', 'How to use the site'])}</h2>
          <p className="text-sm text-[var(--app-text-muted)]">{pick(['Короткая инструкция для каждого участника турнира', 'Мелдештин ар бир катышуучусу үчүн кыскача нускама', 'A short guide for everyone at the tournament'])}</p>
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
            {pick(GUIDES[k].title)}
          </button>
        ))}
      </div>

      <ol className="mt-5 space-y-3">
        {g.steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="w-7 h-7 shrink-0 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-sm font-semibold flex items-center justify-center">
              {i + 1}
            </span>
            <span className="text-[15px] leading-relaxed text-[var(--app-text-primary)] pt-0.5">{pick(step)}</span>
          </li>
        ))}
      </ol>
      {g.tip && (
        <div className="mt-4 rounded-xl bg-[var(--app-surface-subtle)] border border-[var(--app-border)] px-4 py-3 text-sm text-[var(--app-text-secondary)]">
          💡 {pick(g.tip)}
        </div>
      )}
    </section>
  );
};
