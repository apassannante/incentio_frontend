'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X } from 'lucide-react';
import { fetchAuth } from '@/lib/fetchAuth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_CHIPS = [
  'Da dove inizio per il bando con lo score più alto?',
  'Quali documenti raccogliere per prima cosa?',
  'Vale la pena aprire un nuovo codice ATECO?',
];

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\n/g, '<br />');
}

interface ChatBotProps {
  sessionId: string;
}

export default function ChatBot({ sessionId }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chipsVisible, setChipsVisible] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return;
    setChipsVisible(false);

    const newMessages: Message[] = [...messages, { role: 'user', content: content.trim() }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetchAuth(`${API_BASE}/api/visura/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, messages: newMessages }),
      });

      if (!res.ok) throw new Error('Chat API error');
      const data: { reply: string } = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Si è verificato un errore. Riprova tra un momento.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#0D1829] border-r border-white/10">
      {/* Header */}
      <div className="shrink-0 px-4 py-4 border-b border-white/10 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#38BDF8]/10 flex items-center justify-center shrink-0">
          <Bot size={18} className="text-[#38BDF8]" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Consulente Incentio</p>
          <p className="text-xs text-white/40">Basato sulla tua visura</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 min-h-0">
        {messages.length === 0 && !loading && (
          <div className="text-center py-6">
            <p className="text-white/30 text-xs">
              Chiedimi qualsiasi cosa sui tuoi bandi e sulla tua visura.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2.5 text-sm leading-relaxed
                ${msg.role === 'user'
                  ? 'bg-[#38BDF8] text-[#0A0F1E] font-medium rounded-br-sm'
                  : 'bg-white/8 text-white/90 rounded-bl-sm border border-white/10'
                }`}
            >
              {msg.role === 'assistant' ? (
                <span
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                />
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/8 border border-white/10 rounded-xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick chips */}
      {chipsVisible && messages.length === 0 && (
        <div className="shrink-0 px-4 pb-3 flex flex-col gap-2">
          <p className="text-xs text-white/30 mb-1">Domande rapide:</p>
          {QUICK_CHIPS.map((chip, i) => (
            <button
              key={i}
              onClick={() => sendMessage(chip)}
              disabled={loading}
              className="text-left text-xs px-3 py-2 rounded-lg bg-white/5 hover:bg-[#38BDF8]/10 border border-white/10 hover:border-[#38BDF8]/30 text-white/70 hover:text-white transition-all"
            >
              {chip}
            </button>
          ))}
          <button
            onClick={() => setChipsVisible(false)}
            className="flex items-center gap-1 text-xs text-white/25 hover:text-white/50 transition-colors self-end mt-0.5"
          >
            <X size={12} /> Chiudi
          </button>
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 px-4 pb-4 pt-2 border-t border-white/10">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Scrivi un messaggio…"
            disabled={loading}
            className="flex-1 resize-none rounded-xl bg-white/5 border border-white/15 focus:border-[#38BDF8]/50 text-white text-sm px-3 py-2.5 placeholder:text-white/25 outline-none focus:ring-0 transition-colors disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all
              ${input.trim() && !loading
                ? 'bg-[#38BDF8] text-[#0A0F1E] hover:opacity-90 shadow-lg shadow-[#38BDF8]/20'
                : 'bg-white/10 text-white/20 cursor-not-allowed'
              }`}
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-xs text-white/20 mt-1.5">Enter per inviare · Shift+Enter per nuova riga</p>
      </div>
    </div>
  );
}
