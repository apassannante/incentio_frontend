'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Circle, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

const STEPS = [
  'Visura caricata',
  'Estrazione dati aziendali',
  'Ricerca bandi compatibili',
  'Generazione report',
];

type Status = 'uploaded' | 'parsing' | 'parsed' | 'advising' | 'complete' | 'error';

const STATUS_STEP_MAP: Record<Status, number> = {
  uploaded: 0,
  parsing: 1,
  parsed: 2,
  advising: 3,
  complete: 4,
  error: -1,
};

function LoadingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sessionId = searchParams.get('session_id') ?? localStorage.getItem('visura_session_id') ?? '';

  const [currentStep, setCurrentStep] = useState(0);
  const [status, setStatus] = useState<Status>('uploaded');
  const [error, setError] = useState('');

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseDone = useRef({ parse: false, advise: false });

  const stopPolling = () => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
  };

  const pollStatus = async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`${API_BASE}/api/visura/status/${sessionId}`);
      if (!res.ok) throw new Error('Status fetch failed');
      const data: { status: Status } = await res.json();
      setStatus(data.status);
      const step = STATUS_STEP_MAP[data.status];
      if (step >= 0) setCurrentStep(step);

      if (data.status === 'complete') {
        stopPolling();
        setTimeout(() => router.push(`/visura/results/${sessionId}`), 600);
      }
      if (data.status === 'error') {
        stopPolling();
        setError('Si è verificato un errore durante l\'elaborazione. Riprova.');
      }
    } catch {
      stopPolling();
      setError('Errore di connessione. Controlla la rete e riprova.');
    }
  };

  useEffect(() => {
    if (!sessionId) {
      setError('Session ID non trovato. Torna all\'upload.');
      return;
    }

    const runPipeline = async () => {
      try {
        // Step 1 — Parse
        if (!phaseDone.current.parse) {
          setCurrentStep(1);
          const parseRes = await fetch(`${API_BASE}/api/visura/parse`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId }),
          });
          if (!parseRes.ok) throw new Error('Parse failed');
          phaseDone.current.parse = true;
        }

        // Step 2 — Advise
        if (!phaseDone.current.advise) {
          setCurrentStep(2);
          const adviseRes = await fetch(`${API_BASE}/api/visura/advise`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId }),
          });
          if (!adviseRes.ok) throw new Error('Advise failed');
          phaseDone.current.advise = true;
        }

        setCurrentStep(3);
        pollingRef.current = setInterval(pollStatus, 2000);
      } catch {
        setError('Errore durante l\'elaborazione. Riprova dall\'inizio.');
      }
    };

    runPipeline();
    return () => stopPolling();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white flex flex-col">
      <header className="sticky top-0 z-50 bg-[#0A0F1E]/90 backdrop-blur border-b border-[#38BDF8]/15 px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <Link href="/" className="text-xl">
            <span className="font-extrabold text-white">Incent</span>
            <span className="font-extrabold text-[#38BDF8]">io</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#38BDF8]/10 mb-4">
              <Loader2 size={32} className="text-[#38BDF8] animate-spin" />
            </div>
            <h1 className="text-2xl font-extrabold text-white mb-2">Analisi in corso…</h1>
            <p className="text-white/50 text-sm">
              Stiamo elaborando la tua visura e cercando i bandi più compatibili.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {STEPS.map((label, i) => {
              const done = currentStep > i;
              const active = currentStep === i && status !== 'error';

              return (
                <div
                  key={i}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300
                    ${done ? 'border-[#38BDF8]/30 bg-[#38BDF8]/5' : ''}
                    ${active ? 'border-[#38BDF8]/50 bg-[#38BDF8]/10' : ''}
                    ${!done && !active ? 'border-white/10 bg-white/2' : ''}`}
                >
                  <div className="shrink-0">
                    {done ? (
                      <CheckCircle2 size={24} className="text-[#38BDF8]" />
                    ) : active ? (
                      <Loader2 size={24} className="text-[#38BDF8] animate-spin" />
                    ) : (
                      <Circle size={24} className="text-white/20" />
                    )}
                  </div>
                  <span className={`text-sm font-medium transition-colors ${done || active ? 'text-white' : 'text-white/30'}`}>
                    {label}
                  </span>
                  {done && (
                    <span className="ml-auto text-xs text-[#38BDF8] font-semibold">Completato</span>
                  )}
                  {active && (
                    <span className="ml-auto text-xs text-[#38BDF8]/60 font-medium">In corso…</span>
                  )}
                </div>
              );
            })}
          </div>

          {error && (
            <div className="mt-6 flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-red-300 text-sm font-semibold">Errore</p>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
              <Link
                href="/visura/upload"
                className="ml-auto shrink-0 text-xs font-bold text-[#38BDF8] hover:underline"
              >
                Riprova
              </Link>
            </div>
          )}

          <p className="text-center text-xs text-white/25 mt-8">
            L&apos;analisi può richiedere da 30 secondi a qualche minuto.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function VisuraLoadingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center"><Loader2 size={32} className="text-[#38BDF8] animate-spin" /></div>}>
      <LoadingContent />
    </Suspense>
  );
}
