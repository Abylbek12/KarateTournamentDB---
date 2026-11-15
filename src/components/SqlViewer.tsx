import React, { useState } from 'react';
import { 
  Code, 
  Copy, 
  Check, 
  Download, 
  Terminal, 
  HelpCircle,
  Cpu,
  Layers
} from 'lucide-react';
import { POSTGRESQL_DDL_SCRIPT, REAL_WORLD_SQL_QUERIES } from '../data/dbSchemaDefinition';

export const SqlViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ddl' | 'queries'>('ddl');
  const [copiedDdl, setCopiedDdl] = useState(false);
  const [copiedQueryIndex, setCopiedQueryIndex] = useState<number | null>(null);

  const handleCopyDdl = () => {
    navigator.clipboard.writeText(POSTGRESQL_DDL_SCRIPT);
    setCopiedDdl(true);
    setTimeout(() => setCopiedDdl(false), 2000);
  };

  const handleCopyQuery = (sql: string, index: number) => {
    navigator.clipboard.writeText(sql);
    setCopiedQueryIndex(index);
    setTimeout(() => setCopiedQueryIndex(null), 2000);
  };

  const handleDownloadSql = () => {
    const blob = new Blob([POSTGRESQL_DDL_SCRIPT], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'karate_tournament_schema.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Title Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-900 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-rose-400">
              <Terminal className="w-3.5 h-3.5" />
              <span>Чистый SQL DDL & Производственные запросы</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
              PostgreSQL DDL Скрипт и SQL Запросы
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Готовый к развертыванию SQL скрипт: расширения, 12 типов ENUM, 10 нормализованных таблиц, 
              внешние ключи, составные индексы для татами и триггеры.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyDdl}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
            >
              {copiedDdl ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Скопировано!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Копировать DDL</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownloadSql}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Скачать .sql</span>
            </button>
          </div>
        </div>

        {/* Tab switch */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('ddl')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'ddl'
                ? 'bg-rose-600 text-white font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Схема DDL (CREATE TABLE & INDEXES)
          </button>
          <button
            onClick={() => setActiveTab('queries')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'queries'
                ? 'bg-rose-600 text-white font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Примеры сложных аналитических SQL запросов ({REAL_WORLD_SQL_QUERIES.length})
          </button>
        </div>
      </div>

      {activeTab === 'ddl' ? (
        /* DDL Code Block */
        <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>schema_karate_tournament.sql</span>
            </span>
            <span>PostgreSQL 14 / 15 / 16 / 17</span>
          </div>

          <div className="p-6 overflow-x-auto text-xs font-mono text-slate-300 leading-relaxed max-h-[650px] overflow-y-auto">
            <pre className="selection:bg-rose-600 selection:text-white">
              {POSTGRESQL_DDL_SCRIPT}
            </pre>
          </div>
        </div>
      ) : (
        /* Practical Queries List */
        <div className="space-y-6">
          {REAL_WORLD_SQL_QUERIES.map((q, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm"
            >
              <div className="p-5 bg-slate-950/80 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">
                    {q.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {q.description}
                  </p>
                </div>

                <button
                  onClick={() => handleCopyQuery(q.sql, idx)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors shrink-0"
                >
                  {copiedQueryIndex === idx ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Скопировано</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Копировать SQL</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-5 bg-slate-950 text-xs font-mono text-slate-300 overflow-x-auto">
                <pre className="text-rose-300/90 leading-relaxed">
                  {q.sql}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
