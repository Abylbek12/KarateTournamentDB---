import React from 'react';
import QRCode from 'qrcode';
import { QrCode, Tv, Tablet, ListOrdered, Copy, Check, RefreshCw, Wifi, ExternalLink, Trash2 } from 'lucide-react';

interface DeviceKey {
  key: string;
  tatamiNumber: number;
  expiresAt: number;
}

const Qr: React.FC<{ text: string; size?: number }> = ({ text, size = 168 }) => {
  const [src, setSrc] = React.useState('');
  React.useEffect(() => {
    QRCode.toDataURL(text, { margin: 1, width: size * 2, errorCorrectionLevel: 'M' }).then(setSrc).catch(() => setSrc(''));
  }, [text, size]);
  return src ? (
    <img src={src} alt="QR-код" width={size} height={size} className="rounded-lg bg-white p-1.5 border border-[var(--app-border)]" />
  ) : (
    <div style={{ width: size, height: size }} className="rounded-lg bg-[var(--app-surface-subtle)]" />
  );
};

const CopyLink: React.FC<{ url: string }> = ({ url }) => {
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
        title="Копировать ссылку"
      >
        {done ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
      <a href={url} target="_blank" rel="noreferrer" className="p-1.5 rounded-md border border-[var(--app-border)] text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-subtle)]" title="Открыть">
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
};

/** Organizer page: QR codes that open each tatami's scoreboard and console on any device. */
export const ScreensQrPanel: React.FC<{ tatamiNumbers: number[] }> = ({ tatamiNumbers }) => {
  const [base, setBase] = React.useState(window.location.origin);
  const [lanAddresses, setLanAddresses] = React.useState<string[]>([]);
  const [keys, setKeys] = React.useState<DeviceKey[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const isLocalhost = /localhost|127\.0\.0\.1/.test(base);

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
    if (!res.ok) setError(data.error || 'Не удалось создать ключ пульта');
    loadKeys();
  };

  const revokeKey = async (key: string) => {
    await fetch(`/api/admin/device-keys/${encodeURIComponent(key)}`, { method: 'DELETE' });
    loadKeys();
  };

  const callsUrl = `${base}/?screen=calls`;

  return (
    <div className="theme-keep space-y-5 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--app-text-primary)] flex items-center gap-2">
          <QrCode className="w-6 h-6 text-[var(--accent)]" /> Экраны и QR-коды
        </h1>
        <p className="mt-1 text-[15px] text-[var(--app-text-secondary)] max-w-3xl">
          Наведите камеру телефона или планшета на QR-код — экран откроется сразу, без входа. Табло для зрителей открывается на телевизоре или
          проекторе, пульт секретаря — на планшете или ноутбуке у татами. Все экраны обновляются мгновенно.
        </p>
      </div>

      <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--app-text-primary)]">
          <Wifi className="w-4 h-4" /> Адрес сайта для устройств в зале
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
            ? '«localhost» откроется только на этом компьютере. Для телефонов и телевизоров в той же Wi-Fi сети выберите адрес вида http://192.168…'
            : 'Устройства должны быть в той же сети (или сайт должен быть опубликован в интернете).'}
        </p>
      </section>

      <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 flex flex-wrap items-center gap-4">
        <Qr text={callsUrl} size={120} />
        <div className="flex-1 min-w-[220px] space-y-2">
          <div className="flex items-center gap-2 font-semibold text-[var(--app-text-primary)]">
            <ListOrdered className="w-4 h-4" /> Зона разминки: вызов спортсменов
          </div>
          <p className="text-sm text-[var(--app-text-secondary)]">Кто сейчас на каждом татами, кому приготовиться, кто следующий.</p>
          <CopyLink url={callsUrl} />
        </div>
      </section>

      {error && <div className="rounded-xl px-3 py-2 bg-[var(--danger-soft)] border border-[var(--danger-border)] text-sm text-[var(--app-text-primary)]">{error}</div>}

      <div className="grid gap-4 md:grid-cols-2">
        {tatamiNumbers.map((t) => {
          const displayUrl = `${base}/?screen=tatami&t=${t}`;
          const key = keys.find((k) => k.tatamiNumber === t);
          const controlUrl = key ? `${base}/?screen=control&t=${t}&key=${key.key}` : '';
          return (
            <section key={t} className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 space-y-4">
              <h2 className="text-lg font-bold text-[var(--app-text-primary)]">Татами {t}</h2>
              <div className="flex gap-4 items-start">
                <Qr text={displayUrl} size={120} />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--app-text-primary)]">
                    <Tv className="w-4 h-4" /> Табло для зрителей
                  </div>
                  <p className="text-xs text-[var(--app-text-muted)]">Открыто для всех, только просмотр.</p>
                  <CopyLink url={displayUrl} />
                </div>
              </div>
              <div className="flex gap-4 items-start border-t border-[var(--app-border)] pt-4">
                {key ? <Qr text={controlUrl} size={120} /> : <div className="w-[120px] h-[120px] rounded-lg border border-dashed border-[var(--app-border)] flex items-center justify-center text-[var(--app-text-muted)]"><Tablet className="w-8 h-8" /></div>}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--app-text-primary)]">
                    <Tablet className="w-4 h-4" /> Пульт секретаря
                  </div>
                  <p className="text-xs text-[var(--app-text-muted)]">
                    {key
                      ? `Секретная ссылка, действует до ${new Date(key.expiresAt).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}. Управляет только татами ${t}.`
                      : 'Создайте секретный QR-код и отсканируйте его планшетом секретаря.'}
                  </p>
                  {key && <CopyLink url={controlUrl} />}
                  <div className="flex gap-2">
                    <button onClick={() => createKey(t)} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-sm font-semibold cursor-pointer">
                      <RefreshCw className="w-4 h-4" /> {key ? 'Новый код' : 'Создать код'}
                    </button>
                    {key && (
                      <button onClick={() => revokeKey(key.key)} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[var(--app-border)] text-sm text-[var(--app-text-secondary)] hover:text-red-600 cursor-pointer">
                        <Trash2 className="w-4 h-4" /> Отключить
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
