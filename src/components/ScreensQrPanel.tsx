import React from 'react';
import QRCode from 'qrcode';
import { QrCode, Tv, Tablet, ListOrdered, Copy, Check, RefreshCw, Wifi, ExternalLink, Trash2, Youtube, Save } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Tournament } from '../types/schema';
import { youtubeVideoId, youtubeWatchUrl } from '../utils/youtube';

interface DeviceKey {
  key: string;
  tatamiNumber: number;
  expiresAt: number;
}

type Lang = 'ru' | 'ky' | 'en';
const t = (lang: Lang, ru: string, ky: string, en: string) => (lang === 'ky' ? ky : lang === 'en' ? en : ru);

const Qr: React.FC<{ text: string; size?: number }> = ({ text, size = 168 }) => {
  const [src, setSrc] = React.useState('');
  React.useEffect(() => {
    QRCode.toDataURL(text, { margin: 1, width: size * 2, errorCorrectionLevel: 'M' }).then(setSrc).catch(() => setSrc(''));
  }, [text, size]);
  return src ? (
    <img src={src} alt="QR" width={size} height={size} className="rounded-lg bg-white p-1.5 border border-[var(--app-border)]" />
  ) : (
    <div style={{ width: size, height: size }} className="rounded-lg bg-[var(--app-surface-subtle)]" />
  );
};

const CopyLink: React.FC<{ url: string; lang: Lang }> = ({ url, lang }) => {
  const [done, setDone] = React.useState(false);
  return (
    <div className="flex items-center gap-1.5 w-full">
      <code className="flex-1 min-w-0 truncate text-[11px] bg-[var(--app-surface-subtle)] border border-[var(--app-border)] rounded-md px-2 py-1 text-[var(--app-text-secondary)]">{url}</code>
      <button
        onClick={() => {
          navigator.clipboard?.writeText(url);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        }}
        className="p-1.5 rounded-md border border-[var(--app-border)] text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-subtle)] cursor-pointer"
        title={t(lang, 'Копировать ссылку', 'Шилтемени көчүрүү', 'Copy link')}
      >
        {done ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
      <a href={url} target="_blank" rel="noreferrer" className="p-1.5 rounded-md border border-[var(--app-border)] text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-subtle)]" title={t(lang, 'Открыть', 'Ачуу', 'Open')}>
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
};

/** One tatami's YouTube live link: paste, check, save. */
const StreamField: React.FC<{ tatami: number; saved: string; lang: Lang; onSave: (tatami: number, url: string) => Promise<boolean> }> = ({ tatami, saved, lang, onSave }) => {
  const [value, setValue] = React.useState(saved);
  const [state, setState] = React.useState<'idle' | 'saving' | 'saved'>('idle');
  React.useEffect(() => setValue(saved), [saved]);
  const trimmed = value.trim();
  const id = youtubeVideoId(trimmed);
  const invalid = trimmed !== '' && !id;
  const normalized = id ? youtubeWatchUrl(id) : '';
  const changed = (trimmed === '' ? '' : normalized) !== saved;

  const save = async () => {
    if (invalid) return;
    setState('saving');
    const ok = await onSave(tatami, trimmed === '' ? '' : normalized);
    setState(ok ? 'saved' : 'idle');
    if (ok) setTimeout(() => setState('idle'), 2000);
  };

  return (
    <div className="space-y-2">
      <label htmlFor={`yt-${tatami}`} className="flex items-center gap-2 text-sm font-semibold text-[var(--app-text-primary)]">
        <Youtube className="w-4 h-4 text-red-600" /> {t(lang, 'Видеотрансляция на YouTube', 'YouTube видео түз эфир', 'YouTube live video')}
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id={`yt-${tatami}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && changed && save()}
          placeholder="https://youtube.com/live/…"
          inputMode="url"
          className={`flex-1 min-w-[180px] h-9 rounded-lg border bg-[var(--app-surface)] text-[var(--app-text-primary)] px-2.5 text-sm ${invalid ? 'border-red-500' : 'border-[var(--app-border)]'}`}
        />
        <button
          onClick={save}
          disabled={!changed || invalid || state === 'saving'}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[var(--app-border)] text-sm text-[var(--app-text-primary)] hover:bg-[var(--app-surface-subtle)] disabled:opacity-50 cursor-pointer disabled:cursor-default"
        >
          {state === 'saved' ? <Check className="w-4 h-4 text-emerald-600" /> : <Save className="w-4 h-4" />}
          {state === 'saved' ? t(lang, 'Сохранено', 'Сакталды', 'Saved') : t(lang, 'Сохранить', 'Сактоо', 'Save')}
        </button>
      </div>
      <p className={`text-xs ${invalid ? 'text-red-600' : 'text-[var(--app-text-muted)]'}`}>
        {invalid
          ? t(lang, 'Это не похоже на ссылку YouTube. Скопируйте ссылку эфира кнопкой «Поделиться» в YouTube.', 'Бул YouTube шилтемесине окшобойт. Эфирдин шилтемесин YouTube\'дагы «Бөлүшүү» баскычы менен көчүрүңүз.', 'This does not look like a YouTube link. Copy the stream link with the “Share” button on YouTube.')
          : saved
            ? t(lang, 'Видео показывается зрителям на странице турнира → Live. Чтобы убрать — очистите поле и сохраните.', 'Видео көрүүчүлөргө мелдештин барагында → Live көрсөтүлөт. Алып салуу үчүн талааны тазалап, сактаңыз.', 'Viewers see the video on the tournament page → Live. To remove it, clear the field and save.')
            : t(lang, 'Вставьте ссылку на эфир этого татами — видео появится на странице турнира → Live.', 'Бул татаминин эфиринин шилтемесин коюңуз — видео мелдештин барагында → Live чыгат.', 'Paste the link of this tatami\'s stream — the video appears on the tournament page → Live.')}
      </p>
    </div>
  );
};

/** Organizer page: QR codes that open each tatami's scoreboard and console on any device, plus YouTube video per tatami. */
export const ScreensQrPanel: React.FC<{
  tatamiNumbers: number[];
  event: Tournament;
  tournaments: Tournament[];
  onSelectEvent: (id: string) => void;
  onEventUpdated: (event: Tournament) => void;
}> = ({ tatamiNumbers, event, tournaments, onSelectEvent, onEventUpdated }) => {
  const { language } = useApp();
  const lang = (language || 'ru') as Lang;
  const [base, setBase] = React.useState(window.location.origin);
  const [lanAddresses, setLanAddresses] = React.useState<string[]>([]);
  const [keys, setKeys] = React.useState<DeviceKey[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const isLocalhost = /localhost|127\.0\.0\.1/.test(base);
  const streams = event.liveStreams || {};

  const loadKeys = React.useCallback(async () => {
    const res = await fetch('/api/admin/device-keys');
    const data = await res.json().catch(() => ({}));
    if (res.ok) setKeys(data.keys);
  }, []);

  React.useEffect(() => {
    loadKeys();
    fetch('/api/network')
      .then((r) => r.json())
      .then((d) => {
        setLanAddresses(d.addresses || []);
        if (/localhost|127\.0\.0\.1/.test(window.location.origin) && d.addresses?.[0]) setBase(d.addresses[0]);
      })
      .catch(() => {});
  }, [loadKeys]);

  const createKey = async (tatamiNumber: number) => {
    setError(null);
    const res = await fetch('/api/admin/device-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tatamiNumber, hours: 24 })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) setError(data.error || t(lang, 'Не удалось создать ключ пульта', 'Пульттун ачкычын түзүү мүмкүн болгон жок', 'Could not create the console key'));
    loadKeys();
  };

  const revokeKey = async (key: string) => {
    await fetch(`/api/admin/device-keys/${encodeURIComponent(key)}`, { method: 'DELETE' });
    loadKeys();
  };

  const saveStream = async (tatami: number, url: string): Promise<boolean> => {
    setError(null);
    const next = { ...streams };
    if (url) next[String(tatami)] = url;
    else delete next[String(tatami)];
    try {
      const res = await fetch(`/api/events/${encodeURIComponent(event.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ liveStreams: next })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t(lang, 'Сервер не сохранил ссылку.', 'Сервер шилтемени сактаган жок.', 'The server did not save the link.'));
        return false;
      }
      onEventUpdated({ ...event, liveStreams: data.event?.liveStreams ?? next });
      return true;
    } catch {
      setError(t(lang, 'Нет связи с сервером: ссылка не сохранена.', 'Сервер менен байланыш жок: шилтеме сакталган жок.', 'No connection to server: link not saved.'));
      return false;
    }
  };

  const callsUrl = `${base}/?screen=calls`;

  return (
    <div className="theme-keep space-y-5 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--app-text-primary)] flex items-center gap-2">
          <QrCode className="w-6 h-6 text-[var(--accent)]" /> {t(lang, 'Экраны, QR-коды и видео', 'Экрандар, QR жана видео', 'Screens, QR codes & video')}
        </h1>
        <p className="mt-1 text-[15px] text-[var(--app-text-secondary)] max-w-3xl">
          {t(
            lang,
            'Наведите камеру телефона или планшета на QR-код — экран откроется сразу, без входа. Табло для зрителей открывается на телевизоре или проекторе, пульт секретаря — на планшете или ноутбуке у татами. Видео с YouTube зрители смотрят на странице турнира → Live.',
            'Телефондун же планшеттин камерасын QR-кодго багыттаңыз — экран дароо ачылат, кирүүсүз. Көрүүчүлөр үчүн табло телевизордо же проектордо, катчынын пульту татамидеги планшетте же ноутбукта ачылат. YouTube видеону көрүүчүлөр мелдештин барагында → Live көрөт.',
            'Point a phone or tablet camera at a QR code — the screen opens right away, no sign-in. The spectator scoreboard opens on a TV or projector, the scorekeeper console on a tablet or laptop at the tatami. Viewers watch the YouTube video on the tournament page → Live.'
          )}
        </p>
      </div>

      <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 space-y-2">
        <label htmlFor="screens-event" className="text-sm font-semibold text-[var(--app-text-primary)]">
          {t(lang, 'Турнир', 'Мелдеш', 'Tournament')}
        </label>
        <select
          id="screens-event"
          value={event.id}
          onChange={(e) => onSelectEvent(e.target.value)}
          className="block w-full sm:w-auto sm:min-w-[320px] max-w-full h-10 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-primary)] px-2.5 text-sm"
        >
          {!tournaments.some((x) => x.id === event.id) && <option value={event.id}>{event.title}</option>}
          {tournaments.map((x) => (
            <option key={x.id} value={x.id}>{x.title}</option>
          ))}
        </select>
      </section>

      <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--app-text-primary)]">
          <Wifi className="w-4 h-4" /> {t(lang, 'Адрес сайта для устройств в зале', 'Залдагы түзмөктөр үчүн сайттын дареги', 'Site address for devices in the hall')}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            id="screens-base-url"
            value={base}
            onChange={(e) => setBase(e.target.value.replace(/\/$/, ''))}
            className="flex-1 min-w-[220px] rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-primary)] px-3 py-2 text-sm"
          />
          {lanAddresses.map((a) => (
            <button key={a} onClick={() => setBase(a)} className="px-3 py-2 rounded-lg border border-[var(--app-border)] text-sm text-[var(--app-text-secondary)] hover:border-[var(--accent)] cursor-pointer">
              {a}
            </button>
          ))}
        </div>
        <p className="text-xs text-[var(--app-text-muted)]">
          {isLocalhost
            ? t(lang, '«localhost» откроется только на этом компьютере. Для телефонов и телевизоров в той же Wi-Fi сети выберите адрес вида http://192.168…', '«localhost» ушул компьютерде гана ачылат. Ошол эле Wi-Fi тармагындагы телефондор жана телевизорлор үчүн http://192.168… сыяктуу даректи тандаңыз.', '“localhost” opens only on this computer. For phones and TVs on the same Wi-Fi, choose an address like http://192.168…')
            : t(lang, 'Устройства должны быть в той же сети (или сайт должен быть опубликован в интернете).', 'Түзмөктөр ошол эле тармакта болушу керек (же сайт интернетке жарыяланган болушу керек).', 'Devices must be on the same network (or the site must be published online).')}
        </p>
      </section>

      <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 flex flex-wrap items-center gap-4">
        <Qr text={callsUrl} size={120} />
        <div className="flex-1 min-w-[220px] space-y-2">
          <div className="flex items-center gap-2 font-semibold text-[var(--app-text-primary)]">
            <ListOrdered className="w-4 h-4" /> {t(lang, 'Зона разминки: вызов спортсменов', 'Жылытуу аймагы: спортчуларды чакыруу', 'Warm-up area: athlete call')}
          </div>
          <p className="text-sm text-[var(--app-text-secondary)]">{t(lang, 'Кто сейчас на каждом татами, кому приготовиться, кто следующий.', 'Ар бир татамиде азыр ким, ким даярданышы керек, ким кийинки.', 'Who is on each tatami now, who should get ready, who is next.')}</p>
          <CopyLink url={callsUrl} lang={lang} />
        </div>
      </section>

      {error && <div className="rounded-xl px-3 py-2 bg-[var(--danger-soft)] border border-[var(--danger-border)] text-sm text-[var(--app-text-primary)]">{error}</div>}

      <div className="grid gap-4 md:grid-cols-2">
        {tatamiNumbers.map((tn) => {
          const displayUrl = `${base}/?screen=tatami&t=${tn}`;
          const key = keys.find((k) => k.tatamiNumber === tn);
          const controlUrl = key ? `${base}/?screen=control&t=${tn}&key=${key.key}` : '';
          return (
            <section key={tn} className="min-w-0 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 space-y-4">
              <h2 className="text-lg font-bold text-[var(--app-text-primary)]">{t(lang, 'Татами', 'Татами', 'Tatami')} {tn}</h2>
              <div className="flex gap-4 items-start">
                <Qr text={displayUrl} size={120} />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--app-text-primary)]">
                    <Tv className="w-4 h-4" /> {t(lang, 'Табло для зрителей', 'Көрүүчүлөр үчүн табло', 'Spectator scoreboard')}
                  </div>
                  <p className="text-xs text-[var(--app-text-muted)]">{t(lang, 'Открыто для всех, только просмотр.', 'Баарына ачык, көрүү гана.', 'Open to everyone, view only.')}</p>
                  <CopyLink url={displayUrl} lang={lang} />
                </div>
              </div>
              <div className="flex gap-4 items-start border-t border-[var(--app-border)] pt-4">
                {key ? <Qr text={controlUrl} size={120} /> : <div className="w-[120px] h-[120px] shrink-0 rounded-lg border border-dashed border-[var(--app-border)] flex items-center justify-center text-[var(--app-text-muted)]"><Tablet className="w-8 h-8" /></div>}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--app-text-primary)]">
                    <Tablet className="w-4 h-4" /> {t(lang, 'Пульт секретаря', 'Катчынын пульту', 'Scorekeeper console')}
                  </div>
                  <p className="text-xs text-[var(--app-text-muted)]">
                    {key
                      ? `${t(lang, 'Секретная ссылка, действует до', 'Жашыруун шилтеме, мөөнөтү', 'Secret link, valid until')} ${new Date(key.expiresAt).toLocaleString(lang === 'en' ? 'en-GB' : 'ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}. ${t(lang, 'Управляет только татами', 'Татамини гана башкарат:', 'Controls only tatami')} ${tn}.`
                      : t(lang, 'Создайте секретный QR-код и отсканируйте его планшетом секретаря.', 'Жашыруун QR-код түзүп, аны катчынын планшети менен сканерлеңиз.', 'Create a secret QR code and scan it with the scorekeeper\'s tablet.')}
                  </p>
                  {key && <CopyLink url={controlUrl} lang={lang} />}
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => createKey(tn)} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-sm font-semibold cursor-pointer">
                      <RefreshCw className="w-4 h-4" /> {key ? t(lang, 'Новый код', 'Жаңы код', 'New code') : t(lang, 'Создать код', 'Код түзүү', 'Create code')}
                    </button>
                    {key && (
                      <button onClick={() => revokeKey(key.key)} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[var(--app-border)] text-sm text-[var(--app-text-secondary)] hover:text-red-600 cursor-pointer">
                        <Trash2 className="w-4 h-4" /> {t(lang, 'Отключить', 'Өчүрүү', 'Revoke')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="border-t border-[var(--app-border)] pt-4">
                <StreamField tatami={tn} saved={streams[String(tn)] || ''} lang={lang} onSave={saveStream} />
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
