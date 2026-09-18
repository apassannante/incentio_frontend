'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Send, Brain, FolderOpen, Plus, Trash2, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Message = { role: 'user' | 'assistant'; content: string; toolActions?: ToolAction[] };
type ToolAction = { name: string; result: Record<string, unknown> };
type Memory = { id: string; tipo: string; contenuto: string; tags: string[]; created_at: string };
type Conversation = { id: string; titolo: string | null; updated_at: string };

const TIPO_LABELS: Record<string, string> = {
  fatto: '🏭 Fatto',
  obiettivo: '🎯 Obiettivo',
  vincolo: '⚠️ Vincolo',
  decisione: '✅ Decisione',
  storico: '📋 Storico',
};

const TOOL_LABELS: Record<string, string> = {
  salva_memoria: '🧠 Memoria salvata',
  crea_progetto: '📁 Progetto creato',
  aggiorna_milestone: '✅ Milestone aggiornata',
  genera_documento: '📄 Documento generato',
  aggiungi_rendicontazione: '💶 Rendicontazione registrata',
};

export default function ConsultingPage() {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'memoria' | 'conversazioni'>('conversazioni');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      if (!session) return;
      setToken(session.access_token);
      const pid = localStorage.getItem('incentio_profile_id');
      if (pid) {
        setProfileId(pid);
        loadConversations(pid, session.access_token);
        loadMemories(pid, session.access_token);
      }
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function authHeaders() {
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  async function loadConversations(pid: string, tok: string) {
    const r = await fetch(`${API}/api/consulting/conversations/${pid}`, { headers: { Authorization: `Bearer ${tok}` } });
    if (r.ok) setConversations(await r.json());
  }

  async function loadMemories(pid: string, tok: string) {
    const r = await fetch(`${API}/api/consulting/memory/${pid}`, { headers: { Authorization: `Bearer ${tok}` } });
    if (r.ok) setMemories(await r.json());
  }

  async function newConversation() {
    if (!profileId) return;
    const r = await fetch(`${API}/api/consulting/conversations`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ profileId, titolo: 'Nuova sessione' }),
    });
    if (r.ok) {
      const { id } = await r.json();
      setCurrentConvId(id);
      setMessages([]);
      loadConversations(profileId, token!);
    }
  }

  async function openConversation(id: string) {
    setCurrentConvId(id);
    const r = await fetch(`${API}/api/consulting/conversation/${id}/messages`, { headers: await authHeaders() });
    if (r.ok) {
      const msgs = await r.json();
      setMessages(msgs.map((m: { role: 'user' | 'assistant'; content: string }) => ({ role: m.role, content: m.content })));
    }
  }

  async function sendMessage() {
    if (!input.trim() || !currentConvId || !profileId || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    const r = await fetch(`${API}/api/consulting/chat`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ conversationId: currentConvId, profileId, message: userMsg }),
    });

    if (!r.ok || !r.body) { setLoading(false); return; }

    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    let assistantText = '';
    const toolActions: ToolAction[] = [];

    setMessages(prev => [...prev, { role: 'assistant', content: '', toolActions: [] }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value).split('\n').filter(l => l.startsWith('data: '));
      for (const line of lines) {
        const payload = line.slice(6);
        if (payload === '[DONE]') break;
        try {
          const data = JSON.parse(payload);
          if (data.text) {
            assistantText += data.text;
            setMessages(prev => {
              const copy = [...prev];
              copy[copy.length - 1] = { role: 'assistant', content: assistantText, toolActions };
              return copy;
            });
          }
          if (data.tool_action) {
            toolActions.push(data.tool_action);
            setMessages(prev => {
              const copy = [...prev];
              copy[copy.length - 1] = { role: 'assistant', content: assistantText, toolActions: [...toolActions] };
              return copy;
            });
            if (data.tool_action.name === 'salva_memoria') loadMemories(profileId, token!);
          }
        } catch {}
      }
    }

    setLoading(false);
  }

  async function deleteMemory(id: string) {
    await fetch(`${API}/api/consulting/memory/${id}`, { method: 'DELETE', headers: await authHeaders() });
    setMemories(prev => prev.filter(m => m.id !== id));
  }

  if (!profileId) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#09090b] text-zinc-500">
        <p className="text-xs font-medium">Accedi e completa il profilo azienda per usare il Consulting Agent.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 antialiased overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-[#121214] border-r border-zinc-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-zinc-800/60">
          <Link href="/" className="flex items-center gap-2 group">
            <Brain size={18} strokeWidth={1.5} className="text-white group-hover:scale-105 transition-transform" />
            <h1 className="font-semibold text-white text-sm tracking-tight">
              Consulting Agent
            </h1>
          </Link>
          <p className="text-[10px] text-zinc-500 mt-1 font-medium">Memoria persistente · Progetti · Rendicontazione</p>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-zinc-800/60 text-xs">
          {(['conversazioni', 'memoria'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSidebarTab(tab)}
              type="button"
              className={`flex-1 py-3 font-semibold capitalize transition-all border-b ${
                sidebarTab === tab
                  ? 'border-zinc-100 text-white bg-zinc-800/10'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
          {sidebarTab === 'conversazioni' && (
            <>
              <button
                onClick={newConversation}
                type="button"
                className="w-full flex items-center justify-center gap-1.5 text-xs bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 rounded-lg py-2 transition-all font-medium mb-2"
              >
                <Plus size={14} strokeWidth={1.5} /> Nuova sessione
              </button>
              <div className="space-y-1">
                {conversations.map(c => (
                  <button
                    key={c.id}
                    onClick={() => openConversation(c.id)}
                    type="button"
                    className={`w-full text-left text-xs px-3 py-2.5 rounded-lg transition-all border ${
                      currentConvId === c.id
                        ? 'bg-zinc-850 border-zinc-800 text-white font-medium'
                        : 'border-transparent hover:bg-zinc-900/40 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="truncate font-semibold tracking-tight">{c.titolo || 'Sessione senza titolo'}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5 font-medium">{new Date(c.updated_at).toLocaleDateString('it-IT')}</div>
                  </button>
                ))}
              </div>
            </>
          )}

          {sidebarTab === 'memoria' && (
            <div className="space-y-2">
              {memories.length === 0 && (
                <p className="text-[11px] text-zinc-500 px-2 py-4 text-center leading-relaxed">
                  Nessuna memoria ancora. L'agent memorizzerà automaticamente i fatti importanti durante la conversazione.
                </p>
              )}
              {memories.map(m => (
                <div
                  key={m.id}
                  className="bg-[#18181b]/40 border border-zinc-850 rounded-lg p-3 text-[11px] group relative hover:border-zinc-800 transition-colors"
                >
                  <div className="text-zinc-350 font-semibold mb-1 uppercase tracking-wider text-[9px]">{TIPO_LABELS[m.tipo] || m.tipo}</div>
                  <div className="text-zinc-350 leading-normal">{m.contenuto}</div>
                  {m.tags?.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {m.tags.map(t => (
                        <span key={t} className="bg-zinc-900 text-zinc-450 border border-zinc-850 px-1 py-0.5 rounded text-[9px] font-mono">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => deleteMemory(m.id)}
                    type="button"
                    className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-opacity p-1 hover:bg-zinc-900 rounded"
                  >
                    <Trash2 size={11} strokeWidth={1.5} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Link ai progetti */}
        <div className="p-3 border-t border-zinc-800">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-all px-3 py-2.5 rounded-lg hover:bg-zinc-900/50 font-medium"
          >
            <FolderOpen size={14} strokeWidth={1.5} className="text-zinc-500" />
            <span>Dashboard Bandi</span>
            <ChevronRight size={12} className="ml-auto text-zinc-650" />
          </Link>
        </div>
      </aside>

      {/* Chat area */}
      <main className="flex-1 flex flex-col bg-[#09090b]">
        {!currentConvId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-zinc-500 space-y-4 max-w-md mx-auto">
            <div className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center bg-zinc-900/50">
              <Brain size={18} strokeWidth={1.5} className="text-zinc-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-200 tracking-tight">Consulente AI Incentio</h2>
              <p className="text-xs text-zinc-450 mt-1 leading-relaxed">
                Il tuo consulente AI per bandi pubblici. Ricorda fatti aziendali e vincoli sul tuo profilo, crea bozze dei progetti, genera documenti ed assiste nella candidatura.
              </p>
            </div>
            <button
              onClick={newConversation}
              type="button"
              className="bg-white text-black text-xs font-semibold px-4 py-2 rounded-lg hover:bg-zinc-200 transition-all flex items-center gap-1.5 focus:outline-none"
            >
              <Plus size={14} strokeWidth={1.5} /> Inizia una sessione
            </button>
          </div>
        ) : (
          <>
            {/* Active chat header */}
            <div className="h-14 border-b border-zinc-900 px-6 flex items-center justify-between shrink-0 bg-[#09090b]/80 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Brain size={14} className="text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-200">
                  {conversations.find(c => c.id === currentConvId)?.titolo || 'Sessione Chat'}
                </span>
              </div>
              {loading && (
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-medium">
                  <Loader2 size={10} className="animate-spin" />
                  Consulente sta scrivendo...
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {messages.length === 0 && (
                <div className="text-center text-zinc-550 text-xs mt-8 max-w-sm mx-auto leading-relaxed font-medium">
                  Inizia la conversazione. L&apos;agent ha già accesso al profilo del cliente, ai bandi compatibili ed all&apos;azienda_context.md per fornirti risposte altamente personalizzate.
                </div>
              )}
              <div className="space-y-4 max-w-3xl mx-auto">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-xl space-y-1.5">
                      {/* Tool actions */}
                      {msg.toolActions && msg.toolActions.length > 0 && (
                        <div className="space-y-1">
                          {msg.toolActions.map((ta, j) => (
                            <div
                              key={j}
                              className="bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 text-[10px] px-3 py-1.5 rounded-md flex items-center gap-2 font-medium"
                            >
                              <span>{TOOL_LABELS[ta.name] || ta.name}</span>
                              {!!ta.result?.message && (
                                <span className="text-emerald-500/80 font-normal">
                                  — {String(ta.result.message)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <div
                        className={`px-4 py-3 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
                          msg.role === 'user'
                            ? 'bg-zinc-100 text-zinc-950 font-semibold rounded-tr-none'
                            : 'bg-[#121214] border border-zinc-850 text-zinc-200 rounded-tl-none shadow-sm'
                        }`}
                      >
                        {msg.content || (loading && i === messages.length - 1 ? (
                          <span className="flex items-center gap-1 text-zinc-500">
                            <span className="animate-bounce font-bold">.</span>
                            <span className="animate-bounce font-bold delay-75">.</span>
                            <span className="animate-bounce font-bold delay-150">.</span>
                          </span>
                        ) : '')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-zinc-900 bg-[#09090b] p-4 shrink-0">
              <div className="flex gap-3 max-w-3xl mx-auto items-end bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2.5 focus-within:ring-1 focus-within:ring-zinc-700 transition-all">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Scrivi al tuo consulente... (Enter per inviare, Shift+Enter per andare a capo)"
                  rows={1}
                  className="flex-1 resize-none bg-transparent text-zinc-100 text-xs placeholder-zinc-650 focus:outline-none max-h-32 min-h-[24px] py-1 leading-relaxed"
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  type="button"
                  className="bg-white hover:bg-zinc-200 disabled:opacity-40 text-black p-2 rounded-lg transition-all focus:outline-none"
                >
                  <Send size={14} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
