import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Building2, 
  UserCheck, 
  Plus, 
  Trash2, 
  FileCheck2, 
  Upload, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Trophy, 
  Search, 
  Filter, 
  Sparkles, 
  Printer, 
  Copy, 
  Check, 
  FileText, 
  Calendar, 
  MapPin, 
  ArrowRight,
  ExternalLink,
  Layers,
  ChevronRight,
  RefreshCw,
  Zap,
  Clock,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { 
  Club, 
  Participant, 
  Tournament, 
  TournamentCategory, 
  AgeCategory, 
  WeightCategory, 
  Gender, 
  BeltRank, 
  Discipline 
} from '../types/schema';

interface CoachPortalModuleProps {
  clubs: Club[];
  tournaments: Tournament[];
  selectedTournament: Tournament;
  onSelectTournament: (t: Tournament) => void;
  tournamentCategories: TournamentCategory[];
  ageCategories: AgeCategory[];
  weightCategories: WeightCategory[];
  existingParticipants: Participant[];
  onBatchRegisterAthletes: (newAthletes: Participant[]) => void;
  onNavigateToBracket: () => void;
  onNavigateToScoreboard: () => void;
}

interface TeamAthleteRow {
  tempId: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  birthDate: string;
  declaredWeightKg: number;
  beltRank: BeltRank;
  categoryId: string;
  disciplines: Discipline[];
  licenseNumber: string;
  hasMedicalCertificate: boolean;
  hasInsurance: boolean;
  hasParentalConsent: boolean;
  isRegistered: boolean;
}

interface TeamDocument {
  id: string;
  title: string;
  requiredFor: string;
  fileName?: string;
  fileSize?: string;
  uploadedAt?: string;
  status: 'missing' | 'pending_verification' | 'approved' | 'rejected';
  rejectionReason?: string;
}

export const CoachPortalModule: React.FC<CoachPortalModuleProps> = ({
  clubs,
  tournaments,
  selectedTournament,
  onSelectTournament,
  tournamentCategories,
  ageCategories,
  weightCategories,
  existingParticipants,
  onBatchRegisterAthletes,
  onNavigateToBracket,
  onNavigateToScoreboard
}) => {
  // Active Club / Coach Selection
  const [selectedClubId, setSelectedClubId] = useState<string>(clubs[0]?.id || 'c1');
  const currentClub = useMemo(() => clubs.find(c => c.id === selectedClubId) || clubs[0], [clubs, selectedClubId]);

  // Active Sub-tab inside Coach Portal
  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'documents' | 'accounting' | 'submission'>('roster');

  // Search & Filters in Roster
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<'all' | Gender>('all');
  const [selectedAthletes, setSelectedAthletes] = useState<Set<string>>(new Set());

  // Mass Paste / Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importStatusToast, setImportStatusToast] = useState<string | null>(null);

  // New Athlete Quick Add Row State
  const [newRow, setNewRow] = useState<Partial<TeamAthleteRow>>({
    firstName: '',
    lastName: '',
    gender: 'male',
    birthDate: '2010-05-15',
    declaredWeightKg: 52,
    beltRank: 'green_6kyu',
    disciplines: ['kumite'],
    hasMedicalCertificate: true,
    hasInsurance: true,
    hasParentalConsent: true
  });

  // Team Roster State for this Club
  const [teamRoster, setTeamRoster] = useState<TeamAthleteRow[]>([
    {
      tempId: 'tm_1',
      firstName: 'Даниил',
      lastName: 'Романов',
      gender: 'male',
      birthDate: '2011-04-12',
      declaredWeightKg: 48.5,
      beltRank: 'blue_4kyu',
      categoryId: 'tc3',
      disciplines: ['kumite'],
      licenseNumber: 'RUS-FKR-2026-901',
      hasMedicalCertificate: true,
      hasInsurance: true,
      hasParentalConsent: true,
      isRegistered: true
    },
    {
      tempId: 'tm_2',
      firstName: 'Екатерина',
      lastName: 'Смирнова',
      gender: 'female',
      birthDate: '2010-08-25',
      declaredWeightKg: 47.0,
      beltRank: 'brown_3kyu',
      categoryId: 'tc3',
      disciplines: ['kumite', 'kata'],
      licenseNumber: 'RUS-FKR-2026-902',
      hasMedicalCertificate: true,
      hasInsurance: true,
      hasParentalConsent: true,
      isRegistered: true
    },
    {
      tempId: 'tm_3',
      firstName: 'Арсений',
      lastName: 'Белов',
      gender: 'male',
      birthDate: '2009-12-03',
      declaredWeightKg: 57.2,
      beltRank: 'brown_1kyu',
      categoryId: 'tc3',
      disciplines: ['kumite'],
      licenseNumber: 'RUS-FKR-2026-903',
      hasMedicalCertificate: true,
      hasInsurance: true,
      hasParentalConsent: true,
      isRegistered: false
    },
    {
      tempId: 'tm_4',
      firstName: 'Виктория',
      lastName: 'Морозова',
      gender: 'female',
      birthDate: '2011-02-18',
      declaredWeightKg: 54.0,
      beltRank: 'green_6kyu',
      categoryId: 'tc2',
      disciplines: ['kata'],
      licenseNumber: 'RUS-FKR-2026-904',
      hasMedicalCertificate: true,
      hasInsurance: true,
      hasParentalConsent: true,
      isRegistered: false
    }
  ]);

  // Team Documents State
  const [documents, setDocuments] = useState<TeamDocument[]>([
    {
      id: 'doc_1',
      title: 'Официальная командная заявка (Форма №1 с печатью)',
      requiredFor: 'Допуск всей команды клубов к мандатной комиссии',
      fileName: 'Zayavka_Samurai_WKF_2026.pdf',
      fileSize: '2.4 МБ',
      uploadedAt: 'Сегодня, 10:14',
      status: 'approved'
    },
    {
      id: 'doc_2',
      title: 'Медицинское заключение диспансера (ВФД / Справка-допуск)',
      requiredFor: 'Отметка врача напротив каждого спортсмена',
      fileName: 'VFD_Dispanser_Dopusk_Nov2026.pdf',
      fileSize: '5.1 МБ',
      uploadedAt: 'Сегодня, 10:18',
      status: 'approved'
    },
    {
      id: 'doc_3',
      title: 'Коллективный договор страхования от несчастных случаев',
      requiredFor: 'Покрытие риска травм на дни соревнований (не менее 100 000 ₽)',
      fileName: 'Strakhovka_Team_SOGAZ_2026.pdf',
      fileSize: '1.8 МБ',
      uploadedAt: 'Вчера, 16:40',
      status: 'approved'
    },
    {
      id: 'doc_4',
      title: 'Пакет согласий родителей на несовершеннолетних',
      requiredFor: 'Участники до 18 лет (согласие на участие и медицинское вмешательство)',
      fileName: 'Soglasiya_Parents_Samurai.zip',
      fileSize: '14.2 МБ',
      uploadedAt: 'Вчера, 17:05',
      status: 'pending_verification'
    },
    {
      id: 'doc_5',
      title: 'Будо-паспорта и сертификаты квалификации (Кю/Дан)',
      requiredFor: 'Проверка стилевой квалификации и членства в федерации',
      status: 'missing'
    }
  ]);

  // Helper: Auto-recommend category based on age and weight
  const findMatchingCategory = (birthDate: string, weightKg: number, gender: Gender): TournamentCategory | undefined => {
    if (!birthDate) return tournamentCategories[0];
    const birthYear = new Date(birthDate).getFullYear();
    const currentYear = 2026;
    const age = currentYear - birthYear;

    return tournamentCategories.find((cat) => {
      if (cat.gender !== gender && cat.gender !== 'mixed') return false;
      const ageCat = ageCategories.find(a => a.id === cat.ageCategoryId);
      if (!ageCat) return false;
      if (age < ageCat.minAge) return false;
      if (ageCat.maxAge && age > ageCat.maxAge) return false;
      return true;
    }) || tournamentCategories[0];
  };

  // KPI Calculations
  const totalAthletes = teamRoster.length;
  const readyAthletes = teamRoster.filter(a => a.hasMedicalCertificate && a.hasInsurance && a.hasParentalConsent && a.categoryId).length;
  const approvedDocsCount = documents.filter(d => d.status === 'approved').length;
  const entryFeePerStart = 3500; // 3 500 ₽ per category start
  const totalStartsCount = teamRoster.reduce((acc, a) => acc + (a.disciplines.length || 1), 0);
  const totalTeamFee = totalStartsCount * entryFeePerStart;

  // Add Single Athlete Row
  const handleAddAthleteRow = () => {
    if (!newRow.firstName?.trim() || !newRow.lastName?.trim()) {
      alert('Пожалуйста, укажите имя и фамилию спортсмена.');
      return;
    }

    const matchedCat = findMatchingCategory(newRow.birthDate || '2010-01-01', newRow.declaredWeightKg || 50, newRow.gender || 'male');

    const newAthlete: TeamAthleteRow = {
      tempId: 'tm_' + Date.now(),
      firstName: newRow.firstName.trim(),
      lastName: newRow.lastName.trim(),
      gender: newRow.gender || 'male',
      birthDate: newRow.birthDate || '2010-01-01',
      declaredWeightKg: Number(newRow.declaredWeightKg) || 50,
      beltRank: (newRow.beltRank as BeltRank) || 'green_6kyu',
      categoryId: newRow.categoryId || matchedCat?.id || tournamentCategories[0]?.id || 'tc1',
      disciplines: newRow.disciplines || ['kumite'],
      licenseNumber: `RUS-FKR-2026-${Math.floor(100 + Math.random() * 900)}`,
      hasMedicalCertificate: true,
      hasInsurance: true,
      hasParentalConsent: true,
      isRegistered: false
    };

    setTeamRoster(prev => [newAthlete, ...prev]);
    setNewRow({
      firstName: '',
      lastName: '',
      gender: 'male',
      birthDate: '2010-05-15',
      declaredWeightKg: 52,
      beltRank: 'green_6kyu',
      disciplines: ['kumite'],
      hasMedicalCertificate: true,
      hasInsurance: true,
      hasParentalConsent: true
    });

    setImportStatusToast(`✓ Спортсмен ${newAthlete.firstName} ${newAthlete.lastName} добавлен в заявку команды`);
    setTimeout(() => setImportStatusToast(null), 4000);
  };

  // Mass Paste Import
  const handleProcessImport = () => {
    if (!importText.trim()) return;

    const lines = importText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const parsedRows: TeamAthleteRow[] = [];

    lines.forEach((line, idx) => {
      // Formats: "Иванов Иван, 2011-05-12, 45, male" or "Иванов Иван"
      const parts = line.split(/[,;\t]/).map(p => p.trim());
      const fullName = parts[0] || `Атлет ${idx + 1}`;
      const nameParts = fullName.split(' ');
      const lastName = nameParts[0] || 'Фамилия';
      const firstName = nameParts.slice(1).join(' ') || 'Имя';
      const birthDate = parts[1] && /^\d{4}-\d{2}-\d{2}$/.test(parts[1]) ? parts[1] : '2010-05-15';
      const weight = parseFloat(parts[2]) || 50;
      const gender: Gender = parts[3]?.toLowerCase().startsWith('f') || parts[3]?.toLowerCase().startsWith('ж') ? 'female' : 'male';

      const matchedCat = findMatchingCategory(birthDate, weight, gender);

      parsedRows.push({
        tempId: 'batch_' + Date.now() + '_' + idx,
        firstName,
        lastName,
        gender,
        birthDate,
        declaredWeightKg: weight,
        beltRank: 'green_6kyu',
        categoryId: matchedCat?.id || tournamentCategories[0]?.id || 'tc1',
        disciplines: ['kumite'],
        licenseNumber: `RUS-FKR-2026-${Math.floor(100 + Math.random() * 900)}`,
        hasMedicalCertificate: true,
        hasInsurance: true,
        hasParentalConsent: true,
        isRegistered: false
      });
    });

    if (parsedRows.length > 0) {
      setTeamRoster(prev => [...parsedRows, ...prev]);
      setIsImportModalOpen(false);
      setImportText('');
      setImportStatusToast(`✓ Успешно импортировано ${parsedRows.length} спортсменов из списка`);
      setTimeout(() => setImportStatusToast(null), 5000);
    }
  };

  // Insert Sample Batch Roster for Quick Demo
  const handleInsertSampleBatch = () => {
    setImportText(`Васильев Максим, 2011-03-14, 45, male
Семенова Алина, 2010-07-22, 52, female
Куликов Артем, 2009-11-09, 58, male
Тихонова Дарья, 2012-01-30, 40, female
Григорьев Кирилл, 2008-09-18, 65, male
Федорова Полина, 2011-12-05, 48, female`);
  };

  // Batch Select Toggle
  const toggleSelectAll = () => {
    if (selectedAthletes.size === filteredRoster.length) {
      setSelectedAthletes(new Set());
    } else {
      setSelectedAthletes(new Set(filteredRoster.map(a => a.tempId)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedAthletes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Batch Delete
  const handleBatchDelete = () => {
    if (selectedAthletes.size === 0) return;
    if (confirm(`Удалить ${selectedAthletes.size} выбранных спортсменов из заявки команды?`)) {
      setTeamRoster(prev => prev.filter(a => !selectedAthletes.has(a.tempId)));
      setSelectedAthletes(new Set());
      setImportStatusToast('✓ Выбранные спортсмены удалены из заявки');
      setTimeout(() => setImportStatusToast(null), 3000);
    }
  };

  // Batch Assign Category
  const handleBatchAssignCategory = (catId: string) => {
    setTeamRoster(prev => prev.map(a => {
      if (selectedAthletes.has(a.tempId)) {
        return { ...a, categoryId: catId };
      }
      return a;
    }));
    setImportStatusToast(`✓ Категория обновлена для ${selectedAthletes.size} спортсменов`);
    setTimeout(() => setImportStatusToast(null), 3000);
  };

  // Batch Assign Discipline
  const handleBatchAssignDiscipline = (disc: Discipline) => {
    setTeamRoster(prev => prev.map(a => {
      if (selectedAthletes.has(a.tempId)) {
        const has = a.disciplines.includes(disc);
        const updated = has ? a.disciplines.filter(d => d !== disc) : [...a.disciplines, disc];
        return { ...a, disciplines: updated.length > 0 ? updated : ['kumite'] };
      }
      return a;
    }));
  };

  // Submit Entire Team Roster to Tournament Database
  const handleSubmitTeamRoster = () => {
    if (teamRoster.length === 0) {
      alert('В командной заявке нет участников для регистрации.');
      return;
    }

    // Convert TeamAthleteRow to Participant
    const newParticipants: Participant[] = teamRoster.map((row, idx) => ({
      id: `p_${Date.now()}_${idx}`,
      tournamentId: selectedTournament.id,
      clubId: currentClub.id,
      clubName: currentClub.name,
      city: currentClub.city,
      country: 'Россия',
      categoryId: row.categoryId,
      firstName: row.firstName,
      lastName: row.lastName,
      gender: row.gender,
      birthDate: row.birthDate,
      beltRank: row.beltRank,
      declaredWeightKg: row.declaredWeightKg,
      actualWeightKg: row.declaredWeightKg,
      isWeighedIn: true,
      isMedicalCleared: row.hasMedicalCertificate,
      status: 'registered',
      licenseNumber: row.licenseNumber
    }));

    onBatchRegisterAthletes(newParticipants);

    // Mark all as registered in local state
    setTeamRoster(prev => prev.map(a => ({ ...a, isRegistered: true })));

    setImportStatusToast(`🎉 Командная заявка клуба «${currentClub.name}» (${newParticipants.length} атлетов) успешно отправлена в мандатную комиссию и занесена в базу данных!`);
    setTimeout(() => setImportStatusToast(null), 7000);
  };

  // Simulate Document Upload
  const handleUploadDocument = (docId: string) => {
    setDocuments(prev => prev.map(d => {
      if (d.id === docId) {
        return {
          ...d,
          fileName: `Doc_${currentClub.shortCode}_${d.id}.pdf`,
          fileSize: '3.2 МБ',
          uploadedAt: 'Только что',
          status: 'pending_verification'
        };
      }
      return d;
    }));
    setImportStatusToast('✓ Документ успешно загружен и передан на верификацию в ГСК');
    setTimeout(() => setImportStatusToast(null), 4000);
  };

  // Print Official Team Protocol
  const handlePrintRoster = () => {
    window.print();
  };

  // Filtered Roster
  const filteredRoster = useMemo(() => {
    return teamRoster.filter(a => {
      const matchSearch = 
        `${a.firstName} ${a.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchGender = selectedGenderFilter === 'all' || a.gender === selectedGenderFilter;
      return matchSearch && matchGender;
    });
  }, [teamRoster, searchQuery, selectedGenderFilter]);

  return (
    <div className="space-y-6 animate-fadeIn font-sans w-full min-w-0">
      
      {/* Toast Notification */}
      {importStatusToast && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between text-xs sm:text-sm font-semibold animate-fadeIn border border-emerald-400/40">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
            <span>{importStatusToast}</span>
          </div>
          <button 
            onClick={() => setImportStatusToast(null)}
            className="text-emerald-200 hover:text-white ml-3 text-xs bg-emerald-800/60 px-2 py-0.5 rounded"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================
          COACH PORTAL HEADER & CONTEXT BAR
         ======================================================== */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            
            {/* Coach & Club Identity */}
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-purple-950/40 shrink-0 font-black text-xl">
                🥊
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800 uppercase tracking-wider">
                    ЛИЧНЫЙ КАБИНЕТ ТРЕНЕРА
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Лицензия ФКР/WKF активна
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                  {currentClub.headCoachName}
                </h1>

                <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3 mt-1">
                  <span className="text-purple-300 font-bold">{currentClub.name}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {currentClub.city}, {currentClub.region}
                  </span>
                  <span>·</span>
                  <span>Тел: {currentClub.contactPhone}</span>
                </div>
              </div>
            </div>

            {/* Club & Tournament Selector */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Club Switcher */}
              <div className="bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400 px-2 pb-1">Клуб / Додзё:</div>
                <select
                  value={selectedClubId}
                  onChange={(e) => setSelectedClubId(e.target.value)}
                  className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 outline-none cursor-pointer"
                >
                  {clubs.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.city})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tournament Switcher */}
              <div className="bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400 px-2 pb-1">Целевой турнир:</div>
                <select
                  value={selectedTournament.id}
                  onChange={(e) => {
                    const found = tournaments.find(t => t.id === e.target.value);
                    if (found) onSelectTournament(found);
                  }}
                  className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 outline-none cursor-pointer max-w-[220px] truncate"
                >
                  {tournaments.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* KPI Dashboard Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="text-slate-400 flex items-center justify-between">
                <span>Заявлено в команду:</span>
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-black text-white mt-1">{totalAthletes} <span className="text-xs font-normal text-slate-400">бойцов</span></div>
              <div className="text-[11px] text-blue-400 mt-1">Все возрастные дивизионы</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="text-slate-400 flex items-center justify-between">
                <span>Готовы к допуску:</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400 mt-1">{readyAthletes} <span className="text-xs font-normal text-slate-400">из {totalAthletes}</span></div>
              <div className="text-[11px] text-slate-400 mt-1">Врач + страховка подтверждены</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="text-slate-400 flex items-center justify-between">
                <span>Документы команды:</span>
                <FileCheck2 className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-purple-300 mt-1">{approvedDocsCount} <span className="text-xs font-normal text-slate-400">из {documents.length}</span></div>
              <div className="text-[11px] text-slate-400 mt-1">Одобрено секретариатом</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="text-slate-400 flex items-center justify-between">
                <span>Сумма взносов:</span>
                <Trophy className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400 mt-1">{totalTeamFee.toLocaleString('ru-RU')} ₽</div>
              <div className="text-[11px] text-slate-400 mt-1">{totalStartsCount} стартов × 3 500 ₽</div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          INTERNAL SUB-TABS NAVIGATION
         ======================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveSubTab('roster')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'roster'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Состав команды списком ({teamRoster.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('documents')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'documents'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Комплект документов команды ({approvedDocsCount}/{documents.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('submission')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'submission'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Мандатная комиссия и печать</span>
          </button>
        </div>

        {/* Global Action: Submit to DB */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSubmitTeamRoster}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition-all flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Подать командную заявку ({teamRoster.length})</span>
          </button>

          <button
            onClick={handlePrintRoster}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
            title="Печать официальной формы заявки"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================
          TAB 1: TEAM ROSTER & BATCH REGISTRATION
         ======================================================== */}
      {activeSubTab === 'roster' && (
        <div className="space-y-6">
          
          {/* Action Toolbar: Mass Import, Quick Add, Filters */}
          <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            
            {/* Left Tools */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-white border border-purple-500/40 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Upload className="w-4 h-4 text-purple-400" />
                <span>Массовый импорт списком (Excel / Текст)</span>
              </button>

              {/* Batch Actions Bar (when athletes selected) */}
              {selectedAthletes.size > 0 && (
                <div className="flex items-center gap-2 pl-3 border-l border-slate-700 animate-fadeIn">
                  <span className="text-xs font-mono text-blue-400 font-bold">
                    Выбрано: {selectedAthletes.size}
                  </span>

                  <select
                    onChange={(e) => {
                      if (e.target.value) handleBatchAssignCategory(e.target.value);
                    }}
                    className="bg-slate-950 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 outline-none"
                    defaultValue=""
                  >
                    <option value="" disabled>Назначить категорию...</option>
                    {tournamentCategories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name || `${c.discipline} (${c.gender === 'male' ? 'М' : 'Ж'})`}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => handleBatchAssignDiscipline('kumite')}
                    className="px-2 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700"
                    title="Включить Кумитэ для выбранных"
                  >
                    + Кумитэ
                  </button>

                  <button
                    onClick={() => handleBatchAssignDiscipline('kata')}
                    className="px-2 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700"
                    title="Включить Ката для выбранных"
                  >
                    + Ката
                  </button>

                  <button
                    onClick={handleBatchDelete}
                    className="p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800"
                    title="Удалить выбранных из заявки"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Right Filters */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по ФИО или лицензии..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white outline-none"
                />
              </div>

              <select
                value={selectedGenderFilter}
                onChange={(e) => setSelectedGenderFilter(e.target.value as any)}
                className="bg-slate-950 text-slate-300 border border-slate-800 rounded-xl px-3 py-1.5 text-xs outline-none cursor-pointer"
              >
                <option value="all">Все полы</option>
                <option value="male">Юноши / Мужчины</option>
                <option value="female">Девушки / Женщины</option>
              </select>
            </div>
          </div>

          {/* Quick Add Form Row (Быстрое добавление одного бойца) */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                Быстрое добавление спортсмена в состав команды
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Категория подберется автоматически по возрасту и весу
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Фамилия</label>
                <input
                  type="text"
                  value={newRow.lastName || ''}
                  onChange={(e) => setNewRow(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Иванов"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Имя</label>
                <input
                  type="text"
                  value={newRow.firstName || ''}
                  onChange={(e) => setNewRow(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Алексей"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Пол</label>
                <select
                  value={newRow.gender || 'male'}
                  onChange={(e) => setNewRow(prev => ({ ...prev, gender: e.target.value as Gender }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
                >
                  <option value="male">Мужской</option>
                  <option value="female">Женский</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Дата рождения</label>
                <input
                  type="date"
                  value={newRow.birthDate || '2010-05-15'}
                  onChange={(e) => setNewRow(prev => ({ ...prev, birthDate: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Вес (кг)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newRow.declaredWeightKg || 50}
                  onChange={(e) => setNewRow(prev => ({ ...prev, declaredWeightKg: parseFloat(e.target.value) }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Квалификация (Пояс)</label>
                <select
                  value={newRow.beltRank || 'green_6kyu'}
                  onChange={(e) => setNewRow(prev => ({ ...prev, beltRank: e.target.value as BeltRank }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
                >
                  <option value="white_10kyu">10-9 кю (Белый)</option>
                  <option value="yellow_8kyu">8 кю (Желтый)</option>
                  <option value="orange_7kyu">7 кю (Оранжевый)</option>
                  <option value="green_6kyu">6-5 кю (Зеленый)</option>
                  <option value="blue_4kyu">4 кю (Синий)</option>
                  <option value="brown_3kyu">3-2 кю (Коричневый)</option>
                  <option value="brown_1kyu">1 кю (Коричневый)</option>
                  <option value="black_1dan">1 Дан (Черный)</option>
                  <option value="black_2dan">2 Дан (Черный)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleAddAthleteRow}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-900/40 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Добавить</span>
                </button>
              </div>
            </div>
          </div>

          {/* Athletes Roster Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedAthletes.size > 0 && selectedAthletes.size === filteredRoster.length}
                        onChange={toggleSelectAll}
                        className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="p-3">Спортсмен</th>
                    <th className="p-3">Пол / Возраст</th>
                    <th className="p-3">Вес (кг)</th>
                    <th className="p-3">Пояс / Разряд</th>
                    <th className="p-3">Дивизион / Категория</th>
                    <th className="p-3">Дисциплины</th>
                    <th className="p-3 text-center">Допуск</th>
                    <th className="p-3 text-center">Статус</th>
                    <th className="p-3 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredRoster.map((athlete) => {
                    const isSelected = selectedAthletes.has(athlete.tempId);
                    const birthYear = new Date(athlete.birthDate).getFullYear();
                    const age = 2026 - birthYear;
                    const category = tournamentCategories.find(c => c.id === athlete.categoryId) || tournamentCategories[0];

                    return (
                      <tr 
                        key={athlete.tempId}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          isSelected ? 'bg-blue-950/20' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(athlete.tempId)}
                            className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                          />
                        </td>

                        {/* Name & License */}
                        <td className="p-3">
                          <div className="font-bold text-white text-sm">
                            {athlete.lastName} {athlete.firstName}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {athlete.licenseNumber}
                          </div>
                        </td>

                        {/* Gender & Age */}
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 font-medium text-slate-300">
                            <span>{athlete.gender === 'male' ? 'М' : 'Ж'}</span>
                            <span>·</span>
                            <span>{age} лет</span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {athlete.birthDate}
                          </div>
                        </td>

                        {/* Declared Weight */}
                        <td className="p-3 font-mono font-bold text-white">
                          {athlete.declaredWeightKg} кг
                        </td>

                        {/* Belt Rank */}
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            {athlete.beltRank.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>

                        {/* Tournament Category Dropdown */}
                        <td className="p-3">
                          <select
                            value={athlete.categoryId}
                            onChange={(e) => {
                              const newCatId = e.target.value;
                              setTeamRoster(prev => prev.map(a => a.tempId === athlete.tempId ? { ...a, categoryId: newCatId } : a));
                            }}
                            className="bg-slate-950 text-slate-200 border border-slate-800 hover:border-slate-700 text-xs rounded-xl px-2.5 py-1.5 outline-none max-w-[200px] truncate"
                          >
                            {tournamentCategories.map(cat => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name || `${cat.discipline} (${cat.gender === 'male' ? 'Юноши' : 'Девушки'})`}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Disciplines Chips */}
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                const has = athlete.disciplines.includes('kumite');
                                const updated: Discipline[] = has 
                                  ? athlete.disciplines.filter(d => d !== 'kumite') 
                                  : [...athlete.disciplines, 'kumite'];
                                setTeamRoster(prev => prev.map(a => a.tempId === athlete.tempId ? { ...a, disciplines: updated.length ? updated : ['kumite'] } : a));
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                                athlete.disciplines.includes('kumite')
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                  : 'bg-slate-950 text-slate-400 border border-slate-800 opacity-60'
                              }`}
                            >
                              Кумитэ
                            </button>

                            <button
                              onClick={() => {
                                const has = athlete.disciplines.includes('kata');
                                const updated: Discipline[] = has 
                                  ? athlete.disciplines.filter(d => d !== 'kata') 
                                  : [...athlete.disciplines, 'kata'];
                                setTeamRoster(prev => prev.map(a => a.tempId === athlete.tempId ? { ...a, disciplines: updated.length ? updated : ['kata'] } : a));
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                                athlete.disciplines.includes('kata')
                                  ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                  : 'bg-slate-950 text-slate-400 border border-slate-800 opacity-60'
                              }`}
                            >
                              Ката
                            </button>
                          </div>
                        </td>

                        {/* Medical & Insurance Clearance */}
                        <td className="p-3 text-center">
                          <div className="inline-flex items-center gap-1 text-[11px] font-mono">
                            <span 
                              title="Врачебно-физкультурный допуск" 
                              className={`w-5 h-5 rounded flex items-center justify-center ${
                                athlete.hasMedicalCertificate ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400'
                              }`}
                            >
                              🏥
                            </span>
                            <span 
                              title="Страховка от травм" 
                              className={`w-5 h-5 rounded flex items-center justify-center ${
                                athlete.hasInsurance ? 'bg-blue-950 text-blue-400 border border-blue-800' : 'bg-rose-950 text-rose-400'
                              }`}
                            >
                              🛡️
                            </span>
                          </div>
                        </td>

                        {/* Registration State */}
                        <td className="p-3 text-center">
                          {athlete.isRegistered ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center justify-center gap-1">
                              <Check className="w-3 h-3" /> В базе БД
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-800 flex items-center justify-center gap-1">
                              Черновик
                            </span>
                          )}
                        </td>

                        {/* Delete action */}
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              if (confirm(`Удалить ${athlete.lastName} ${athlete.firstName} из списка команды?`)) {
                                setTeamRoster(prev => prev.filter(a => a.tempId !== athlete.tempId));
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Удалить из заявки"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredRoster.length === 0 && (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Users className="w-8 h-8 mx-auto text-slate-600" />
                <div className="font-bold text-slate-300">В заявке пока нет спортсменов</div>
                <div className="text-xs text-slate-400">Используйте форму быстрого добавления выше или массовый импорт списком.</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: TEAM DOCUMENTS (ВФД, СТРАХОВКИ, СОГЛАСИЯ)
         ======================================================== */}
      {activeSubTab === 'documents' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-purple-400" />
                  Пакет документов команды для мандатной комиссии
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Загрузите коллективные документы команды клуба «{currentClub.name}» в электронном виде для прохождения онлайн-проверки ГСК.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-purple-950 text-purple-300 border border-purple-800 text-xs font-mono font-bold">
                  {approvedDocsCount} из {documents.length} подтверждено
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {documents.map((doc) => {
                const isApproved = doc.status === 'approved';
                const isPending = doc.status === 'pending_verification';
                const isMissing = doc.status === 'missing';

                return (
                  <div
                    key={doc.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isApproved 
                        ? 'bg-slate-950/80 border-emerald-900/40 shadow-sm shadow-emerald-950/20'
                        : isPending
                        ? 'bg-slate-950/80 border-purple-900/40'
                        : 'bg-slate-950/40 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isApproved ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}>
                          <FileText className="w-5 h-5" />
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-white leading-snug">
                            {doc.title}
                          </h4>
                          <p className="text-xs text-slate-400 mt-1">
                            {doc.requiredFor}
                          </p>

                          {doc.fileName && (
                            <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-purple-300 bg-purple-950/40 px-2.5 py-1 rounded-lg border border-purple-900/40 w-fit">
                              <span>📄 {doc.fileName}</span>
                              <span>({doc.fileSize})</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {isApproved && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Одобрен ГСК
                          </span>
                        )}
                        {isPending && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-700 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> На проверке
                          </span>
                        )}
                        {isMissing && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Ожидает
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-900 text-xs">
                      <div className="text-[10px] font-mono text-slate-400">
                        {doc.uploadedAt ? `Загружен: ${doc.uploadedAt}` : 'Файл еще не прикреплен'}
                      </div>

                      <div className="flex items-center gap-2">
                        {doc.fileName ? (
                          <button
                            onClick={() => alert(`Просмотр документа «${doc.fileName}». Файл доступен в системе.`)}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Просмотр</span>
                          </button>
                        ) : null}

                        <button
                          onClick={() => handleUploadDocument(doc.id)}
                          className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-900/40 flex items-center gap-1 cursor-pointer"
                        >
                          <Upload className="w-3 h-3" />
                          <span>{doc.fileName ? 'Заменить файл' : 'Загрузить файл'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: MANDATE SUBMISSION & OFFICIAL FORM EXPORT
         ======================================================== */}
      {activeSubTab === 'submission' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Готовность командной заявки к подаче в секретариат
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Проверьте соблюдение требований регламента соревнований перед отправкой итогового пакета.
                </p>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-400">Статус команды:</div>
                <div className="text-sm font-bold text-emerald-400">Допуск разрешен</div>
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white">Список атлетов укомплектован</div>
                    <div className="text-[11px] text-slate-400">{teamRoster.length} спортсменов занесены с категориями и весом</div>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">ВЫПОЛНЕНО</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white">Медицинский допуск ВФД</div>
                    <div className="text-[11px] text-slate-400">Справка-допуск загружена с печатью главного врача</div>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">ПОДТВЕРЖДЕНО</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white">Коллективная спортивная страховка</div>
                    <div className="text-[11px] text-slate-400">Полис действителен на все дни соревнований WKF</div>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">ПОДТВЕРЖДЕНО</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white">Согласия родителей на несовершеннолетних</div>
                    <div className="text-[11px] text-slate-400">Пакет документов передан на верификацию в ГСК</div>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-purple-400">ПРОВЕРКА ГСК</span>
              </div>
            </div>

            {/* Submission CTA Block */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-950 to-blue-950/60 border border-emerald-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-white">
                  Отправка заявки клуба «{currentClub.name}»
                </div>
                <div className="text-xs text-slate-300 mt-1 max-w-xl">
                  При нажатии все {teamRoster.length} спортсменов мгновенно регистрируются в реляционной базе данных турнира и автоматически распределяются в алгоритм умной жеребьевки WKF.
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={handlePrintRoster}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Печать Формы №1</span>
                </button>

                <button
                  onClick={handleSubmitTeamRoster}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-xl shadow-emerald-950/50 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Подать в комиссию</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MASS IMPORT MODAL (PASTE EXCEL / TEXT ROSTER)
         ======================================================== */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Upload className="w-4 h-4 text-purple-400" />
                  Массовый импорт списка спортсменов команды
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Скопируйте и вставьте список из Excel, Google Таблиц или текстового файла.
                </p>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Формат: Фамилия Имя, ГГГГ-ММ-ДД, Вес (кг), Пол (male/female)</span>
                <button
                  onClick={handleInsertSampleBatch}
                  className="text-purple-400 hover:text-purple-300 font-bold underline cursor-pointer"
                >
                  Вставить тестовый пример (6 атлетов)
                </button>
              </div>

              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={8}
                placeholder="Смирнов Артем, 2011-04-12, 48.5, male&#10;Кузнецова София, 2010-08-25, 47.0, female&#10;Попов Денис, 2009-12-03, 57.2, male"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-white placeholder-slate-600 outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                Категории подберутся автоматически по регламенту WKF 2026.
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold"
                >
                  Отмена
                </button>
                <button
                  onClick={handleProcessImport}
                  disabled={!importText.trim()}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-purple-900/40 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Импортировать в заявку</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
