'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Send, Brain, FolderOpen, Plus, Trash2, ChevronRight } from 'lucide-react';
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
  fatto: '🏭 Fatto', obiettivo: '🎯 Obiettivo', vincolo: '⚠️ Vincolo',
  decisione: '✅ Decisione', storico: '📋 Storico',
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
      // Prende profileId da localStorage (salvato in onboarding)
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
            // Ricarica memoria se aggiornata
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
      <div className="flex items-center justify-center h-screen text-gray-500">
        <p>Accedi e completa il profilo azienda per usare il Consulting Agent.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r flex flex-col shrink-0">
        <div className="p-4 border-b">
          <h1 className="font-semibold text-gray-900 flex items-center gap-2">
            <Brain size={18} className="text-blue-600" /> Consulting Agent
          </h1>
          <p className="text-xs text-gray-500 mt-1">Memoria persistente · Progetti · Rendicontazione</p>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b text-sm">
          {(['conversazioni', 'memoria'] as const).map(tab => (
            <button key={tab} onClick={() => setSidebarTab(tab)}
              className={`flex-1 py-2 capitalize ${sidebarTab === tab ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500'}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {sidebarTab === 'conversazioni' && (
            <>
              <button onClick={newConversation}
                className="w-full flex items-center gap-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg px-3 py-2 transition-colors">
                <Plus size={16} /> Nuova sessione
              </button>
              {conversations.map(c => (
                <button key={c.id} onClick={() => openConversation(c.id)}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${currentConvId === c.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}`}>
                  <div className="truncate">{c.titolo || 'Sessione senza titolo'}</div>
                  <div className="text-xs text-gray-400">{new Date(c.updated_at).toLocaleDateString('it-IT')}</div>
                </button>
              ))}
            </>
          )}

          {sidebarTab === 'memoria' && (
            <div className="space-y-2">
              {memories.length === 0 && <p className="text-xs text-gray-400 px-2">Nessuna memoria ancora. L'agent memorizzerà automaticamente i fatti importanti.</p>}
              {memories.map(m => (
                <div key={m.id} className="bg-gray-50 rounded-lg p-3 text-xs group relative">
                  <div className="text-blue-600 font-medium mb-1">{TIPO_LABELS[m.tipo] || m.tipo}</div>
                  <div className="text-gray-700">{m.contenuto}</div>
                  {m.tags?.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {m.tags.map(t => <span key={t} className="bg-blue-100 text-blue-600 px-1.5 rounded text-xs">{t}</span>)}
                    </div>
                  )}
                  <button onClick={() => deleteMemory(m.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Link ai progetti */}
        <div className="p-3 border-t">
          <Link href="/projects"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-50">
            <FolderOpen size={16} /> I tuoi progetti
            <ChevronRight size={14} className="ml-auto" />
          </Link>
        </div>
      </aside>

      {/* Chat area */}
      <main className="flex-1 flex flex-col">
        {!currentConvId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-500">
            <Brain size={48} className="text-blue-200 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Consulting Agent</h2>
            <p className="text-sm max-w-md mb-6">
              Il tuo consulente AI per bandi pubblici. Ricorda tutto sul tuo cliente, crea progetti, genera documenti e gestisce la rendicontazione.
            </p>
            <button onClick={newConversation}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2">
              <Plus size={18} /> Inizia una sessione
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.length === 0 && (
                <div className="text-center text-gray-400 text-sm mt-8">
                  Inizia la conversazione. L'agent ha già accesso alla memoria del cliente e ai bandi compatibili.
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-2xl ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                    {/* Tool actions */}
                    {msg.toolActions && msg.toolActions.length > 0 && (
                      <div className="mb-2 space-y-1">
                        {msg.toolActions.map((ta, j) => (
                          <div key={j} className="bg-green-50 border border-green-200 text-green-700 text-xs px-3 py-1.5 rounded-lg flex items-center gap-2">
                            <span>{TOOL_LABELS[ta.name] || ta.name}</span>
                            {ta.result?.message && <span className="text-green-600">— {String(ta.result.message)}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className={`px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-white border text-gray-800 rounded-tl-none shadow-sm'
                    }`}>
                      {msg.content || (loading && i === messages.length - 1 ? <span className="animate-pulse">...</span> : '')}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t bg-white p-4">
              <div className="flex gap-3 max-w-4xl mx-auto">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Scrivi al tuo consulente... (Shift+Enter per andare a capo)"
                  rows={2}
                  className="flex-1 resize-none border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={sendMessage} disabled={loading || !input.trim()}
                  className="bg-blue-600 text-white px-4 rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors flex items-center gap-2">
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
