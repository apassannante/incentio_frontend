'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { MessageCircle, X, Send, Loader2, Bot, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    streaming?: boolean;
}

const SUGGESTIONS = [
    'Quali bandi sono aperti adesso?',
    'Cosa serve per il bando Industria 4.0?',
    'Cos\'è il de minimis?',
];

export default function ChatWidget() {
    const searchParams = useSearchParams();
    const profileId = searchParams.get('id') || searchParams.get('profileId') || undefined;

    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content:
                'Ciao! Sono l\'assistente di Incentio. Posso aiutarti a capire i bandi, i requisiti e i documenti necessari. Cosa vuoi sapere?',
        },
    ]);
    const [input, setInput] = useState('');
    const [streaming, setStreaming] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const abortRef = useRef<AbortController | null>(null);
    const convIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [open]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = useCallback(
        async (text: string) => {
            if (!text.trim() || streaming) return;
            setInput('');

            const userMsg: Message = {
                id: `u-${Date.now()}`,
                role: 'user',
                content: text.trim(),
            };
            const assistantId = `a-${Date.now()}`;
            const assistantMsg: Message = {
                id: assistantId,
                role: 'assistant',
                content: '',
                streaming: true,
            };

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
                        profileId,
                        conversationId: convIdRef.current,
                    }),
                    signal: controller.signal,
                });

                if (!res.ok || !res.body) {
                    throw new Error(`HTTP ${res.status}`);
                }

                // Salva conversationId per messaggi successivi
                const newConvId = res.headers.get('X-Conversation-Id');
                if (newConvId) convIdRef.current = newConvId;

                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let accumulated = '';
                let buffer = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });

                    // Processa linee SSE complete
                    const lines = buffer.split('\n');
                    buffer = lines.pop() ?? ''; // tieni l'ultima linea incompleta

                    for (const line of lines) {
                        if (!line.startsWith('data: ')) continue;
                        const payload = line.slice(6).trim();
                        if (payload === '[DONE]') continue;
                        try {
                            const parsed = JSON.parse(payload);
                            // Backend Anthropic invia { text: "..." }
                            const chunk = parsed?.text ?? parsed?.content ?? '';
                            if (chunk) {
                                accumulated += chunk;
                                setMessages((prev) =>
                                    prev.map((m) =>
                                        m.id === assistantId ? { ...m, content: accumulated } : m
                                    )
                                );
                            }
                        } catch {
                            // linea non JSON, ignora
                        }
                    }
                }
            } catch (err: unknown) {
                if (err instanceof Error && err.name === 'AbortError') return;
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === assistantId
                            ? {
                                ...m,
                                content:
                                    'Ops, si è verificato un errore. Assicurati che il backend sia attivo su localhost:3001.',
                                streaming: false,
                            }
                            : m
                    )
                );
            } finally {
                setMessages((prev) =>
                    prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m))
                );
                setStreaming(false);
                abortRef.current = null;
            }
        },
        [messages, streaming]
    );

    return (
        <>
            {/* Backdrop (mobile) */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 sm:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Drawer */}
            <div
                className={clsx(
                    'fixed right-0 top-0 h-full z-50 flex flex-col bg-white shadow-2xl border-l border-gray-100 transition-all duration-300 ease-in-out',
                    'w-full sm:w-[380px]',
                    open ? 'translate-x-0' : 'translate-x-full'
                )}
                aria-hidden={!open}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-[#1A7A4A]">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                            <Bot size={16} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-white leading-none">Assistente Incentio</h2>
                            <p className="text-xs text-green-200 mt-0.5">Online</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setOpen(false)}
                        className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
                        aria-label="Chiudi chat"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 scroll-smooth">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={clsx('flex gap-2.5', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                        >
                            {msg.role === 'assistant' && (
                                <div className="w-7 h-7 rounded-full bg-[#1A7A4A]/10 flex items-center justify-center shrink-0 mt-0.5">
                                    <Bot size={14} className="text-[#1A7A4A]" />
                                </div>
                            )}
                            <div
                                className={clsx(
                                    'max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                                    msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-br-sm'
                                        : 'bg-[#F5F7FA] text-[#1C1C1C] rounded-bl-sm border border-gray-100'
                                )}
                            >
                                {msg.content || (msg.streaming && (
                                    <span className="flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                                    </span>
                                ))}
                                {msg.streaming && msg.content && (
                                    <span className="inline-block w-0.5 h-3.5 bg-[#1A7A4A] ml-0.5 animate-pulse" />
                                )}
                            </div>
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>

                {/* Suggestions (show only initially) */}
                {messages.length <= 2 && !streaming && (
                    <div className="px-4 pb-2 flex flex-wrap gap-2">
                        {SUGGESTIONS.map((s) => (
                            <button
                                key={s}
                                onClick={() => sendMessage(s)}
                                className="flex items-center gap-1 text-xs bg-[#F5F7FA] text-[#1A7A4A] border border-emerald-100 px-3 py-1.5 rounded-full hover:bg-emerald-50 transition-colors font-medium"
                            >
                                <ChevronRight size={11} />
                                {s}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input */}
                <div className="px-4 py-4 border-t border-gray-100 bg-white">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            sendMessage(input);
                        }}
                        className="flex items-center gap-2"
                    >
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Scrivi un messaggio..."
                            disabled={streaming}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-[#F5F7FA] focus:outline-none focus:ring-2 focus:ring-[#1A7A4A] focus:border-transparent disabled:opacity-60 transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || streaming}
                            className="w-10 h-10 rounded-xl bg-[#1A7A4A] text-white flex items-center justify-center hover:bg-[#155f3a] disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                            aria-label="Invia"
                        >
                            {streaming ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Send size={16} />
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* FAB button */}
            <button
                onClick={() => setOpen((o) => !o)}
                className={clsx(
                    'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300',
                    'bg-[#1A7A4A] text-white hover:bg-[#155f3a] hover:scale-105 active:scale-95',
                    open && 'opacity-0 pointer-events-none translate-x-4'
                )}
                aria-label="Apri chat assistente"
            >
                <MessageCircle size={24} />
                {/* Pulse indicator */}
                <span className="absolute top-1 right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
            </button>
        </>
    );
}
