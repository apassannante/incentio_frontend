'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Loader2, Save, Check } from 'lucide-react';
import { API_BASE } from '@/lib/config';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_CHIPS = [
  'Sviluppa un piano di progetto completo per questo bando',
  'Quali KPI quantitativi posso proporre?',
  'Suggerisci un quadro logico (4 livelli) per la candidatura',
  'Quali partner cercare per rafforzare la proposta?',
];

function renderMarkdown(text: string): React.ReactNode {
  const lines = (text || '').split('\n');
  return lines.map((line, idx) => {
    if (/^## /.test(line)) {
      return <h4 key={idx} className="text-base font-bold text-[#38BDF8] mt-3 mb-1">{line.replace(/^## /, '')}</h4>;
    }
    if (/^### /.test(line)) {
      return <h5 key={idx} className="text-sm font-semibold text-white mt-2 mb-1">{line.replace(/^### /, '')}</h5>;
    }
    const isBullet = /^- /.test(line);
    const content = isBullet ? line.replace(/^- /, '') : line;
    const parts = content.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={i}>{p.slice(2, -2)}</strong>
        : <React.Fragment key={i}>{p}</React.Fragment>
    );
    if (isBullet) return <li key={idx} className="ml-5 list-disc text-white/85">{parts}</li>;
    return <React.Fragment key={idx}>{parts}{idx < lines.length - 1 && <br />}</React.Fragment>;
  });
}

function extractSectionTitle(content: string): string {
  const heading = content.match(/^##\s+(.+)$/m);
  if (heading) return heading[1].trim().slice(0, 80);
  const firstLine = content.split('\n').find(l => l.trim().length > 0);
  return (firstLine || 'Sezione progettuale').slice(0, 80);
}

interface ApplicationChatProps {
  applicationId: string;
}

export default function ApplicationChat({ applicationId }: ApplicationChatProps) {
  const cacheKey = `incentio_app_chat_${applicationId}`;
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem(cacheKey) || '[]'); } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [exportingIdx, setExportingIdx] = useState<number | null>(null);
  const [exportedIdx, setExportedIdx] = useState<Set<number>>(new Set());
  const [chipsVisible, setChipsVisible] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    try { localStorage.setItem(cacheKey, JSON.stringify(messages)); } catch {}
  }, [messages, cacheKey]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return;
    setChipsVisible(false);
    const newMessages: Message[] = [...messages, { role: 'user', content: content.trim() }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/application/${applicationId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      if (!res.ok) throw new Error('http ' + res.status);
      const data: { reply: string } = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Errore di connessione. Riprova tra un momento.' }]);
    } finally {
      setLoading(false);
    }
  };

  const exportToApplication = async (idx: number) => {
    if (exportingIdx !== null || exportedIdx.has(idx)) return;
    const msg = messages[idx];
    if (!msg || msg.role !== 'assistant') return;
    setExportingIdx(idx);
    try {
      const titolo = extractSectionTitle(msg.content);
      const res = await fetch(`${API_BASE}/api/application/${applicationId}/append-section`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titolo, contenuto: msg.content }),
      });
      if (!res.ok) throw new Error('http ' + res.status);
      setExportedIdx(prev => new Set(prev).add(idx));
    } catch (e) {
      alert('Esportazione fallita: ' + (e instanceof Error ? e.message : 'errore'));
    } finally {
      setExportingIdx(null);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[500px] bg-[#0D1829] border border-white/10 rounded-xl">
      <div className="shrink-0 px-4 py-3 border-b border-white/10 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#38BDF8]/10 flex items-center justify-center">
          <Bot size={18} className="text-[#38BDF8]" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">Sviluppa la tua candidatura</p>
          <p className="text-xs text-white/40">Chiedi piani di progetto, KPI, partenariati — esporta direttamente nella candidatura</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 min-h-0">
        {messages.length === 0 && (
          <p className="text-white/30 text-xs text-center py-4">
            Sviluppiamo insieme il piano per questo bando.
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] rounded-xl px-3 py-2.5 text-sm leading-relaxed
              ${msg.role === 'user'
                ? 'bg-[#38BDF8] text-[#0A0F1E] font-medium rounded-br-sm'
                : 'bg-white/8 text-white/90 rounded-bl-sm border border-white/10'}`}>
              {msg.role === 'assistant' ? (
                <>
                  <div>{renderMarkdown(msg.content)}</div>
                  <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-end">
                    {exportedIdx.has(i) ? (
                      <span className="flex items-center gap-1.5 text-xs text-green-400 font-semibold">
                        <Check size={12} /> Esportato nella candidatura
                      </span>
                    ) : (
                      <button onClick={() => exportToApplication(i)} disabled={exportingIdx === i}
                        className="flex items-center gap-1.5 text-xs text-[#38BDF8] hover:text-[#38BDF8]/80 font-semibold disabled:opacity-50">
                        {exportingIdx === i ? <><Loader2 size={11} className="animate-spin" /> Esporto…</> : <><Save size={11} /> Esporta nella candidatura</>}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/8 border border-white/10 rounded-xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:120ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:240ms]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {chipsVisible && messages.length === 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {QUICK_CHIPS.map(chip => (
            <button key={chip} onClick={() => sendMessage(chip)}
              className="text-xs px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:border-[#38BDF8]/40 transition-all">
              {chip}
            </button>
          ))}
        </div>
      )}

      <div className="shrink-0 p-3 border-t border-white/10 flex items-end gap-2">
        <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKeyDown}
          placeholder="Sviluppa un piano di progetto, chiedi KPI, partenariati…" rows={1}
          className="flex-1 resize-none bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#38BDF8]/50 max-h-32" />
        <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
          className="shrink-0 w-9 h-9 rounded-xl bg-[#38BDF8] text-[#0A0F1E] flex items-center justify-center hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
