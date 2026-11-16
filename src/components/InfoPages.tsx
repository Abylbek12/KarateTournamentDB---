import React, { useState } from 'react';
import { Award, Globe, ShieldCheck } from 'lucide-react';
import { trLang } from '../utils/globalDomTranslator';

// About the platform and FAQ (static pages).
export const AboutUsView: React.FC<{ language: 'ru' | 'en' | 'ky' }> = ({ language }) => {
  const tr = (ru: string, ky: string, en: string) => trLang(language, ru, ky, en);

  return (
    <div className="space-y-6 animate-fadeIn font-sans max-w-7xl mx-auto pb-16">
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="max-w-3xl space-y-4">
          <span className="px-3 py-1 rounded-md bg-sky-50 text-sky-700 border border-sky-200 text-xs font-bold uppercase">
            TATAMI.KG
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
            {tr('О платформе Tatami.kg', 'Tatami.kg платформасы жөнүндө', 'About Tatami.kg')}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            {tr(
              'Tatami.kg — профессиональная цифровая операционная система для управления соревнованиями по спортивным единоборствам и традиционным боевым искусствам. Платформа объединяет онлайн-заявки, электронное табло и судейство, сетки олимпийской системы, учёт взносов и официальные протоколы для печати.',
              'Tatami.kg — спорттук жекпе-жек жана салттуу согуш өнөрлөрү боюнча мелдештерди башкаруу үчүн кесиптик санариптик операциялык система. Платформа онлайн өтүнмөлөрдү, электрондук таблону жана калыстыкты, олимпиадалык системанын торчолорун, төлөмдөрдү эсепке алууну жана расмий протоколдорду бириктирет.',
              'Tatami.kg is a dedicated digital management ecosystem for martial arts championships: online entries, electronic scoring, elimination brackets, entry fees and printable official protocols.'
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {tr('Международные стандарты судейства', 'Калыстыктын эл аралык стандарттары', 'International Standards')}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {tr(
              'Полная поддержка официальных регламентов соревнований по Кумитэ & Ката: система оценок Иппон/Ваза-ари/Юко, преимущество Сеншу, отрыв 8 очков и автоматическое разведение соклубников.',
              'Кумитэ жана Ката боюнча мелдештердин расмий регламенттерин толук колдоо: Иппон/Ваза-ари/Юко баалоо системасы, Сеншу артыкчылыгы, 8 упай айырмасы жана бир клубдун спортчуларын автоматтык бөлүштүрүү.',
              'Official competition scoring rules: Ippon, Waza-ari, Senshu advantage, 8-point lead mercy rule, and club athlete separation.'
            )}
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mb-3">
            <Globe className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {tr('Работа без интернета', 'Интернетсиз иштөө', 'Works offline')}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {tr(
              'Бесперебойное проведение турнира даже при отключении интернета на спортивной арене: ноутбук в зале становится сервером, пульты и табло всех татами подключаются к нему по Wi-Fi роутера.',
              'Спорттук аренада интернет өчүп калса да мелдешти үзгүлтүксүз өткөрүү: залдагы ноутбук сервер болот, бардык татамилердин пульттары жана таблолору ага роутердин Wi-Fi аркылуу туташат.',
              'Offline-ready venue hub guarantees uninterrupted bouts and scoring across all tatamis without external internet connection.'
            )}
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-3">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {tr('Официальные протоколы', 'Расмий протоколдор', 'Official Protocols')}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {tr(
              'Сетки, итоговые протоколы, медальный зачёт, стартовые листы и дипломы — на A4 с местами для подписей главного судьи и секретаря, печать или PDF.',
              'Торчолор, жыйынтык протоколдор, медалдык эсеп, старттык тизмелер жана дипломдор — A4 форматында, басып чыгаруу же PDF.',
              'Brackets, official results, medal standings, start lists and diplomas on A4 — print or save as PDF.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 5. Help & FAQ View (#help)
// -------------------------------------------------------------
export const HelpFaqView: React.FC<{ language: 'ru' | 'en' | 'ky' }> = ({ language }) => {
  const tr = (ru: string, ky: string, en: string) => trLang(language, ru, ky, en);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: tr(
        'Как подать индивидуальную заявку спортсмена?',
        'Спортчунун жеке табыштамасын кантип берсе болот?',
        'How to register an individual athlete?'
      ),
      a: tr(
        'На главной странице выберите турнир и нажмите «Подать заявку». Заполните данные спортсмена (ФИО, дата рождения, вес, клуб, разряд), выберите весовую категорию и подтвердите оплату взноса.',
        'Башкы беттен мелдешти тандап, «Катталуу» баскычын басыңыз. Спортчунун маалыматтарын (аты-жөнү, туулган күнү, салмагы, клубу, разряды) толтуруп, салмак категориясын тандап, төгүмдү төлөөнү ырастаңыз.',
        'Select the tournament on the homepage and click "Register Athlete". Fill in the athlete profile, weight category, club affiliation and submit.'
      )
    },
    {
      q: tr(
        'Как тренеру подать общую командную заявку?',
        'Машыктыруучу жалпы командалык табыштаманы кантип бере алат?',
        'How can coaches submit a full team entry?'
      ),
      a: tr(
        'Тренер входит по ссылке-приглашению для тренеров, открывает «Подать заявку», выбирает турнир и добавляет сразу всех своих спортсменов и команды. Заявки и статус оплаты видны в разделе «Мои заявки».',
        'Машыктыруучу машыктыруучулар үчүн чакыруу шилтемеси аркылуу кирип, «Өтүнмө берүү» бөлүмүн ачат, мелдешти тандап, бардык спортчуларын жана командаларын бир убакта кошот. Өтүнмөлөр жана төлөм абалы «Менин өтүнмөлөрүм» бөлүмүндө көрүнөт.',
        'Coaches sign in with the coach invitation link, open “Enter”, choose the tournament and add all their athletes and teams at once. Entries and payment status are shown in “My entries”.'
      )
    },
    {
      q: tr(
        'Какие способы оплаты взносов поддерживаются?',
        'Төгүмдөрдү төлөөнүн кандай ыкмалары колдоого алынат?',
        'What payment methods are supported?'
      ),
      a: tr(
        'Взнос оплачивается так, как указал организатор турнира: по его реквизитам или на мандатной комиссии. Онлайн-оплата картой на сайте пока не подключена. Организатор отмечает оплату, и статус виден в разделе «Мои заявки».',
        'Төгүм уюштуруучу көрсөткөндөй төлөнөт: анын реквизиттери боюнча же мандаттык комиссияда. Сайтта карта менен онлайн төлөө азырынча туташтырыла элек. Уюштуруучу төлөмдү белгилейт, абалы «Менин өтүнмөлөрүм» бөлүмүндө көрүнөт.',
        'The fee is paid as the organizer specifies (bank transfer or cash at accreditation). Online card payment is not connected yet. The organizer marks the payment and the status shows in “My entries”.'
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn font-sans max-w-4xl mx-auto pb-16">
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-2xs text-center space-y-2">
        <span className="px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-xs font-bold">
          {tr('СПРАВКА И ПОДДЕРЖКА', 'ЖАРДАМ ЖАНА КОЛДОО', 'FAQ & SUPPORT')}
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          {tr('Центр помощи и частые вопросы', 'Жардам борбору жана көп берилүүчү суроолор', 'Help Center & Knowledge Base')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          {tr(
            'Ответы на ключевые вопросы по регламенту, регистрации и оплате',
            'Регламент, каттоо жана төлөө боюнча негизги суроолорго жооптор',
            'Answers to common questions regarding registration, rules and scoring'
          )}
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => (
          <div key={idx} className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden">
            <button
              onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
              className="w-full p-4 sm:p-5 text-left font-semibold text-sm text-slate-800 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <span>{faq.q}</span>
              <span className="text-sky-600 text-lg font-bold">{openFaqIndex === idx ? '−' : '+'}</span>
            </button>
            {openFaqIndex === idx && (
              <div className="p-4 sm:p-5 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900">
            {tr('Остались вопросы по турниру?', 'Мелдеш боюнча суроолоруңуз калдыбы?', 'Need direct assistance?')}
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            {tr(
              'Вопросы о заявках, взносах и расписании — к организатору турнира: его контакты указаны на странице турнира. Можно также спросить ассистента Сенсея в правом нижнем углу.',
              'Өтүнмөлөр, төгүмдөр жана график боюнча суроолор — мелдештин уюштуруучусуна: анын байланыштары мелдештин бетинде көрсөтүлгөн. Оң төмөнкү бурчтагы Сенсей жардамчысынан да сураса болот.',
              'Questions about entries, fees and schedule go to the tournament organizer: contacts are on the tournament page. You can also ask the Sensei assistant (bottom right).'
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
