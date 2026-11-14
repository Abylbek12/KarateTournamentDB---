import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Trophy, 
  Users, 
  FileCheck2, 
  Award, 
  CheckCircle2, 
  Clock, 
  Download, 
  Filter, 
  Search, 
  ShieldCheck, 
  Sparkles, 
  Tv, 
  ArrowRight,
  Layers,
  ChevronRight,
  Zap,
  MapPin,
  Calendar,
  Check,
  X,
  FileText,
  Scale
} from 'lucide-react';
import { 
  Tournament, 
  Club, 
  TournamentClub, 
  Participant, 
  Bout, 
  TournamentCategory, 
  RefereeProtocol, 
  KataEvaluation, 
  Discipline,
  TournamentRules
} from '../types/schema';
import { 
  SAMPLE_TOURNAMENTS, 
  SAMPLE_TOURNAMENT_CLUBS, 
  SAMPLE_REFEREE_PROTOCOLS, 
  SAMPLE_KATA_EVALUATIONS 
} from '../data/sampleTournamentData';

interface TournamentClubAccountingModuleProps {
  clubs: Club[];
  participants: Participant[];
  bouts: Bout[];
  categories: TournamentCategory[];
  tournamentRules: TournamentRules;
  onNavigateToScoreboard: (boutId: string) => void;
  onNavigateToBracket: () => void;
}

export const TournamentClubAccountingModule: React.FC<TournamentClubAccountingModuleProps> = ({
  clubs,
  participants,
  bouts,
  categories,
  tournamentRules,
  onNavigateToScoreboard,
  onNavigateToBracket
}) => {
  // 1. Active Tournament selection (Separate Tournament Accounting)
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('tourn1');
  const activeTournament = SAMPLE_TOURNAMENTS.find((t) => t.id === selectedTournamentId) || SAMPLE_TOURNAMENTS[0];

  // 2. Discipline Switcher (Kumite / Kata / Team Kumite / Team Kata)
  const [selectedDiscipline, setSelectedDiscipline] = useState<Discipline | 'all'>('all');

  // 3. Sub-tabs inside module
  const [activeView, setActiveView] = useState<'protocols' | 'clubs' | 'participants' | 'results' | 'kata'>('protocols');

  // 4. Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClubId, setSelectedClubId] = useState<string>('all');
  const [selectedProtocolForModal, setSelectedProtocolForModal] = useState<RefereeProtocol | null>(null);

  // Filtered Tournament Clubs
  const tournamentClubs = useMemo(() => {
    return SAMPLE_TOURNAMENT_CLUBS.filter((tc) => tc.tournamentId === activeTournament.id);
  }, [activeTournament.id]);

  // Filtered Categories by discipline
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const matchTournament = c.tournamentId === activeTournament.id;
      const matchDiscipline = selectedDiscipline === 'all' || c.discipline === selectedDiscipline;
      return matchTournament && matchDiscipline;
    });
  }, [categories, activeTournament.id, selectedDiscipline]);

  const filteredCategoryIds = useMemo(() => {
    return new Set(filteredCategories.map((c) => c.id));
  }, [filteredCategories]);

  // Filtered Participants by Tournament, Club, and Discipline
  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      const matchTournament = p.tournamentId === activeTournament.id;
      const matchClub = selectedClubId === 'all' || p.clubId === selectedClubId;
      const matchSearch =
        searchQuery === '' ||
        p.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.clubName && p.clubName.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchDiscipline = true;
      if (selectedDiscipline !== 'all' && p.categoryId) {
        matchDiscipline = filteredCategoryIds.has(p.categoryId);
      }

      return matchTournament && matchClub && matchSearch && matchDiscipline;
    });
  }, [participants, activeTournament.id, selectedClubId, searchQuery, selectedDiscipline, filteredCategoryIds]);

  // Filtered Bouts / Results by Tournament and Discipline
  const filteredBouts = useMemo(() => {
    return bouts.filter((b) => {
      const matchTournament = b.tournamentId === activeTournament.id;
      const matchDiscipline =
        selectedDiscipline === 'all' ||
        (b.discipline ? b.discipline === selectedDiscipline : selectedDiscipline === 'kumite');
      return matchTournament && matchDiscipline;
    });
  }, [bouts, activeTournament.id, selectedDiscipline]);

  // Filtered Referee Protocols
  const filteredProtocols = useMemo(() => {
    return SAMPLE_REFEREE_PROTOCOLS.filter((proto) => {
      const matchTournament = proto.tournamentId === activeTournament.id;
      const matchDiscipline = selectedDiscipline === 'all' || proto.discipline === selectedDiscipline;
      const matchSearch =
        searchQuery === '' ||
        proto.protocolNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        proto.akaParticipantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        proto.aoParticipantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        proto.shushinRefereeName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchTournament && matchDiscipline && matchSearch;
    });
  }, [activeTournament.id, selectedDiscipline, searchQuery]);

  // Kata Evaluations
  const kataEvaluations = useMemo(() => {
    return SAMPLE_KATA_EVALUATIONS;
  }, []);

  const handleExportProtocolTxt = (proto: RefereeProtocol) => {
    const content = `
========================================================================
ОФИЦИАЛЬНЫЙ СУДЕЙСКИЙ ПРОТОКОЛ ПОЕДИНКА / ВЫСТУПЛЕНИЯ
БЛАНК №: ${proto.protocolNumber}
ТУРНИР: ${proto.tournamentName}
========================================================================
Дата / Время: ${proto.certifiedAt}
Татами: №${proto.tatamiNumber}
Дисциплина: ${proto.discipline.toUpperCase()}
Стадия: ${proto.roundStage.toUpperCase()}
Категория: ${proto.categoryName}

УЧАСТНИКИ:
  - АКА (Красный): ${proto.akaParticipantName} (${proto.akaClub})
  - АО (Синий):    ${proto.aoParticipantName} (${proto.aoClub})

ИТОГОВЫЙ СЧЁТ / ОЦЕНКА:
  ${proto.scoreSummary}

РЕШЕНИЕ СУДЕЙСКОЙ КОЛЛЕГИИ:
  ПОБЕДИТЕЛЬ: ${proto.winnerName}
  ОСНОВАНИЕ:  ${proto.winReason}

СУДЕЙСКАЯ БРИГАДА:
  - Рефери на татами (Сусин):   ${proto.shushinRefereeName}
  - Арбитр стола (Канса):       ${proto.kansaArbitratorName}
  - Боковые судьи (Фукусин):    ${proto.fukushinReferees.join(', ')}

ВИДЕОПОВТОР И ПРОТЕСТЫ:
  - Видеоповтор VR использован: ${proto.videoReviewUsed ? 'ДА' : 'НЕТ'}
  - Протест подан:              ${proto.protestFiled ? 'ДА' : 'НЕТ'} (Статус: ${proto.protestStatus || 'none'})

ОФИЦИАЛЬНЫЕ ЗАМЕЧАНИЯ:
  ${proto.notes || 'Замечаний нет. Протокол заверен электронной подписью.'}
========================================================================
    `.trim();

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `protocol_${proto.protocolNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOURNAMENT SELECTOR & SEPARATE ACCOUNTING HEADER */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-850 border border-slate-800 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-rose-400">
              <Building2 className="w-3.5 h-3.5" />
              <span>Multi-Tournament & Club Accounting · WKF Relational Engine</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
              Раздельный учёт турниров, клубов и судейских протоколов
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Реляционная схема раздельного учета соревнований: аккредитация клубов, списки участников, 
              результаты поединков и официальные бланки судейских протоколов WKF/SKIF с переключением дисциплин.
            </p>
          </div>

          {/* Tournament Selection Dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <span className="text-xs font-mono text-slate-400 shrink-0">Турнир в работе:</span>
            <select
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-bold"
            >
              {SAMPLE_TOURNAMENTS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.city}, {t.startDate.slice(0, 4)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Tournament Highlight Strip */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Локация и Арена:</span>
            <span className="font-bold text-white mt-0.5 block truncate">
              {activeTournament.city} · {activeTournament.venueName}
            </span>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Даты турнира:</span>
            <span className="font-bold text-rose-400 mt-0.5 block">
              {activeTournament.startDate} — {activeTournament.endDate}
            </span>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Аккредитовано клубов:</span>
            <span className="font-bold text-sky-400 mt-0.5 block">
              {tournamentClubs.length} додзё ({activeTournament.athleteCount} атлетов)
            </span>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Регламент соревнований:</span>
            <span className="font-bold text-amber-400 mt-0.5 block uppercase">
              {activeTournament.rulesType === 'skif' ? 'SKIF Shobu' : 'WKF Olympic'} ({activeTournament.status})
            </span>
          </div>
        </div>

        {/* 2. DISCIPLINE SWITCHER TOOLBAR */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-xs font-mono text-slate-400 font-bold shrink-0 flex items-center gap-1.5 mr-1">
              <Layers className="w-3.5 h-3.5 text-rose-400" />
              <span>Дисциплина:</span>
            </span>

            {[
              { id: 'all', label: 'Все дисциплины' },
              { id: 'kumite', label: 'Кумитэ (Поединки)' },
              { id: 'kata', label: 'Ката (Формы)' },
              { id: 'team_kumite', label: 'Командное кумитэ' },
              { id: 'team_kata', label: 'Командное ката & Бункай' }
            ].map((disc) => (
              <button
                key={disc.id}
                onClick={() => setSelectedDiscipline(disc.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap shrink-0 ${
                  selectedDiscipline === disc.id
                    ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-400'
                    : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {disc.label}
              </button>
            ))}
          </div>

          <span className="text-xs font-mono text-slate-400">
            Найдено категорий: <strong className="text-white">{filteredCategories.length}</strong>
          </span>
        </div>

        {/* 3. SUB-TABS NAVIGATION (Protocols / Clubs / Participants / Results / Kata) */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveView('protocols')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeView === 'protocols'
                ? 'bg-rose-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Судейские протоколы ({filteredProtocols.length})</span>
          </button>

          <button
            onClick={() => setActiveView('clubs')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeView === 'clubs'
                ? 'bg-rose-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Клубы и аккредитация ({tournamentClubs.length})</span>
          </button>

          <button
            onClick={() => setActiveView('participants')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeView === 'participants'
                ? 'bg-rose-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Участники турнира ({filteredParticipants.length})</span>
          </button>

          <button
            onClick={() => setActiveView('results')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeView === 'results'
                ? 'bg-rose-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Результаты поединков ({filteredBouts.length})</span>
          </button>

          {(selectedDiscipline === 'all' || selectedDiscipline === 'kata' || selectedDiscipline === 'team_kata') && (
            <button
              onClick={() => setActiveView('kata')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeView === 'kata'
                  ? 'bg-amber-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>Оценки Ката WKF (5-7 судей)</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. REFEREE PROTOCOLS VIEW (Судейские протоколы WKF/SKIF)                 */}
      {/* ========================================================================= */}
      {activeView === 'protocols' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Поиск протокола по номеру, бойцу или судье..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>

            <div className="text-xs font-mono text-slate-400">
              Таблица <code className="text-rose-400">referee_protocols</code> · Официальная верификация
            </div>
          </div>

          {/* Protocols List Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProtocols.map((proto) => (
              <div
                key={proto.id}
                className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all shadow-sm flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top Bar with Number and Discipline */}
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-rose-400">
                      {proto.protocolNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-900 text-slate-300 border border-slate-800">
                      {proto.discipline} · Т{proto.tatamiNumber}
                    </span>
                  </div>

                  {/* Stage and Category */}
                  <div className="mt-3">
                    <h4 className="text-sm font-bold text-white truncate">
                      {proto.categoryName}
                    </h4>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Стадия: {proto.roundStage.toUpperCase()}
                    </span>
                  </div>

                  {/* Bout Fighters Pair */}
                  <div className="mt-3 pt-3 border-t border-slate-850 space-y-1.5 font-mono text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1.5 truncate">
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                        <span className="truncate">{proto.akaParticipantName}</span>
                      </span>
                      <span className="text-[10px] text-slate-500">{proto.akaClub}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1.5 truncate">
                        <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                        <span className="truncate">{proto.aoParticipantName}</span>
                      </span>
                      <span className="text-[10px] text-slate-500">{proto.aoClub}</span>
                    </div>
                  </div>

                  {/* Result & Decision Summary */}
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-900 border border-slate-850 font-mono text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[11px]">Счёт встречи:</span>
                      <span className="font-bold text-white">{proto.scoreSummary}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[11px]">Победитель:</span>
                      <span className="font-bold text-emerald-400 truncate max-w-[170px]">
                        {proto.winnerName}
                      </span>
                    </div>
                  </div>

                  {/* Officiating Crew */}
                  <div className="mt-3 text-[11px] font-mono text-slate-400 space-y-0.5">
                    <div>Сусин (Рефери): <strong className="text-slate-300">{proto.shushinRefereeName}</strong></div>
                    <div>Канса (Арбитр): <strong className="text-slate-300">{proto.kansaArbitratorName}</strong></div>
                  </div>

                  {/* VR and Protest Badges */}
                  <div className="mt-3 flex items-center gap-2 text-[10px] font-mono">
                    {proto.videoReviewUsed && (
                      <span className="px-2 py-0.5 bg-sky-950 text-sky-400 border border-sky-800 rounded font-bold">
                        VR Просмотр
                      </span>
                    )}
                    {proto.protestFiled ? (
                      <span className="px-2 py-0.5 bg-amber-950 text-amber-400 border border-amber-800 rounded font-bold">
                        Протест ({proto.protestStatus})
                      </span>
                    ) : (
                      <span className="text-slate-600">Без протестов</span>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-850 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500 text-[10px]">Подписан в {proto.certifiedAt}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleExportProtocolTxt(proto)}
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 flex items-center gap-1 text-[11px]"
                      title="Скачать бланк протокола"
                    >
                      <Download className="w-3 h-3 text-rose-400" />
                      <span>Бланк</span>
                    </button>
                    <button
                      onClick={() => onNavigateToScoreboard(proto.boutId)}
                      className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1 text-[11px]"
                    >
                      <span>Табло</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CLUBS & ACCREDITATION VIEW (Раздельный учет клубов и турниров)         */}
      {/* ========================================================================= */}
      {activeView === 'clubs' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
            <span className="text-slate-300">
              Таблица связки <code className="text-rose-400">tournament_clubs</code> (M:N) · Раздельный учёт участия клубов в турнире <strong>{activeTournament.title}</strong>
            </span>
            <span className="text-slate-400">
              Всего заявлено: <strong className="text-white">{tournamentClubs.length} клубов</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournamentClubs.map((tc) => {
              const fullClub = clubs.find((c) => c.id === tc.clubId);
              return (
                <div
                  key={tc.id}
                  className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold text-xs font-mono">
                      {fullClub?.shortCode || 'ДОДЗЁ'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      tc.status === 'accredited'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : tc.status === 'verified'
                        ? 'bg-sky-950 text-sky-400 border border-sky-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}>
                      {tc.status === 'accredited' ? 'Аккредитован' : tc.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-white truncate">
                      {tc.clubName || fullClub?.name}
                    </h4>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      {fullClub?.city} · {fullClub?.region}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-850 space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Руководитель делегации:</span>
                      <span className="text-slate-300 font-bold">{tc.teamLeaderName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Заявлено / Допущено:</span>
                      <span className="text-white font-bold">
                        {tc.athletesDeclaredCount} / {tc.athletesAdmittedCount} атлетов
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Стартовый взнос:</span>
                      <span className="text-emerald-400 font-bold">
                        {tc.feePaid ? '✓ Оплачен' : '✓ Подтверждён'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-850 flex items-center justify-between text-xs font-mono text-slate-400">
                    <span className="text-[10px]">Регистрация: {tc.registeredAt}</span>
                    <button
                      onClick={() => {
                        setSelectedClubId(tc.clubId);
                        setActiveView('participants');
                      }}
                      className="text-rose-400 hover:text-rose-300 text-[11px] font-bold"
                    >
                      Состав команды →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. PARTICIPANTS LIST VIEW (Участники с фильтром по турниру и дисциплине)   */}
      {/* ========================================================================= */}
      {activeView === 'participants' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Поиск по имени или клубу..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <select
                value={selectedClubId}
                onChange={(e) => setSelectedClubId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
              >
                <option value="all">Все клубы турнира</option>
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-xs font-mono text-slate-400">
              Показано спортсменов: <strong className="text-white">{filteredParticipants.length}</strong>
            </span>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Спортсмен</th>
                    <th className="px-5 py-3.5">Клуб / Додзё</th>
                    <th className="px-5 py-3.5">Квалификация</th>
                    <th className="px-5 py-3.5 text-center">Вес (заявка / факт)</th>
                    <th className="px-5 py-3.5 text-center">Взвешивание</th>
                    <th className="px-5 py-3.5 text-center">Мед. допуск</th>
                    <th className="px-5 py-3.5 text-right">Лицензия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {filteredParticipants.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-white">
                        <div>{p.lastName} {p.firstName}</div>
                        <div className="text-[10px] text-slate-500 font-normal">
                          {p.gender === 'male' ? 'Мужской' : 'Женский'} · ДР: {p.birthDate}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-300">{p.clubName}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                          {p.beltRank.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center text-slate-300">
                        {p.declaredWeightKg} кг / {p.actualWeightKg ? `${p.actualWeightKg} кг` : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.isWeighedIn
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {p.isWeighedIn ? 'Пройдено' : 'Ожидает'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.isMedicalCleared
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}>
                          {p.isMedicalCleared ? 'Допущен' : 'Не допущен'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-slate-400">
                        {p.licenseNumber}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. BOUT RESULTS VIEW                                                      */}
      {/* ========================================================================= */}
      {activeView === 'results' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300">
              Поединки в турнире <strong>{activeTournament.title}</strong> · Дисциплина: <strong>{selectedDiscipline.toUpperCase()}</strong>
            </span>
            <button
              onClick={onNavigateToBracket}
              className="text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1"
            >
              <span>Открыть дерево сетки</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBouts.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">Бой #{b.boutNumber}</span>
                    <span>·</span>
                    <span>Т{b.tatamiNumber || 1}</span>
                    <span>·</span>
                    <span>{b.roundStage.toUpperCase()}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    b.status === 'completed'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : b.status === 'in_progress'
                      ? 'bg-rose-950 text-rose-400 border border-rose-800 animate-pulse'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}>
                    {b.status}
                  </span>
                </div>

                <div className="text-xs text-slate-300 font-bold truncate">
                  {b.categoryName}
                </div>

                <div className="space-y-1.5 font-mono text-xs">
                  <div className="p-2 rounded bg-slate-900 flex items-center justify-between">
                    <span className="flex items-center gap-2 truncate">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      <span className="truncate">{b.akaParticipant?.lastName} {b.akaParticipant?.firstName}</span>
                      <span className="text-[10px] text-slate-500">({b.akaParticipant?.clubName})</span>
                    </span>
                    <span className="font-bold text-rose-400 tabular-nums">
                      {b.discipline === 'kata' ? b.akaKataScore || b.akaScore : b.akaScore}
                    </span>
                  </div>

                  <div className="p-2 rounded bg-slate-900 flex items-center justify-between">
                    <span className="flex items-center gap-2 truncate">
                      <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                      <span className="truncate">{b.aoParticipant?.lastName} {b.aoParticipant?.firstName}</span>
                      <span className="text-[10px] text-slate-500">({b.aoParticipant?.clubName})</span>
                    </span>
                    <span className="font-bold text-sky-400 tabular-nums">
                      {b.discipline === 'kata' ? b.aoKataScore || b.aoScore : b.aoScore}
                    </span>
                  </div>
                </div>

                {b.winnerId && (
                  <div className="pt-2 border-t border-slate-850 flex items-center justify-between text-[11px] font-mono text-emerald-400">
                    <span>Победитель: {b.winnerId === b.akaParticipantId ? 'АКА' : 'АО'} ({b.winReason})</span>
                    <button
                      onClick={() => onNavigateToScoreboard(b.id)}
                      className="text-slate-400 hover:text-white underline text-[10px]"
                    >
                      Табло →
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. KATA EVALUATION PANEL (Судейские оценки Ката 5-7 судей WKF)            */}
      {/* ========================================================================= */}
      {activeView === 'kata' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400 flex items-center gap-2">
                <Award className="w-4 h-4" />
                <span>Судейская система оценивания Ката (WKF / SKIF Ката)</span>
              </span>
              <span className="text-slate-400">Таблица <code>kata_scores</code></span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Коллегия из 7 судей выставляет баллы от 5.0 до 10.0. Две крайние оценки (минимальная и максимальная) 
              отбрасываются. Оставшиеся 5 оценок умножаются на коэффициенты: Технический уровень (70%) + Атлетический уровень (30%).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kataEvaluations.map((ke) => (
              <div
                key={ke.id}
                className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 transition-all shadow-md space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded bg-amber-950/80 text-amber-300 border border-amber-800 text-xs font-mono font-bold">
                    Ката: {ke.kataName}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    Ранг: #{ke.rank}
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-white">{ke.participantName}</h4>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">{ke.clubName}</div>
                </div>

                {/* 7 Judge Scores Strip with Dropped Min/Max Indicators */}
                <div className="space-y-1.5 font-mono">
                  <div className="text-[11px] text-slate-400 flex justify-between">
                    <span>Оценки судей (7 арбитров):</span>
                    <span className="text-slate-500 text-[10px]">Крайние (min/max) отброшены</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
                    {ke.judgeScores.map((score, idx) => {
                      const isMin = score === ke.trimmedMinScore;
                      const isMax = score === ke.trimmedMaxScore;
                      const isDropped = isMin || isMax;
                      return (
                        <div
                          key={idx}
                          className={`p-1.5 rounded-lg border ${
                            isDropped
                              ? 'bg-slate-900 border-slate-800 text-slate-600 line-through'
                              : 'bg-slate-900 border-amber-500/40 text-amber-300 font-bold'
                          }`}
                        >
                          <span className="text-[9px] text-slate-500 block">J{idx + 1}</span>
                          <span>{score.toFixed(1)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Formula breakdown */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-850 grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Техника (70%)</span>
                    <span className="font-bold text-slate-200 mt-0.5 block">{ke.technicalScore}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Атлетизм (30%)</span>
                    <span className="font-bold text-slate-200 mt-0.5 block">{ke.athleticScore}</span>
                  </div>
                  <div>
                    <span className="text-amber-400 text-[10px] block font-bold">Итоговый балл</span>
                    <span className="font-black text-amber-400 text-base mt-0.5 block">{ke.totalScore}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
