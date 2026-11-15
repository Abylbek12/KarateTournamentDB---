import { useEffect } from 'react';
import { Language } from './translations';
import { EventItem } from '../data/eventsData';

/**
 * Helper for 3-language inline translation in React components
 */
export function trLang(language: Language, ru: string, ky: string, en: string): string {
  if (language === 'ky') return ky;
  if (language === 'en') return en;
  return ru;
}

/**
 * Localized event metadata for the 15 showcase tournaments in RU, KY, and EN
 */
const EVENT_LOCALIZATIONS: Record<
  string,
  {
    ru: { title: string; locationLabel: string; description: string };
    ky: { title: string; locationLabel: string; description: string };
    en: { title: string; locationLabel: string; description: string };
  }
> = {
  'kg-bishkek-cup-2026': {
    ru: { title: "Кубок города Бишкек по каратэ WKF 2026", locationLabel: "Кыргызстан, г. Бишкек", description: "Пример турнира на сайте Tatami.kg." },
    ky: { title: "Бишкек шаарынын каратэ WKF боюнча Кубогу 2026", locationLabel: "Кыргызстан, Бишкек ш.", description: "Tatami.kg сайтындагы мелдештин үлгүсү." },
    en: { title: "Bishkek City Karate WKF Cup 2026", locationLabel: "Kyrgyzstan, Bishkek", description: "Example tournament on Tatami.kg." }
  },
  'kg-osh-open-2026': {
    ru: { title: "Открытый турнир г. Ош среди детей и юношей", locationLabel: "Кыргызстан, Ошская обл., Ош", description: "Пример турнира на сайте Tatami.kg." },
    ky: { title: "Ош шаарынын балдар жана өспүрүмдөр арасындагы ачык мелдеши", locationLabel: "Кыргызстан, Ош облусу, Ош", description: "Tatami.kg сайтындагы мелдештин үлгүсү." },
    en: { title: "Osh Open Tournament for Children and Youth", locationLabel: "Kyrgyzstan, Osh Region, Osh", description: "Example tournament on Tatami.kg." }
  },
  'kg-national-championship-2026': {
    ru: { title: "Чемпионат Кыргызской Республики по каратэ 2026", locationLabel: "Кыргызстан, г. Бишкек", description: "Пример турнира на сайте Tatami.kg." },
    ky: { title: "Кыргыз Республикасынын каратэ боюнча чемпионаты 2026", locationLabel: "Кыргызстан, Бишкек ш.", description: "Tatami.kg сайтындагы мелдештин үлгүсү." },
    en: { title: "Kyrgyz Republic Karate Championship 2026", locationLabel: "Kyrgyzstan, Bishkek", description: "Example tournament on Tatami.kg." }
  },
  'kg-karakol-kata-2027': {
    ru: { title: "Турнир по ката «Каракол 2027»", locationLabel: "Кыргызстан, Иссык-Кульская обл., Каракол", description: "Пример турнира на сайте Tatami.kg." },
    ky: { title: "«Каракол 2027» ката мелдеши", locationLabel: "Кыргызстан, Ысык-Көл облусу, Каракол", description: "Tatami.kg сайтындагы мелдештин үлгүсү." },
    en: { title: "Karakol 2027 Kata Tournament", locationLabel: "Kyrgyzstan, Issyk-Kul Region, Karakol", description: "Example tournament on Tatami.kg." }
  },
  'kg-jalal-abad-youth-2027': {
    ru: { title: "Первенство Джалал-Абадской области среди юношей", locationLabel: "Кыргызстан, Джалал-Абадская обл.", description: "Пример турнира на сайте Tatami.kg." },
    ky: { title: "Жалал-Абад облусунун өспүрүмдөр арасындагы биринчилиги", locationLabel: "Кыргызстан, Жалал-Абад облусу", description: "Tatami.kg сайтындагы мелдештин үлгүсү." },
    en: { title: "Jalal-Abad Region Youth Championship", locationLabel: "Kyrgyzstan, Jalal-Abad Region", description: "Example tournament on Tatami.kg." }
  },
  'kg-talas-cup-2027': {
    ru: { title: "Кубок Таласа по каратэ", locationLabel: "Кыргызстан, Таласская обл., Талас", description: "Пример турнира на сайте Tatami.kg." },
    ky: { title: "Талас каратэ кубогу", locationLabel: "Кыргызстан, Талас облусу, Талас", description: "Tatami.kg сайтындагы мелдештин үлгүсү." },
    en: { title: "Talas Karate Cup", locationLabel: "Kyrgyzstan, Talas Region, Talas", description: "Example tournament on Tatami.kg." }
  },
  'kg-issyk-kul-cup-2027': {
    ru: { title: "Кубок Иссык-Куля по традиционному каратэ", locationLabel: "Кыргызстан, Иссык-Кульская обл., Чолпон-Ата", description: "Пример турнира на сайте Tatami.kg." },
    ky: { title: "Салттуу каратэ боюнча Ысык-Көл кубогу", locationLabel: "Кыргызстан, Ысык-Көл облусу, Чолпон-Ата", description: "Tatami.kg сайтындагы мелдештин үлгүсү." },
    en: { title: "Issyk-Kul Traditional Karate Cup", locationLabel: "Kyrgyzstan, Issyk-Kul Region, Cholpon-Ata", description: "Example tournament on Tatami.kg." }
  },
  'kg-naryn-cup-2026': {
    ru: { title: "Кубок Нарына 2026", locationLabel: "Кыргызстан, Нарынская обл., Нарын", description: "Пример турнира на сайте Tatami.kg." },
    ky: { title: "Нарын кубогу 2026", locationLabel: "Кыргызстан, Нарын облусу, Нарын", description: "Tatami.kg сайтындагы мелдештин үлгүсү." },
    en: { title: "Naryn Cup 2026", locationLabel: "Kyrgyzstan, Naryn Region, Naryn", description: "Example tournament on Tatami.kg." }
  },
  'kg-bishkek-juniors-2026': {
    ru: { title: "Первенство Бишкека среди юниоров 2026", locationLabel: "Кыргызстан, г. Бишкек", description: "Пример турнира на сайте Tatami.kg." },
    ky: { title: "Бишкек шаарынын юниорлор арасындагы биринчилиги 2026", locationLabel: "Кыргызстан, Бишкек ш.", description: "Tatami.kg сайтындагы мелдештин үлгүсү." },
    en: { title: "Bishkek Junior Championship 2026", locationLabel: "Kyrgyzstan, Bishkek", description: "Example tournament on Tatami.kg." }
  }
};

export function localizeDateLabel(dateLabel: string, language: Language): string {
  if (!dateLabel) return '';
  if (language === 'ru') return dateLabel;

  const monthMapEn: Record<string, string> = {
    'янв.': 'Jan',
    'февр.': 'Feb',
    'марта': 'Mar',
    'апр.': 'Apr',
    'мая': 'May',
    'июня': 'Jun',
    'июля': 'Jul',
    'авг.': 'Aug',
    'сент.': 'Sep',
    'окт.': 'Oct',
    'нояб.': 'Nov',
    'дек.': 'Dec'
  };

  const monthMapKy: Record<string, string> = {
    'янв.': 'Янв.',
    'февр.': 'Фев.',
    'марта': 'Март',
    'апр.': 'Апр.',
    'мая': 'Май',
    'июня': 'Июнь',
    'июля': 'Июль',
    'авг.': 'Авг.',
    'сент.': 'Сент.',
    'окт.': 'Окт.',
    'нояб.': 'Нояб.',
    'дек.': 'Дек.'
  };

  let out = dateLabel;
  const map = language === 'ky' ? monthMapKy : monthMapEn;
  for (const [ruMonth, targetMonth] of Object.entries(map)) {
    out = out.split(ruMonth).join(targetMonth);
  }
  return out;
}

export function localizeEventItem(item: EventItem, language: Language): EventItem {
  const loc = EVENT_LOCALIZATIONS[item.id];
  const localizedDate = localizeDateLabel(item.dateLabel || `${item.startDate} - ${item.endDate}`, language);

  // Russian is the source language: keep the organizer's own (possibly edited) texts.
  if (loc && language !== 'ru') {
    const target = loc[language] || loc.ru;
    return {
      ...item,
      title: target.title,
      locationLabel: target.locationLabel,
      description: target.description,
      dateLabel: localizedDate
    };
  }

  return {
    ...item,
    dateLabel: localizedDate
  };
}

/**
 * Comprehensive phrase & fragment dictionary mapping Russian (and common English) UI strings
 * to [Kyrgyz (ky), English (en)] so that EVERY text node, placeholder, title, option, and table header
 * across all 25+ modules translates seamlessly when switching between RU, KY, and EN.
 */
const EXACT_DICTIONARY: Record<string, [string, string]> = {
  // Navigation & Core Headers
  'События': ['Мелдештер', 'Events'],
  'События и Турниры': ['Мелдештер жана Турнирлер', 'Events & Tournaments'],
  'Клубы и Додзё': ['Клубдар жана Додзё', 'Studios & Dojos'],
  'Студии и Клубы': ['Студиялар жана Клубдар', 'Studios & Clubs'],
  'Прямой эфир': ['Түз эфир', 'Live Stream'],
  'Рейтинги': ['Рейтингдер', 'Rankings'],
  'О нас': ['Биз жөнүндө', 'About Us'],
  'О платформе': ['Платформа жөнүндө', 'About Platform'],
  'О платформе Tatami.kg': ['Tatami.kg платформасы жөнүндө', 'About Tatami.kg Platform'],
  'Помощь': ['Жардам', 'Help'],
  'Помощь и FAQ': ['Жардам жана FAQ', 'Help & FAQ'],
  'Справка и О нас': ['Маалымат жана Биз жөнүндө', 'Help & About Us'],
  'Конфиденциальность': ['Купуялуулук саясаты', 'Privacy Policy'],
  'Политика конфиденциальности': ['Купуялуулук саясаты', 'Privacy Policy'],
  'Пользовательское соглашение': ['Колдонуучу келишими', 'Terms of Service'],
  'Международный регламент соревнований': ['Эл аралык мелдеш регламенти', 'International Competition Rulebook'],
  'Компактный режим': ['Чакан режим', 'Compact Mode'],
  'Навигация': ['Чабыттоо', 'Navigation'],
  'Основное': ['Негизги', 'Main'],
  'Управление турниром': ['Мелдешти башкаруу', 'Tournament Control'],
  'Администрирование': ['Администрациялоо', 'Administration'],
  'Управление событиями': ['Мелдештерди башкаруу', 'Manage Events & Admin'],
  'Обучение': ['Окутуу', 'Training'],
  'Вход': ['Кирүү', 'Log In'],
  'Регистрация': ['Каттоо', 'Register'],
  'Выйти из аккаунта': ['Аккаунттан чыгуу', 'Log Out'],
  'Главная': ['Башкы бет', 'Home'],
  'Назад к турниру': ['Мелдешке кайтуу', 'Back to Tournament'],
  '✕ Закрыть': ['✕ Жабуу', '✕ Close'],
  'Закрыть': ['Жабуу', 'Close'],
  'Отмена': ['Жокко чыгаруу', 'Cancel'],
  'Перейти': ['Өтүү', 'Go'],
  'Сохранить': ['Сактоо', 'Save'],
  'Удалить': ['Өчүрүү', 'Delete'],
  'Редактировать': ['Түзөтүү', 'Edit'],
  'Подтвердить': ['Ырастоо', 'Confirm'],

  // Showcase & Filters
  'Введите имя события': ['Мелдештин атын жазыңыз', 'Enter event name'],
  'Все страны': ['Бардык өлкөлөр', 'All countries'],
  'Украина': ['Украина', 'Ukraine'],
  'США (USA)': ['АКШ (USA)', 'United States (USA)'],
  'Канада': ['Канада', 'Canada'],
  'Италия': ['Италия', 'Italy'],
  'Польша': ['Польша', 'Poland'],
  'Узбекистан': ['Өзбекстан', 'Uzbekistan'],
  'Израиль': ['Израиль', 'Israel'],
  'Кыргызстан': ['Кыргызстан', 'Kyrgyzstan'],
  'Казахстан': ['Казакстан', 'Kazakhstan'],
  'Все виды спорта': ['Спорттун бардык түрлөрү', 'All sports'],
  'Каратэ (Karate)': ['Каратэ (Karate)', 'Karate'],
  'Кобудо (Kobudo)': ['Кобудо (Kobudo)', 'Kobudo'],
  'Все лиги': ['Бардык лигалар', 'All leagues'],
  'Дата начала': ['Башталуу датасы', 'Start date'],
  'Дата окончания': ['Аяктоо датасы', 'End date'],
  'Все типы': ['Бардык түрлөрү', 'All types'],
  'Турниры': ['Мелдештер', 'Tournaments'],
  'Семинары': ['Семинарлар', 'Seminars'],
  'Санкционирование': ['Санкциялоо', 'Sanctioning'],
  'Сбросить все фильтры': ['Чыпкаларды тазалоо', 'Reset all filters'],
  'События не найдены': ['Мелдештер табылган жок', 'No events found'],
  'Попробуйте изменить поисковый запрос или сбросить фильтры стран и лиг.': [
    'Издөө суроосун өзгөртүп көрүңүз же өлкөлөр менен лигалардын чыпкаларын тазалаңыз.',
    'Try adjusting your search query or resetting the country and league filters.'
  ],
  'Опции события': ['Мелдеш опциялары', 'Event Options'],
  'Информация': ['Маалымат', 'Information'],
  'Категории и цены': ['Категориялар жана баалар', 'Categories & Prices'],
  'Сетки': ['Торчолор (Brackets)', 'Brackets'],
  'Результаты': ['Жыйынтыктар', 'Results'],
  'Медали': ['Медалдар', 'Medals'],
  'Билеты и регистрация': ['Билеттер жана каттоо', 'Tickets & Registration'],
  '+ Создать турнир': ['+ Мелдеш түзүү', '+ Create Tournament'],
  'Создать новый турнир': ['Жаңы мелдеш түзүү', 'Create New Tournament'],
  'Скрыть форму': ['Форманы жашыруу', 'Hide Form'],

  // Tournament Creation & Image Upload Form
  'Создание и управление событиями': ['Мелдештерди түзүү жана башкаруу', 'Event Creation & Management'],
  'Создавайте новые соревнования, настраивайте правила (WKF/SKIF), даты, локации, арены и регламент проведения': [
    'Жаңы мелдештерди түзүңүз, эрежелерди (WKF/SKIF), даталарды, локацияларды, ареналарды жана регламентти ырастаңыз',
    'Create new championships, configure rules (WKF/SKIF), dates, locations, venues, and event regulations'
  ],
  'Создание нового турнира': ['Жаңы мелдеш түзүү', 'Create New Tournament'],
  'Редактирование турнира': ['Мелдешти түзөтүү', 'Edit Tournament'],
  'Заполните все атрибуты события для автоматической привязки судейства, сеток и онлайн-регистрации': [
    'Калыстыкты, торчолорду жана онлайн-каттоону автоматтык түрдө байланыштыруу үчүн мелдештин бардык талааларын толтуруңуз',
    'Fill in all event attributes to automatically link refereeing, brackets, and online registration'
  ],
  'Быстрый шаблон:': ['Тез үлгү:', 'Quick template:'],
  'Кубок WKF': ['WKF Кубогу', 'WKF Cup'],
  'Сётокан SKIF': ['Сётокан SKIF', 'Shotokan SKIF'],
  'Юношеский WKF': ['Өспүрүмдөр WKF', 'Youth WKF'],
  'Название соревнования': ['Мелдештин аталышы', 'Tournament Title'],
  'Организатор / Федерация': ['Уюштуруучу / Федерация', 'Organizer / Federation'],
  'Правила и регламент': ['Эрежелер жана регламент', 'Rules & Regulations'],
  'Статус турнира': ['Мелдештин статусу', 'Tournament Status'],
  'Регистрация открыта': ['Каттоо ачык', 'Registration Open'],
  'Идет соревнование (LIVE)': ['Мелдеш жүрүп жатат (LIVE)', 'In Progress (LIVE)'],
  'Идет турнир (LIVE)': ['Мелдеш жүрүп жатат (LIVE)', 'In Progress (LIVE)'],
  'Жеребьевка завершена': ['Чүчүкулак аяктады', 'Draw Completed'],
  'Сетки сформированы': ['Торчолор түзүлдү', 'Brackets Generated'],
  'Черновик (подготовка)': ['Долбоор (даярдоо)', 'Draft (Preparation)'],
  'Черновик': ['Долбоор', 'Draft'],
  'Завершен': ['Аяктады', 'Completed'],
  'Количество татами (площадок)': ['Татамилердин (аянтчалардын) саны', 'Number of Tatamis (Mats)'],
  'Дедлайн подачи заявок': ['Өтүнмөлөрдү кабыл алуу мөөнөтү', 'Registration Deadline'],
  'Страна': ['Өлкө', 'Country'],
  'Город': ['Шаар', 'City'],
  'Арена / Спорткомплекс': ['Арена / Спорткомплекс', 'Arena / Sports Complex'],
  'Соревновательные дисциплины в программе:': ['Программадагы мелдеш дисциплиналары:', 'Competition Disciplines in Program:'],
  'Описание турнира и регламент допуска': ['Мелдештин сүрөттөлүшү жана катышуу регламенти', 'Tournament Description & Eligibility Rules'],
  'Сохранить изменения': ['Өзгөртүүлөрдү сактоо', 'Save Changes'],
  'Выбрать активным': ['Активдүү кылып тандоо', 'Set Active'],
  '★ Активный турнир': ['★ Активдүү мелдеш', '★ Active Tournament'],
  'Витрина': ['Витрина', 'Showcase'],
  'Кликните на турнир для активации контекста': ['Контекстти активдештирүү үчүн мелдешти басыңыз', 'Click a tournament to activate context'],
  'Нет фото': ['Сүрөт жок', 'No image'],
  '✕ Удалить изображение': ['✕ Сүрөттү өчүрүү', '✕ Remove Image'],
  'Выберите файл изображения (JPG или WebP, до 2 МБ)': [
    'Сүрөт файлын тандаңыз (JPG же WebP, 2 МБ чейин)',
    'Select image file (JPG or WebP, max 2 MB)'
  ],
  'Проверка и сохранение изображения в БД...': [
    'Сүрөттү текшерүү жана маалымат базасына сактоо...',
    'Validating and saving image to database...'
  ],

  // Tournament Info Detail View
  'Официальный турнир': ['Расмий мелдеш', 'Official Tournament'],
  'Зарегистрироваться на событие': ['Мелдешке катталуу', 'Register for Event'],
  'До старта турнира': ['Мелдеш башталарына чейин', 'Countdown to Event'],
  'Дней': ['Күн', 'Days'],
  'Час': ['Саат', 'Hrs'],
  'Мин': ['Мүн', 'Min'],
  'Сек': ['Сек', 'Sec'],
  'Организатор': ['Уюштуруучу', 'Organizer'],
  'Татами / Рингов': ['Татами / Рингдер', 'Tatami / Rings'],
  'Участников заявлено': ['Катталган катышуучулар', 'Registered Athletes'],
  'Регламент': ['Регламент', 'Rules Standard'],
  'Доступные разделы для события': ['Мелдештин жеткиликтүү бөлүмдөрү', 'Available Event Sections'],
  'Описание, регламент и расписание': ['Сүрөттөмө, регламент жана ырааттама', 'Description, regulations, and schedule'],
  'Список весовых и возрастных категорий, стоимость': ['Салмак жана жаш категориялары, баасы', 'Age/weight classes and registration fees'],
  'Турнирные сетки по татами и времени': ['Татами жана убакыт боюнча мелдеш торчолору', 'Tournament brackets by tatami and time'],
  'Итоговые протоколы и призеры поединков': ['Жыйынтыктоочу протоколдор жана байге ээлери', 'Final protocols and podium winners'],
  'Зачет по клубам, федерациям и странам': ['Клубдар, федерациялар жана өлкөлөр боюнча эсеп', 'Standings by club, federation, and country'],
  'Онлайн-монитор 4-х татами в реальном времени': ['Реалдуу убакытта 4 татаминин онлайн-монитору', 'Real-time 4-tatami live scoreboard monitor'],

  // Divisions & Pricing, Rings, Medals, Results
  'Категории и стоимость регистрации': ['Категориялар жана каттоо баасы', 'Divisions & Registration Pricing'],
  'Текущий': ['Учурдагы', 'Current'],
  'Все категории': ['Бардык категориялар', 'All Categories'],
  'Оружие (Кобудо)': ['Курал (Кобудо)', 'Weapons (Kobudo)'],
  'Формы (Ката)': ['Формалар (Ката)', 'Forms (Kata)'],
  'Спарринг (Кумитэ)': ['Спарринг (Кумитэ)', 'Sparring (Kumite)'],
  'Экстрим': ['Экстрим', 'Extreme'],
  'Расписание площадок и турнирные сетки': ['Аянтчалардын ырааттамасы жана мелдеш торчолору', 'Rings Schedule & Tournament Brackets'],
  'Все площадки (Rings)': ['Бардык аянтчалар (Rings)', 'All Rings'],
  'Поиск сетки...': ['Торчо издөө...', 'Search bracket...'],
  'Медальный зачёт и командные рейтинги': ['Медалдык эсеп жана командалык рейтингдер', 'Medal Standings & Team Rankings'],
  'Поиск команды...': ['Команда издөө...', 'Search team...'],
  'По клубам (By Club)': ['Клубдар боюнча', 'By Club'],
  'По федерациям (By Federation)': ['Федерациялар боюнча', 'By Federation'],
  'По странам (By Country)': ['Өлкөлөр боюнча', 'By Country'],

  // Studios, Virtual Studios, Rankings, About, Help
  'Студии, Клубы и Додзё': ['Студиялар, Клубдар жана Додзё', 'Studios, Clubs & Dojos'],
  'Единый реестр сертифицированных клубов боевых искусств, расписание тренировок и запись спортсменов': [
    'Сертификатталган мушташ өнөрү клубдарынын бирдиктүү реестри, машыгуу ырааттамасы жана спортчуларды жазуу',
    'Unified registry of certified martial arts clubs, training schedules, and athlete enrollment'
  ],
  'Каталог студий': ['Студиялар каталогу', 'Studios Directory'],
  'Управление клубом и взносами': ['Клубду жана төлөмдөрдү башкаруу', 'Club Hub & Invoices'],
  'Все города': ['Бардык шаарлар', 'All Cities'],
  'Все направления': ['Бардык багыттар', 'All Disciplines'],
  'Стоимость': ['Баасы', 'Tuition'],
  'Детали': ['Толугураак', 'Details'],
  'Записаться': ['Жазылуу', 'Join'],
  'Главный тренер:': ['Башкы машыктыруучу:', 'Head Coach:'],
  'Квалификация:': ['Квалификациясы:', 'Qualification:'],
  'Телефон:': ['Телефон:', 'Phone:'],
  'Расписание:': ['Ырааттама:', 'Schedule:'],
  'Стоимость абонемента:': ['Абонемент баасы:', 'Monthly Tuition:'],
  'Подать заявку на пробную тренировку': ['Сыноо машыгуусуна өтүнмө берүү', 'Apply for a Trial Class'],
  'Официальный рейтинг Tatami.kg': ['Tatami.kg расмий рейтинги', 'Official Tatami.kg Rankings'],
  'Рейтинги спортсменов и клубов': ['Спортчулардын жана клубдардын рейтинги', 'Athletes & Clubs Leaderboard'],
  'Начисление рейтинговых очков по результатам официальных соревнований WKF и лиги Tatami.kg': [
    'WKF жана Tatami.kg лигасынын расмий мелдештеринин жыйынтыгы боюнча рейтингдик упайларды эсептөө',
    'Official ranking points accrued from certified WKF and Tatami.kg League championships'
  ],
  'Спортсмены': ['Спортчулар', 'Athletes'],
  'Клубы и Студии': ['Клубдар жана Студиялар', 'Clubs & Studios'],
  'Спортсмен': ['Спортчу', 'Athlete'],
  'Клуб / Регион': ['Клуб / Аймак', 'Club / Region'],
  'Весовая категория': ['Салмак категориясы', 'Weight Category'],
  '🥇 Золото': ['🥇 Алтын', '🥇 Gold'],
  '🥈 Серебро': ['🥈 Күмүш', '🥈 Silver'],
  '🥉 Бронза': ['🥉 Коло', '🥉 Bronze'],
  'Рейтинг (pts)': ['Рейтинг (упай)', 'Points (pts)'],
  'Клуб / Студия': ['Клуб / Студия', 'Club / Studio'],
  'Главный тренер': ['Башкы машыктыруучу', 'Head Coach'],
  'Локация': ['Локация', 'Location'],
  'Очки (PTS)': ['Упайлар (PTS)', 'Points (PTS)'],
  'Virtual Studios — Прямой эфир татами': ['Virtual Studios — Татамиден түз эфир', 'Virtual Studios — Live Tatami Streams'],
  'Прямой эфир поединков с 4-х татами, онлайн-судейство и тайминг в реальном времени': [
    '4 татамиден беттештердин түз эфири, онлайн-калыстык жана реалдуу убакыттагы тайминг',
    'Live match broadcasts from 4 tatamis, online refereeing, and real-time timing'
  ],
  'Открыть табло LIVE': ['LIVE таблону ачуу', 'Open LIVE Scoreboard'],
  'Каналы татами': ['Татами каналдары', 'Tatami Channels'],
  'Международные стандарты судейства': ['Эл аралык калыстык стандарттары', 'International Refereeing Standards'],
  'Локальная сеть LAN Hub': ['Локалдык LAN Hub тармагы', 'Offline Venue LAN Hub'],
  'Готовые протоколы Минспорта': ['Спорт министрлигинин даяр протоколдору', 'Certified Official Protocols'],
  'Центр помощи и частые вопросы': ['Жардам борбору жана көп берилүүчү суроолор', 'Help Center & FAQ'],
  'Ответы на ключевые вопросы по регламенту, регистрации и оплате': [
    'Регламент, каттоо жана төлөм боюнча негизги суроолорго жооптор',
    'Answers to key questions regarding rules, registration, and payments'
  ],
  'Остались вопросы по турниру?': ['Мелдеш боюнча суроолоруңуз калдыбы?', 'Still have questions about the tournament?'],
  'Написать в оргкомитет': ['Уюштуруу комитетине жазуу', 'Contact Organizing Committee'],

  // Sidebar & Sub-modules common titles
  'Онлайн-Табло': ['Онлайн-Табло', 'Live Scoreboard'],
  'Сетки плей-офф': ['Плей-офф торчосу', 'Playoff Brackets'],
  'Расписание татами': ['Татами ырааттамасы', 'Tatami Schedule'],
  'База участников': ['Катышуучулар базасы', 'Athletes Database'],
  'Кабинет тренера': ['Машыктыруучу кабинети', 'Coach Portal'],
  'Судейский VR и Флаги': ['Калыстар VR пульту', 'Referee VR & Flags'],
  'Протоколы поединков': ['Беттеш протоколдору', 'Match Protocols'],
  'Медконтроль (80с)': ['Медкөзөмөл (80с)', 'Medical Timer (80s)'],
  'Видеоаналитика': ['Видеоаналитика', 'Video Analytics'],
  'Эквайринг и взносы': ['Төлөмдөр жана взностор', 'Acquiring & Fees'],
  'Экспорт протоколов': ['Протоколдорду экспорттоо', 'Official Exports'],
  'Локальный LAN-сервер': ['Локалдык LAN-сервер', 'Venue LAN Hub'],
  'База данных SQL': ['SQL маалымат базасы', 'PostgreSQL Schema'],
  'Учебные материалы Tatami.kg': ['Tatami.kg окуу материалдары', 'Tatami.kg Training Guides'],
  '📘 База знаний и FAQ': ['📘 Билим базасы жана FAQ', '📘 Knowledge Base & FAQ'],
  '🥋 Кабинет тренера и заявка команды': ['🥋 Машыктыруучу кабинети жана командалык өтүнмө', '🥋 Coach Portal & Team Entry'],
  '🚩 Судейский пульт и VR-повторы': ['🚩 Калыстар пульту жана VR-кайталоо', '🚩 Referee Console & VR Replay'],
  '📺 Электронное табло татами': ['📺 Татаминин электрондук таблосу', '📺 Electronic Tatami Scoreboard'],
  '⚡ Тренажер управления поединком': ['⚡ Беттешти башкаруу тренажеру', '⚡ Match Control Simulator'],

  // Footer
  'Разделы платформы': ['Платформанын бөлүмдөрү', 'Platform Sections'],
  '• События и турниры': ['• Мелдештер жана турнирлер', '• Events & Tournaments'],
  '• Клубы (Studios)': ['• Клубдар (Studios)', '• Clubs & Studios'],
  '• Рейтинги атлетов': ['• Спортчулардын рейтинги', '• Athlete Rankings'],
  'Документы и регламент': ['Документтер жана регламент', 'Legal & Compliance'],
  'Поддержка и Помощник': ['Колдоо жана Жардамчы', 'Support & AI Assistant'],
  'Чат-бот Sensei AI': ['Sensei AI чат-боту', 'Sensei AI Assistant'],
  'Стандарт 2026': ['Стандарт 2026', 'Standard 2026'],
  '© 2026 Tatami.kg. Все права защищены. Международные стандарты протоколов.': [
    '© 2026 Tatami.kg. Бардык укуктар корголгон. Эл аралык протокол стандарттары.',
    '© 2026 Tatami.kg. All rights reserved. International protocol standards.'
  ]
};

/**
 * Common phrase replacements applied when a text node contains dynamic values
 */
const FRAGMENT_REPLACEMENTS: Array<{
  ru: string;
  ky: string;
  en: string;
}> = [
  { ru: 'События и Турниры', ky: 'Мелдештер жана Турнирлер', en: 'Events & Tournaments' },
  { ru: 'Реестр соревнований в системе', ky: 'Системадагы мелдештердин реестри', en: 'System Tournaments Registry' },
  { ru: 'В реестре:', ky: 'Реестрде:', en: 'In registry:' },
  { ru: 'событий', ky: 'мелдеш', en: 'events' },
  { ru: 'Аккредитованных студий:', ky: 'Аккредитацияланган студиялар:', en: 'Accredited studios:' },
  { ru: 'Сезон:', ky: 'Сезон:', en: 'Season:' },
  { ru: 'Сезон 2026', ky: 'Сезон 2026', en: 'Season 2026' },
  { ru: 'Сезон 2025', ky: 'Сезон 2025', en: 'Season 2025' },
  { ru: 'зрителей', ky: 'көрүүчү', en: 'viewers' },
  { ru: 'площадок', ky: 'аянтча', en: 'rings/mats' },
  { ru: 'спортсменов', ky: 'спортчу', en: 'athletes' },
  { ru: 'Дедлайн:', ky: 'Мөөнөтү:', en: 'Deadline:' },
  { ru: 'Атлетов:', ky: 'Спортчулар:', en: 'Athletes:' },
  { ru: 'Клубов:', ky: 'Клубдар:', en: 'Clubs:' },
  { ru: 'Татами:', ky: 'Татами:', en: 'Tatami:' },
  { ru: 'Ссылка в БД:', ky: 'МБ шилтемеси:', en: 'DB URL:' },
  { ru: 'Допустимые форматы:', ky: 'Уруксат берилген форматтар:', en: 'Allowed formats:' },
  { ru: 'Максимальный размер файла:', ky: 'Файлдын максималдуу көлөмү:', en: 'Max file size:' },
  { ru: 'Изображение / эмблема события', ky: 'Мелдештин сүрөтү / эмблемасы', en: 'Event Image / Emblem' },
  { ru: 'Панель администратора', ky: 'Администратор панели', en: 'Administrator Panel' },
  { ru: 'Регистрация спортсмена', ky: 'Спортчуну каттоо', en: 'Athlete Registration' },
  { ru: 'Жеребьевка WKF', ky: 'WKF чүчүкулак', en: 'WKF Bracket Draw' },
  { ru: 'Управление базой', ky: 'Базаны башкаруу', en: 'Database Control' },
  { ru: 'Сброс в 1 клик', ky: '1 басуу менен тазалоо', en: '1-Click Reset' },
  { ru: 'Кумитэ Индивидуальное (WKF)', ky: 'Жеке Кумитэ (WKF)', en: 'Individual Kumite (WKF)' },
  { ru: 'Ката Индивидуальное (WKF)', ky: 'Жеке Ката (WKF)', en: 'Individual Kata (WKF)' },
  { ru: 'Командное Кумитэ', ky: 'Командалык Кумитэ', en: 'Team Kumite' },
  { ru: 'Командное Ката', ky: 'Командалык Ката', en: 'Team Kata' },
  { ru: 'Сётокан Shobu Ippon', ky: 'Сётокан Shobu Ippon', en: 'Shotokan Shobu Ippon' },
  { ru: 'Сётокан Shobu Sanbon', ky: 'Сётокан Shobu Sanbon', en: 'Shotokan Shobu Sanbon' },
  { ru: 'Кёкусинкай весовой нокдаун', ky: 'Кёкусинкай салмактык нокдаун', en: 'Kyokushin Knockdown' },
  { ru: 'Абсолютная весовая категория', ky: 'Абсолюттук салмак категориясы', en: 'Open Weight Division' },
  { ru: 'Мужчины', ky: 'Эркектер', en: 'Men' },
  { ru: 'Женщины', ky: 'Аялдар', en: 'Women' },
  { ru: 'Юниоры', ky: 'Юниорлор', en: 'Juniors' },
  { ru: 'Кадеты', ky: 'Кадеттер', en: 'Cadets' },
  { ru: 'Кумитэ', ky: 'Кумитэ', en: 'Kumite' },
  { ru: 'Ката', ky: 'Ката', en: 'Kata' },
  { ru: 'Черный пояс', ky: 'Кара кур', en: 'Black Belt' },
  { ru: 'Финал за Золото', ky: 'Алтын үчүн финал', en: 'Gold Medal Final' },
  { ru: 'Бронзовый финал', ky: 'Коло финал', en: 'Bronze Medal Match' },
  { ru: 'Полуфинал', ky: 'Жарым финал', en: 'Semi-Final' },
  { ru: 'Четвертьфинал', ky: 'Чейрек финал', en: 'Quarter-Final' },
  { ru: 'По очкам (Сеншу)', ky: 'Упай боюнча (Сеншу)', en: 'By Points (Senshu)' },
  { ru: 'Отрыв 8 очков', ky: '8 упай айырма', en: '8-Point Lead' },
  { ru: 'Бишкек', ky: 'Бишкек', en: 'Bishkek' },
  { ru: 'Ош', ky: 'Ош', en: 'Osh' },
  { ru: 'Каракол', ky: 'Каракол', en: 'Karakol' },
  { ru: 'Кант', ky: 'Кант', en: 'Kant' },
  { ru: 'Джалал-Абад', ky: 'Джалал-Абад', en: 'Jalal-Abad' },
  { ru: 'Кыргызстан', ky: 'Кыргызстан', en: 'Kyrgyzstan' },
  { ru: 'Украина', ky: 'Украина', en: 'Ukraine' },
  { ru: 'Узбекистан', ky: 'Өзбекстан', en: 'Uzbekistan' },
  { ru: 'Польша', ky: 'Польша', en: 'Poland' },
  { ru: 'Италия', ky: 'Италия', en: 'Italy' },
  { ru: 'Израиль', ky: 'Израиль', en: 'Israel' },
  { ru: 'Канада', ky: 'Канада', en: 'Canada' }
];

const originalTextNodeMap = new WeakMap<Node, string>();
const originalPlaceholderMap = new WeakMap<Element, string>();
const originalTitleMap = new WeakMap<Element, string>();

function translateString(source: string, lang: Language): string {
  if (lang === 'ru') return source;
  const trimmed = source.trim();
  if (!trimmed) return source;

  const exact = EXACT_DICTIONARY[trimmed];
  if (exact) {
    const target = lang === 'ky' ? exact[0] : exact[1];
    return source.replace(trimmed, target);
  }

  let result = source;
  for (const item of FRAGMENT_REPLACEMENTS) {
    if (result.includes(item.ru)) {
      const replacement = lang === 'ky' ? item.ky : item.en;
      result = result.split(item.ru).join(replacement);
    }
  }
  return result;
}

function applyTranslationToSubtree(root: Node, lang: Language) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let current: Node | null = walker.currentNode;

  while (current) {
    if (current.nodeType === Node.TEXT_NODE) {
      const parentTag = current.parentElement?.tagName;
      if (parentTag !== 'SCRIPT' && parentTag !== 'STYLE' && parentTag !== 'TEXTAREA') {
        const currentVal = current.nodeValue || '';
        if (!originalTextNodeMap.has(current)) {
          originalTextNodeMap.set(current, currentVal);
        } else {
          const orig = originalTextNodeMap.get(current)!;
          const expectedPrevKy = translateString(orig, 'ky');
          const expectedPrevEn = translateString(orig, 'en');
          if (currentVal !== orig && currentVal !== expectedPrevKy && currentVal !== expectedPrevEn) {
            originalTextNodeMap.set(current, currentVal);
          }
        }

        const baseText = originalTextNodeMap.get(current) || currentVal;
        const nextText = lang === 'ru' ? baseText : translateString(baseText, lang);
        if (current.nodeValue !== nextText) {
          current.nodeValue = nextText;
        }
      }
    } else if (current.nodeType === Node.ELEMENT_NODE) {
      const el = current as HTMLElement;
      if (el.hasAttribute('placeholder')) {
        const curPh = el.getAttribute('placeholder') || '';
        if (!originalPlaceholderMap.has(el)) {
          originalPlaceholderMap.set(el, curPh);
        }
        const basePh = originalPlaceholderMap.get(el) || curPh;
        const nextPh = lang === 'ru' ? basePh : translateString(basePh, lang);
        if (curPh !== nextPh) {
          el.setAttribute('placeholder', nextPh);
        }
      }
      if (el.hasAttribute('title')) {
        const curTitle = el.getAttribute('title') || '';
        if (!originalTitleMap.has(el)) {
          originalTitleMap.set(el, curTitle);
        }
        const baseTitle = originalTitleMap.get(el) || curTitle;
        const nextTitle = lang === 'ru' ? baseTitle : translateString(baseTitle, lang);
        if (curTitle !== nextTitle) {
          el.setAttribute('title', nextTitle);
        }
      }
    }
    current = walker.nextNode();
  }
}

/**
 * Global hook that ensures 100% of DOM text nodes, options, placeholders, and tooltips
 * update immediately when switching between Russian ('ru'), Kyrgyz ('ky'), and English ('en').
 */
export function useGlobalDomTranslator(language: Language, activeTab?: string) {
  useEffect(() => {
    const rootEl = document.getElementById('root') || document.body;
    let isApplying = false;

    const runPass = () => {
      if (isApplying) return;
      isApplying = true;
      try {
        applyTranslationToSubtree(rootEl, language);
      } finally {
        isApplying = false;
      }
    };

    runPass();
    const timer = setTimeout(runPass, 80);

    const observer = new MutationObserver(() => {
      if (!isApplying) {
        runPass();
      }
    });

    observer.observe(rootEl, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [language, activeTab]);
}
