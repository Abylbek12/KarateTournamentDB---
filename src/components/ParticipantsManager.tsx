import React, { useState } from 'react';
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
import { Participant, Club, BeltRank } from '../types/schema';
import { SAMPLE_PARTICIPANTS, SAMPLE_CLUBS } from '../data/sampleTournamentData';

interface ParticipantsManagerProps {
  participants: Participant[];
  onUpdateParticipant: (updated: Participant) => void;
  onNavigateToRegister?: () => void;
}

export const ParticipantsManager: React.FC<ParticipantsManagerProps> = ({
  participants,
  onUpdateParticipant,
  onNavigateToRegister
}) => {
  const [search, setSearch] = useState('');
  const [selectedClub, setSelectedClub] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Weigh-in modal state
  const [weighInAthlete, setWeighInAthlete] = useState<Participant | null>(null);
  const [actualWeightInput, setActualWeightInput] = useState<number>(0);
  const [medicalClearedInput, setMedicalClearedInput] = useState<boolean>(true);

  const filtered = participants.filter((p) => {
    const matchesSearch = search === '' || 
      `${p.lastName} ${p.firstName}`.toLowerCase().includes(search.toLowerCase()) ||
      p.licenseNumber.toLowerCase().includes(search.toLowerCase());
    const matchesClub = selectedClub === 'all' || p.clubId === selectedClub;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'weighed' && p.isWeighedIn) ||
      (statusFilter === 'pending' && !p.isWeighedIn);
    return matchesSearch && matchesClub && matchesStatus;
  });

  const handleOpenWeighIn = (p: Participant) => {
    setWeighInAthlete(p);
    setActualWeightInput(p.actualWeightKg || p.declaredWeightKg);
    setMedicalClearedInput(p.isMedicalCleared);
  };

  const handleSaveWeighIn = () => {
    if (!weighInAthlete) return;
    const updated: Participant = {
      ...weighInAthlete,
      actualWeightKg: actualWeightInput,
      isWeighedIn: true,
      isMedicalCleared: medicalClearedInput,
      status: medicalClearedInput ? 'weighed_in' : 'disqualified'
    };
    onUpdateParticipant(updated);
    setWeighInAthlete(null);
  };

  const beltLabels: Record<string, string> = {
    'white_10kyu': 'Белый (10 кю)',
    'yellow_8kyu': 'Желтый (8 кю)',
    'orange_7kyu': 'Оранжевый (7 кю)',
    'green_6kyu': 'Зеленый (6 кю)',
    'blue_4kyu': 'Синий (4 кю)',
    'brown_3kyu': 'Коричневый (3 кю)',
    'brown_1kyu': 'Коричневый (1 кю)',
    'black_1dan': 'Черный 1 Дан',
    'black_2dan': 'Черный 2 Дан',
    'black_3dan_plus': 'Черный 3+ Дан'
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-850 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-rose-400">
              <Users className="w-3.5 h-3.5" />
              <span>Таблица participants & category_entries</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
              Реестр участников и мандатная комиссия
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Учет спортсменов, клубов, спортивной квалификации (кю/дан), 
              контрольное взвешивание перед поединками и медицинский допуск.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800">
              Всего заявлено: <span className="font-bold text-white">{participants.length}</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800">
              Взвешено: <span className="font-bold text-emerald-400">{participants.filter(p => p.isWeighedIn).length}</span>
            </div>
            {onNavigateToRegister && (
              <button
                onClick={onNavigateToRegister}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Зарегистрировать</span>
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
                placeholder="Поиск по фамилии или лицензии..."
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
              <option value="all">Все клубы</option>
              {SAMPLE_CLUBS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.city})
                </option>
              ))}
            </select>

            {/* Weigh-in status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              <option value="all">Все статусы комиссии</option>
              <option value="weighed">Взвешивание пройдено</option>
              <option value="pending">Ожидают взвешивания</option>
            </select>
          </div>
        </div>
      </div>

      {/* Participants Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Спортсмен</th>
                <th className="px-5 py-3.5">Клуб / Город</th>
                <th className="px-5 py-3.5">Квалификация</th>
                <th className="px-5 py-3.5 text-right">Заявленный вес</th>
                <th className="px-5 py-3.5 text-right">Факт. вес</th>
                <th className="px-5 py-3.5 text-center">Мед. допуск</th>
                <th className="px-5 py-3.5 text-center">Статус</th>
                <th className="px-5 py-3.5 text-right">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {filtered.map((p) => {
                const club = SAMPLE_CLUBS.find(c => c.id === p.clubId);
                return (
                  <tr key={p.id} className="hover:bg-slate-850/50 transition-colors">
                    {/* Athlete name */}
                    <td className="px-5 py-4">
                      <div className="font-bold text-white text-sm">
                        {p.lastName} {p.firstName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Лицензия: {p.licenseNumber} · {p.gender === 'male' ? 'Мужской' : 'Женский'}
                      </div>
                    </td>

                    {/* Club */}
                    <td className="px-5 py-4">
                      <div className="text-slate-200 font-medium">
                        {p.clubName || club?.name}
                      </div>
                      <div className="text-[11px] text-sky-400 font-mono">
                        {p.city || club?.city || 'г. Москва'} · {p.country || 'Россия'}
                      </div>
                    </td>

                    {/* Belt */}
                    <td className="px-5 py-4 font-mono">
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 text-[11px]">
                        {beltLabels[p.beltRank] || p.beltRank}
                      </span>
                    </td>

                    {/* Declared weight */}
                    <td className="px-5 py-4 text-right font-mono text-slate-400 tabular-nums">
                      {p.declaredWeightKg} кг
                    </td>

                    {/* Actual weight */}
                    <td className="px-5 py-4 text-right font-mono tabular-nums">
                      {p.actualWeightKg !== null ? (
                        <span className="font-bold text-white">
                          {p.actualWeightKg} кг
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* Medical clearance */}
                    <td className="px-5 py-4 text-center">
                      {p.isMedicalCleared ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Допущен
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-400 font-mono text-[11px]">
                          <XCircle className="w-3.5 h-3.5" /> Отказ
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 text-center font-mono text-[11px]">
                      {p.isWeighedIn ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                          Взвешен
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                          Ожидает
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
                        <span>Взвешивание</span>
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-rose-400">
                <Scale className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">
                  Контрольное взвешивание
                </h3>
              </div>
              <button
                onClick={() => setWeighInAthlete(null)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                Закрыть
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-xs text-slate-500 font-mono">Спортсмен:</span>
                <div className="text-base font-bold text-white">
                  {weighInAthlete.lastName} {weighInAthlete.firstName}
                </div>
                <div className="text-xs text-slate-400">
                  {weighInAthlete.clubName} · Заявленный вес: {weighInAthlete.declaredWeightKg} кг
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Фактический вес на весах (кг):
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={actualWeightInput}
                  onChange={(e) => setActualWeightInput(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-base text-white focus:outline-none focus:border-rose-500 font-mono font-bold"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="medClear"
                  checked={medicalClearedInput}
                  onChange={(e) => setMedicalClearedInput(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-rose-600 focus:ring-0"
                />
                <label htmlFor="medClear" className="text-xs text-slate-300 cursor-pointer">
                  Медицинский допуск врача соревнований подтвержден
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={() => setWeighInAthlete(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-lg"
              >
                Отмена
              </button>
              <button
                onClick={handleSaveWeighIn}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm"
              >
                Зафиксировать вес в БД
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
