import React from 'react';
import { Wifi, Download, Copy, Check, QrCode } from 'lucide-react';

/** Organizer: how to run a tournament in a hall without internet (one laptop as the server). */
export const OfflinePanel: React.FC<{ onOpenScreens: () => void }> = ({ onOpenScreens }) => {
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
          <Wifi className="w-6 h-6 text-[var(--accent)]" /> Работа без интернета
        </h1>
        <p className="text-[15px] text-[var(--app-text-secondary)] mt-1">
          В зале может не быть интернета. Тогда сервером турнира становится один ноутбук, а пульты и табло подключаются к нему по Wi-Fi роутера.
        </p>
      </div>

      <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 space-y-3">
        <h2 className="font-semibold text-[var(--app-text-primary)]">Адрес этого сервера в локальной сети</h2>
        {!isLocal && (
          <p className="text-sm text-[var(--app-text-muted)]">
            Сейчас сайт открыт через интернет. Адреса ниже пригодятся, только если запустить Tatami.kg на ноутбуке в зале.
          </p>
        )}
        {addresses === null ? (
          <p className="text-sm text-[var(--app-text-muted)]">Определяю…</p>
        ) : addresses.length === 0 ? (
          <p className="text-sm text-[var(--app-text-muted)]">Сетевой адрес не найден. Подключите ноутбук к Wi-Fi роутера и обновите страницу.</p>
        ) : (
          <ul className="space-y-2">
            {addresses.map((a) => (
              <li key={a} className="flex items-center gap-2">
                <code className="text-lg font-semibold text-[var(--app-text-primary)]">{a}</code>
                <button onClick={() => copy(a)} className="p-1.5 rounded-lg text-[var(--app-text-muted)] hover:text-[var(--app-text-primary)] cursor-pointer" title="Копировать">
                  {copied === a ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 space-y-4">
        <h2 className="font-semibold text-[var(--app-text-primary)]">Как провести турнир без интернета</h2>
        <div className={step}><span className={num}>1</span><p className="text-sm text-[var(--app-text-secondary)]">До турнира, пока есть интернет: соберите заявки и проведите жеребьёвку. Скачайте резервную копию (кнопка ниже).</p></div>
        <div className={step}><span className={num}>2</span><p className="text-sm text-[var(--app-text-secondary)]">В зале включите Wi-Fi роутер (интернет в нём не обязателен) и подключите к нему ноутбук-сервер, планшеты/телефоны секретарей и компьютеры у телевизоров.</p></div>
        <div className={step}><span className={num}>3</span><p className="text-sm text-[var(--app-text-secondary)]">На ноутбуке запустите Tatami.kg (инструкция — файл DEPLOY_VERCEL.md в коде сайта), войдите администратором и в «Турниры и пользователи» нажмите «Восстановить из копии…». Адрес ноутбука появится выше, например <code>http://192.168.1.5:3000</code>.</p></div>
        <div className={step}><span className={num}>4</span><p className="text-sm text-[var(--app-text-secondary)]">
          Откройте «Экраны и QR-коды»: секретари сканируют QR-код своего татами, а на телевизорах открывается табло. Все устройства должны быть в той же сети Wi-Fi.
        </p></div>
        <div className={step}><span className={num}>5</span><p className="text-sm text-[var(--app-text-secondary)]">Если на татами только один компьютер и один экран — в пульте нажмите «Один экран»: зрители видят табло, секретарь ведёт бой клавишами.</p></div>
        <div className={step}><span className={num}>6</span><p className="text-sm text-[var(--app-text-secondary)]">После турнира скачайте резервную копию на ноутбуке и восстановите её на сайте в интернете — результаты появятся там.</p></div>
        <div className="flex flex-wrap gap-2 pt-1">
          <a href="/api/admin/backup" className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-sm font-semibold">
            <Download className="w-4 h-4" /> Скачать резервную копию
          </a>
          <button onClick={onOpenScreens} className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-[var(--app-border)] text-sm text-[var(--app-text-primary)] hover:bg-[var(--app-surface-subtle)] cursor-pointer">
            <QrCode className="w-4 h-4" /> Экраны и QR-коды
          </button>
        </div>
      </section>
    </div>
  );
};
