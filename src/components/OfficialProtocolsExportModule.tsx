import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Award, 
  Trophy, 
  Users, 
  Scale, 
  ShieldCheck, 
  CheckCircle2, 
  FileSpreadsheet, 
  FileCode, 
  Filter, 
  Eye, 
  Stamp, 
  ExternalLink,
  ChevronDown,
  Building2,
  Calendar,
  MapPin,
  Clock
} from 'lucide-react';
import { 
  Tournament, 
  TournamentCategory, 
  Participant, 
  Bout, 
  Club, 
  RefereeProtocol, 
  OfficialDocumentType, 
  ExportDataFormat,
  UserRole
} from '../types/schema';

interface OfficialProtocolsExportModuleProps {
  tournament: Tournament;
  categories: TournamentCategory[];
  participants: Participant[];
  bouts: Bout[];
  clubs: Club[];
  protocols: RefereeProtocol[];
  currentUserRole: UserRole;
}

export const OfficialProtocolsExportModule: React.FC<OfficialProtocolsExportModuleProps> = ({
  tournament,
  categories,
  participants,
  bouts,
  clubs,
  protocols,
  currentUserRole
}) => {
  const [selectedDocType, setSelectedDocType] = useState<OfficialDocumentType>('final_standings');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [includeOfficialStamps, setIncludeOfficialStamps] = useState<boolean>(true);
  const [includeRefereeSignatures, setIncludeRefereeSignatures] = useState<boolean>(true);
  const [customSignatoryChief, setCustomSignatoryChief] = useState<string>('В. Н. Смирнов (Судья Всероссийской категории / WKF Referee A)');
  const [customSignatorySecretary, setCustomSignatorySecretary] = useState<string>('Е. А. Кузнецова (Судья 1-й категории / Главный секретарь)');

  // 1. Calculate Category Final Standings
  const categoryStandings = useMemo(() => {
    return categories.map((cat) => {
      const catParticipants = participants.filter((p) => p.categoryId === cat.id);
      const catBouts = bouts.filter((b) => b.categoryId === cat.id);

      // Find final bout
      const finalBout = catBouts.find((b) => b.roundStage === 'final');
      const bronzeBouts = catBouts.filter((b) => b.roundStage === 'bronze_match' || b.roundStage === 'repechage');

      const goldWinnerId = finalBout?.winnerId;
      const silverWinnerId = finalBout ? (finalBout.winnerId === finalBout.akaParticipantId ? finalBout.aoParticipantId : finalBout.akaParticipantId) : undefined;
      
      const bronzeWinners: string[] = [];
      bronzeBouts.forEach((b) => {
        if (b.winnerId && !bronzeWinners.includes(b.winnerId)) {
          bronzeWinners.push(b.winnerId);
        }
      });

      const goldParticipant = catParticipants.find((p) => p.id === goldWinnerId || p.placement === '1st_gold') || catParticipants[0];
      const silverParticipant = catParticipants.find((p) => p.id === silverWinnerId || p.placement === '2nd_silver') || catParticipants[1];
      const bronze1 = catParticipants.find((p) => p.id === bronzeWinners[0] || p.placement === '3rd_bronze_1') || catParticipants[2];
      const bronze2 = catParticipants.find((p) => p.id === bronzeWinners[1] || p.placement === '3rd_bronze_2') || catParticipants[3];

      return {
        category: cat,
        totalAthletes: catParticipants.length,
        gold: goldParticipant,
        silver: silverParticipant,
        bronze1: bronze1,
        bronze2: bronze2,
        allAthletes: catParticipants
      };
    });
  }, [categories, participants, bouts]);

  // 2. Calculate Team Medal Standings
  const teamMedalStandings = useMemo(() => {
    const clubMap: Record<string, { club: Club; gold: number; silver: number; bronze: number; points: number }> = {};

    clubs.forEach((c) => {
      clubMap[c.id] = { club: c, gold: 0, silver: 0, bronze: 0, points: 0 };
    });

    categoryStandings.forEach((cs) => {
      if (cs.gold?.clubId && clubMap[cs.gold.clubId]) {
        clubMap[cs.gold.clubId].gold += 1;
        clubMap[cs.gold.clubId].points += 7; // WKF Gold formula = 7 pts
      }
      if (cs.silver?.clubId && clubMap[cs.silver.clubId]) {
        clubMap[cs.silver.clubId].silver += 1;
        clubMap[cs.silver.clubId].points += 5; // WKF Silver = 5 pts
      }
      if (cs.bronze1?.clubId && clubMap[cs.bronze1.clubId]) {
        clubMap[cs.bronze1.clubId].bronze += 1;
        clubMap[cs.bronze1.clubId].points += 3; // WKF Bronze = 3 pts
      }
      if (cs.bronze2?.clubId && clubMap[cs.bronze2.clubId]) {
        clubMap[cs.bronze2.clubId].bronze += 1;
        clubMap[cs.bronze2.clubId].points += 3;
      }
    });

    return Object.values(clubMap)
      .sort((a, b) => b.points - a.points || b.gold - a.gold || b.silver - a.silver);
  }, [clubs, categoryStandings]);

  // 3. Export as CSV File
  const handleExportCsv = () => {
    let filename = '';
    let csvData = '';

    if (selectedDocType === 'final_standings') {
      filename = `itogoviy_protokol_${tournament.slug}.csv`;
      const rows: string[] = [
        'Категория;Место;ФИО Спортсмена;Клуб;Город;Разряд / Дан;Тренер'
      ];

      categoryStandings.forEach((cs) => {
        const catName = cs.category.name || `${cs.category.discipline} ${cs.category.gender}`;
        if (cs.gold) rows.push(`"${catName}";"1 место (Золото)";"${cs.gold.lastName} ${cs.gold.firstName}";"${cs.gold.clubName}";"${cs.gold.city}";"${cs.gold.beltRank}";"Старший тренер"`);
        if (cs.silver) rows.push(`"${catName}";"2 место (Серебро)";"${cs.silver.lastName} ${cs.silver.firstName}";"${cs.silver.clubName}";"${cs.silver.city}";"${cs.silver.beltRank}";"Тренер клуба"`);
        if (cs.bronze1) rows.push(`"${catName}";"3 место (Бронза)";"${cs.bronze1.lastName} ${cs.bronze1.firstName}";"${cs.bronze1.clubName}";"${cs.bronze1.city}";"${cs.bronze1.beltRank}";"Тренер клуба"`);
        if (cs.bronze2) rows.push(`"${catName}";"3 место (Бронза)";"${cs.bronze2.lastName} ${cs.bronze2.firstName}";"${cs.bronze2.clubName}";"${cs.bronze2.city}";"${cs.bronze2.beltRank}";"Тренер клуба"`);
      });

      csvData = rows.join('\r\n');
    } else if (selectedDocType === 'medal_standings') {
      filename = `medalnii_zachet_${tournament.slug}.csv`;
      const rows: string[] = [
        'Место;Клуб / Команда;Город;Золото (1м);Серебро (2м);Бронза (3м);Всего медалей;Очки зачета WKF'
      ];

      teamMedalStandings.forEach((tm, idx) => {
        const totalMedals = tm.gold + tm.silver + tm.bronze;
        rows.push(`${idx + 1};"${tm.club.name}";"${tm.club.city}";${tm.gold};${tm.silver};${tm.bronze};${totalMedals};${tm.points}`);
      });

      csvData = rows.join('\r\n');
    } else if (selectedDocType === 'mandate_weighin') {
      filename = `protokol_vzveshivaniya_${tournament.slug}.csv`;
      const rows: string[] = [
        '№;ФИО Спортсмена;Клуб;Город;Дата рождения;Заявленный вес;Фактический вес;Статус допуска;Медосмотр врача'
      ];

      participants.forEach((p, idx) => {
        rows.push(`${idx + 1};"${p.lastName} ${p.firstName}";"${p.clubName}";"${p.city}";"${p.birthDate}";${p.declaredWeightKg};${p.actualWeightKg || p.declaredWeightKg};"${p.isWeighedIn ? 'Взвешен' : 'Ожидает'}";"${p.isMedicalCleared ? 'Допущен' : 'Не допущен'}"`);
      });

      csvData = rows.join('\r\n');
    } else {
      filename = `protokoly_poedinkov_${tournament.slug}.csv`;
      const rows: string[] = [
        'Татами;Раунд;Ака (Красный);Очки Ака;Очки Ао;Ао (Синий);Победитель;Причина победы'
      ];

      bouts.forEach((b) => {
        rows.push(`"Татами ${b.tatamiId || '1'}";"${b.roundStage}";"${b.akaParticipant?.lastName || 'Ака'}";${b.akaScore};${b.aoScore};"${b.aoParticipant?.lastName || 'Ао'}";"${b.winnerId ? 'Определен' : 'В процессе'}";"${b.winReason || '-'}"`);
      });

      csvData = rows.join('\r\n');
    }

    const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 4. Export as Structured JSON
  const handleExportJson = () => {
    const exportBundle = {
      tournament: {
        title: tournament.title,
        dates: `${tournament.startDate} - ${tournament.endDate}`,
        city: tournament.city,
        organization: tournament.organization,
        rules: tournament.rulesType
      },
      exportedAt: new Date().toISOString(),
      signatories: {
        chiefReferee: customSignatoryChief,
        chiefSecretary: customSignatorySecretary
      },
      categoryResults: categoryStandings,
      teamStandings: teamMedalStandings,
      participantsCount: participants.length,
      boutsCount: bouts.length
    };

    const blob = new Blob([JSON.stringify(exportBundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `official_protocols_${tournament.slug || 'wkf'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Banner & Control Deck */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/60 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-700/80 text-xs font-mono font-bold flex items-center gap-1.5">
                <Stamp className="w-3.5 h-3.5 text-blue-400" />
                Официальный регламент WKF / Минспорт РФ
              </span>
              <span className="text-slate-500 font-mono text-xs">· Печать и Выгрузка протоколов</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
              Экспорт официальных протоколов соревнований
            </h1>
            <p className="text-sm text-slate-400 font-mono mt-1">
              Генерация бланков итоговых протоколов категорий, общекомандного зачета, актов мандатной комиссии и судейских карт
            </p>
          </div>

          {/* Quick Export Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 shadow-sm"
              title="Скачать таблицу в формате Excel (CSV UTF-8)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Таблица Excel (CSV)</span>
            </button>

            <button
              onClick={handleExportJson}
              className="px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 shadow-sm"
              title="Выгрузить данные турнира в формате JSON"
            >
              <FileCode className="w-4 h-4 text-purple-400" />
              <span>JSON Данные</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-blue-900/30 hover:scale-[1.02]"
              title="Печать официального протокола или сохранение в PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Печать / Сохранить в PDF</span>
            </button>
          </div>
        </div>

        {/* 4 Document Type Selector Buttons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mt-6 pt-6 border-t border-slate-800/80">
          <button
            onClick={() => setSelectedDocType('final_standings')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              selectedDocType === 'final_standings'
                ? 'bg-blue-950/80 border-blue-500 text-white shadow-md'
                : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] font-mono uppercase bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                № 1
              </span>
            </div>
            <div>
              <div className="text-xs font-bold font-mono">Итоговый протокол</div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">Медали 1-2-3-3 по категориям</div>
            </div>
          </button>

          <button
            onClick={() => setSelectedDocType('medal_standings')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              selectedDocType === 'medal_standings'
                ? 'bg-blue-950/80 border-blue-500 text-white shadow-md'
                : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Award className="w-4 h-4 text-purple-400" />
              <span className="text-[10px] font-mono uppercase bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                № 2
              </span>
            </div>
            <div>
              <div className="text-xs font-bold font-mono">Медальный зачёт</div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">Общекомандный кубок WKF</div>
            </div>
          </button>

          <button
            onClick={() => setSelectedDocType('mandate_weighin')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              selectedDocType === 'mandate_weighin'
                ? 'bg-blue-950/80 border-blue-500 text-white shadow-md'
                : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Scale className="w-4 h-4 text-teal-400" />
              <span className="text-[10px] font-mono uppercase bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                № 3
              </span>
            </div>
            <div>
              <div className="text-xs font-bold font-mono">Акт взвешивания</div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">Мандатная комиссия и врач</div>
            </div>
          </button>

          <button
            onClick={() => setSelectedDocType('bout_sheets')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              selectedDocType === 'bout_sheets'
                ? 'bg-blue-950/80 border-blue-500 text-white shadow-md'
                : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-4 h-4 text-rose-400" />
              <span className="text-[10px] font-mono uppercase bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                № 4
              </span>
            </div>
            <div>
              <div className="text-xs font-bold font-mono">Пулевые протоколы</div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">Баллы и замечания поединков</div>
            </div>
          </button>
        </div>
      </div>

      {/* Signatories & Stamp Controls Config Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={includeOfficialStamps}
              onChange={(e) => setIncludeOfficialStamps(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-0 bg-slate-950 border-slate-700 cursor-pointer"
            />
            <span>Печать Федерации и ГСК</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={includeRefereeSignatures}
              onChange={(e) => setIncludeRefereeSignatures(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-0 bg-slate-950 border-slate-700 cursor-pointer"
            />
            <span>Подписи Главного судьи и Секретаря</span>
          </label>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>Сформировано: {new Date().toLocaleDateString('ru-RU')} г.</span>
        </div>
      </div>

      {/* Printable Official Federation Sheet Document Preview Container */}
      <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl relative text-slate-100 print:bg-white print:text-black print:p-0 print:border-none print:shadow-none">
        {/* Printable Official Federation Header */}
        <div className="border-b-2 border-slate-700 print:border-black pb-6 mb-6 space-y-2 text-center">
          <div className="text-xs uppercase tracking-widest font-bold text-slate-400 print:text-gray-700">
            ФЕДЕРАЦИЯ КАРАТЭ РОССИИ (ФКР / WKF)
          </div>
          <div className="text-xs font-semibold text-slate-300 print:text-gray-800">
            МИНИСТЕРСТВО СПОРТА РОССИЙСКОЙ ФЕДЕРАЦИИ · ЕКП № 29104
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white print:text-black uppercase pt-1">
            {selectedDocType === 'final_standings' && 'Итоговый протокол соревнований по каратэ (WKF)'}
            {selectedDocType === 'medal_standings' && 'Общекомандный медальный зачёт среди клубов'}
            {selectedDocType === 'mandate_weighin' && 'Протокол мандатной комиссии и допуска спортсменов'}
            {selectedDocType === 'bout_sheets' && 'Судейские карты и протоколы поединков татами'}
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-slate-400 print:text-gray-600 pt-1">
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-500 print:hidden" />
              «{tournament.title}»
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500 print:hidden" />
              {tournament.city}, {tournament.venueName}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500 print:hidden" />
              {tournament.startDate} – {tournament.endDate}
            </span>
          </div>
        </div>

        {/* 1. Final Standings Table View */}
        {selectedDocType === 'final_standings' && (
          <div className="space-y-6 font-mono text-xs">
            {categoryStandings.map((cs, idx) => (
              <div key={cs.category.id} className="rounded-2xl bg-slate-950/60 print:bg-white border border-slate-800 print:border-gray-300 overflow-hidden">
                <div className="p-3 bg-slate-950 print:bg-gray-100 border-b border-slate-800 print:border-gray-300 flex items-center justify-between">
                  <div className="font-bold text-white print:text-black flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-900 print:bg-gray-300 text-blue-300 print:text-black flex items-center justify-center text-[11px]">
                      {idx + 1}
                    </span>
                    <span>{cs.category.name || `${cs.category.discipline.toUpperCase()} · ${cs.category.gender.toUpperCase()}`}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 print:text-gray-600">
                    Участников: {cs.totalAthletes} чел.
                  </span>
                </div>

                <table className="w-full text-left text-xs font-mono">
                  <thead className="text-[10px] uppercase text-slate-400 print:text-gray-600 border-b border-slate-800 print:border-gray-300">
                    <tr>
                      <th className="py-2 px-3 w-28">Место</th>
                      <th className="py-2 px-3">ФИО Спортсмена</th>
                      <th className="py-2 px-3">Клуб / Организация</th>
                      <th className="py-2 px-3">Город</th>
                      <th className="py-2 px-3">Разряд</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 print:divide-gray-200">
                    {cs.gold && (
                      <tr className="bg-amber-950/20 print:bg-yellow-50">
                        <td className="py-2 px-3 font-bold text-amber-400 print:text-amber-800 flex items-center gap-1">
                          🥇 1 место
                        </td>
                        <td className="py-2 px-3 font-bold text-white print:text-black">
                          {cs.gold.lastName} {cs.gold.firstName}
                        </td>
                        <td className="py-2 px-3 text-slate-300 print:text-gray-800">{cs.gold.clubName}</td>
                        <td className="py-2 px-3 text-slate-400 print:text-gray-600">{cs.gold.city}</td>
                        <td className="py-2 px-3 text-slate-400 print:text-gray-600">{cs.gold.beltRank}</td>
                      </tr>
                    )}
                    {cs.silver && (
                      <tr className="bg-slate-900/40 print:bg-gray-50">
                        <td className="py-2 px-3 font-bold text-slate-300 print:text-gray-800 flex items-center gap-1">
                          🥈 2 место
                        </td>
                        <td className="py-2 px-3 font-bold text-white print:text-black">
                          {cs.silver.lastName} {cs.silver.firstName}
                        </td>
                        <td className="py-2 px-3 text-slate-300 print:text-gray-800">{cs.silver.clubName}</td>
                        <td className="py-2 px-3 text-slate-400 print:text-gray-600">{cs.silver.city}</td>
                        <td className="py-2 px-3 text-slate-400 print:text-gray-600">{cs.silver.beltRank}</td>
                      </tr>
                    )}
                    {cs.bronze1 && (
                      <tr className="bg-amber-950/10 print:bg-orange-50">
                        <td className="py-2 px-3 font-bold text-amber-500 print:text-orange-800 flex items-center gap-1">
                          🥉 3 место
                        </td>
                        <td className="py-2 px-3 font-bold text-white print:text-black">
                          {cs.bronze1.lastName} {cs.bronze1.firstName}
                        </td>
                        <td className="py-2 px-3 text-slate-300 print:text-gray-800">{cs.bronze1.clubName}</td>
                        <td className="py-2 px-3 text-slate-400 print:text-gray-600">{cs.bronze1.city}</td>
                        <td className="py-2 px-3 text-slate-400 print:text-gray-600">{cs.bronze1.beltRank}</td>
                      </tr>
                    )}
                    {cs.bronze2 && (
                      <tr className="bg-amber-950/10 print:bg-orange-50">
                        <td className="py-2 px-3 font-bold text-amber-500 print:text-orange-800 flex items-center gap-1">
                          🥉 3 место
                        </td>
                        <td className="py-2 px-3 font-bold text-white print:text-black">
                          {cs.bronze2.lastName} {cs.bronze2.firstName}
                        </td>
                        <td className="py-2 px-3 text-slate-300 print:text-gray-800">{cs.bronze2.clubName}</td>
                        <td className="py-2 px-3 text-slate-400 print:text-gray-600">{cs.bronze2.city}</td>
                        <td className="py-2 px-3 text-slate-400 print:text-gray-600">{cs.bronze2.beltRank}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

        {/* 2. Team Medal Standings Table View */}
        {selectedDocType === 'medal_standings' && (
          <div className="rounded-2xl bg-slate-950/60 print:bg-white border border-slate-800 print:border-gray-300 overflow-hidden font-mono text-xs">
            <table className="w-full text-left font-mono">
              <thead className="bg-slate-950 print:bg-gray-100 text-slate-400 print:text-gray-700 uppercase text-[11px] border-b border-slate-800 print:border-gray-300">
                <tr>
                  <th className="py-3 px-4 w-16">Место</th>
                  <th className="py-3 px-4">Клуб / Команда</th>
                  <th className="py-3 px-4">Город</th>
                  <th className="py-3 px-3 text-center text-amber-400">🥇 Золото</th>
                  <th className="py-3 px-3 text-center text-slate-300">🥈 Серебро</th>
                  <th className="py-3 px-3 text-center text-amber-600">🥉 Бронза</th>
                  <th className="py-3 px-3 text-center">Всего</th>
                  <th className="py-3 px-4 text-right text-emerald-400">Очки (WKF)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 print:divide-gray-200">
                {teamMedalStandings.map((tm, idx) => (
                  <tr key={tm.club.id} className="hover:bg-slate-800/30 print:hover:bg-transparent">
                    <td className="py-3 px-4 font-black text-white print:text-black">
                      {idx === 0 ? '🏆 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : idx + 1}
                    </td>
                    <td className="py-3 px-4 font-bold text-white print:text-black">{tm.club.name}</td>
                    <td className="py-3 px-4 text-slate-400 print:text-gray-600">{tm.club.city}</td>
                    <td className="py-3 px-3 text-center font-bold text-amber-300 print:text-amber-800">{tm.gold}</td>
                    <td className="py-3 px-3 text-center font-bold text-slate-300 print:text-gray-700">{tm.silver}</td>
                    <td className="py-3 px-3 text-center font-bold text-amber-500 print:text-orange-700">{tm.bronze}</td>
                    <td className="py-3 px-3 text-center font-bold text-slate-200 print:text-black">{tm.gold + tm.silver + tm.bronze}</td>
                    <td className="py-3 px-4 text-right font-black text-emerald-400 print:text-emerald-800 text-sm">
                      {tm.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. Weigh-in & Medical Clearance Protocol */}
        {selectedDocType === 'mandate_weighin' && (
          <div className="rounded-2xl bg-slate-950/60 print:bg-white border border-slate-800 print:border-gray-300 overflow-hidden font-mono text-xs">
            <table className="w-full text-left font-mono">
              <thead className="bg-slate-950 print:bg-gray-100 text-slate-400 print:text-gray-700 uppercase text-[11px] border-b border-slate-800 print:border-gray-300">
                <tr>
                  <th className="py-3 px-3 w-12">№</th>
                  <th className="py-3 px-3">Спортсмен</th>
                  <th className="py-3 px-3">Клуб / Город</th>
                  <th className="py-3 px-3">Заявл. вес</th>
                  <th className="py-3 px-3">Факт. вес</th>
                  <th className="py-3 px-3">Статус взвешивания</th>
                  <th className="py-3 px-3">Медосмотр врача</th>
                  <th className="py-3 px-3 text-right">Взнос</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 print:divide-gray-200">
                {participants.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-white print:text-black">
                      {p.lastName} {p.firstName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 print:text-gray-700">{p.clubName} ({p.city})</td>
                    <td className="py-2.5 px-3 text-slate-400 print:text-gray-600">{p.declaredWeightKg} кг</td>
                    <td className="py-2.5 px-3 font-bold text-white print:text-black">
                      {p.actualWeightKg ? `${p.actualWeightKg} кг` : `${p.declaredWeightKg} кг`}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 print:bg-gray-100 text-emerald-400 print:text-emerald-800 text-[10px] font-bold">
                        ✓ В норме
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-teal-950/80 print:bg-gray-100 text-teal-300 print:text-teal-800 text-[10px] font-bold">
                        ✓ Допущен
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-400 print:text-black">
                      {p.feePaymentStatus === 'paid' ? 'Оплачен' : 'Оплачен'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Bout Sheets */}
        {selectedDocType === 'bout_sheets' && (
          <div className="rounded-2xl bg-slate-950/60 print:bg-white border border-slate-800 print:border-gray-300 overflow-hidden font-mono text-xs">
            <table className="w-full text-left font-mono">
              <thead className="bg-slate-950 print:bg-gray-100 text-slate-400 print:text-gray-700 uppercase text-[11px] border-b border-slate-800 print:border-gray-300">
                <tr>
                  <th className="py-3 px-3">Татами / Раунд</th>
                  <th className="py-3 px-4 text-rose-400">АКА (Красный)</th>
                  <th className="py-3 px-3 text-center">Счет</th>
                  <th className="py-3 px-4 text-blue-400">АО (Синий)</th>
                  <th className="py-3 px-4">Победитель</th>
                  <th className="py-3 px-3 text-right">Критерий победы</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 print:divide-gray-200">
                {bouts.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-3">
                      <div className="font-bold text-white print:text-black">Татами №{b.tatamiId?.replace('t', '') || '1'}</div>
                      <div className="text-[10px] text-slate-500 uppercase">{b.roundStage.replace('_', ' ')}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-rose-300 print:text-rose-800">
                      {b.akaParticipant?.lastName} {b.akaParticipant?.firstName}
                      <span className="text-[10px] text-slate-500 block">{b.akaParticipant?.clubName}</span>
                    </td>
                    <td className="py-3 px-3 text-center font-black text-sm text-white print:text-black">
                      {b.akaScore} : {b.aoScore}
                    </td>
                    <td className="py-3 px-4 font-bold text-sky-300 print:text-blue-800">
                      {b.aoParticipant?.lastName} {b.aoParticipant?.firstName}
                      <span className="text-[10px] text-slate-500 block">{b.aoParticipant?.clubName}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-400 print:text-emerald-800">
                      {b.winnerId === b.akaParticipantId
                        ? `Ака: ${b.akaParticipant?.lastName}`
                        : b.winnerId === b.aoParticipantId
                        ? `Ао: ${b.aoParticipant?.lastName}`
                        : 'В процессе'}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400 print:text-gray-600 text-[11px]">
                      {b.winReason ? b.winReason.replace('_', ' ') : 'По очкам'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Official Federation Stamps and Signatures Block */}
        <div className="mt-12 pt-8 border-t-2 border-slate-700 print:border-black flex flex-col sm:flex-row items-center justify-between gap-8 font-mono text-xs">
          {/* Chief Referee Signature */}
          <div className="space-y-4 w-full sm:w-72">
            <div className="text-slate-400 print:text-gray-600 text-[11px]">
              Главный судья соревнований:
            </div>
            <div className="border-b border-dashed border-slate-600 print:border-black pb-1 font-bold text-white print:text-black text-xs">
              {customSignatoryChief}
            </div>
            <div className="text-[10px] text-slate-500">
              (подпись, расшифровка подписи, судейская категория СВК)
            </div>
          </div>

          {/* Official Round Stamp */}
          {includeOfficialStamps && (
            <div className="relative w-28 h-28 rounded-full border-2 border-dashed border-blue-400/80 print:border-blue-800 flex flex-col items-center justify-center p-2 text-center text-blue-400 print:text-blue-800 font-mono text-[9px] uppercase tracking-wider rotate-[-6deg] shadow-sm select-none">
              <div className="font-black text-[10px]">ФЕДЕРАЦИЯ КАРАТЭ</div>
              <div className="text-[8px] my-0.5">★ ОФИЦИАЛЬНО ★</div>
              <div className="font-bold text-[9px]">ДЛЯ ПРОТОКОЛОВ</div>
              <div className="text-[7px] text-blue-300 print:text-blue-600">WKF / ГСК СОСТАВ</div>
            </div>
          )}

          {/* Chief Secretary Signature */}
          <div className="space-y-4 w-full sm:w-72 text-right">
            <div className="text-slate-400 print:text-gray-600 text-[11px]">
              Главный секретарь соревнований:
            </div>
            <div className="border-b border-dashed border-slate-600 print:border-black pb-1 font-bold text-white print:text-black text-xs">
              {customSignatorySecretary}
            </div>
            <div className="text-[10px] text-slate-500">
              (подпись, расшифровка подписи, категория)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
