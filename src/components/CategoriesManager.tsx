import React, { useState } from 'react';
import { Layers, Scale, Clock, Calculator, Check, Plus, ShieldCheck } from 'lucide-react';
import { AgeCategory, WeightCategory } from '../types/schema';
import { SAMPLE_AGE_CATEGORIES, SAMPLE_WEIGHT_CATEGORIES } from '../data/sampleTournamentData';

export const CategoriesManager: React.FC = () => {
  const [selectedAgeCatId, setSelectedAgeCatId] = useState<string>('ac5'); // Senior by default
  const [activeGender, setActiveGender] = useState<'male' | 'female'>('male');
  
  // Interactive category checker state
  const [testBirthDate, setTestBirthDate] = useState<string>('2001-05-14');
  const [testWeight, setTestWeight] = useState<number>(74.5);
  const [testGender, setTestGender] = useState<'male' | 'female'>('male');
  const [calcResult, setCalcResult] = useState<string | null>(null);

  const currentAgeCat = SAMPLE_AGE_CATEGORIES.find(a => a.id === selectedAgeCatId) || SAMPLE_AGE_CATEGORIES[0];
  
  const filteredWeights = SAMPLE_WEIGHT_CATEGORIES.filter(
    w => w.ageCategoryId === selectedAgeCatId && w.gender === activeGender
  );

  const handleCalculateCategory = () => {
    if (!testBirthDate || !testWeight) return;
    
    // Calculate age in 2026
    const birth = new Date(testBirthDate);
    const today = new Date('2026-11-04');
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    // Match age category
    const matchedAge = SAMPLE_AGE_CATEGORIES.find(ac => {
      const minOk = age >= ac.minAge;
      const maxOk = ac.maxAge === null || age <= ac.maxAge;
      return minOk && maxOk;
    });

    if (!matchedAge) {
      setCalcResult(`Возраст: ${age} лет. Подходящая возрастная категория не найдена в регламенте.`);
      return;
    }

    // Match weight category
    const weightsForCat = SAMPLE_WEIGHT_CATEGORIES.filter(
      w => w.ageCategoryId === matchedAge.id && w.gender === testGender
    );

    const matchedWeight = weightsForCat.find(wc => {
      const minOk = testWeight >= wc.minWeightKg;
      const maxOk = wc.maxWeightKg === null || testWeight <= wc.maxWeightKg;
      return minOk && maxOk;
    });

    if (matchedWeight) {
      setCalcResult(
        `Возраст: ${age} лет → Категория: "${matchedAge.name}", Вес ${testWeight} кг → Весовая: "${matchedWeight.name}" (WKF ${testGender === 'male' ? 'Мужчины' : 'Женщины'})`
      );
    } else {
      setCalcResult(
        `Возраст: ${age} лет (${matchedAge.name}), но для веса ${testWeight} кг точный диапазон не определен.`
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Architecture Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-900 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-rose-400">
              <Layers className="w-3.5 h-3.5" />
              <span>Таблицы age_categories & weight_categories</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
              Возрастные и весовые категории WKF
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Связь один-ко-многим (1:N): каждая возрастная категория определяет чистое время боя 
              и содержит набор весовых категорий для мужчин и женщин.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
              Возрастов: <span className="font-bold text-rose-400">{SAMPLE_AGE_CATEGORIES.length}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
              Весовых планок: <span className="font-bold text-sky-400">{SAMPLE_WEIGHT_CATEGORIES.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Category Checker (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-rose-400">
              <Calculator className="w-4 h-4" />
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono">
                Калькулятор распределения в категорию
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Имитирует выполнение SQL триггера и логики мандатной комиссии: 
              автоматическое определение дивизиона спортсмена по дате рождения и весу.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Дата рождения спортсмена:
                </label>
                <input
                  type="date"
                  value={testBirthDate}
                  onChange={(e) => setTestBirthDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Фактический вес (кг):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={testWeight}
                    onChange={(e) => setTestWeight(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Пол:
                  </label>
                  <select
                    value={testGender}
                    onChange={(e) => setTestGender(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="male">Мужской</option>
                    <option value="female">Женский</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleCalculateCategory}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Рассчитать категорию турнира</span>
              </button>

              {calcResult && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/40 text-emerald-300 text-xs font-mono space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-400">
                    <Check className="w-3.5 h-3.5" />
                    <span>Результат валидации:</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed font-sans">{calcResult}</p>
                </div>
              )}
            </div>
          </div>

          {/* Age Categories List */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white">Возрастные категории (age_categories)</h3>
            <div className="space-y-2">
              {SAMPLE_AGE_CATEGORIES.map((ac) => {
                const isSelected = selectedAgeCatId === ac.id;
                return (
                  <div
                    key={ac.id}
                    onClick={() => setSelectedAgeCatId(ac.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-slate-950 border-rose-500 ring-1 ring-rose-500/20'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{ac.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded">
                          {ac.code}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Возраст: {ac.minAge} {ac.maxAge ? `– ${ac.maxAge}` : '+'} лет
                      </div>
                    </div>

                    <div className="text-right text-xs font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{ac.matchDurationSeconds} сек</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Weight Categories Breakdown for Selected Age (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-rose-400">
                  Выбранный возраст: {currentAgeCat.code}
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {currentAgeCat.name}
                </h3>
              </div>

              {/* Gender toggle */}
              <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
                <button
                  onClick={() => setActiveGender('male')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    activeGender === 'male'
                      ? 'bg-rose-600 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Мужчины / Юноши
                </button>
                <button
                  onClick={() => setActiveGender('female')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    activeGender === 'female'
                      ? 'bg-rose-600 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Женщины / Девушки
                </button>
              </div>
            </div>

            {/* Weight Categories Table */}
            <div className="space-y-3">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Весовые планки (weight_categories)</span>
                <span>Регламент времени: {currentAgeCat.matchDurationSeconds} сек ({currentAgeCat.matchDurationSeconds / 60} мин)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredWeights.length === 0 ? (
                  <div className="col-span-2 p-6 text-center text-xs text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
                    Для данного возраста и пола весовые категории не заданы (или соревнование по Ката).
                  </div>
                ) : (
                  filteredWeights.map((w) => (
                    <div
                      key={w.id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-sm font-bold text-white font-mono flex items-center gap-2">
                          <Scale className="w-3.5 h-3.5 text-rose-400" />
                          <span>{w.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-1">
                          Диапазон: {w.minWeightKg} кг – {w.maxWeightKg ? `${w.maxWeightKg} кг` : '∞ (Тяж)'}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-emerald-400">
                          {w.isOpenWeight ? 'Абсолютная' : 'Стандарт WKF'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* DB Constraints & Notes */}
            <div className="mt-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1.5">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                <span>Правила реляционной целостности:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
                <li><code className="text-rose-300">CHECK (max_weight_kg IS NULL OR max_weight_kg &gt; min_weight_kg)</code> — верхняя граница веса всегда выше нижней.</li>
                <li><code className="text-rose-300">CHECK (min_age &gt;= 5)</code> — минимальный возраст участника не менее 5 лет.</li>
                <li>Каскадное удаление: при удалении возрастной категории связанные веса удаляются автоматически (<code className="text-sky-300">ON DELETE CASCADE</code>).</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
