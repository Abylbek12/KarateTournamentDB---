import React from 'react';
import { Rocket, Download, ShieldAlert, CheckCircle2, Upload } from 'lucide-react';

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

  // Restore from a backup file (e.g. after a tournament on a laptop without internet)
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [restoreFile, setRestoreFile] = React.useState<{ name: string; data: unknown } | null>(null);
  const pickFile = async (f?: File) => {
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!data || !Array.isArray(data.accounts) || typeof data.state !== 'object') throw new Error();
      setRestoreFile({ name: f.name, data });
      setMessage(null);
    } catch {
      setMessage({ ok: false, text: 'Это не резервная копия Apsatarov.' });
    }
    if (fileRef.current) fileRef.current.value = '';
  };
  const restore = async () => {
    if (!restoreFile) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backup: restoreFile.data })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setMessage({ ok: false, text: data.error || (res.status === 413 ? 'Файл слишком большой для сервера.' : 'Не удалось восстановить.') });
      else {
        setMessage({ ok: true, text: `Данные восстановлены: турниров ${data.counts?.events ?? 0}, заявок ${data.counts?.participants ?? 0}, боёв ${data.counts?.bouts ?? 0}. Страница обновится…` });
        setRestoreFile(null);
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
    <section className="theme-keep rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 shrink-0 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
          <Rocket className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-[var(--app-text-primary)]">Резервная копия и подготовка к запуску</h2>
          <p className="text-sm text-[var(--app-text-muted)]">
            {status?.launchedAt
              ? `Сайт подготовлен к запуску ${new Date(status.launchedAt).toLocaleString('ru-RU')}. Демо-данные больше не создаются.`
              : 'Сейчас на сайте демо- и тестовые данные. Перед открытием для людей удалите их одной кнопкой: сначала сохраняется полная резервная копия, остаются только аккаунты администраторов.'}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
          <a href="/api/admin/backup" className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-sm font-semibold">
            <Download className="w-4 h-4" /> Скачать резервную копию
          </a>
          <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-[var(--app-border)] text-sm font-medium text-[var(--app-text-primary)] hover:bg-[var(--app-surface-subtle)] cursor-pointer">
            <Upload className="w-4 h-4" /> Восстановить из копии…
          </button>
          <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
      </div>

      {restoreFile && (
        <div className="rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-soft)] p-4 space-y-3">
          <p className="text-sm text-[var(--app-text-primary)]">
            Все текущие данные сайта будут заменены данными из файла <b>{restoreFile.name}</b>. Перед этим сервер сохранит копию текущих данных. Вы останетесь в системе.
          </p>
          <div className="flex gap-2">
            <button onClick={restore} disabled={busy} className="h-10 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-40 cursor-pointer">
              {busy ? 'Восстанавливаю…' : 'Заменить данные из копии'}
            </button>
            <button onClick={() => setRestoreFile(null)} className="h-10 px-4 rounded-lg border border-[var(--app-border)] text-sm text-[var(--app-text-primary)] cursor-pointer">Отмена</button>
          </div>
        </div>
      )}

      {status && (
        <div className="flex flex-wrap gap-1.5">
          {LABELS.map(([k, label]) => (
            <span key={k} className="inline-flex items-center gap-1.5 h-8 pl-3 pr-1 rounded-full bg-[var(--app-surface-subtle)] border border-[var(--app-border)] text-xs text-[var(--app-text-secondary)]">
              {label}
              <b className="min-w-6 h-6 px-1.5 rounded-full bg-[var(--app-surface)] text-[var(--app-text-primary)] flex items-center justify-center tabular-nums">{status.counts[k]}</b>
            </span>
          ))}
        </div>
      )}

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          disabled={!status || total === 0}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-40 cursor-pointer"
        >
          <ShieldAlert className="w-4 h-4" /> Подготовка к запуску…
        </button>
      ) : (
        <div className="rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-soft)] p-4 space-y-3">
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
