import React, { useState } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Tv, 
  Tablet, 
  Server, 
  ShieldCheck, 
  RefreshCw, 
  Download, 
  Upload, 
  QrCode, 
  CheckCircle2, 
  Sparkles, 
  GitBranch, 
  Users, 
  HardDrive, 
  ArrowRight,
  Copy,
  Check,
  Radio,
  FileCode
} from 'lucide-react';
import { 
  LocalLanDevice, 
  TournamentRegistrationConfig, 
  Bout, 
  Participant, 
  Tatami, 
  TournamentCategory 
} from '../types/schema';

interface LocalLanTournamentHubProps {
  registrationConfig: TournamentRegistrationConfig;
  onUpdateRegistrationConfig: (cfg: TournamentRegistrationConfig) => void;
  tatamis: Tatami[];
  bouts: Bout[];
  participants: Participant[];
  categories: TournamentCategory[];
  onOpenScoreboardForTatami?: (tatamiId: string) => void;
  onExecuteSmartWkfDraw: () => void;
  onExportLocalBundle: () => void;
  onImportLocalBundle: (file: File) => void;
  onExportSql: () => void;
}

export const LocalLanTournamentHub: React.FC<LocalLanTournamentHubProps> = ({
  registrationConfig,
  onUpdateRegistrationConfig,
  tatamis,
  bouts,
  participants,
  categories,
  onOpenScoreboardForTatami,
  onExecuteSmartWkfDraw,
  onExportLocalBundle,
  onImportLocalBundle,
  onExportSql
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedTabletForQr, setSelectedTabletForQr] = useState<number | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  // Default LAN devices on local venue network
  const [devices, setDevices] = useState<LocalLanDevice[]>([
    {
      id: 'dev_tatami_1',
      name: 'Планшет судейского столика Татами №1',
      role: 'tatami_1',
      ipAddress: '192.168.1.101',
      assignedTatamiNumber: 1,
      status: 'connected',
      lastPing: '3 сек назад',
      activeBoutNumber: 104
    },
    {
      id: 'dev_tatami_2',
      name: 'Планшет судейского столика Татами №2',
      role: 'tatami_2',
      ipAddress: '192.168.1.102',
      assignedTatamiNumber: 2,
      status: 'connected',
      lastPing: '2 сек назад',
      activeBoutNumber: 201
    },
    {
      id: 'dev_tatami_3',
      name: 'Планшет судейского столика Татами №3 (Кадеты)',
      role: 'tatami_3',
      ipAddress: '192.168.1.103',
      assignedTatamiNumber: 3,
      status: 'connected',
      lastPing: '5 сек назад',
      activeBoutNumber: 302
    },
    {
      id: 'dev_tatami_4',
      name: 'Планшет судейского столика Татами №4 (Ката)',
      role: 'tatami_4',
      ipAddress: '192.168.1.104',
      assignedTatamiNumber: 4,
      status: 'connected',
      lastPing: '1 сек назад',
      activeBoutNumber: 401
    },
    {
      id: 'dev_chief_ref',
      name: 'Ноутбук Главного судьи соревнований (ГСК / VR)',
      role: 'chief_referee',
      ipAddress: '192.168.1.105',
      status: 'connected',
      lastPing: 'Только что'
    },
    {
      id: 'dev_projector_hall',
      name: 'Центральный проектор зала (Главное табло и сетка)',
      role: 'projector',
      ipAddress: '192.168.1.110',
      status: 'connected',
      lastPing: 'Только что'
    }
  ]);

  const handleCopyPublicLink = () => {
    const fullUrl = `${window.location.origin}/?mode=registration&token=${registrationConfig.shareableToken}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleToggleRegistration = () => {
    onUpdateRegistrationConfig({
      ...registrationConfig,
      isRegistrationOpen: !registrationConfig.isRegistrationOpen
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onImportLocalBundle(file);
    setImportNotice(`Пакет "${file.name}" успешно загружен в локальную базу данных!`);
    setTimeout(() => setImportNotice(null), 4000);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* LAN Server Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-indigo-400">
              <Server className="w-4 h-4" />
              <span>ЛОКАЛЬНЫЙ СЕРВЕР ТУРНИРА (LAN HUB) · АВТОНОМНЫЙ РЕЖИМ БЕЗ ИНТЕРНЕТА</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Управление соревнованиями по локальной сети
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-3xl mt-1 leading-relaxed">
              Система функционирует полностью автономно внутри спортивного комплекса: после закрытия онлайн-регистрации 
              база данных атлетов блокируется от изменений извне и передается на судейские планшеты по локальной Wi-Fi/Ethernet сети.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3.5 py-1.5 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-xs font-mono font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LAN: 192.168.1.100:3000</span>
            </span>

            <button
              onClick={onExportLocalBundle}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
              title="Скачать локальный JSON-бэкап турнира на флешку"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Сохранить на флешку (JSON)</span>
            </button>
          </div>
        </div>
      </div>

      {importNotice && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{importNotice}</span>
        </div>
      )}

      {/* 2-Column Dashboard: Registration Gate & Smart Draw Trigger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Module 1: Temporary Online Registration Switcher & Public Share Link */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-lg border ${
                registrationConfig.isRegistrationOpen
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  : 'bg-rose-950 text-rose-400 border-rose-800'
              }`}>
                {registrationConfig.isRegistrationOpen ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Временный сбор заявок онлайн</h2>
                <span className="text-[11px] font-mono text-slate-400">
                  Статус: {registrationConfig.isRegistrationOpen ? (
                    <strong className="text-emerald-400 font-bold">ОТКРЫТ ПО ССЫЛКЕ</strong>
                  ) : (
                    <strong className="text-rose-400 font-bold">ЗАКРЫТ (ПЕРЕХОД В LAN)</strong>
                  )}
                </span>
              </div>
            </div>

            {/* Quick 1-Click Toggle */}
            <button
              onClick={handleToggleRegistration}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                registrationConfig.isRegistrationOpen
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {registrationConfig.isRegistrationOpen ? 'Закрыть сбор заявок' : 'Открыть сбор заявок'}
            </button>
          </div>

          {/* Registration Info & Share Link */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Публичная ссылка для тренеров и представителей клубов:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/?mode=registration&token=${registrationConfig.shareableToken}`}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs font-mono focus:outline-none select-all"
                />
                <button
                  onClick={handleCopyPublicLink}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shrink-0"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Скопировано!' : 'Копировать'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Подано заявок атлетов:</span>
                <span className="text-lg font-bold text-sky-400 mt-0.5 block">{participants.length} спортсменов</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Дивизионов соревнований:</span>
                <span className="text-lg font-bold text-rose-400 mt-0.5 block">{categories.length} категорий</span>
              </div>
            </div>

            {/* Offline Transition Explanation */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 space-y-1.5">
              <div className="text-slate-200 font-semibold flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
                <span>Автономная защита зала:</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                После закрытия онлайн-регистрации интернет можно полностью отключить. База турнира фиксируется 
                на главном компьютере секретариата, а данные на ковры передаются локально.
              </p>
            </div>
          </div>
        </div>

        {/* Module 2: Smart Seeding & Automatic Tatami Assignment */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-600/20 text-rose-400 border border-rose-600/40 flex items-center justify-center font-bold text-lg">
                  <GitBranch className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Умная жеребьевка WKF и назначение татами</h2>
                  <span className="text-[11px] font-mono text-emerald-400">
                    Защита 1-2 кругов: Разведение клубов, городов и стран
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <p>
                Нажмите кнопку ниже для моментального формирования турнирных сеток всех дивизионов:
              </p>
              <ul className="space-y-2 text-[11px] font-mono text-slate-400">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Исключение встреч в 1-м и 2-м кругах</strong> между бойцами одного клуба, города или страны.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Автоматическое закрепление за татами</strong>: Ката $\rightarrow$ Татами 4, Кадеты $\rightarrow$ Татами 3, Легкий вес $\rightarrow$ Татами 2, Тяжелый вес $\rightarrow$ Татами 1.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Сквозная нумерация поединков</strong> для электронных судейских табло (#101, #102, #201...).</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={onExecuteSmartWkfDraw}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-extrabold text-sm tracking-wide shadow-xl shadow-rose-950/50 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>ЗАПУСТИТЬ УМНУЮ ЖЕРЕБЬЕВКУ И РАСПРЕДЕЛИТЬ ПО ТАТАМИ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Module 3: Connected Referee Tablet Devices in the Sports Hall */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>СЕТЬ СУДЕЙСКИХ ПЛАНШЕТОВ И ЭКРАНОВ В ЗАЛЕ (LAN ONLINE)</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-0.5">
              Подключенные планшеты ковров и терминалы
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <label className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer border border-slate-700 transition-colors flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span>Загрузить турнир (JSON)</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <button
              onClick={onExportSql}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <FileCode className="w-3.5 h-3.5 text-rose-400" />
              <span>Резервная копия (JSON)</span>
            </button>
          </div>
        </div>

        {/* Tablet Nodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((dev) => {
            const tatamiMatches = dev.assignedTatamiNumber
              ? bouts.filter((b) => b.tatamiNumber === dev.assignedTatamiNumber)
              : [];
            const activeBout = tatamiMatches.find((b) => b.status === 'in_progress');

            return (
              <div
                key={dev.id}
                className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-slate-400 flex items-center gap-1.5">
                    <Tablet className="w-4 h-4 text-sky-400" />
                    <span>IP: {dev.ipAddress}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>В сети ({dev.lastPing})</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors">
                    {dev.name}
                  </h3>
                  {dev.assignedTatamiNumber && (
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      Назначено боев: <strong className="text-white">{tatamiMatches.length}</strong>
                      {activeBout && (
                        <span className="ml-2 text-rose-400">· Бой #{activeBout.boutNumber} (Live)</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedTabletForQr(dev.assignedTatamiNumber || 1)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] font-mono text-slate-300 border border-slate-800 flex items-center gap-1 transition-colors"
                  >
                    <QrCode className="w-3 h-3 text-sky-400" />
                    <span>QR для планшета</span>
                  </button>

                  {dev.assignedTatamiNumber && onOpenScoreboardForTatami && (
                    <button
                      onClick={() => onOpenScoreboardForTatami(`t${dev.assignedTatamiNumber}`)}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-600/40 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Tv className="w-3 h-3 text-rose-400" />
                      <span>Открыть табло</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* QR Code Modal for Tablet Setup */}
      {selectedTabletForQr !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-slate-400">
                ПОДКЛЮЧЕНИЕ ПЛАНШЕТА · ТАТАМИ №{selectedTabletForQr}
              </span>
              <button
                onClick={() => setSelectedTabletForQr(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="w-48 h-48 mx-auto p-3 bg-white rounded-2xl shadow-inner flex items-center justify-center">
              <QrCode className="w-full h-full text-slate-950" />
            </div>

            <div className="space-y-1 text-xs">
              <div className="font-bold text-white">
                Наведите камеру судейского планшета
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Локальный адрес: http://192.168.1.100:3000/?tatami={selectedTabletForQr}
              </p>
            </div>

            <button
              onClick={() => setSelectedTabletForQr(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
            >
              Закрыть окно
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
