'use client';

/**
 * ChatPanel — chat contestuale incorporata in una pagina (non standalone).
 * Usato in:
 *  - /bando/[id] — contesto bando specifico
 *  - /onboarding — contesto campo specifico
 *
 * Props:
 *  - profileId: per la persistenza della conversazione su Supabase
 *  - bandoId: se presente, il backend inietta il contesto del bando nel system prompt
 *  - initialMessage: messaggio di benvenuto personalizzato
 *  - suggestions: suggerimenti iniziali
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Bot, X, MessageCircle } from 'lucide-react';
import { clsx } from 'clsx';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

interface ChatPanelProps {
  profileId?: string;
  bandoId?: string;
  initialMessage?: string;
  suggestions?: string[];
  className?: string;
}

export default function ChatPanel({
  profileId,
  bandoId,
  initialMessage = 'Ciao! Sono l\'assistente di Incentio. Come posso aiutarti?',
  suggestions = [],
  className,
}: ChatPanelProps) {
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'assistant', content: initialMessage },
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return;
    setInput('');

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: text.trim() };
    const assistantId = `a-${Date.now()}`;
    const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '', streaming: true };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          profileId: profileId || 'anonymous',
          conversationId,
          bandoId,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      // Capture conversationId from response header
      const newConvId = res.headers.get('X-Conversation-Id');
      if (newConvId && !conversationId) setConversationId(newConvId);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            const text = parsed.text ?? '';
            accumulated += text;
            setMessages((prev) =>
              prev.map((m) => m.id === assistantId ? { ...m, content: accumulated } : m)
            );
          } catch { /* ignore */ }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setMessages((prev) =>
        prev.map((m) => m.id === assistantId
          ? { ...m, content: 'Errore di connessione. Assicurati che il backend sia attivo.', streaming: false }
          : m
        )
      );
    } finally {
      setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, streaming: false } : m));
      setStreaming(false);
      abortRef.current = null;
    }
  }, [messages, streaming, conversationId, profileId, bandoId]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={clsx(
          'flex items-center gap-2.5 px-5 py-3 rounded-xl border-2 border-[#1A7A4A] text-[#1A7A4A] font-semibold text-sm hover:bg-emerald-50 transition-all',
          className
        )}
      >
        <MessageCircle size={18} />
        Non hai capito qualcosa? Chiedi al nostro assistente
      </button>
    );
  }

  return (
    <div className={clsx('border-2 border-[#1A7A4A] rounded-2xl overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#1A7A4A]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <Bot size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold text-white">Assistente Incentio</span>
        </div>
        <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white p-1 rounded-lg transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="h-72 overflow-y-auto px-4 py-4 space-y-3 bg-white scroll-smooth">
        {messages.map((msg) => (
          <div key={msg.id} className={clsx('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                <Bot size={12} className="text-[#1A7A4A]" />
              </div>
            )}
            <div className={clsx(
              'max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
              msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-100 text-[#1C1C1C] rounded-bl-sm'
            )}>
              {msg.content || (msg.streaming && (
                <span className="flex items-center gap-1">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </span>
              ))}
              {msg.streaming && msg.content && (
                <span className="inline-block w-0.5 h-3 bg-[#1A7A4A] ml-0.5 animate-pulse" />
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && suggestions.length > 0 && !streaming && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5 bg-white">
          {suggestions.map((s) => (
            <button key={s} onClick={() => sendMessage(s)}
              className="text-xs bg-emerald-50 text-[#1A7A4A] border border-emerald-200 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors font-medium"
            >{s}</button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-100 bg-white">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Scrivi una domanda..."
            disabled={streaming}
            className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1A7A4A] disabled:opacity-60"
          />
          <button type="submit" disabled={!input.trim() || streaming}
            className="w-9 h-9 rounded-xl bg-[#1A7A4A] text-white flex items-center justify-center hover:bg-[#155f3a] disabled:opacity-40 transition-all"
          >
            {streaming ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </form>
      </div>
    </div>
  );
}
