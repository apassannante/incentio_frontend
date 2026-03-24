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
        // Check if user has a profile in Supabase
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', data.user.id)
          .single();
        if (!profile) {
          router.push('/onboarding');
          return;
        }
        // Verify profile is also synced in backend (profiles.json). Only redirect to
        // onboarding on explicit 404 — if backend is unreachable, proceed normally.
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const backendCheck = await fetch(`${API_BASE}/api/bandi/${data.user.id}`).catch(() => null);
        if (backendCheck && backendCheck.status === 404) {
          // Profile in Supabase but not in backend — re-sync via onboarding
          router.push('/onboarding');
          return;
        }
        router.push(`/risultati?id=${data.user.id}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Errore di autenticazione');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">
            <span className="text-white">Incent</span>
            <span className="text-[#38BDF8]">io</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Trova i fondi pubblici per la tua azienda</p>
        </div>

        <div className="bg-[#0F1F3D] rounded-2xl shadow-xl border border-[#38BDF8]/20 p-8">
          {/* Mode toggle */}
          <div className="flex rounded-xl border border-gray-800 p-1 mb-6">
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setMessage(''); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  mode === m ? 'bg-[#38BDF8] text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                {m === 'login' ? 'Accedi' : 'Registrati'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email aziendale</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@azienda.it"
                  required
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#0A0F1E] border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimo 6 caratteri"
                  required
                  minLength={6}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#0A0F1E] border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8]"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-900/30 border border-red-500/50 rounded-lg px-3 py-2">{error}</p>
            )}
            {message && (
              <p className="text-sm text-[#38BDF8] bg-[#0A0F1E] border border-[#38BDF8]/30 rounded-lg px-3 py-2">{message}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#38BDF8] text-black font-semibold text-sm hover:bg-[#2fa3d6] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {mode === 'login' ? 'Accedi' : 'Crea account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
