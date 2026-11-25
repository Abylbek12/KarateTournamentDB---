import React, { useState } from 'react';
import { NumberField } from './NumberField';
import { 
  Users, 
  Search, 
  Filter, 
  Scale, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  AlertTriangle,
  UserCheck,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { Participant, Club, BeltRank, EventCategory, Tournament } from '../types/schema';
import { belongsToEvent } from '../data/sampleTournamentData';
import { useApp } from '../context/AppContext';
import { placeName, countryLabel } from '../utils/eventI18n';
import { categoryName, weighInFits, findCategoryForWeight, beltName, beltLabel, hasWeightClasses } from '../utils/eventCategories';
import { SAMPLE_PARTICIPANTS, SAMPLE_CLUBS } from '../data/sampleTournamentData';

interface ParticipantsManagerProps {
  participants: Participant[];
  onUpdateParticipant: (updated: Participant) => void;
  onNavigateToRegister?: () => void;
  tournaments?: Tournament[];
  categories?: EventCategory[];
  defaultTournamentId?: string;
  /** The tournament is chosen in the common «Турнир» bar at the top; hide this screen's own picker. */
  hidePicker?: boolean;
}

export const ParticipantsManager: React.FC<ParticipantsManagerProps> = ({
  participants,
  onUpdateParticipant,
  onNavigateToRegister,
  tournaments = [],
  categories = [],
  defaultTournamentId,
  hidePicker
}) => {
  const [tournamentId, setTournamentId] = useState(defaultTournamentId || tournaments[0]?.id || '');
  const { language } = useApp();
  const tl = (ru: string, ky: string, en: string) => (language === 'ky' ? ky : language === 'en' ? en : ru);
  const inTournament = participants.filter((p) => p.status !== 'withdrawn' && (!tournamentId || belongsToEvent(p.tournamentId, tournamentId)));
  const catOf = (p: Participant) => categories.find((c) => c.id === p.categoryId);
  const flagged = inTournament.filter((p) => p.eligibilityNote);
  const [search, setSearch] = useState('');
  const [selectedClub, setSelectedClub] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Weigh-in modal state
  const [weighInAthlete, setWeighInAthlete] = useState<Participant | null>(null);
  const [actualWeightInput, setActualWeightInput] = useState<number>(0);
  const [weighError, setWeighError] = useState('');
  const [medicalClearedInput, setMedicalClearedInput] = useState<boolean>(true);

  // One row per child: entries in kata and kumite are the same person (one weigh-in for all)
  const personKey = (p: Participant) => (p.teamName ? p.id : `${p.tournamentId}|${p.lastName}|${p.firstName}|${p.birthDate}`);
  const entriesOf = new Map<string, Participant[]>();
  for (const p of inTournament) entriesOf.set(personKey(p), [...(entriesOf.get(personKey(p)) || []), p]);
  const people = [...entriesOf.values()].map((list) => list[0]);
  const clubOptions = [...new Map(inTournament.map((p) => [p.clubId, p.clubName || p.clubId] as const)).entries()].sort((a, b) => String(a[1]).localeCompare(String(b[1])));
  const filtered = people.filter((p) => {
    const matchesSearch = search === '' || 
      `${p.lastName} ${p.firstName}`.toLowerCase().includes(search.toLowerCase()) ||
      p.licenseNumber.toLowerCase().includes(search.toLowerCase());
    const matchesClub = selectedClub === 'all' || p.clubId === selectedClub;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'weighed' && p.isWeighedIn) ||
      (statusFilter === 'pending' && !p.isWeighedIn);
    return matchesSearch && matchesClub && matchesStatus;
  });

  // ---------- Bulk approval: the filtered (or ticked) athletes become «weighed in, admitted» in one click ----------
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [bulkAsk, setBulkAsk] = useState(false);
  const [bulkMsg, setBulkMsg] = useState('');
  const pendingShown = filtered.filter((p) => !p.isWeighedIn);
  const pickedPending = pendingShown.filter((p) => picked.has(personKey(p)));
  const bulkTargets = pickedPending.length ? pickedPending : pendingShown;
  const togglePick = (p: Participant) =>
    setPicked((prev) => {
      const next = new Set(prev);
      const k = personKey(p);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  const allPicked = pendingShown.length > 0 && pendingShown.every((p) => picked.has(personKey(p)));
  const approveBulk = () => {
    let done = 0;
    const noWeight: string[] = [];
    let wrongWeight = 0;
    for (const person of bulkTargets) {
      const records = entriesOf.get(personKey(person)) || [person];
      // The weight from the entry is taken as the weigh-in weight
      const known = person.actualWeightKg || person.declaredWeightKg;
      const kg = known && known > 0 ? known : null;
      const needsWeight = records.some((r) => {
        const c = catOf(r);
        return !!c && hasWeightClasses(c) && (c.weightMin != null || c.weightMax != null);
      });
      // A weight category without any weight cannot be checked: left for the usual weigh-in
      if (kg == null && needsWeight) {
        noWeight.push(`${person.lastName} ${person.firstName}`);
        continue;
      }
      for (const r of records) {
        const cat = catOf(r);
        const fits = weighInFits(cat, kg);
        if (!fits) wrongWeight++;
        onUpdateParticipant({
          ...r,
          actualWeightKg: kg,
          isWeighedIn: true,
          isMedicalCleared: true,
          status: 'weighed_in',
          eligibilityNote: fits || !cat ? undefined : `${tl('Вес', 'Салмак', 'Weight')} ${kg} ${tl('кг не подходит для', 'кг ылайык келбейт:', 'kg does not fit')} «${categoryName(cat)}»`
        });
      }
      done++;
    }
    setPicked(new Set());
    setBulkAsk(false);
    setBulkMsg(
      `${tl('Допущены и взвешены', 'Уруксат берилди жана таразаланды', 'Weighed in and admitted')}: ${done}.` +
        (noWeight.length ? ` ${tl('Без веса в весовой категории (взвесьте вручную)', 'Салмак категориясында салмагы жок (кол менен таразалаңыз)', 'No weight in a weight category (weigh by hand)')}: ${noWeight.join(', ')}.` : '') +
        (wrongWeight ? ` ${tl('Вес не подходит к категории — смотрите блок «Не прошли по весу»', 'Салмак категорияга туура келбейт — «Салмагы туура келген жок» блогун караңыз', 'Weight does not fit — see «Failed the weigh-in»')}: ${wrongWeight}.` : '')
    );
  };

  const handleOpenWeighIn = (p: Participant) => {
    setWeighInAthlete(p);
    setActualWeightInput(p.actualWeightKg || p.declaredWeightKg || 0);
    setWeighError('');
    setMedicalClearedInput(p.isWeighedIn ? p.isMedicalCleared : true);
  };

  const handleSaveWeighIn = () => {
    if (!weighInAthlete) return;
    const a = weighInAthlete;
    // One child, several entries (kata + kumite): one weigh-in for all entries of this tournament
    const same = a.teamName
      ? [a]
      : inTournament.filter((p) => !p.teamName && p.lastName === a.lastName && p.firstName === a.firstName && p.birthDate === a.birthDate && p.tournamentId === a.tournamentId);
    const records = same.some((p) => p.id === a.id) ? same : [a, ...same];
    // Empty weight = not given (kata, open weight): saved as «нет», never as 0 kg
    const kg = actualWeightInput > 0 ? actualWeightInput : null;
    const needsWeight = records.some((p) => {
      const c = catOf(p);
      return !!c && hasWeightClasses(c) && (c.weightMin != null || c.weightMax != null);
    });
    if (kg == null && needsWeight) {
      setWeighError(tl('Для весовой категории кумитэ впишите вес.', 'Кумитэнин салмак категориясы үчүн салмакты жазыңыз.', 'Enter the weight for the kumite weight category.'));
      return;
    }
    for (const p of records) {
      const cat = catOf(p);
      const fits = weighInFits(cat, kg);
      onUpdateParticipant({
        ...p,
        actualWeightKg: kg,
        // weight given later: it also becomes the declared weight
        declaredWeightKg: p.declaredWeightKg > 0 ? p.declaredWeightKg : kg ?? 0,
        isWeighedIn: true,
        isMedicalCleared: medicalClearedInput,
        status: medicalClearedInput ? 'weighed_in' : 'disqualified',
        eligibilityNote: fits || !cat ? undefined : `${tl('Вес', 'Салмак', 'Weight')} ${kg} ${tl('кг не подходит для', 'кг ылайык келбейт:', 'kg does not fit')} «${categoryName(cat)}»`
      });
    }
    setWeighInAthlete(null);
  };


  return (
    <div className="space-y-6">
      {tournaments.length > 0 && !hidePicker && (
        <div className="theme-keep flex flex-wrap items-center gap-2">
          <label htmlFor="weighin-tournament" className="text-sm text-[var(--app-text-secondary)]">{tl('Турнир:', 'Мелдеш:', 'Tournament:')}</label>
          <select id="weighin-tournament" value={tournamentId} onChange={(e) => setTournamentId(e.target.value)} className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-primary)] px-3 py-2 text-sm max-w-full">
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>
      )}
      {flagged.length > 0 && (
        <div className="theme-keep rounded-2xl border-2 border-amber-500 bg-[var(--app-surface)] p-4 space-y-2">
          <div className="font-semibold text-[var(--app-text-primary)] flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-600" /> {tl('Не прошли по весу', 'Салмагы туура келген жок', 'Failed the weigh-in')} ({flagged.length})</div>
          {flagged.map((p) => {
            const cat = catOf(p);
            const target = cat && p.actualWeightKg != null ? findCategoryForWeight(categories, cat, p.actualWeightKg) : undefined;
            return (
              <div key={p.id} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="flex-1 min-w-[200px] text-[var(--app-text-primary)]">{p.lastName} {p.firstName}: {p.eligibilityNote}</span>
                {target && (
                  <button onClick={() => onUpdateParticipant({ ...p, categoryId: target.id, eligibilityNote: undefined })} className="h-8 px-3 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold cursor-pointer">
                    {tl('Перевести в', 'Которуу:', 'Move to')} «{categoryName(target)}»
                  </button>
                )}
                <button onClick={() => onUpdateParticipant({ ...p, status: 'withdrawn', eligibilityNote: undefined })} className="h-8 px-3 rounded-lg border border-[var(--app-border)] text-xs text-[var(--app-text-secondary)] cursor-pointer">
                  {tl('Снять с турнира', 'Мелдештен чыгаруу', 'Withdraw from tournament')}
                </button>
              </div>
            );
          })}
        </div>
      )}
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-900 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs tabular-nums uppercase tracking-wider text-rose-400">
              <Users className="w-3.5 h-3.5" />
              <span>{tl('Взвешивание и допуск', 'Таразалоо жана уруксат', 'Weigh-in & clearance')}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
              {tl('Реестр участников и мандатная комиссия', 'Катышуучулардын тизмеси жана мандаттык комиссия', 'Participants and registration desk')}
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              {tl('Учёт спортсменов, клубов, квалификации (кю/дан), контрольное взвешивание перед поединками и медицинский допуск.', 'Спортчуларды, клубдарды, квалификацияны (кю/дан) эсепке алуу, беттештин алдындагы таразалоо жана медициналык уруксат.', 'Athletes, clubs, grades (kyu/dan), official weigh-in before bouts and medical clearance.')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs tabular-nums">
            <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800">
              {tl('Спортсменов', 'Спортчулар', 'Athletes')}: <span className="font-bold text-white">{people.length}</span>
              <span className="text-slate-400"> · {tl('заявок', 'өтүнмө', 'entries')} {inTournament.length}</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800">
              {tl('Взвешено', 'Таразаланган', 'Weighed in')}: <span className="font-bold text-emerald-400">{people.filter(p => p.isWeighedIn).length}</span>
            </div>
            {onNavigateToRegister && (
              <button
                onClick={onNavigateToRegister}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{tl('Зарегистрировать', 'Каттоо', 'Register')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={tl('Поиск по фамилии или лицензии...', 'Фамилия же лицензия боюнча издөө...', 'Search by surname or licence...')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Club filter */}
            <select
              value={selectedClub}
              onChange={(e) => setSelectedClub(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              <option value="all">{tl('Все клубы', 'Бардык клубдар', 'All clubs')}</option>
              {clubOptions.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>

            {/* Weigh-in status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              <option value="all">{tl('Все статусы комиссии', 'Комиссиянын бардык абалдары', 'All statuses')}</option>
              <option value="weighed">{tl('Взвешивание пройдено', 'Таразадан өттү', 'Weighed in')}</option>
              <option value="pending">{tl('Ожидают взвешивания', 'Таразалоону күтүүдө', 'Waiting for weigh-in')}</option>
            </select>
          </div>
          {/* Bulk approval of the athletes shown (or ticked) */}
          <button
            disabled={bulkTargets.length === 0}
            onClick={() => { setBulkMsg(''); setBulkAsk(true); }}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer shrink-0"
          >
            <CheckCircle2 className="w-4 h-4" />
            {pickedPending.length ? tl('Допустить выбранных', 'Тандалгандарга уруксат', 'Admit selected') : tl('Допустить всех', 'Баарына уруксат', 'Admit all')} ({bulkTargets.length})
          </button>
        </div>
        {bulkAsk && (
          <div className="theme-keep mt-4 rounded-xl border border-emerald-500 bg-[var(--app-surface)] p-4 space-y-3">
            <div className="text-sm text-[var(--app-text-primary)]">
              {tl('Отметить', 'Белгилөө', 'Mark')} <b>{bulkTargets.length}</b> {tl('спортсменов как «взвешен и допущен»? Вес берётся из заявки, допуск врача — да. Кого нет в списке фильтра, не изменится.', 'спортчуну «таразаланды жана уруксат берилди» деп белгилейсизби? Салмак табыштамадан алынат, дарыгердин уруксаты — ооба. Чыпкада жоктор өзгөрбөйт.', 'athletes as «weighed in and admitted»? The weight comes from the entry, medical clearance — yes. Athletes outside the filter do not change.')}
            </div>
            <div className="flex gap-2">
              <button onClick={approveBulk} className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold cursor-pointer">{tl('Да, допустить', 'Ооба, уруксат берүү', 'Yes, admit')}</button>
              <button onClick={() => setBulkAsk(false)} className="h-9 px-4 rounded-lg border border-[var(--app-border)] text-sm text-[var(--app-text-primary)] cursor-pointer">{tl('Отмена', 'Жокко чыгаруу', 'Cancel')}</button>
            </div>
          </div>
        )}
        {bulkMsg && <div role="status" className="theme-keep mt-4 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 text-sm text-[var(--app-text-primary)]">{bulkMsg}</div>}
      </div>

      {/* Participants Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tabular-nums text-[11px] border-b border-slate-800">
              <tr>
                <th className="pl-4 pr-1 py-3.5 w-8">
                  <input type="checkbox" aria-label={tl('Выбрать всех ожидающих', 'Күтүп жаткандардын баарын тандоо', 'Select all waiting')} checked={allPicked} disabled={pendingShown.length === 0}
                    onChange={() => setPicked(allPicked ? new Set() : new Set(pendingShown.map(personKey)))} className="w-4 h-4 cursor-pointer" />
                </th>
                <th className="px-5 py-3.5">{tl('Спортсмен', 'Спортчу', 'Athlete')}</th>
                <th className="px-5 py-3.5">{tl('Клуб / Город', 'Клуб / Шаар', 'Club / City')}</th>
                <th className="px-5 py-3.5">{tl('Квалификация', 'Квалификация', 'Grade')}</th>
                <th className="px-5 py-3.5 text-right">{tl('Заявленный вес', 'Көрсөтүлгөн салмак', 'Declared weight')}</th>
                <th className="px-5 py-3.5 text-right">{tl('Факт. вес', 'Чыныгы салмак', 'Actual weight')}</th>
                <th className="px-5 py-3.5 text-center">{tl('Мед. допуск', 'Мед. уруксат', 'Medical')}</th>
                <th className="px-5 py-3.5 text-center">{tl('Статус', 'Абалы', 'Status')}</th>
                <th className="px-5 py-3.5 text-right">{tl('Действие', 'Аракет', 'Action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((p) => {
                const club = SAMPLE_CLUBS.find(c => c.id === p.clubId);
                return (
                  <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="pl-4 pr-1 py-4">
                      <input type="checkbox" aria-label={`${p.lastName} ${p.firstName}`} disabled={p.isWeighedIn} checked={!p.isWeighedIn && picked.has(personKey(p))} onChange={() => togglePick(p)} className="w-4 h-4 cursor-pointer disabled:opacity-30" />
                    </td>
                    {/* Athlete name */}
                    <td className="px-5 py-4">
                      <div className="font-bold text-white text-sm">
                        {p.lastName} {p.firstName}
                      </div>
                      <div className="text-[11px] text-slate-500 tabular-nums mt-0.5">
                        {p.licenseNumber ? `${tl('Лицензия', 'Лицензия', 'Licence')}: ${p.licenseNumber} · ` : ''}{p.gender === 'male' ? tl('Мужской', 'Эркек', 'Male') : tl('Женский', 'Аял', 'Female')}
                        {(entriesOf.get(personKey(p)) || [p]).some((e) => e.mediaConsent === false) && (
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500 font-semibold">{tl('без фото/видео', 'сүрөт/видеосуз', 'no photo/video')}</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                        {(entriesOf.get(personKey(p)) || [p]).map((e) => { const c = catOf(e); return c ? categoryName(c) : ''; }).filter(Boolean).join(' / ')}
                      </div>
                    </td>

                    {/* Club */}
                    <td className="px-5 py-4">
                      <div className="text-slate-200 font-medium">
                        {p.clubName || club?.name}
                      </div>
                      <div className="text-[11px] text-sky-400 tabular-nums">
                        {placeName(p.city || club?.city || 'Бишкек', language)} · {countryLabel(p.country || 'Кыргызстан', language)}
                      </div>
                    </td>

                    {/* Belt */}
                    <td className="px-5 py-4 tabular-nums">
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 text-[11px]">
                        {beltName(p, language)}
                      </span>
                    </td>

                    {/* Declared weight */}
                    <td className="px-5 py-4 text-right tabular-nums text-slate-400 tabular-nums">
                      {p.declaredWeightKg > 0 ? `${p.declaredWeightKg} ${tl('кг', 'кг', 'kg')}` : tl('не указан', 'көрсөтүлгөн эмес', 'not given')}
                    </td>

                    {/* Actual weight */}
                    <td className="px-5 py-4 text-right tabular-nums tabular-nums">
                      {p.actualWeightKg ? (
                        <span className="font-bold text-white">
                          {p.actualWeightKg} {tl('кг', 'кг', 'kg')}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* Medical clearance */}
                    <td className="px-5 py-4 text-center">
                      {!p.isWeighedIn ? (
                        <span className="text-slate-600">—</span>
                      ) : p.isMedicalCleared ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 tabular-nums text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {tl('Допущен', 'Уруксат берилди', 'Cleared')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-400 tabular-nums text-[11px]">
                          <XCircle className="w-3.5 h-3.5" /> {tl('Отказ', 'Баш тартылды', 'Refused')}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 text-center tabular-nums text-[11px]">
                      {p.isWeighedIn ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {tl('Взвешен', 'Таразаланды', 'Weighed')}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                          {tl('Ожидает', 'Күтүүдө', 'Waiting')}
                        </span>
                      )}
                    </td>

                    {/* Action button */}
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleOpenWeighIn(p)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1.5"
                      >
                        <Scale className="w-3.5 h-3.5 text-rose-400" />
                        <span>{tl('Взвешивание', 'Таразалоо', 'Weigh-in')}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Weigh-in Modal */}
      {weighInAthlete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full max-h-[90dvh] overflow-y-auto shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-rose-400">
                <Scale className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">
                  {tl('Контрольное взвешивание', 'Текшерүү таразалоосу', 'Official weigh-in')}
                </h3>
              </div>
              <button
                onClick={() => setWeighInAthlete(null)}
                className="text-slate-400 hover:text-white text-xs tabular-nums"
              >
                {tl('Закрыть', 'Жабуу', 'Close')}
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-xs text-slate-500 tabular-nums">{tl('Спортсмен:', 'Спортчу:', 'Athlete:')}</span>
                <div className="text-base font-bold text-[var(--app-text-primary)]">
                  {weighInAthlete.lastName} {weighInAthlete.firstName}
                </div>
                <div className="text-xs text-slate-400">
                  {weighInAthlete.clubName} · {tl('Заявленный вес', 'Көрсөтүлгөн салмак', 'Declared weight')}: {weighInAthlete.declaredWeightKg > 0 ? `${weighInAthlete.declaredWeightKg} ${tl('кг', 'кг', 'kg')}` : tl('не указан — впишите, если известен', 'көрсөтүлгөн эмес — белгилүү болсо жазыңыз', 'not given — enter it if known')}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--app-text-secondary)] mb-1">
                  {tl('Фактический вес на весах (кг):', 'Таразадагы чыныгы салмак (кг):', 'Actual weight on the scales (kg):')}
                </label>
                <NumberField
                  decimals
                  value={actualWeightInput}
                  onValueChange={(v) => { setActualWeightInput(v); setWeighError(''); }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-base text-white focus:outline-none focus:border-rose-500 tabular-nums font-bold"
                />
              </div>

              {weighError && <div role="alert" className="text-xs font-semibold text-amber-400">{weighError}</div>}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="medClear"
                  checked={medicalClearedInput}
                  onChange={(e) => setMedicalClearedInput(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-rose-600 focus:ring-0"
                />
                <label htmlFor="medClear" className="text-xs text-[var(--app-text-secondary)] cursor-pointer">
                  {tl('Медицинский допуск врача соревнований подтверждён', 'Мелдештин дарыгеринин медициналык уруксаты ырасталды', 'Medical clearance by the tournament doctor confirmed')}
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={() => setWeighInAthlete(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-lg"
              >
                {tl('Отмена', 'Жокко чыгаруу', 'Cancel')}
              </button>
              <button
                onClick={handleSaveWeighIn}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm"
              >
                {tl('Сохранить вес', 'Салмакты сактоо', 'Save weight')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
