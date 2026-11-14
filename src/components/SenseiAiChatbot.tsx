import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  Maximize2, 
  Minimize2, 
  Sparkles, 
  Trash2, 
  Copy, 
  Check, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  Trophy, 
  HelpCircle, 
  RefreshCw, 
  Download,
  Flame,
  ArrowUpRight
} from 'lucide-react';
import { Tournament, TournamentRules } from '../types/schema';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  source?: string;
}

interface SenseiAiChatbotProps {
  currentTournament: Tournament;
  tournamentRules: TournamentRules;
  participantCount: number;
  tatamiCount: number;
}

const QUICK_QUESTIONS = [
  { label: '🥋 Правило Senshu (первый балл)', prompt: 'Объясни детально правило первого балла (Senshu) в WKF 2026: как оно присуждается и когда аннулируется?' },
  { label: '📊 Разница Ippon, Waza-ari, Yuko', prompt: 'Какие критерии присуждения Ippon, Waza-ari и Yuko в кумитэ WKF? За что дают 3, 2 и 1 балл?' },
  { label: '🛡️ Умная жеребьевка и разведение', prompt: 'Как работает умная жеребьевка турнира для защиты от встречи представителей одного клуба в первых кругах?' },
  { label: '⛩️ Различия правил WKF и SKIF', prompt: 'В чем главные отличия спортивного регламента WKF от традиционного SKIF (Shobu Ippon и Shobu Sanbon)?' },
  { label: '📹 Регламент Video Review (VR)', prompt: 'Как тренер подает протест Video Review (VR) на татами? Сколько карточек дается и когда они сгорают?' },
  { label: '⏱️ Правило 10 секунд при травме', prompt: 'Как действует правило 10 секунд (10-second rule) при падении или травме спортсмена в кумитэ WKF?' }
];

export const SenseiAiChatbot: React.FC<SenseiAiChatbotProps> = ({
  currentTournament,
  tournamentRules,
  participantCount,
  tatamiCount
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome_1',
      role: 'model',
      text: `### Ос! Приветствую! 🥋 Я — Sensei AI Supreme

Лучший в мире специализированный спортивный интеллект турнирной платформы **Uventex Karate**, усиленный моделью нового поколения **Gemini 3.8 Flash**.

Я знаю всё об:
* **Официальных правилах WKF 2026** (Ippon, Waza-ari, Yuko, Senshu, категории нарушений C1/C2, Video Review);
* **Традиционном каратэ SKIF** (Shobu Ippon, Shobu Sanbon, Todome-waza);
* **Электронном судействе Ката** (технический 70% и атлетический 30% коэффициенты);
* **Умной жеребьевке** с защитой от ранних встреч соклубников и земляков;
* **Структуре базы данных турнира** и автономном режиме работы LAN.

*Выберите подсказку ниже или задайте любой вопрос!*`,
      timestamp: 'Только что',
      source: 'gemini-3.8-flash'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-sensei-ai', handleOpen);
    return () => window.removeEventListener('open-sensei-ai', handleOpen);
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Voice Speech Synthesis
  const speakText = (text: string) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    // Clean markdown symbols for cleaner speech
    const cleanSpeech = text
      .replace(/[#*_`|]/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .replace(/\n+/g, '. ');

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.lang = 'ru-RU';
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    if (window.confirm('Очистить историю диалога с Sensei AI?')) {
      setMessages([
        {
          id: 'welcome_reset',
          role: 'model',
          text: 'Диалог очищен. Готов к новым вопросам по правилам каратэ и управлению турниром!',
          timestamp: 'Только что',
          source: 'gemini-3.8-flash'
        }
      ]);
      window.speechSynthesis?.cancel();
    }
  };

  const handleExportChat = () => {
    const chatExport = messages
      .map(m => `[${m.timestamp}] ${m.role === 'user' ? 'Вы' : 'Sensei AI'}:\n${m.text}\n`)
      .join('\n---\n\n');
    
    const blob = new Blob([chatExport], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sensei_AI_Chat_${currentTournament.slug || 'tournament'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsgId = 'user_' + Date.now();
    const newUserMessage: Message = {
      id: userMsgId,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: messages.slice(-8).map(m => ({ role: m.role, text: m.text })),
          context: {
            tournamentTitle: currentTournament.title,
            rules: tournamentRules,
            participantCount,
            tatamiCount,
            city: currentTournament.city,
            country: currentTournament.country
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      const botReply = data.reply || 'Не удалось получить ответ. Попробуйте еще раз.';
      
      const newBotMessage: Message = {
        id: 'bot_' + Date.now(),
        role: 'model',
        text: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: data.source || 'gemini-3.8-flash'
      };

      setMessages(prev => [...prev, newBotMessage]);
      speakText(botReply);
    } catch (err) {
      console.error('Chat error:', err);
      const errorBotMessage: Message = {
        id: 'err_' + Date.now(),
        role: 'model',
        text: `### ⚠️ Временная задержка соединения

Не удалось связаться с сервером Gemini API. Проверьте подключение к серверу.

*Вы можете повторить запрос или воспользоваться справочником регламента WKF/SKIF через навигацию.*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'local-diagnostic'
      };
      setMessages(prev => [...prev, errorBotMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 animate-fadeIn">
          {/* Helper tooltip badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 shadow-xl text-xs text-slate-300 backdrop-blur font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Sensei AI · Эксперт WKF/SKIF</span>
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className="relative group p-4 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-rose-600 text-white shadow-2xl hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer flex items-center justify-center border border-white/20"
            title="Открыть лучший в мире ИИ-ассистент по каратэ"
          >
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-950 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            </div>
            <Bot className="w-7 h-7 text-white drop-shadow-md group-hover:rotate-6 transition-transform" />
          </button>
        </div>
      )}

      {/* Main Chatbot Panel */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 flex flex-col shadow-2xl border border-slate-800 bg-slate-950/98 backdrop-blur-xl font-sans overflow-hidden ${
            isExpanded
              ? 'inset-2 sm:inset-6 rounded-3xl'
              : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[480px] h-[640px] max-h-[88vh] rounded-3xl'
          }`}
        >
          {/* Top Header */}
          <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border-b border-slate-800/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-rose-600 flex items-center justify-center text-white shadow-md shadow-indigo-900/40">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                    Sensei AI Supreme
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      Gemini 3.8 Flash
                    </span>
                  </h3>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Эксперт правил WKF & SKIF</span>
                  <span>·</span>
                  <span className="text-blue-400 font-mono text-[10px]">{currentTournament.city}</span>
                </div>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  !isMuted ? 'text-blue-400 bg-blue-950/40 border border-blue-900/50' : 'hover:bg-slate-800 hover:text-white'
                }`}
                title={isMuted ? 'Включить озвучку ответов' : 'Выключить звук'}
              >
                {!isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                onClick={handleExportChat}
                className="p-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                title="Экспорт диалога в Markdown"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={handleClearHistory}
                className="p-2 rounded-lg hover:bg-slate-800 hover:text-rose-400 transition-colors cursor-pointer"
                title="Очистить историю"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer hidden sm:block"
                title={isExpanded ? 'Свернуть окно' : 'На весь экран'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  window.speechSynthesis?.cancel();
                }}
                className="p-2 rounded-lg hover:bg-rose-950/50 hover:text-rose-400 text-slate-400 transition-colors cursor-pointer ml-1"
                title="Закрыть чат"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Tournament Context Bar */}
          <div className="px-4 py-2 bg-slate-900/70 border-b border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0">
            <div className="flex items-center gap-2 truncate">
              <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate text-slate-200">{currentTournament.title}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                {tournamentRules.toUpperCase()}
              </span>
              <span className="text-emerald-400">{tatamiCount} ковра</span>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs sm:text-sm">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                {msg.role === 'model' && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-md relative group ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-xs'
                      : 'bg-slate-900/95 text-slate-200 border border-slate-800 rounded-bl-xs'
                  }`}
                >
                  {/* Message source header for bot */}
                  {msg.role === 'model' && (
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 text-[10px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1 text-indigo-300">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        Sensei AI Supreme · {msg.source || 'gemini-3.8-flash'}
                      </span>
                      <span>{msg.timestamp}</span>
                    </div>
                  )}

                  {/* Message body with Markdown style */}
                  <div className="whitespace-pre-wrap leading-relaxed space-y-1.5 text-xs sm:text-[13px]">
                    {msg.text}
                  </div>

                  {/* Actions Bar for Bot Messages */}
                  {msg.role === 'model' && (
                    <div className="pt-2 mt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="text-[10px] text-slate-400">Официальные стандарты WKF</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => speakText(msg.text)}
                          className="p-1 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Озвучить"
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleCopyText(msg.id, msg.text)}
                          className="p-1 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
                          title="Копировать ответ"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {msg.role === 'user' && (
                    <div className="text-[10px] text-blue-200 text-right mt-1 font-mono">
                      {msg.timestamp}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-3 justify-start animate-pulse">
                <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-300 animate-spin" />
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-bl-xs px-4 py-3 text-xs text-slate-400 flex items-center gap-2 font-mono">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span>Sensei AI анализирует регламент и формирует ответ...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Question Chips */}
          <div className="p-2.5 bg-slate-900/80 border-t border-slate-800/80 shrink-0 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-[10px] uppercase font-mono text-slate-400 mr-1 flex items-center gap-1">
                <Flame className="w-3 h-3 text-rose-500" /> Темы:
              </span>
              {QUICK_QUESTIONS.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip.prompt)}
                  disabled={isLoading}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-blue-500/60 text-[11px] transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message Input Box */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Задайте вопрос Сенсею (WKF правила, Senshu, жеребьевка)..."
                disabled={isLoading}
                className="flex-1 bg-slate-900 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-100 placeholder-slate-500 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm outline-none transition-all"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-900/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <span>Спросить</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
            <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400 px-1 font-mono">
              <span>Powered by Gemini 3.8 Flash & Uventex Engine</span>
              <span>Enter ↵ для отправки</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
