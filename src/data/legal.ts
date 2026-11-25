// Legal documents of the site (ru / ky / en). Shown on the page #legal;doc=privacy|terms|payment.
// The operator's name and contact are filled in by the site owner (OPERATOR below).
// NOTE: written as a plain-language template for Kyrgyzstan; the owner should have it checked by a local lawyer.

export type LegalDocId = 'privacy' | 'terms' | 'payment';
type T3 = [ru: string, ky: string, en: string];

/** Who processes the personal data. Filled in by the owner before publishing. */
export const OPERATOR = {
  name: 'Абылбек Амирбек уулу' as string,
  /** The same name in Latin letters, for the English version */
  nameLatin: 'Abylbek Amirbek uulu' as string,
  contact: 'abylbek12@gmail.com' as string,
  city: 'Кыргызская Республика'
};

export const LEGAL_VERSION = '25.11.2026';

export const LEGAL_TITLES: Record<LegalDocId, T3> = {
  privacy: ['Политика обработки персональных данных', 'Жеке маалыматтарды иштетүү саясаты', 'Personal data policy'],
  terms: ['Пользовательское соглашение', 'Колдонуучу келишими', 'Terms of use'],
  payment: ['Оплата взносов и возврат', 'Төгүмдөрдү төлөө жана кайтаруу', 'Entry fees and refunds']
};

export interface LegalSection {
  h: T3;
  p: T3[];
}

const op = (): T3 => {
  const n = OPERATOR.name || '—';
  const nLat = OPERATOR.nameLatin || n;
  const c = OPERATOR.contact || '—';
  return [
    `Оператор: ${n}. Контакт для вопросов о данных: ${c}. Сайт работает в Кыргызской Республике.`,
    `Оператор: ${n}. Маалыматтар боюнча суроолор үчүн байланыш: ${c}. Сайт Кыргыз Республикасында иштейт.`,
    `Operator: ${nLat}. Contact for data questions: ${c}. The site operates in the Kyrgyz Republic.`
  ];
};

export function legalSections(doc: LegalDocId): LegalSection[] {
  if (doc === 'privacy')
    return [
      {
        h: ['1. Кто обрабатывает данные', '1. Маалыматтарды ким иштетет', '1. Who processes the data'],
        p: [
          op(),
          [
            'Турнир на сайте ведёт его организатор. Он отвечает за заявки своего турнира и пользуется ими только для проведения соревнований.',
            'Сайттагы мелдешти анын уюштуруучусу жүргүзөт. Ал өз мелдешинин табыштамалары үчүн жооп берет жана аларды мелдешти өткөрүү үчүн гана колдонот.',
            'Each tournament is run by its organizer, who is responsible for its entries and uses them only to hold the competition.'
          ]
        ]
      },
      {
        h: ['2. Какие данные', '2. Кандай маалыматтар', '2. What data'],
        p: [
          [
            'Аккаунт: имя и фамилия, e-mail, телефон (по желанию), клуб, роль. Пароль хранится только в зашифрованном виде.',
            'Аккаунт: аты-жөнү, e-mail, телефон (каалоо боюнча), клуб, роль. Сырсөз шифрленген түрдө гана сакталат.',
            'Account: name, e-mail, phone (optional), club, role. The password is stored only in encrypted form.'
          ],
          [
            'Заявка спортсмена: фамилия и имя, дата рождения, пол, вес, пояс (кю/дан), клуб, город, страна; на соревнованиях — фактический вес, допуск врача, результаты боёв.',
            'Спортчунун табыштамасы: аты-жөнү, туулган күнү, жынысы, салмагы, курү (кю/дан), клубу, шаары, өлкөсү; мелдеште — чыныгы салмагы, дарыгердин уруксаты, беттештердин жыйынтыктары.',
            'Athlete entry: name, date of birth, gender, weight, belt (kyu/dan), club, city, country; at the event — actual weight, medical clearance, bout results.'
          ]
        ]
      },
      {
        h: ['3. Зачем', '3. Эмне үчүн', '3. Why'],
        p: [
          [
            'Чтобы принять заявку, распределить по категориям, провести взвешивание, жеребьёвку и бои, напечатать протоколы, сетки, дипломы и показать результаты.',
            'Табыштаманы кабыл алуу, категорияларга бөлүү, таразалоо, чүчүкулак жана беттештерди өткөрүү, протоколдорду, торчолорду, дипломдорду басып чыгаруу жана жыйынтыктарды көрсөтүү үчүн.',
            'To accept entries, assign categories, hold the weigh-in, draw and bouts, print protocols, brackets and diplomas, and show results.'
          ],
          [
            'Мы не продаём данные и не используем их для рекламы. Рассылок сайт не делает.',
            'Маалыматтарды сатпайбыз жана жарнама үчүн колдонбойбуз. Сайт жөнөтмөлөрдү жасабайт.',
            'We do not sell data or use it for advertising. The site sends no newsletters.'
          ]
        ]
      },
      {
        h: ['4. Дети', '4. Балдар', '4. Children'],
        p: [
          [
            'Многие спортсмены — дети. Их заявку подаёт родитель (законный представитель) или тренер, получивший согласие родителей. При подаче заявки он подтверждает это отдельной галочкой.',
            'Көптөгөн спортчулар — балдар. Алардын табыштамасын ата-энеси (мыйзамдуу өкүлү) же ата-энесинин макулдугун алган машыктыруучу берет. Табыштама берүүдө ал муну өзүнчө белги менен ырастайт.',
            'Many athletes are children. Their entry is made by a parent (legal guardian) or by a coach who has the parents’ consent, confirmed with a separate tick when entering.'
          ],
          [
            'Дату рождения, вес и сведения об оплате детей видят только организатор турнира, судьи, секретарь и врач. Тренеры других клубов и зрители их не видят.',
            'Балдардын туулган күнүн, салмагын жана төлөм маалыматын мелдештин уюштуруучусу, калыстар, катчы жана дарыгер гана көрөт. Башка клубдардын машыктыруучулары жана көрүүчүлөр көрбөйт.',
            'Children’s date of birth, weight and payment details are visible only to the tournament organizer, referees, secretary and doctor — not to other clubs or spectators.'
          ]
        ]
      },
      {
        h: ['5. Что публикуется', '5. Эмне жарыяланат', '5. What is published'],
        p: [
          [
            'На страницах турнира всем видны: фамилия и имя спортсмена, клуб, город, страна, категория, сетки, результаты, медали и рейтинг. Так устроены спортивные соревнования; согласие на это даётся при подаче заявки.',
            'Мелдештин барактарында баарына көрүнөт: спортчунун аты-жөнү, клубу, шаары, өлкөсү, категориясы, торчолор, жыйынтыктар, медалдар жана рейтинг. Спорттук мелдештер ушундай; буга макулдук табыштама берүүдө берилет.',
            'Tournament pages show everyone the athlete’s name, club, city, country, category, brackets, results, medals and ranking. Consent to this is given when entering.'
          ],
          [
            'Фото- и видеосъёмка, трансляции боёв на YouTube — только с согласия, которое отмечается в заявке отдельно. Если согласия нет, организатор видит это в списке участников.',
            'Сүрөткө жана видеого тартуу, беттештерди YouTube аркылуу көрсөтүү — табыштамада өзүнчө белгиленген макулдук менен гана. Макулдук жок болсо, уюштуруучу муну катышуучулардын тизмесинде көрөт.',
            'Photos, video and YouTube broadcasts of bouts only with consent ticked separately in the entry. Without it, the organizer sees a mark in the list of athletes.'
          ]
        ]
      },
      {
        h: ['6. Где хранятся и кому передаются', '6. Кайда сакталат жана кимге берилет', '6. Where data is stored and who receives it'],
        p: [
          [
            'Сайт и база данных работают на серверах Vercel и Neon в Европейском союзе (Германия) — то есть данные передаются за пределы Кыргызстана. Доступ к ним защищён паролем и шифрованием (HTTPS).',
            'Сайт жана маалымат базасы Евробиримдиктеги (Германия) Vercel жана Neon серверлеринде иштейт — башкача айтканда, маалыматтар Кыргызстандан тышкары берилет. Аларга кирүү сырсөз жана шифрлөө (HTTPS) менен корголгон.',
            'The site and database run on Vercel and Neon servers in the European Union (Germany), i.e. data is transferred outside Kyrgyzstan. Access is protected by password and encryption (HTTPS).'
          ],
          [
            'Видео трансляций показываются через YouTube (Google). Если вы пишете ассистенту «Сенсей», текст вопроса отправляется сервису ИИ (Anthropic или Google) только для ответа — не вводите туда личные данные детей.',
            'Түз көрсөтүүлөр YouTube (Google) аркылуу көрсөтүлөт. «Сенсей» жардамчысына жазсаңыз, суроонун тексти жооп алуу үчүн гана ЖИ кызматына (Anthropic же Google) жөнөтүлөт — ага балдардын жеке маалыматтарын жазбаңыз.',
            'Broadcasts are shown through YouTube (Google). Questions to the «Sensei» assistant are sent to an AI service (Anthropic or Google) only to get an answer — do not type children’s personal data there.'
          ]
        ]
      },
      {
        h: ['7. Cookies и хранилище браузера', '7. Cookies жана браузердин эс тутуму', '7. Cookies and browser storage'],
        p: [
          [
            'Сайт использует одну техническую cookie — чтобы вы оставались в аккаунте после входа, и хранит в браузере язык, тему и порядок меню. Аналитики, рекламы и счётчиков посещений нет.',
            'Сайт бир техникалык cookie колдонот — киргенден кийин аккаунтта калуу үчүн, жана браузерде тилди, теманы жана менюнун тартибин сактайт. Аналитика, жарнама жана эсептегичтер жок.',
            'The site uses one technical cookie to keep you signed in, and stores the language, theme and menu order in your browser. There is no analytics, advertising or visitor tracking.'
          ]
        ]
      },
      {
        h: ['8. Сколько хранятся', '8. Канча убакыт сакталат', '8. How long'],
        p: [
          [
            'Аккаунт — пока вы им пользуетесь или пока не попросите удалить. Заявки и результаты турнира — как часть протоколов соревнований; личные данные из них (дата рождения, вес, оплата) удаляются по запросу, если это не мешает итогам уже прошедших соревнований.',
            'Аккаунт — сиз колдонгонго чейин же өчүрүүнү сураганга чейин. Табыштамалар жана жыйынтыктар — мелдештин протоколдорунун бөлүгү катары; андагы жеке маалыматтар (туулган күнү, салмагы, төлөм) суроо боюнча өчүрүлөт.',
            'Account — while you use it or until you ask to delete it. Entries and results — as part of the competition records; personal details in them (date of birth, weight, payment) are removed on request.'
          ]
        ]
      },
      {
        h: ['9. Ваши права', '9. Сиздин укуктарыңыз', '9. Your rights'],
        p: [
          [
            'Вы можете узнать, какие данные о вас или вашем ребёнке есть на сайте, исправить их, отозвать согласие и попросить удалить. Напишите оператору (контакт выше) или организатору турнира. Ответ — в течение 10 рабочих дней.',
            'Сиз же балаңыз тууралуу сайтта кандай маалымат бар экенин билип, аны оңдоп, макулдукту кайтарып алып, өчүрүүнү сурай аласыз. Операторго (байланыш жогоруда) же мелдештин уюштуруучусуна жазыңыз. Жооп — 10 жумуш күндүн ичинде.',
            'You can learn what data about you or your child is on the site, correct it, withdraw consent and ask for deletion. Write to the operator (contact above) or the tournament organizer. Reply within 10 working days.'
          ]
        ]
      }
    ];
  if (doc === 'terms')
    return [
      {
        h: ['1. О сайте', '1. Сайт жөнүндө', '1. About the site'],
        p: [
          op(),
          [
            'Apsatarov — сервис для проведения турниров по каратэ: заявки, взвешивание, жеребьёвка, сетки, табло и результаты. Пользуясь сайтом, вы принимаете это соглашение.',
            'Apsatarov — каратэ боюнча мелдештерди өткөрүү кызматы: табыштамалар, таразалоо, чүчүкулак, торчолор, табло жана жыйынтыктар. Сайтты колдонуп, бул келишимди кабыл аласыз.',
            'Apsatarov is a service for running karate tournaments: entries, weigh-in, draw, brackets, scoreboards and results. Using the site means you accept these terms.'
          ]
        ]
      },
      {
        h: ['2. Аккаунт', '2. Аккаунт', '2. Account'],
        p: [
          [
            'Указывайте правдивые данные и не передавайте пароль другим. Вы отвечаете за действия в своём аккаунте. Роли судьи, секретаря, врача и организатора выдаёт администратор или организатор по приглашению.',
            'Чыныгы маалыматтарды көрсөтүңүз жана сырсөздү башкаларга бербеңиз. Аккаунтуңуздагы аракеттер үчүн сиз жооп бересиз. Калыс, катчы, дарыгер жана уюштуруучу ролдорун администратор же уюштуруучу чакыруу менен берет.',
            'Give true information and do not share your password. You are responsible for actions in your account. Referee, secretary, doctor and organizer roles are given by the administrator or by invitation.'
          ]
        ]
      },
      {
        h: ['3. Заявки', '3. Табыштамалар', '3. Entries'],
        p: [
          [
            'Подавая заявку за ребёнка, вы подтверждаете, что вы его родитель (законный представитель) или тренер с согласием родителей. Правила, категории, взнос и допуск определяет регламент организатора турнира.',
            'Бала үчүн табыштама берип, анын ата-энеси (мыйзамдуу өкүлү) же ата-энесинин макулдугу бар машыктыруучусу экениңизди ырастайсыз. Эрежелерди, категорияларды, төгүмдү жана уруксатты мелдештин уюштуруучусунун жобосу аныктайт.',
            'By entering a child you confirm that you are the parent (legal guardian) or a coach with the parents’ consent. Rules, categories, fees and admission are set by the organizer’s regulations.'
          ]
        ]
      },
      {
        h: ['4. Ответственность', '4. Жоопкерчилик', '4. Liability'],
        p: [
          [
            'Соревнования проводит организатор турнира; он отвечает за их проведение, безопасность и решения судей. Сайт — инструмент: мы стараемся, чтобы он работал без сбоев, но не отвечаем за перерывы связи и ошибки ввода данных.',
            'Мелдешти уюштуруучу өткөрөт; анын өткөрүлүшү, коопсуздугу жана калыстардын чечимдери үчүн ал жооп берет. Сайт — курал: анын үзгүлтүксүз иштешине аракет кылабыз, бирок байланыштын үзүлүшү жана маалыматтарды туура эмес киргизүү үчүн жооп бербейбиз.',
            'Competitions are held by the tournament organizer, who is responsible for running them, safety and referee decisions. The site is a tool: we try to keep it working but are not liable for connection outages or data entry errors.'
          ]
        ]
      },
      {
        h: ['5. Запрещено', '5. Тыюу салынат', '5. Not allowed'],
        p: [
          [
            'Вводить чужие данные без согласия, пытаться получить доступ к чужим аккаунтам и турнирам, мешать работе сайта, публиковать оскорбления.',
            'Башкалардын маалыматын макулдуксуз киргизүү, башкалардын аккаунттарына жана мелдештерине кирүүгө аракет кылуу, сайттын иштешине тоскоол болуу, кордогон сөздөрдү жарыялоо.',
            'Entering other people’s data without consent, trying to access other accounts or tournaments, disrupting the site, posting insults.'
          ]
        ]
      },
      {
        h: ['6. Изменения', '6. Өзгөртүүлөр', '6. Changes'],
        p: [
          [
            'Соглашение может обновляться; новая редакция действует с даты публикации на этой странице.',
            'Келишим жаңыланышы мүмкүн; жаңы редакция ушул баракта жарыяланган күндөн тартып күчүнө кирет.',
            'These terms may be updated; a new version applies from its publication on this page.'
          ]
        ]
      }
    ];
  return [
    {
      h: ['1. Кто принимает оплату', '1. Төлөмдү ким кабыл алат', '1. Who receives payment'],
      p: [
        [
          'Сайт деньги не принимает. Стартовый взнос платится организатору турнира — способом, указанным в регламенте (наличными на мандатной комиссии или переводом).',
          'Сайт акча кабыл албайт. Старттык төгүм мелдештин уюштуруучусуна жободо көрсөтүлгөн жол менен төлөнөт (мандаттык комиссияда накталай же которуу менен).',
          'The site does not take money. The entry fee is paid to the tournament organizer as stated in the regulations (cash at registration or transfer).'
        ]
      ]
    },
    {
      h: ['2. Сумма', '2. Суммасы', '2. Amount'],
      p: [
        [
          'Взнос каждой категории и скидки видны на вкладке турнира «Категории». Сумма фиксируется при подаче заявки и видна в разделе «Мои заявки и оплата».',
          'Ар бир категориянын төгүмү жана арзандатуулар мелдештин «Категориялар» өтмөгүндө көрүнөт. Сумма табыштама берилгенде бекитилет жана «Менин табыштамаларым жана төлөм» бөлүмүндө көрүнөт.',
          'Each category’s fee and discounts are shown on the tournament’s «Categories» tab. The amount is fixed when entering and shown in «My entries & fees».'
        ]
      ]
    },
    {
      h: ['3. Статус оплаты', '3. Төлөмдүн абалы', '3. Payment status'],
      p: [
        [
          'Статус («Оплачено», «Не оплачено», «Освобождён», «Возвращено») ведёт организатор турнира и может его изменить. Если статус не совпадает с реальностью — обратитесь к организатору.',
          'Абалды («Төлөндү», «Төлөнгөн жок», «Бошотулган», «Кайтарылды») уюштуруучу белгилейт. Абал чындыкка дал келбесе — мелдештин уюштуруучусуна кайрылыңыз.',
          'The status («Paid», «Not paid», «Exempt», «Refunded») is set by the organizer. If it is wrong, contact the tournament organizer.'
        ]
      ]
    },
    {
      h: ['4. Возврат', '4. Кайтаруу', '4. Refunds'],
      p: [
        [
          'Условия возврата взноса определяет регламент турнира. Обычно: при отзыве заявки до окончания приёма заявок взнос возвращается полностью; после жеребьёвки и при неявке — по решению организатора. Возврат делает организатор тем же способом, каким была оплата, и отмечает статус «Возвращено».',
          'Төгүмдү кайтаруунун шарттарын мелдештин жобосу аныктайт. Адатта: табыштама кабыл алуу бүткөнгө чейин кайтарылып алынса, төгүм толук кайтарылат; чүчүкулактан кийин жана келбей калганда — уюштуруучунун чечими менен. Кайтарууну уюштуруучу төлөнгөн жол менен жасайт жана «Кайтарылды» деп белгилейт.',
          'Refund terms are set by the tournament regulations. Usually: a full refund if the entry is withdrawn before entries close; after the draw or for no-shows — at the organizer’s decision. The organizer refunds the same way it was paid and marks «Refunded».'
        ]
      ]
    }
  ];
}
