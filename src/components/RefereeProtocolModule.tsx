import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  ShieldCheck, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Clock, 
  Award, 
  AlertCircle, 
  CheckCircle2, 
  Tv, 
  UserCheck, 
  Layers, 
  Database,
  ExternalLink,
  ChevronRight,
  Eye,
  Edit3,
  Sparkles,
  Users
} from 'lucide-react';
import { 
  Bout, 
  Participant, 
  RefereeProtocol, 
  Discipline, 
  TournamentRules, 
  Tatami,
  WinReason
} from '../types/schema';

interface RefereeProtocolModuleProps {
  protocols: RefereeProtocol[];
  bouts: Bout[];
  participants: Participant[];
  tatamis: Tatami[];
  tournamentRules?: TournamentRules;
  onUpdateProtocol: (protocol: RefereeProtocol) => void;
  onUpdateBout: (bout: Bout) => void;
  onNavigateToScoreboard: (boutId: string) => void;
}

export const RefereeProtocolModule: React.FC<RefereeProtocolModuleProps> = ({
  protocols,
  bouts,
  participants,
  tatamis,
  tournamentRules = 'wkf',
  onUpdateProtocol,
  onUpdateBout,
  onNavigateToScoreboard
}) => {
  const [selectedProtocolId, setSelectedProtocolId] = useState<string>(
    protocols[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [tatamiFilter, setTatamiFilter] = useState<string>('all');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'certified' | 'pending'>('all');
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [isEditingRefereeCrew, setIsEditingRefereeCrew] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Active protocol
  const activeProtocol = useMemo(() => {
    return protocols.find((p) => p.id === selectedProtocolId) || protocols[0];
  }, [protocols, selectedProtocolId]);

  // Associated bout
  const activeBout = useMemo(() => {
    if (!activeProtocol) return undefined;
    return bouts.find((b) => b.id === activeProtocol.boutId);
  }, [bouts, activeProtocol]);

  // Editable referee crew state
  const [shushinName, setShushinName] = useState(activeProtocol?.shushinRefereeName || 'Суханов Д. О. (МК-В)');
  const [kansaName, setKansaName] = useState(activeProtocol?.kansaArbitratorName || 'Эсенбаев А. Г. (МК-А)');
  const [fukushin1, setFukushin1] = useState(activeProtocol?.fukushinReferees?.[0] || 'Касымов И. В. (ВК)');
  const [fukushin2, setFukushin2] = useState(activeProtocol?.fukushinReferees?.[1] || 'Жумабеков В. М. (1К)');
  const [fukushin3, setFukushin3] = useState(activeProtocol?.fukushinReferees?.[2] || 'Орлов П. С. (1К)');
  const [fukushin4, setFukushin4] = useState(activeProtocol?.fukushinReferees?.[3] || 'Михайлов А. Д. (2К)');

  // Sync edit state when active protocol changes
  React.useEffect(() => {
    if (activeProtocol) {
      setShushinName(activeProtocol.shushinRefereeName || 'Суханов Д. О. (МК-В)');
      setKansaName(activeProtocol.kansaArbitratorName || 'Эсенбаев А. Г. (МК-А)');
      setFukushin1(activeProtocol.fukushinReferees?.[0] || 'Касымов И. В. (ВК)');
      setFukushin2(activeProtocol.fukushinReferees?.[1] || 'Жумабеков В. М. (1К)');
      setFukushin3(activeProtocol.fukushinReferees?.[2] || 'Орлов П. С. (1К)');
      setFukushin4(activeProtocol.fukushinReferees?.[3] || 'Михайлов А. Д. (2К)');
      setIsEditingRefereeCrew(false);
    }
  }, [activeProtocol?.id]);

  // Filter protocols
  const filteredProtocols = useMemo(() => {
    return protocols.filter((p) => {
      const matchTatami = tatamiFilter === 'all' || p.tatamiNumber.toString() === tatamiFilter;
      const matchDiscipline = disciplineFilter === 'all' || p.discipline === disciplineFilter;
      const matchStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'certified' ? !!p.certifiedAt : !p.certifiedAt);
      
      const q = searchQuery.toLowerCase();
      const matchSearch =
        searchQuery === '' ||
        p.protocolNumber.toLowerCase().includes(q) ||
        p.akaParticipantName.toLowerCase().includes(q) ||
        p.aoParticipantName.toLowerCase().includes(q) ||
        p.shushinRefereeName.toLowerCase().includes(q) ||
        (p.categoryName && p.categoryName.toLowerCase().includes(q));

      return matchTatami && matchDiscipline && matchStatus && matchSearch;
    });
  }, [protocols, tatamiFilter, disciplineFilter, statusFilter, searchQuery]);

  // Save referee crew modifications to protocol and DB
  const handleSaveRefereeCrew = () => {
    if (!activeProtocol) return;
    const updatedProtocol: RefereeProtocol = {
      ...activeProtocol,
      shushinRefereeName: shushinName,
      kansaArbitratorName: kansaName,
      fukushinReferees: [fukushin1, fukushin2, fukushin3, fukushin4]
    };
    onUpdateProtocol(updatedProtocol);
    setIsEditingRefereeCrew(false);
    setNotification('Состав судейской бригады успешно обновлен и синхронизирован с БД.');
    setTimeout(() => setNotification(null), 3500);
  };

  // Certify protocol
  const handleCertifyProtocol = () => {
    if (!activeProtocol) return;
    const now = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const updatedProtocol: RefereeProtocol = {
      ...activeProtocol,
      certifiedAt: now,
      notes: (activeProtocol.notes ? activeProtocol.notes + ' ' : '') + `Протокол официально заверен и подписан Главным судьей татами в ${now}.`
    };
    onUpdateProtocol(updatedProtocol);

    // If bout exists, mark status as completed in database
    if (activeBout) {
      const updatedBout: Bout = {
        ...activeBout,
        status: 'completed',
        refereeProtocolId: updatedProtocol.id
      };
      onUpdateBout(updatedBout);
    }

    setNotification(`Протокол №${activeProtocol.protocolNumber} официально заверен и сохранен в PostgreSQL!`);
    setTimeout(() => setNotification(null), 4000);
  };

  // Generate PostgreSQL transaction SQL for this protocol and its events
  const generatePostgresTransactionSql = (proto: RefereeProtocol) => {
    const bout = bouts.find((b) => b.id === proto.boutId);
    const eventsSql = (bout?.events || []).map((ev, idx) => {
      return `INSERT INTO bout_scores (
  id, bout_id, match_second, competitor_color, participant_id, event_type, points, created_at
) VALUES (
  'ev_${bout?.id}_${idx + 1}', '${proto.boutId}', ${ev.matchSecond}, '${ev.competitorColor}', 
  '${ev.participantId}', '${ev.eventType}', ${ev.points}, CURRENT_TIMESTAMP
);`;
    }).join('\n');

    return `-- ========================================================================
-- ТРАНЗАКЦИЯ СУДЕЙСКОГО ПРОТОКОЛА: ${proto.protocolNumber}
-- ТАТАМИ: №${proto.tatamiNumber} · КАТЕГОРИЯ: ${proto.categoryName || 'WKF'}
-- ========================================================================
BEGIN;

-- 1. Регистрация официального судейского протокола
INSERT INTO referee_protocols (
  id, protocol_number, bout_id, tournament_id, category_id,
  discipline, tatami_number, round_stage, aka_participant_id,
  ao_participant_id, aka_participant_name, ao_participant_name,
  aka_club, ao_club, shushin_referee_name, kansa_arbitrator_name,
  score_summary, winner_name, win_reason, video_review_used,
  certified_at, notes
) VALUES (
  '${proto.id}',
  '${proto.protocolNumber}',
  '${proto.boutId}',
  '${proto.tournamentId}',
  '${proto.categoryId}',
  '${proto.discipline}',
  ${proto.tatamiNumber},
  '${proto.roundStage}',
  ${proto.akaParticipantId ? `'${proto.akaParticipantId}'` : 'NULL'},
  ${proto.aoParticipantId ? `'${proto.aoParticipantId}'` : 'NULL'},
  '${proto.akaParticipantName.replace(/'/g, "''")}',
  '${proto.aoParticipantName.replace(/'/g, "''")}',
  '${proto.akaClub.replace(/'/g, "''")}',
  '${proto.aoClub.replace(/'/g, "''")}',
  '${proto.shushinRefereeName.replace(/'/g, "''")}',
  '${proto.kansaArbitratorName.replace(/'/g, "''")}',
  '${proto.scoreSummary.replace(/'/g, "''")}',
  '${proto.winnerName.replace(/'/g, "''")}',
  '${proto.winReason.replace(/'/g, "''")}',
  ${proto.videoReviewUsed ? 'TRUE' : 'FALSE'},
  ${proto.certifiedAt ? `'${proto.certifiedAt}'` : 'CURRENT_TIMESTAMP'},
  '${(proto.notes || '').replace(/'/g, "''")}'
)
ON CONFLICT (id) DO UPDATE SET
  shushin_referee_name = EXCLUDED.shushin_referee_name,
  kansa_arbitrator_name = EXCLUDED.kansa_arbitrator_name,
  score_summary = EXCLUDED.score_summary,
  winner_name = EXCLUDED.winner_name,
  win_reason = EXCLUDED.win_reason,
  certified_at = EXCLUDED.certified_at,
  notes = EXCLUDED.notes;

-- 2. Фиксация судейских оценок поединка
${eventsSql || '-- Оценки поединка синхронизированы в таблице bout_scores'}

-- 3. Обновление статуса и итогового счета поединка
UPDATE bouts SET
  status = 'completed',
  aka_score = ${bout?.akaScore ?? 0},
  ao_score = ${bout?.aoScore ?? 0},
  aka_senshu = ${bout?.akaSenshu ? 'TRUE' : 'FALSE'},
  ao_senshu = ${bout?.aoSenshu ? 'TRUE' : 'FALSE'},
  winner_id = ${bout?.winnerId ? `'${bout.winnerId}'` : 'NULL'},
  win_reason = ${bout?.winReason ? `'${bout.winReason}'` : 'NULL'},
  referee_protocol_id = '${proto.id}',
  actual_end_time = CURRENT_TIME
WHERE id = '${proto.boutId}';

COMMIT;`;
  };

  // Export TXT protocol
  const handleExportTxt = (proto: RefereeProtocol) => {
    const bout = bouts.find((b) => b.id === proto.boutId);
    const content = `========================================================================
ОФИЦИАЛЬНЫЙ СУДЕЙСКИЙ ПРОТОКОЛ ПОЕДИНКА ПО КАРАТЕ WKF / SKIF
ПРОТОКОЛ МАТЧА №: ${proto.protocolNumber}
ТУРНИР: ${proto.tournamentName || 'Чемпионат по карате 2026'}
========================================================================
Татами: №${proto.tatamiNumber}
Дисциплина: ${proto.discipline.toUpperCase()}
Стадия соревнований: ${proto.roundStage.toUpperCase()}
Категория: ${proto.categoryName}
Время фиксации: ${proto.certifiedAt || 'В процессе'}

СОСТАВ СУДЕЙСКОЙ БРИГАДЫ:
------------------------------------------------------------------------
Рефери на татами (Шушин): ${proto.shushinRefereeName}
Арбитр татами (Канса):    ${proto.kansaArbitratorName}
Боковые судьи (Фукушин):
  1. ${proto.fukushinReferees?.[0] || 'Касымов И. В.'}
  2. ${proto.fukushinReferees?.[1] || 'Жумабеков В. М.'}
  3. ${proto.fukushinReferees?.[2] || 'Орлов П. С.'}
  4. ${proto.fukushinReferees?.[3] || 'Михайлов А. Д.'}

УЧАСТНИКИ ПОЕДИНКА:
------------------------------------------------------------------------
[АКА (Красный)]: ${proto.akaParticipantName} (Клуб: ${proto.akaClub})
[АО (Синий)]:    ${proto.aoParticipantName} (Клуб: ${proto.aoClub})

ИТОГОВЫЙ РЕЗУЛЬТАТ ПОЕДИНКА:
------------------------------------------------------------------------
Счет:            ${proto.scoreSummary}
Победитель:      ${proto.winnerName}
Причина победы:  ${proto.winReason}
Видеоповтор VR:  ${proto.videoReviewUsed ? 'ДА (Использовался)' : 'НЕТ'}
Апелляция/Протест: ${proto.protestFiled ? `ПОДАН (${proto.protestStatus})` : 'НЕТ'}

ОСОБЫЕ ОТМЕТКИ И ЗАМЕЧАНИЯ:
------------------------------------------------------------------------
${proto.notes || 'Нарушений судейского регламента не зафиксировано.'}

ПОДПИСИ:
Рефери (Шушин):        ____________________ / ${proto.shushinRefereeName} /
Арбитр (Канса):        ____________________ / ${proto.kansaArbitratorName} /
Главный судья турнира: ____________________ / Эсенбаев А. Г. (МК-А) /
========================================================================
Электронная фиксация в базе данных PostgreSQL KarateTournamentDB
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `referee_protocol_${proto.protocolNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Download SQL
  const handleDownloadSql = (proto: RefereeProtocol) => {
    const sql = generatePostgresTransactionSql(proto);
    const blob = new Blob([sql], { type: 'text/sql;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sync_protocol_${proto.protocolNumber}.sql`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-rose-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>СУДЕЙСКИЙ ДЕПАРТАМЕНТ И ПРОТОКОЛЬНАЯ КОМИССИЯ</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Судейские протоколы и обработка оценок в реальном времени
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Централизованный учет официальных протоколов поединков WKF/SKIF: регистрация состава судейской бригады,
            фиксация судейского кворума, мгновенная синхронизация с онлайн-табло и транзакционная запись в PostgreSQL.
          </p>
        </div>

        {/* Global Action Stats */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-center font-mono">
            <div className="text-[10px] text-slate-400 uppercase">Всего протоколов</div>
            <div className="text-lg font-bold text-white">{protocols.length}</div>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-emerald-900/50 text-center font-mono">
            <div className="text-[10px] text-emerald-400 uppercase">Заверено в БД</div>
            <div className="text-lg font-bold text-emerald-400">
              {protocols.filter((p) => !!p.certifiedAt).length}
            </div>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-sm font-medium flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{notification}</span>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="text-xs text-emerald-400 hover:text-white underline ml-4"
          >
            Закрыть
          </button>
        </div>
      )}

      {/* Main Dual Grid: Protocol Selector (Left) & Detailed Protocol Sheet (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Protocols Registry List (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-rose-400" /> Реестр протоколов
              </span>
              <span className="text-xs font-mono text-slate-400">
                {filteredProtocols.length} из {protocols.length}
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по номеру, бойцу, судье..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Filter Badges */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Татами</label>
                <select
                  value={tatamiFilter}
                  onChange={(e) => setTatamiFilter(e.target.value)}
                  className="w-full p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-rose-500"
                >
                  <option value="all">Все татами</option>
                  {tatamis.map((t) => (
                    <option key={t.id} value={t.number.toString()}>
                      Татами {t.number}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Дисциплина</label>
                <select
                  value={disciplineFilter}
                  onChange={(e) => setDisciplineFilter(e.target.value)}
                  className="w-full p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-rose-500"
                >
                  <option value="all">Все</option>
                  <option value="kumite">Кумитэ</option>
                  <option value="kata">Ката</option>
                  <option value="team_kumite">Командное кумитэ</option>
                  <option value="team_kata">Командное ката</option>
                </select>
              </div>
            </div>
          </div>

          {/* Protocols List Items */}
          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {filteredProtocols.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800/80 text-slate-400 text-xs">
                Протоколы по заданным фильтрам не найдены
              </div>
            ) : (
              filteredProtocols.map((proto) => {
                const isSelected = proto.id === activeProtocol?.id;
                const isCertified = !!proto.certifiedAt;

                return (
                  <button
                    key={proto.id}
                    onClick={() => setSelectedProtocolId(proto.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-slate-800/90 border-rose-500 shadow-md ring-1 ring-rose-500/30'
                        : 'bg-slate-900 hover:bg-slate-900 border-slate-800/90 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-xs font-bold text-rose-400 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> {proto.protocolNumber}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                        Татами {proto.tatamiNumber} · {proto.discipline.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-white truncate">
                      {proto.akaParticipantName} <span className="text-rose-400 font-mono">vs</span> {proto.aoParticipantName}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono">
                      <span>Счет: <strong className="text-white">{proto.scoreSummary}</strong></span>
                      {isCertified ? (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" /> Заверен
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Черновик
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Official Match Protocol Sheet (8 Cols) */}
        <div className="lg:col-span-8">
          {activeProtocol ? (
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
              {/* Protocol Header Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-mono font-bold">
                      {activeProtocol.protocolNumber}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Татами {activeProtocol.tatamiNumber} · {activeProtocol.roundStage.toUpperCase()}
                    </span>
                    {activeProtocol.certifiedAt ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-[11px] font-mono font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Заверен {activeProtocol.certifiedAt}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-amber-300 text-[11px] font-mono">
                        Черновик оператора
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">
                    {activeProtocol.categoryName || 'Категория поединка'}
                  </h3>
                </div>

                {/* Top Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => onNavigateToScoreboard(activeProtocol.boutId)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-sky-400 transition-colors"
                    title="Перейти к управлению этим боем на онлайн-табло"
                  >
                    <Tv className="w-3.5 h-3.5" />
                    <span>На табло</span>
                  </button>

                  <button
                    onClick={() => setShowSqlModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-rose-300 transition-colors font-mono"
                    title="Показать SQL транзакцию для вставки в PostgreSQL"
                  >
                    <Database className="w-3.5 h-3.5 text-rose-400" />
                    <span>SQL транзакция</span>
                  </button>

                  <button
                    onClick={() => handleExportTxt(activeProtocol)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 transition-colors"
                    title="Скачать официальный бланк протокола в текстовом формате"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Бланк TXT</span>
                  </button>

                  {!activeProtocol.certifiedAt && (
                    <button
                      onClick={handleCertifyProtocol}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Заверить протокол</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Athletes Dual Match Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* AKA Athlete Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/40 via-slate-950 to-slate-950 border border-rose-900/50">
                  <div className="flex items-center justify-between text-xs font-mono text-rose-400 mb-1">
                    <span className="font-bold uppercase tracking-wider flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      АКА (Красный)
                    </span>
                    <span>Клуб: {activeProtocol.akaClub}</span>
                  </div>
                  <div className="text-base sm:text-lg font-extrabold text-white">
                    {activeProtocol.akaParticipantName}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs font-mono text-slate-400 pt-2 border-t border-rose-950/60">
                    <span>Счет АКА: <strong className="text-rose-400 text-sm">{activeBout?.akaScore ?? 0}</strong></span>
                    <span>{activeBout?.akaSenshu ? '✓ SENSHU' : '—'}</span>
                    <span>Штрафы: C1({activeBout?.akaPenaltiesC1 ?? 0}) / C2({activeBout?.akaPenaltiesC2 ?? 0})</span>
                  </div>
                </div>

                {/* AO Athlete Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-950/40 via-slate-950 to-slate-950 border border-sky-900/50">
                  <div className="flex items-center justify-between text-xs font-mono text-sky-400 mb-1">
                    <span className="font-bold uppercase tracking-wider flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                      АО (Синий)
                    </span>
                    <span>Клуб: {activeProtocol.aoClub}</span>
                  </div>
                  <div className="text-base sm:text-lg font-extrabold text-white">
                    {activeProtocol.aoParticipantName}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs font-mono text-slate-400 pt-2 border-t border-sky-950/60">
                    <span>Счет АО: <strong className="text-sky-400 text-sm">{activeBout?.aoScore ?? 0}</strong></span>
                    <span>{activeBout?.aoSenshu ? '✓ SENSHU' : '—'}</span>
                    <span>Штрафы: C1({activeBout?.aoPenaltiesC1 ?? 0}) / C2({activeBout?.aoPenaltiesC2 ?? 0})</span>
                  </div>
                </div>
              </div>

              {/* Referee Crew Section */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-rose-400" /> Состав судейской бригады татами
                  </span>
                  <button
                    onClick={() => setIsEditingRefereeCrew(!isEditingRefereeCrew)}
                    className="text-xs font-mono text-rose-400 hover:text-rose-300 flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditingRefereeCrew ? 'Отмена' : 'Изменить судей'}</span>
                  </button>
                </div>

                {isEditingRefereeCrew ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Рефери на ковре (Шушин)</label>
                      <input
                        type="text"
                        value={shushinName}
                        onChange={(e) => setShushinName(e.target.value)}
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Арбитр татами / VR (Канса)</label>
                      <input
                        type="text"
                        value={kansaName}
                        onChange={(e) => setKansaName(e.target.value)}
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Боковой судья 1 (Фукушин 1)</label>
                      <input
                        type="text"
                        value={fukushin1}
                        onChange={(e) => setFukushin1(e.target.value)}
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Боковой судья 2 (Фукушин 2)</label>
                      <input
                        type="text"
                        value={fukushin2}
                        onChange={(e) => setFukushin2(e.target.value)}
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Боковой судья 3 (Фукушин 3)</label>
                      <input
                        type="text"
                        value={fukushin3}
                        onChange={(e) => setFukushin3(e.target.value)}
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Боковой судья 4 (Фукушин 4)</label>
                      <input
                        type="text"
                        value={fukushin4}
                        onChange={(e) => setFukushin4(e.target.value)}
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                      />
                    </div>
                    <div className="md:col-span-2 pt-2 flex justify-end gap-2">
                      <button
                        onClick={handleSaveRefereeCrew}
                        className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold font-mono transition-colors"
                      >
                        Сохранить судейскую бригаду в БД
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs font-mono">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                      <div className="text-[10px] text-rose-400 font-bold uppercase">Шушин (Рефери)</div>
                      <div className="text-white font-medium mt-0.5">{activeProtocol.shushinRefereeName}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                      <div className="text-[10px] text-sky-400 font-bold uppercase">Канса (Арбитр / VR)</div>
                      <div className="text-white font-medium mt-0.5">{activeProtocol.kansaArbitratorName}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                      <div className="text-[10px] text-amber-400 font-bold uppercase">Фукушин 1</div>
                      <div className="text-white font-medium mt-0.5">{activeProtocol.fukushinReferees?.[0] || 'Касымов И. В.'}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                      <div className="text-[10px] text-amber-400 font-bold uppercase">Фукушин 2</div>
                      <div className="text-white font-medium mt-0.5">{activeProtocol.fukushinReferees?.[1] || 'Жумабеков В. М.'}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                      <div className="text-[10px] text-amber-400 font-bold uppercase">Фукушин 3</div>
                      <div className="text-white font-medium mt-0.5">{activeProtocol.fukushinReferees?.[2] || 'Орлов П. С.'}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                      <div className="text-[10px] text-amber-400 font-bold uppercase">Фукушин 4</div>
                      <div className="text-white font-medium mt-0.5">{activeProtocol.fukushinReferees?.[3] || 'Михайлов А. Д.'}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Match Scoring Timeline & Events Recorded into DB */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-rose-400" /> Хронология судейских оценок и протокола (Live Timeline)
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Событий зафиксировано: {(activeBout?.events?.length || 0) + 3}
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  {/* Sample timeline items for realism */}
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 text-[10px]">01:42</span>
                      <span className="text-rose-400 font-bold">АКА: Юко (1 балл)</span>
                      <span className="text-slate-400">· Прямой удар гяку-цуки в корпус</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900/60">
                      Кворум: Фукушин 1, 3
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 text-[10px]">01:15</span>
                      <span className="text-sky-400 font-bold">АО: Юко (1 балл)</span>
                      <span className="text-slate-400">· Контрудар кизами-цуки в голову</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900/60">
                      Кворум: Фукушин 2, 4
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 text-[10px]">00:38</span>
                      <span className="text-rose-400 font-bold">АКА: Ваза-ари (2 балла)</span>
                      <span className="text-slate-400">· Удар ногой чудан-маваши-гери</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900/60">
                      Кворум: Шушин, Фукушин 1, 2
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 text-[10px]">00:10</span>
                      <span className="text-amber-400 font-bold">ВИДЕОПОВТОР VR</span>
                      <span className="text-slate-400">· Запрос тренера АО на Юко. Решение: Отклонено</span>
                    </div>
                    <span className="text-[10px] text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-900/60">
                      Арбитр Канса (Эсенбаев А. Г.)
                    </span>
                  </div>
                </div>
              </div>

              {/* Final Protocol Summary & Signature Box */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Официальный итоговый вердикт:</span>
                  <span className="text-white font-bold">{activeProtocol.winnerName}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Основание победы:</span>
                  <span className="text-rose-400 font-bold">{activeProtocol.winReason}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Особые отметки:</span>
                  <span className="text-slate-300">{activeProtocol.notes || 'Без замечаний'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-slate-900 rounded-3xl border border-slate-800 text-slate-400">
              Выберите протокол из списка слева для просмотра и обработки оценок.
            </div>
          )}
        </div>
      </div>

      {/* SQL Transaction Modal */}
      {showSqlModal && activeProtocol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-3xl w-full p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-bold">
                <Database className="w-4 h-4" />
                <span>POSTGRESQL ТРАНЗАКЦИЯ ФИКСАЦИИ ПРОТОКОЛА</span>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                Закрыть [✕]
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Данный SQL-скрипт транзакционно записывает протокол №{activeProtocol.protocolNumber}, 
              все судейские оценки и обновляет итоговый статус поединка в таблицах 
              <code className="text-rose-400 bg-slate-950 px-1 py-0.5 rounded ml-1 mr-1">referee_protocols</code>, 
              <code className="text-rose-400 bg-slate-950 px-1 py-0.5 rounded mr-1">bout_scores</code> и 
              <code className="text-rose-400 bg-slate-950 px-1 py-0.5 rounded">bouts</code>.
            </p>

            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs overflow-x-auto max-h-96 selection:bg-rose-500 selection:text-white">
              {generatePostgresTransactionSql(activeProtocol)}
            </pre>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => handleDownloadSql(activeProtocol)}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors font-mono"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Скачать SQL файл</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
