import React from 'react';
import { Wifi, Download, Copy, Check, QrCode } from 'lucide-react';
import { useApp } from '../context/AppContext';

/** Organizer: how to run a tournament in a hall without internet (one laptop as the server). */
export const OfflinePanel: React.FC<{ onOpenScreens: () => void }> = ({ onOpenScreens }) => {
  const { language } = useApp();
  const tl = (ru: string, ky: string, en: string) => (language === 'ky' ? ky : language === 'en' ? en : ru);
  const [addresses, setAddresses] = React.useState<string[] | null>(null);
  const [copied, setCopied] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch('/api/network')
      .then((r) => (r.ok ? r.json() : { addresses: [] }))
      .then((d) => setAddresses(Array.isArray(d.addresses) ? d.addresses : []))
      .catch(() => setAddresses([]));
  }, []);

  const copy = (a: string) => {
    navigator.clipboard?.writeText(a).then(() => {
      setCopied(a);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  const isLocal = typeof window !== 'undefined' && /^(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(window.location.hostname);
  const step = 'flex gap-3';
  const num = 'w-7 h-7 shrink-0 rounded-full bg-[var(--accent)] text-white text-sm font-bold flex items-center justify-center';

  return (
    <div className="theme-keep space-y-5 pb-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--app-text-primary)] flex items-center gap-2">
          <Wifi className="w-6 h-6 text-[var(--accent)]" /> {tl('Работа без интернета', 'Интернетсиз иштөө', 'Working offline')}
        </h1>
        <p className="text-[15px] text-[var(--app-text-secondary)] mt-1">
          {tl('В зале может не быть интернета. Тогда сервером турнира становится один ноутбук, а пульты и табло подключаются к нему по Wi-Fi роутера.', 'Залда интернет болбошу мүмкүн. Анда бир ноутбук мелдештин сервери болуп, пульттар жана таблолор ага роутердин Wi-Fi аркылуу туташат.', 'The hall may have no internet. Then one laptop becomes the tournament server, and consoles and scoreboards connect to it over the router Wi-Fi.')}
        </p>
      </div>

      <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 space-y-3">
        <h2 className="font-semibold text-[var(--app-text-primary)]">{tl('Адрес этого сервера в локальной сети', 'Бул сервердин жергиликтүү тармактагы дареги', 'This server’s address on the local network')}</h2>
        {!isLocal && (
          <p className="text-sm text-[var(--app-text-muted)]">
            {tl('Сейчас сайт открыт через интернет. Адреса ниже пригодятся, только если запустить Apsatarov на ноутбуке в зале.', 'Азыр сайт интернет аркылуу ачык. Төмөнкү даректер Apsatarov залдагы ноутбукта иштетилгенде гана керек.', 'The site is open over the internet now. The addresses below matter only when Apsatarov runs on a laptop in the hall.')}
          </p>
        )}
        {addresses === null ? (
          <p className="text-sm text-[var(--app-text-muted)]">{tl('Определяю…', 'Аныкталууда…', 'Detecting…')}</p>
        ) : addresses.length === 0 ? (
          <p className="text-sm text-[var(--app-text-muted)]">{tl('Сетевой адрес не найден. Подключите ноутбук к Wi-Fi роутера и обновите страницу.', 'Тармак дареги табылган жок. Ноутбукту роутердин Wi-Fi тармагына туташтырып, баракты жаңылаңыз.', 'No network address found. Connect the laptop to the router Wi-Fi and reload the page.')}</p>
        ) : (
          <ul className="space-y-2">
            {addresses.map((a) => (
              <li key={a} className="flex items-center gap-2">
                <code className="text-lg font-semibold text-[var(--app-text-primary)]">{a}</code>
                <button onClick={() => copy(a)} className="p-1.5 rounded-lg text-[var(--app-text-muted)] hover:text-[var(--app-text-primary)] cursor-pointer" title={tl('Копировать', 'Көчүрүү', 'Copy')}>
                  {copied === a ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 space-y-4">
        <h2 className="font-semibold text-[var(--app-text-primary)]">{tl('Как провести турнир без интернета', 'Мелдешти интернетсиз кантип өткөрүү керек', 'How to run a tournament offline')}</h2>
        <div className={step}><span className={num}>1</span><p className="text-sm text-[var(--app-text-secondary)]">{tl('До турнира, пока есть интернет: соберите заявки и проведите жеребьёвку. Скачайте резервную копию (кнопка ниже).', 'Мелдешке чейин, интернет бар кезде: табыштамаларды чогултуп, чүчүкулак өткөрүңүз. Камдык көчүрмөнү жүктөп алыңыз (төмөнкү баскыч).', 'Before the tournament, while online: collect entries and run the draw. Download a backup (button below).')}</p></div>
        <div className={step}><span className={num}>2</span><p className="text-sm text-[var(--app-text-secondary)]">{tl('В зале включите Wi-Fi роутер (интернет в нём не обязателен) и подключите к нему ноутбук-сервер, планшеты/телефоны секретарей и компьютеры у телевизоров.', 'Залда Wi-Fi роутерди күйгүзүңүз (андагы интернет милдеттүү эмес) жана ага сервер-ноутбукту, катчылардын планшеттерин/телефондорун жана телевизорлордогу компьютерлерди туташтырыңыз.', 'In the hall switch on a Wi-Fi router (no internet needed) and connect the server laptop, the scorekeepers’ tablets/phones and the computers at the TVs.')}</p></div>
        <div className={step}><span className={num}>3</span><p className="text-sm text-[var(--app-text-secondary)]">{tl('На ноутбуке запустите Apsatarov (инструкция — файл DEPLOY_VERCEL.md в коде сайта), войдите администратором и в «Турниры и пользователи» нажмите «Восстановить из копии…». Адрес ноутбука появится выше, например', 'Ноутбукта Apsatarov иштетиңиз (нускама — сайттын кодундагы DEPLOY_VERCEL.md файлы), администратор болуп кирип, «Мелдештер жана колдонуучулар» бөлүмүндө «Көчүрмөдөн калыбына келтирүүнү» басыңыз. Ноутбуктун дареги жогоруда чыгат, мисалы', 'On the laptop start Apsatarov (see DEPLOY_VERCEL.md in the site code), sign in as administrator and press «Restore from backup…» in «Events & users». The laptop address appears above, e.g.')} <code>http://192.168.1.5:3000</code>.</p></div>
        <div className={step}><span className={num}>4</span><p className="text-sm text-[var(--app-text-secondary)]">
          {tl('Откройте «Экраны, QR-коды и видео»: секретари сканируют QR-код своего татами, а на телевизорах открывается табло. Все устройства должны быть в той же сети Wi-Fi.', '«Экрандар, QR жана видео» бөлүмүн ачыңыз: катчылар өз татамисинин QR-кодун сканерлешет, телевизорлордо табло ачылат. Бардык түзмөктөр бир Wi-Fi тармагында болушу керек.', 'Open «Screens, QR codes & video»: scorekeepers scan their tatami QR code, the TVs open the scoreboard. All devices must be on the same Wi-Fi.')}
        </p></div>
        <div className={step}><span className={num}>5</span><p className="text-sm text-[var(--app-text-secondary)]">{tl('Если на татами только один компьютер и один экран — в пульте нажмите «Один экран»: зрители видят табло, секретарь ведёт бой клавишами.', 'Татамиде бир гана компьютер жана бир экран болсо — пультта «Бир экран» баскычын басыңыз: көрүүчүлөр таблону көрөт, катчы беттешти баскычтар менен жүргүзөт.', 'One computer and one screen at a tatami? Press «Single screen» in the console: spectators see the scoreboard, the scorekeeper uses the keyboard.')}</p></div>
        <div className={step}><span className={num}>6</span><p className="text-sm text-[var(--app-text-secondary)]">{tl('После турнира скачайте резервную копию на ноутбуке и восстановите её на сайте в интернете — результаты появятся там.', 'Мелдештен кийин ноутбукта камдык көчүрмөнү жүктөп, интернеттеги сайтта калыбына келтириңиз — жыйынтыктар ошол жерде чыгат.', 'After the tournament download a backup on the laptop and restore it on the online site — the results will appear there.')}</p></div>
        <div className="flex flex-wrap gap-2 pt-1">
          <a href="/api/admin/backup" className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-sm font-semibold">
            <Download className="w-4 h-4" /> {tl('Скачать резервную копию', 'Камдык көчүрмөнү жүктөө', 'Download backup')}
          </a>
          <button onClick={onOpenScreens} className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-[var(--app-border)] text-sm text-[var(--app-text-primary)] hover:bg-[var(--app-surface-subtle)] cursor-pointer">
            <QrCode className="w-4 h-4" /> {tl('Экраны, QR-коды и видео', 'Экрандар, QR жана видео', 'Screens, QR codes & video')}
          </button>
        </div>
      </section>
    </div>
  );
};
