import React from 'react';
import { Rocket, Download, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface LaunchStatus {
  launchedAt: string | null;
  counts: Record<'events' | 'participants' | 'bouts' | 'categories' | 'protocols' | 'accounts' | 'invites' | 'deviceKeys', number>;
}

const PHRASE = 'ЗАПУСК';

const LABELS: [keyof LaunchStatus['counts'], string][] = [
  ['events', 'Турниры'],
  ['participants', 'Заявки участников'],
  ['categories', 'Категории'],
  ['bouts', 'Поединки'],
  ['protocols', 'Судейские протоколы'],
  ['accounts', 'Аккаунты (кроме администраторов)'],
  ['invites', 'Ссылки-приглашения'],
  ['deviceKeys', 'Ключи пультов татами']
];

/** Admin: backup download and «Подготовка к запуску» (remove all demo/test data, keep administrators). */
export const LaunchPanel: React.FC = () => {
  const [status, setStatus] = React.useState<LaunchStatus | null>(null);
  const [open, setOpen] = React.useState(false);
  const [phrase, setPhrase] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<{ ok: boolean; text: string } | null>(null);

  const load = React.useCallback(() => {
    fetch('/api/admin/launch-status')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setStatus(d))
      .catch(() => {});
  }, []);
  React.useEffect(load, [load]);

  const run = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/launch-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: phrase })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ ok: false, text: data.error || 'Не удалось выполнить.' });
      } else {
        setMessage({ ok: true, text: `Готово. Резервная копия сохранена на сервере: data/backups/${data.backupFile}. Страница обновится…` });
        setTimeout(() => window.location.assign('/'), 2500);
      }
    } catch {
      setMessage({ ok: false, text: 'Нет связи с сервером.' });
    } finally {
      setBusy(false);
    }
  };

  const total = status ? Object.values(status.counts).reduce((a, b) => a + b, 0) : 0;

  return (
    <section className="theme-keep rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 space-y-4">
      <div className="flex flex-wrap items-start gap-3">
        <Rocket className="w-6 h-6 text-[var(--accent)] mt-0.5" />
        <div className="flex-1 min-w-[240px]">
          <h2 className="text-lg font-bold text-[var(--app-text-primary)]">Резервная копия и подготовка к запуску</h2>
          <p className="text-sm text-[var(--app-text-secondary)] mt-1">
            {status?.launchedAt
              ? `Сайт подготовлен к запуску ${new Date(status.launchedAt).toLocaleString('ru-RU')}. Демо-данные больше не создаются.`
              : 'Сейчас на сайте демо- и тестовые данные. Перед открытием для людей удалите их одной кнопкой: сначала сохраняется полная резервная копия, остаются только аккаунты администраторов.'}
          </p>
        </div>
        <a href="/api/admin/backup" className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-[var(--app-border)] text-sm text-[var(--app-text-primary)] hover:bg-[var(--app-surface-subtle)]">
          <Download className="w-4 h-4" /> Скачать резервную копию
        </a>
      </div>

      {status && (
        <div className="grid gap-2 grid-cols-2 sm:grid-cols-4 text-sm">
          {LABELS.map(([k, label]) => (
            <div key={k} className="rounded-lg bg-[var(--app-surface-subtle)] px-3 py-2">
              <div className="text-xs text-[var(--app-text-muted)]">{label}</div>
              <div className="font-semibold text-[var(--app-text-primary)]">{status.counts[k]}</div>
            </div>
          ))}
        </div>
      )}

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          disabled={!status || total === 0}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-40 cursor-pointer"
        >
          <ShieldAlert className="w-4 h-4" /> Подготовка к запуску…
        </button>
      ) : (
        <div className="rounded-xl border border-[var(--danger-border)] bg-[var(--danger-soft)] p-4 space-y-3">
          <p className="text-sm text-[var(--app-text-primary)]">
            Будут удалены <b>все</b> турниры, заявки, категории, поединки, протоколы, приглашения, ключи пультов и все аккаунты, кроме администраторов. Все, кроме администраторов, выйдут из системы.
            Перед удалением сервер сохранит полную копию в папке <code>data/backups</code>. Вернуть данные можно только из этой копии.
          </p>
          <label className="block text-sm text-[var(--app-text-secondary)]">
            Для подтверждения введите слово <b>{PHRASE}</b>
            <input
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              className="mt-1 block w-full max-w-xs h-10 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-primary)] px-3"
              autoFocus
            />
          </label>
          <div className="flex gap-2">
            <button
              onClick={run}
              disabled={busy || phrase.trim().toUpperCase() !== PHRASE}
              className="h-10 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-40 cursor-pointer"
            >
              {busy ? 'Выполняется…' : 'Удалить данные и подготовить'}
            </button>
            <button onClick={() => { setOpen(false); setPhrase(''); }} className="h-10 px-4 rounded-lg border border-[var(--app-border)] text-sm text-[var(--app-text-primary)] cursor-pointer">
              Отмена
            </button>
          </div>
        </div>
      )}

      {message && (
        <div className={`text-sm flex items-start gap-2 ${message.ok ? 'text-emerald-700' : 'text-red-600'}`}>
          {message.ok && <CheckCircle2 className="w-4 h-4 mt-0.5" />} {message.text}
        </div>
      )}
    </section>
  );
};
