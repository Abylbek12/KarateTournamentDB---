import React from 'react';
import { Rocket, Download, ShieldAlert, CheckCircle2, Upload } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface LaunchStatus {
  launchedAt: string | null;
  counts: Record<'events' | 'participants' | 'bouts' | 'categories' | 'protocols' | 'accounts' | 'invites' | 'deviceKeys' | 'athletes', number>;
}

const PHRASE = 'ЗАПУСК';

const LABELS: [keyof LaunchStatus['counts'], string][] = [
  ['events', 'Турниры'],
  ['participants', 'Заявки участников'],
  ['categories', 'Категории'],
  ['bouts', 'Поединки'],
  ['protocols', 'Судейские протоколы'],
  ['accounts', 'Аккаунты (кроме администраторов)'],
  ['athletes', 'Карточки «Мои спортсмены»'],
  ['invites', 'Ссылки-приглашения'],
  ['deviceKeys', 'Ключи пультов татами']
];
const LABELS_I18N: Record<string, [ky: string, en: string]> = {
  events: ['Мелдештер', 'Tournaments'],
  participants: ['Катышуучулардын табыштамалары', 'Entries'],
  categories: ['Категориялар', 'Categories'],
  bouts: ['Беттештер', 'Bouts'],
  protocols: ['Калыстык протоколдор', 'Referee protocols'],
  accounts: ['Аккаунттар (администраторлордон башка)', 'Accounts (except administrators)'],
  athletes: ['«Менин спортчуларым» карточкалары', '«My athletes» cards'],
  invites: ['Чакыруу шилтемелери', 'Invitation links'],
  deviceKeys: ['Татами пульттарынын ачкычтары', 'Tatami console keys']
};

/** Admin: backup download and «Подготовка к запуску» (remove all demo/test data, keep administrators). */
export const LaunchPanel: React.FC = () => {
  const { language } = useApp();
  const tl = (ru: string, ky: string, en: string) => (language === 'ky' ? ky : language === 'en' ? en : ru);
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
        setMessage({ ok: false, text: data.error || tl('Не удалось выполнить.', 'Аткаруу мүмкүн болгон жок.', 'Could not complete.') });
      } else {
        setMessage({ ok: true, text: `${tl('Готово. Резервная копия сохранена на сервере', 'Даяр. Камдык көчүрмө серверде сакталды', 'Done. Backup saved on the server')}: data/backups/${data.backupFile}. ${tl('Страница обновится…', 'Барак жаңыланат…', 'The page will reload…')}` });
        setTimeout(() => window.location.assign('/'), 2500);
      }
    } catch {
      setMessage({ ok: false, text: tl('Нет связи с сервером.', 'Сервер менен байланыш жок.', 'No connection to the server.') });
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
      setMessage({ ok: false, text: tl('Это не резервная копия Apsatarov.', 'Бул Apsatarov камдык көчүрмөсү эмес.', 'This is not an Apsatarov backup.') });
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
      if (!res.ok) setMessage({ ok: false, text: data.error || (res.status === 413 ? tl('Файл слишком большой для сервера.', 'Файл сервер үчүн өтө чоң.', 'The file is too large for the server.') : tl('Не удалось восстановить.', 'Калыбына келтирүү мүмкүн болгон жок.', 'Could not restore.')) });
      else {
        setMessage({ ok: true, text: `${tl('Данные восстановлены', 'Маалыматтар калыбына келтирилди', 'Data restored')}: ${tl('турниров', 'мелдеш', 'tournaments')} ${data.counts?.events ?? 0}, ${tl('заявок', 'табыштама', 'entries')} ${data.counts?.participants ?? 0}, ${tl('боёв', 'беттеш', 'bouts')} ${data.counts?.bouts ?? 0}. ${tl('Страница обновится…', 'Барак жаңыланат…', 'The page will reload…')}` });
        setRestoreFile(null);
        setTimeout(() => window.location.assign('/'), 2500);
      }
    } catch {
      setMessage({ ok: false, text: tl('Нет связи с сервером.', 'Сервер менен байланыш жок.', 'No connection to the server.') });
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
          <h2 className="text-lg font-bold text-[var(--app-text-primary)]">{tl('Резервная копия и подготовка к запуску', 'Камдык көчүрмө жана ишке киргизүүгө даярдоо', 'Backup and launch preparation')}</h2>
          <p className="text-sm text-[var(--app-text-muted)]">
            {status?.launchedAt
              ? `${tl('Сайт подготовлен к запуску', 'Сайт ишке киргизүүгө даярдалды', 'The site was prepared for launch')} ${new Date(status.launchedAt).toLocaleString(language === 'en' ? 'en-GB' : 'ru-RU')}. ${tl('Демо-данные больше не создаются.', 'Демо-маалыматтар мындан ары түзүлбөйт.', 'Demo data is no longer created.')}`
              : tl('Сейчас на сайте демо- и тестовые данные. Перед открытием для людей удалите их одной кнопкой: сначала сохраняется полная резервная копия, остаются только аккаунты администраторов.', 'Азыр сайтта демо жана тесттик маалыматтар бар. Элге ачуудан мурун аларды бир баскыч менен өчүрүңүз: адегенде толук камдык көчүрмө сакталат, администраторлордун аккаунттары гана калат.', 'The site has demo and test data now. Before opening it to people, remove it with one button: a full backup is saved first, only administrator accounts stay.')}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
          <a href="/api/admin/backup" className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-sm font-semibold">
            <Download className="w-4 h-4" /> {tl('Скачать резервную копию', 'Камдык көчүрмөнү жүктөө', 'Download backup')}
          </a>
          <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-[var(--app-border)] text-sm font-medium text-[var(--app-text-primary)] hover:bg-[var(--app-surface-subtle)] cursor-pointer">
            <Upload className="w-4 h-4" /> {tl('Восстановить из копии…', 'Көчүрмөдөн калыбына келтирүү…', 'Restore from backup…')}
          </button>
          <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
      </div>

      {restoreFile && (
        <div className="rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-soft)] p-4 space-y-3">
          <p className="text-sm text-[var(--app-text-primary)]">
            {tl('Все текущие данные сайта будут заменены данными из файла', 'Сайттын бардык учурдагы маалыматтары бул файлдагы маалыматтар менен алмаштырылат:', 'All current site data will be replaced with the data from')} <b>{restoreFile.name}</b>. {tl('Перед этим сервер сохранит копию текущих данных. Вы останетесь в системе.', 'Буга чейин сервер учурдагы маалыматтардын көчүрмөсүн сактайт. Сиз системада каласыз.', 'The server saves a copy of the current data first. You stay signed in.')}
          </p>
          <div className="flex gap-2">
            <button onClick={restore} disabled={busy} className="h-10 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-40 cursor-pointer">
              {busy ? tl('Восстанавливаю…', 'Калыбына келтирилүүдө…', 'Restoring…') : tl('Заменить данные из копии', 'Маалыматтарды көчүрмөдөн алмаштыруу', 'Replace data from backup')}
            </button>
            <button onClick={() => setRestoreFile(null)} className="h-10 px-4 rounded-lg border border-[var(--app-border)] text-sm text-[var(--app-text-primary)] cursor-pointer">{tl('Отмена', 'Жокко чыгаруу', 'Cancel')}</button>
          </div>
        </div>
      )}

      {status && (
        <div className="flex flex-wrap gap-1.5">
          {LABELS.map(([k, label]) => (
            <span key={k} className="inline-flex items-center gap-1.5 h-8 pl-3 pr-1 rounded-full bg-[var(--app-surface-subtle)] border border-[var(--app-border)] text-xs text-[var(--app-text-secondary)]">
              {language === 'ky' ? LABELS_I18N[k][0] : language === 'en' ? LABELS_I18N[k][1] : label}
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
          <ShieldAlert className="w-4 h-4" /> {tl('Подготовка к запуску…', 'Ишке киргизүүгө даярдоо…', 'Prepare for launch…')}
        </button>
      ) : (
        <div className="rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-soft)] p-4 space-y-3">
          <p className="text-sm text-[var(--app-text-primary)]">
            {tl('Будут удалены все турниры, заявки, категории, поединки, протоколы, приглашения, ключи пультов и все аккаунты, кроме администраторов. Все, кроме администраторов, выйдут из системы. Перед удалением сервер сохранит полную копию в папке data/backups. Вернуть данные можно только из этой копии.', 'Бардык мелдештер, табыштамалар, категориялар, беттештер, протоколдор, чакыруулар, пульт ачкычтары жана администраторлордон башка бардык аккаунттар өчүрүлөт. Администраторлордон башкалардын баары системадан чыгат. Өчүрүүдөн мурун сервер data/backups папкасына толук көчүрмө сактайт. Маалыматты ушул көчүрмөдөн гана кайтарса болот.', 'All tournaments, entries, categories, bouts, protocols, invitations, console keys and all accounts except administrators will be deleted. Everyone except administrators will be signed out. Before deleting, the server saves a full copy in data/backups. Data can be restored only from that copy.')}
          </p>
          <label className="block text-sm text-[var(--app-text-secondary)]">
            {tl('Для подтверждения введите слово', 'Ырастоо үчүн бул сөздү жазыңыз:', 'To confirm, type the word')} <b>{PHRASE}</b>
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
              {busy ? tl('Выполняется…', 'Аткарылууда…', 'Working…') : tl('Удалить данные и подготовить', 'Маалыматтарды өчүрүп, даярдоо', 'Delete data and prepare')}
            </button>
            <button onClick={() => { setOpen(false); setPhrase(''); }} className="h-10 px-4 rounded-lg border border-[var(--app-border)] text-sm text-[var(--app-text-primary)] cursor-pointer">
              {tl('Отмена', 'Жокко чыгаруу', 'Cancel')}
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
