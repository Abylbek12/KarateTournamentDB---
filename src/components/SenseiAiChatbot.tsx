import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  X,
  Maximize2,
  Minimize2,
  Trash2,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Download,
  Trophy
} from 'lucide-react';
import { Tournament, TournamentRules } from '../types/schema';
import { ChatMarkdown } from './ChatMarkdown';

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
  { label: 'Правило Senshu', prompt: 'Объясни правило первого балла (Senshu) в WKF: как оно присуждается и когда аннулируется?' },
  { label: 'Ippon, Waza-ari, Yuko', prompt: 'Какие критерии присуждения Ippon, Waza-ari и Yuko в кумитэ WKF? За что дают 3, 2 и 1 балл?' },
  { label: 'Жеребьёвка', prompt: 'Как работает жеребьёвка турнира с разведением спортсменов одного клуба в первых кругах?' },
  { label: 'WKF и SKIF', prompt: 'В чём главные отличия правил WKF от традиционного SKIF (Shobu Ippon и Shobu Sanbon)?' },
  { label: 'Видеоповтор (VR)', prompt: 'Как тренер подаёт запрос на видеоповтор (Video Review) на татами?' },
  { label: 'Судейство ката', prompt: 'Как оценивается ката по правилам WKF?' }
];

const WELCOME: Message = {
  id: 'welcome',
  role: 'model',
  text: `### Ос! Я — Sensei AI 🥋

Помогу разобраться в правилах и работе турнира:

* правила **WKF** и **SKIF** — баллы, Senshu, предупреждения, видеоповтор;
* судейство **ката**;
* **жеребьёвка** и сетки;
* как пользоваться разделами этого сайта.

Выберите тему ниже или задайте свой вопрос.`,
  timestamp: '',
  source: 'welcome'
};

const STORAGE_KEY = 'sensei_chat_history_v2';

const loadHistory = (): Message[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(-40);
  } catch {
    /* storage unavailable */
  }
  return [WELCOME];
};

const sourceLabel = (source?: string) => {
  if (!source || source === 'welcome') return null;
  if (source === 'claude') return 'Ответ ИИ (Claude)';
  if (source === 'local-diagnostic') return 'Нет связи';
  return 'Справочник (офлайн)';
};

const nowTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
  const [messages, setMessages] = useState<Message[]>(loadHistory);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
    } catch {
      /* storage unavailable */
    }
  }, [messages]);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-sensei-ai', handleOpen);
    return () => window.removeEventListener('open-sensei-ai', handleOpen);
  }, []);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isLoading]);

  useEffect(() => {
    if (!isOpen) return;
    setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const speakText = (text: string, force = false) => {
    if ((isMuted && !force) || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
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
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    if (window.confirm('Очистить историю диалога?')) {
      setMessages([WELCOME]);
      window.speechSynthesis?.cancel();
    }
  };

  const handleExportChat = () => {
    const chatExport = messages
      .filter((m) => m.source !== 'welcome')
      .map((m) => `[${m.timestamp}] ${m.role === 'user' ? 'Вы' : 'Sensei AI'}:\n${m.text}\n`)
      .join('\n---\n\n');
    const blob = new Blob([chatExport], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sensei_AI_${currentTournament.slug || 'chat'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const newUserMessage: Message = { id: 'user_' + Date.now(), role: 'user', text: query, timestamp: nowTime() };
    setMessages((prev) => [...prev, newUserMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: messages
            .filter((m) => m.source !== 'welcome')
            .slice(-8)
            .map((m) => ({ role: m.role, text: m.text })),
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

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);

      const botReply = data.reply || 'Не удалось получить ответ. Попробуйте ещё раз.';
      setMessages((prev) => [
        ...prev,
        { id: 'bot_' + Date.now(), role: 'model', text: botReply, timestamp: nowTime(), source: data.source }
      ]);
      speakText(botReply);
    } catch (err: any) {
      const reason = err?.message && !String(err.message).startsWith('HTTP') ? err.message : 'Проверьте подключение к серверу и попробуйте ещё раз.';
      setMessages((prev) => [
        ...prev,
        { id: 'err_' + Date.now(), role: 'model', text: `**Не удалось получить ответ.** ${reason}`, timestamp: nowTime(), source: 'local-diagnostic' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const iconBtn =
    'p-2 rounded-lg text-[var(--app-text-muted)] hover:text-[var(--app-text-primary)] hover:bg-[var(--app-surface-subtle)] transition-colors cursor-pointer';

  return (
    <div className="theme-keep">
      {/* Launcher */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 lg:bottom-5 lg:right-5 z-50 h-12 sm:h-13 pl-3.5 pr-3.5 sm:pr-5 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white shadow-lg shadow-black/15 flex items-center gap-2.5 transition-all hover:-translate-y-0.5 cursor-pointer animate-fadeIn"
          title="Спросить Sensei AI"
          aria-label="Открыть помощника Sensei AI"
        >
          <Bot className="w-6 h-6" />
          <span className="hidden sm:inline text-sm font-semibold">Спросить сенсея</span>
        </button>
      )}

      {/* Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Помощник Sensei AI"
          className={`fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-primary)] shadow-2xl shadow-black/20 animate-fadeIn ${
            isExpanded
              ? 'inset-2 sm:inset-6'
              : 'inset-x-2 bottom-2 top-16 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[440px] sm:h-[620px] sm:max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-[var(--app-border)] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold leading-tight">Sensei AI</h3>
                <div className="text-xs text-[var(--app-text-muted)] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Помощник по правилам каратэ
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <button onClick={() => setIsMuted(!isMuted)} className={iconBtn} title={isMuted ? 'Озвучивать ответы' : 'Не озвучивать'}>
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[var(--accent)]" />}
              </button>
              <button onClick={handleExportChat} className={`${iconBtn} hidden sm:block`} title="Скачать диалог">
                <Download className="w-4 h-4" />
              </button>
              <button onClick={handleClearHistory} className={iconBtn} title="Очистить историю">
                <Trash2 className="w-4 h-4" />
              </button>
              <button onClick={() => setIsExpanded(!isExpanded)} className={`${iconBtn} hidden sm:block`} title={isExpanded ? 'Свернуть' : 'Развернуть'}>
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  window.speechSynthesis?.cancel();
                }}
                className={iconBtn}
                title="Закрыть (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tournament context */}
          <div className="px-4 py-2 bg-[var(--app-surface-subtle)] border-b border-[var(--app-border)] flex items-center gap-2 text-xs text-[var(--app-text-secondary)] shrink-0">
            <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">{currentTournament.title}</span>
            <span className="ml-auto shrink-0 px-1.5 py-0.5 rounded-md bg-[var(--app-surface)] border border-[var(--app-border)] font-semibold">
              {tournamentRules.toUpperCase()}
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((msg) =>
              msg.role === 'user' ? (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[var(--accent)] text-white px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                    {msg.timestamp && <div className="text-[10px] text-white/75 text-right mt-1">{msg.timestamp}</div>}
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="max-w-[88%] min-w-0">
                    <div
                      className={`rounded-2xl rounded-tl-md border px-3.5 py-2.5 text-sm ${
                        msg.source === 'local-diagnostic'
                          ? 'bg-[var(--danger-soft)] border-[var(--danger-border)]'
                          : 'bg-[var(--app-surface-subtle)] border-[var(--app-border)]'
                      }`}
                    >
                      <ChatMarkdown text={msg.text} />
                    </div>
                    {msg.source !== 'welcome' && (
                      <div className="flex items-center gap-1 mt-1 px-1 text-[11px] text-[var(--app-text-muted)]">
                        {sourceLabel(msg.source) && <span>{sourceLabel(msg.source)}</span>}
                        {msg.timestamp && <span>· {msg.timestamp}</span>}
                        <button onClick={() => speakText(msg.text, true)} className="ml-1 p-1 rounded hover:text-[var(--app-text-primary)] cursor-pointer" title="Озвучить">
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleCopyText(msg.id, msg.text)} className="p-1 rounded hover:text-[var(--app-text-primary)] cursor-pointer" title="Копировать">
                          {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

            {isLoading && (
              <div className="flex gap-2.5 items-center">
                <div className="w-7 h-7 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="rounded-2xl rounded-tl-md bg-[var(--app-surface-subtle)] border border-[var(--app-border)] px-4 py-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--app-text-muted)] animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--app-text-muted)] animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--app-text-muted)] animate-bounce [animation-delay:0.3s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick topics */}
          <div className="px-3 pt-2 shrink-0 overflow-x-auto no-scrollbar">
            <div className="flex gap-1.5 whitespace-nowrap pb-1">
              {QUICK_QUESTIONS.map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => handleSendMessage(chip.prompt)}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] text-xs text-[var(--app-text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 shrink-0"
          >
            <div className="flex items-end gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-subtle)] focus-within:border-[var(--accent)] transition-colors px-3 py-2">
              <textarea
                ref={inputRef}
                rows={1}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Напишите вопрос…"
                disabled={isLoading}
                className="flex-1 resize-none bg-transparent border-0 outline-none text-sm text-[var(--app-text-primary)] placeholder:text-[var(--app-text-muted)] max-h-32 py-1"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="w-9 h-9 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
                title="Отправить (Enter)"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-1.5 px-1 text-[11px] text-[var(--app-text-muted)]">
              Enter — отправить, Shift+Enter — новая строка. ИИ может ошибаться: сверяйтесь с официальными правилами.
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
