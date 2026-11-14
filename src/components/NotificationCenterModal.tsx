import React, { useState } from 'react';
import { 
  Bell, 
  X, 
  Check, 
  AlertTriangle, 
  ShieldAlert, 
  Info, 
  Volume2, 
  VolumeX, 
  Send, 
  Clock, 
  Trash2, 
  ExternalLink,
  Radio,
  Flame,
  Stethoscope,
  Tv,
  CreditCard,
  UserCheck
} from 'lucide-react';
import { AppNotification, NotificationCategory, NotificationSeverity, UserRole } from '../types/schema';
import { playNotificationSound } from '../data/sampleAcquiringAndExports';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onDispatchNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => void;
  onNavigateTab: (tab: string, extraId?: string) => void;
  currentUserRole: UserRole;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onDispatchNotification,
  onNavigateTab,
  currentUserRole,
  isSoundEnabled,
  onToggleSound
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | NotificationCategory>('all');
  const [showDispatchForm, setShowDispatchForm] = useState(false);
  
  // Dispatch form state
  const [dispatchTitle, setDispatchTitle] = useState('');
  const [dispatchMessage, setDispatchMessage] = useState('');
  const [dispatchCategory, setDispatchCategory] = useState<NotificationCategory>('tatami');
  const [dispatchSeverity, setDispatchSeverity] = useState<NotificationSeverity>('urgent');
  const [dispatchTatami, setDispatchTatami] = useState<number>(1);

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !n.isRead;
    return n.category === activeFilter;
  });

  const handleSendAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchTitle.trim() || !dispatchMessage.trim()) return;

    onDispatchNotification({
      title: dispatchTitle,
      message: dispatchMessage,
      category: dispatchCategory,
      severity: dispatchSeverity,
      tatamiNumber: dispatchCategory === 'tatami' ? dispatchTatami : undefined,
      actionTab: dispatchCategory === 'tatami' ? 'scoreboard' : dispatchCategory === 'medical' ? 'doctor' : 'protocols',
      actionLabel: dispatchCategory === 'tatami' ? `Табло Татами ${dispatchTatami}` : undefined,
      soundAlert: true
    });

    if (isSoundEnabled) {
      playNotificationSound(dispatchSeverity === 'critical' ? 'urgent' : 'chime');
    }

    setDispatchTitle('');
    setDispatchMessage('');
    setShowDispatchForm(false);
  };

  const getSeverityStyle = (severity: NotificationSeverity) => {
    switch (severity) {
      case 'critical':
        return 'border-rose-600/80 bg-rose-950/40 text-rose-200';
      case 'urgent':
        return 'border-amber-600/80 bg-amber-950/40 text-amber-200';
      case 'warning':
        return 'border-yellow-600/60 bg-yellow-950/30 text-yellow-200';
      default:
        return 'border-blue-700/60 bg-blue-950/30 text-blue-200';
    }
  };

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'tatami':
        return <Tv className="w-4 h-4 text-sky-400" />;
      case 'medical':
        return <Stethoscope className="w-4 h-4 text-teal-400" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-emerald-400" />;
      case 'referee':
        return <Radio className="w-4 h-4 text-amber-400" />;
      case 'schedule':
        return <Clock className="w-4 h-4 text-indigo-400" />;
      default:
        return <Info className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden animate-slideLeft text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative p-2.5 rounded-2xl bg-gradient-to-br from-blue-600/30 to-indigo-600/20 border border-blue-500/40 text-blue-400 shadow-md">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[11px] font-black flex items-center justify-center animate-pulse shadow">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-mono tracking-tight text-white flex items-center gap-2">
                Оперативные уведомления
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 font-mono">
                  WKF Live Hub
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Вызовы на татами, медицинские тайм-ауты, взносы и решения ГСК
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Audio Toggle */}
            <button
              onClick={() => {
                onToggleSound();
                if (!isSoundEnabled) playNotificationSound('success');
              }}
              className={`p-2 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                isSoundEnabled 
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60 hover:bg-emerald-900' 
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title={isSoundEnabled ? 'Звук оповещений включен' : 'Звук оповещений отключен'}
            >
              {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Закрыть"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Controls & Filter Ribbon */}
        <div className="p-3 bg-slate-950/50 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs font-mono shrink-0">
          {/* Filters */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-full">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                activeFilter === 'all' 
                  ? 'bg-blue-600 text-white font-bold shadow-sm' 
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              Все ({notifications.length})
            </button>

            <button
              onClick={() => setActiveFilter('unread')}
              className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                activeFilter === 'unread' 
                  ? 'bg-rose-600 text-white font-bold shadow-sm' 
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              Непрочитанные ({unreadCount})
            </button>

            <button
              onClick={() => setActiveFilter('tatami')}
              className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                activeFilter === 'tatami' 
                  ? 'bg-sky-600 text-white font-bold shadow-sm' 
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Tv className="w-3 h-3" /> Татами
            </button>

            <button
              onClick={() => setActiveFilter('medical')}
              className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                activeFilter === 'medical' 
                  ? 'bg-teal-600 text-white font-bold shadow-sm' 
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Stethoscope className="w-3 h-3" /> Медицина
            </button>

            <button
              onClick={() => setActiveFilter('payment')}
              className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                activeFilter === 'payment' 
                  ? 'bg-emerald-600 text-white font-bold shadow-sm' 
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <CreditCard className="w-3 h-3" /> Взносы
            </button>
          </div>

          {/* Quick Operations */}
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                title="Отметить все прочитанными"
              >
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Прочитано все</span>
              </button>
            )}

            <button
              onClick={onClearAll}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
              title="Очистить архив"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dispatcher Button for Admin / Referee / Doctor */}
        <div className="px-4 py-2 bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>Диспетчер громкой связи и вызовов татами</span>
          </div>
          <button
            onClick={() => setShowDispatchForm(!showDispatchForm)}
            className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Send className="w-3 h-3" />
            <span>{showDispatchForm ? 'Скрыть форму' : 'Создать оповещение'}</span>
          </button>
        </div>

        {/* Dispatch Form Drawer */}
        {showDispatchForm && (
          <form onSubmit={handleSendAlert} className="p-4 bg-slate-950 border-b border-slate-800 space-y-3 animate-fadeIn shrink-0">
            <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Отправить экстренное сообщение</span>
              <span className="text-[10px] text-blue-400">Роль: {currentUserRole.toUpperCase()}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Категория</label>
                <select
                  value={dispatchCategory}
                  onChange={(e) => setDispatchCategory(e.target.value as NotificationCategory)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-blue-500 focus:outline-none"
                >
                  <option value="tatami">🥋 Татами / Поединок</option>
                  <option value="medical">🩺 Медицина / Врач</option>
                  <option value="referee">⚖️ ГСК / Судейство</option>
                  <option value="payment">💳 Взносы / Оплата</option>
                  <option value="schedule">⏱️ Расписание / Пауза</option>
                  <option value="system">📢 Общее оповещение</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Приоритет</label>
                <select
                  value={dispatchSeverity}
                  onChange={(e) => setDispatchSeverity(e.target.value as NotificationSeverity)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-blue-500 focus:outline-none"
                >
                  <option value="info">Информационный</option>
                  <option value="warning">Предупреждение</option>
                  <option value="urgent">Срочно (Вызов)</option>
                  <option value="critical">Критический (Стоп боя)</option>
                </select>
              </div>

              {dispatchCategory === 'tatami' && (
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Номер татами</label>
                  <select
                    value={dispatchTatami}
                    onChange={(e) => setDispatchTatami(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-blue-500 focus:outline-none"
                  >
                    <option value={1}>Татами 1</option>
                    <option value={2}>Татами 2</option>
                    <option value={3}>Татами 3</option>
                    <option value={4}>Татами 4</option>
                  </select>
                </div>
              )}
            </div>

            <div>
              <input
                type="text"
                placeholder="Заголовок (например: Вызов на Татами №1)"
                value={dispatchTitle}
                onChange={(e) => setDispatchTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <textarea
                rows={2}
                placeholder="Текст оповещения (например: Спортсменам финала подойти к зоне секундантов...)"
                value={dispatchMessage}
                onChange={(e) => setDispatchMessage(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:border-blue-500 focus:outline-none resize-none"
                required
              />
            </div>

            {/* Quick Templates */}
            <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
              <span className="text-slate-400 self-center">Быстро:</span>
              <button
                type="button"
                onClick={() => {
                  setDispatchCategory('tatami');
                  setDispatchSeverity('urgent');
                  setDispatchTitle('Вызов на Татами №' + dispatchTatami);
                  setDispatchMessage(`Участникам следующего боя на Татами №${dispatchTatami} немедленно явиться в зону подготовки.`);
                }}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300"
              >
                + Вызов бойцов
              </button>
              <button
                type="button"
                onClick={() => {
                  setDispatchCategory('medical');
                  setDispatchSeverity('critical');
                  setDispatchTitle('Срочно: Врач на Татами №' + dispatchTatami);
                  setDispatchMessage(`Дежурному врачу соревнований срочно прибыть на Татами №${dispatchTatami} для оказания помощи.`);
                }}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-teal-300"
              >
                + Вызов врача
              </button>
              <button
                type="button"
                onClick={() => {
                  setDispatchCategory('schedule');
                  setDispatchSeverity('warning');
                  setDispatchTitle('Технический перерыв 15 минут');
                  setDispatchMessage('По решению ГСК объявляется технический перерыв 15 минут для калибровки электронного судейства.');
                }}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300"
              >
                + Перерыв ГСК
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDispatchForm(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-mono"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Опубликовать оповещение</span>
              </button>
            </div>
          </form>
        )}

        {/* Scrollable Notification List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-500 mb-3">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold font-mono text-slate-300 mb-1">
                Нет новых оповещений
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {activeFilter === 'unread' 
                  ? 'Все сообщения уже прочитаны.' 
                  : 'В выбранной категории пока нет зарегистрированных событий.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const severityBadge = getSeverityStyle(notif.severity);
              const icon = getCategoryIcon(notif.category);

              return (
                <div
                  key={notif.id}
                  className={`relative p-3.5 sm:p-4 rounded-2xl border transition-all ${
                    notif.isRead 
                      ? 'bg-slate-900/40 border-slate-800/80 opacity-80' 
                      : 'bg-slate-900/90 border-slate-700 shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-xl bg-slate-800 border border-slate-700/80">
                        {icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={`text-xs sm:text-sm font-bold font-mono ${notif.isRead ? 'text-slate-300' : 'text-white'}`}>
                            {notif.title}
                          </h4>
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {notif.timestamp}
                          </span>
                          <span>•</span>
                          <span className={`px-1.5 py-0.2 rounded font-bold uppercase ${severityBadge}`}>
                            {notif.severity}
                          </span>
                          {notif.tatamiNumber && (
                            <>
                              <span>•</span>
                              <span className="text-sky-300 font-bold">Татами №{notif.tatamiNumber}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {!notif.isRead && (
                      <button
                        onClick={() => onMarkAsRead(notif.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-emerald-300 transition-colors"
                        title="Отметить прочитанным"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 font-mono leading-relaxed pl-8">
                    {notif.message}
                  </p>

                  {/* Action Link if target exists */}
                  {notif.actionTab && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-end pl-8">
                      <button
                        onClick={() => {
                          onMarkAsRead(notif.id);
                          onNavigateTab(notif.actionTab!, notif.boutId);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800/80 text-xs font-mono font-bold transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
                      >
                        <span>{notif.actionLabel || 'Перейти к событию'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Summary */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Канал прямой трансляции оповещений активен (LAN/Web)</span>
          </div>
          <span className="text-slate-500">Uventex Push Engine</span>
        </div>
      </div>
    </div>
  );
};
