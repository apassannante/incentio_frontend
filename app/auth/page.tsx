'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        router.push('/visura?nuovo=true');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Check if user has a profile in Supabase (by id or user_id)
        const { data: profileById } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single();
        const { data: profileByUserId } = !profileById ? await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', data.user.id)
          .single() : { data: profileById };

        const profile = profileById || profileByUserId;
        if (!profile) {
          // Nessun profilo → visura come primo step
          router.push('/visura?nuovo=true');
          return;
        }

        // Check se ha già una visura caricata
        const { data: visura } = await supabase
          .from('visura_sessions')
          .select('id')
          .eq('user_id', data.user.id)
          .eq('status', 'complete')
          .limit(1)
          .single();

        if (!visura) {
          // Ha profilo ma nessuna visura completata → visura come primo step
          router.push('/visura?nuovo=true');
          return;
        }

        router.push(`/risultati?id=${profile.id}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Errore di autenticazione');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4 font-sans text-zinc-100">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Incentio
          </h1>
          <p className="text-zinc-400 mt-2 text-xs">Trova i fondi pubblici per la tua azienda</p>
        </div>

        <div className="bg-zinc-900/40 rounded-2xl shadow-xl border border-zinc-800 p-8 backdrop-blur-md">
          {/* Mode toggle */}
          <div className="flex rounded-xl border border-zinc-800 p-1 mb-6 bg-zinc-950/40">
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setMessage(''); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  mode === m ? 'bg-zinc-100 text-zinc-950 shadow-sm' : 'text-zinc-450 text-zinc-400 hover:text-white'
                }`}
              >
                {m === 'login' ? 'Accedi' : 'Registrati'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">Email aziendale</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@azienda.it"
                  required
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-950/40 border border-zinc-800 text-zinc-100 placeholder-zinc-600 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-550/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimo 6 caratteri"
                  required
                  minLength={6}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-zinc-950/40 border border-zinc-800 text-zinc-100 placeholder-zinc-600 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-550/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-550 hover:text-zinc-300"
                >
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/30 rounded-lg px-3.5 py-2.5 font-medium">{error}</p>
            )}
            {message && (
              <p className="text-xs text-indigo-400 bg-indigo-950/20 border border-indigo-900/25 rounded-lg px-3.5 py-2.5 font-medium">{message}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-zinc-100 text-zinc-950 font-semibold text-xs hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 mt-2"
            >
              {loading && <Loader2 size={12} className="animate-spin" />}
              {mode === 'login' ? 'Accedi' : 'Crea account'}
            </button>
          </form>

          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-zinc-800/80"></div>
            <span className="flex-shrink mx-4 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Oppure</span>
            <div className="flex-grow border-t border-zinc-800/80"></div>
          </div>

          <button
            type="button"
            onClick={() => router.push('/risultati?id=ffa9a023-4bd8-474c-9b57-f130668c9bc2')}
            className="w-full py-2.5 rounded-xl border border-zinc-800 bg-zinc-950/25 text-zinc-300 font-semibold text-xs hover:bg-zinc-900/40 hover:border-zinc-700 transition-all flex items-center justify-center gap-1.5"
          >
            🚀 Demo Login (Alessio SRL)
          </button>
        </div>
      </div>
    </div>
  );
}
