import React, { useState } from 'react';
import { 
  Database, 
  Key, 
  Link as LinkIcon, 
  Search, 
  Layers, 
  CheckCircle2, 
  ShieldAlert, 
  Code, 
  Info,
  ChevronRight,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { TableDef } from '../types/schema';
import { DATABASE_TABLES } from '../data/dbSchemaDefinition';

export const SchemaVisualizer: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTable, setActiveTable] = useState<TableDef | null>(DATABASE_TABLES[0]);
  const [copiedTableId, setCopiedTableId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'Все таблицы', count: DATABASE_TABLES.length },
    { id: 'auth_org', label: 'Пользователи и клубы', count: DATABASE_TABLES.filter(t => t.category === 'auth_org').length },
    { id: 'athletes_categories', label: 'Категории и спортсмены', count: DATABASE_TABLES.filter(t => t.category === 'athletes_categories').length },
    { id: 'tatami_matches', label: 'Татами и поединки', count: DATABASE_TABLES.filter(t => t.category === 'tatami_matches').length }
  ];

  const filteredTables = DATABASE_TABLES.filter(t => {
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.russianName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.columns.some(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleCopySql = (table: TableDef) => {
    const colSql = table.columns.map(c => {
      let str = `  ${c.name} ${c.type}`;
      if (!c.nullable) str += ' NOT NULL';
      if (c.defaultValue) str += ` DEFAULT ${c.defaultValue}`;
      return str;
    }).join(',\n');

    const constraintSql = table.constraints.length > 0 
      ? ',\n' + table.constraints.map(ct => `  ${ct}`).join(',\n')
      : '';

    const ddl = `CREATE TABLE ${table.name} (\n${colSql}${constraintSql}\n);`;
    navigator.clipboard.writeText(ddl);
    setCopiedTableId(table.id);
    setTimeout(() => setCopiedTableId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Title & Architecture Overview */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-850 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-rose-400">
              <Database className="w-3.5 h-3.5" />
              <span>Реляционная архитектура PostgreSQL 14+</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
              Схема базы данных соревнований по каратэ
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Спроектирована по стандартам WKF (World Karate Federation) и правилам олимпийского каратэ: 
              управление судейской коллегией и ролями, участники с контролем взвешивания и допусков, 
              динамическая матрица возрастных и весовых категорий, и отказоустойчивое расписание по татами.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-300">
            <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
              Таблиц: <span className="font-bold text-rose-400">{DATABASE_TABLES.length}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
              ENUM типов: <span className="font-bold text-sky-400">12</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
              Индексов: <span className="font-bold text-emerald-400">22</span>
            </div>
          </div>
        </div>

        {/* Filter bar & Search */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Segmented filter controls */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 w-full sm:w-auto overflow-x-auto no-scrollbar">
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  selectedCategory === c.id 
                    ? 'bg-rose-600 text-white shadow-sm font-semibold' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {c.label} ({c.count})
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Поиск по таблицам и полям..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>
      </div>

      {/* Main split: Table Grid & Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Tables Grid (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Таблицы в выборке: {filteredTables.length}</span>
            <span>Нажмите на таблицу для подробного анализа</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredTables.map((table) => {
              const isSelected = activeTable?.id === table.id;
              const pkCount = table.columns.filter(c => c.isPk).length;
              const fkCount = table.columns.filter(c => c.isFk).length;

              return (
                <div
                  key={table.id}
                  onClick={() => setActiveTable(table)}
                  className={`p-5 rounded-xl border transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-slate-900 border-rose-500 shadow-md ring-1 ring-rose-500/20' 
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-white tracking-tight">
                          {table.name}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          · {table.russianName}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {table.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopySql(table);
                        }}
                        className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md text-xs transition-colors"
                        title="Скопировать CREATE TABLE DDL"
                      >
                        {copiedTableId === table.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Badges strip: Primary Key & Foreign Keys */}
                  <div className="mt-3 pt-3 border-t border-slate-850 flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 flex items-center gap-1 text-amber-400">
                      <Key className="w-3 h-3" /> PK: {pkCount}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 flex items-center gap-1 text-sky-400">
                      <LinkIcon className="w-3 h-3" /> FK: {fkCount}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                      Колонок: {table.columns.length}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-emerald-400">
                      Индексов: {table.indexes.length}
                    </span>
                  </div>

                  {/* Mini Preview of First 4 Columns */}
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] font-mono">
                    {table.columns.slice(0, 4).map((col) => (
                      <div key={col.name} className="px-2 py-1 bg-slate-950/80 rounded border border-slate-800/80 truncate text-slate-300">
                        {col.isPk && <span className="text-amber-400 font-bold mr-1">PK</span>}
                        {col.isFk && <span className="text-sky-400 font-bold mr-1">FK</span>}
                        <span className="text-slate-200">{col.name}</span>
                      </div>
                    ))}
                    {table.columns.length > 4 && (
                      <div className="px-2 py-1 text-slate-500 text-[11px]">
                        +{table.columns.length - 4} ещё...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Deep Table Inspector (5 cols) */}
        <div className="lg:col-span-5 sticky top-20 space-y-4">
          {activeTable ? (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
              {/* Header */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase text-rose-400 font-semibold tracking-wider">
                    Инспектор сущности БД
                  </span>
                  <button
                    onClick={() => handleCopySql(activeTable)}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    {copiedTableId === activeTable.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Скопировано!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>SQL DDL</span>
                      </>
                    )}
                  </button>
                </div>
                <h3 className="text-xl font-bold text-white font-mono mt-1">
                  {activeTable.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {activeTable.description}
                </p>
              </div>

              {/* Columns Table */}
              <div>
                <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
                  <span>Поля и типы данных ({activeTable.columns.length})</span>
                  <span className="text-[11px] text-slate-500 font-mono">Nullability / Type</span>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-850 text-xs font-mono max-h-[360px] overflow-y-auto">
                  {activeTable.columns.map((col) => (
                    <div key={col.name} className="p-2.5 bg-slate-950/60 hover:bg-slate-850/60 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 truncate">
                          {col.isPk && (
                            <span className="px-1.5 py-0.2 bg-amber-950/80 border border-amber-600/60 text-amber-300 text-[10px] rounded font-bold">
                              PK
                            </span>
                          )}
                          {col.isFk && (
                            <span className="px-1.5 py-0.2 bg-sky-950/80 border border-sky-600/60 text-sky-300 text-[10px] rounded font-bold" title={`Внешний ключ -> ${col.fkTarget}`}>
                              FK
                            </span>
                          )}
                          <span className="font-semibold text-white">{col.name}</span>
                        </div>
                        <span className="text-rose-400 font-mono text-[11px] shrink-0">
                          {col.type}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400 font-sans">
                        <span className="truncate">{col.description}</span>
                        <span className="font-mono text-slate-500 shrink-0 text-[10px]">
                          {col.nullable ? 'NULL' : 'NOT NULL'}
                          {col.defaultValue ? ` · def: ${col.defaultValue}` : ''}
                        </span>
                      </div>

                      {col.fkTarget && (
                        <div className="mt-1 text-[10px] text-sky-400 font-mono flex items-center gap-1">
                          <LinkIcon className="w-2.5 h-2.5" />
                          <span>Связь с {col.fkTarget}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Integrity Constraints & Checks */}
              {activeTable.constraints.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ограничения целостности (Constraints)</span>
                  </div>
                  <div className="space-y-1.5">
                    {activeTable.constraints.map((c, i) => (
                      <div key={i} className="p-2 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300">
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended PostgreSQL Indexes */}
              {activeTable.indexes.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Индексы производительности (PostgreSQL B-Tree)</span>
                  </div>
                  <div className="space-y-2">
                    {activeTable.indexes.map((idx, i) => (
                      <div key={i} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                        <div className="flex items-center justify-between font-mono text-[11px]">
                          <span className="text-emerald-400 font-semibold">{idx.name}</span>
                          <span className="text-slate-500">
                            {idx.isUnique ? 'UNIQUE' : 'INDEX'}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-300 mt-0.5">
                          Колонки: ({idx.columns.join(', ')})
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          {idx.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400">
              Выберите таблицу слева для просмотра деталей структуры
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
