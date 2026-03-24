'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { getSchedaBando } from '@/lib/api';
import type { Bando } from '@/lib/types';
import BandoScheda from '@/components/BandoScheda';
import ChecklistDocumenti from '@/components/ChecklistDocumenti';
import ChatPanel from '@/components/ChatPanel';
import GapAnalysisSection from '@/components/GapAnalysisSection';

interface PageProps {
  params: Promise<{ id: string }>;
}

const BANDO_SUGGESTIONS = [
  'Quali documenti servono?',
  'Chi può fare domanda?',
  'Come si presenta la candidatura?',
  'Quali sono i termini di scadenza?',
];

export default function BandoDetailPage({ params }: PageProps) {
  const searchParams = useSearchParams();
  const profileId = searchParams.get('profileId') || '';

  const [id, setId] = useState('');
  const [data, setData] = useState<{
    bando: Bando;
    checklist: string[];
    template_progetto: string;
    giorni_preparazione: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    params.then((p) => {
      setId(p.id);
      getSchedaBando(p.id, profileId)
        .then((res) => setData(res))
        .catch(() => setError('Errore nel caricamento della scheda.'))
        .finally(() => setLoading(false));
    });
  }, [params, profileId]);

  const toggleItem = (doc: string) => {
    setCheckedItems((prev) => ({ ...prev, [doc]: !prev[doc] }));
  };

  const backHref = profileId ? `/risultati?id=${profileId}` : '/risultati';

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0A0F1E]/90 backdrop-blur border-b border-[#38BDF8]/20 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link
            href={backHref}
            className="flex items-center gap-1.5 text-sm text-white/50 hover:text-[#38BDF8] transition-colors"
          >
            <ArrowLeft size={16} />
            Torna ai risultati
          </Link>
          <span className="text-xl font-bold">
            <span className="text-white">Incent</span><span className="text-[#38BDF8]">io</span>
          </span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {loading && (
          <div className="flex flex-col items-center gap-4 py-24">
            <Loader2 className="animate-spin text-[#38BDF8]" size={36} />
            <p className="text-white/50">Caricamento scheda...</p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <AlertCircle size={36} className="text-red-400" />
            <p className="text-white/60">{error}</p>
            <Link href={backHref} className="text-sm text-[#38BDF8] font-semibold hover:underline">
              ← Torna ai risultati
            </Link>
          </div>
        )}

        {!loading && !error && data && (
          <div className="space-y-6">
            <BandoScheda
              bando={data.bando}
              checklist={data.checklist}
              template_progetto={data.template_progetto}
              giorni_preparazione={data.giorni_preparazione}
            />
            <ChecklistDocumenti
              documenti={data.checklist}
              checkedItems={checkedItems}
              onToggle={toggleItem}
            />

            <GapAnalysisSection bandoId={id} profileId={profileId} />

            {/* MODULO D — Chatbot contestuale */}
            <div className="pt-4 border-t border-[#38BDF8]/10">
              <ChatPanel
                profileId={profileId}
                bandoId={id}
                initialMessage={`Ciao! Sono l'assistente di Incentio. Hai domande su "${data.bando.titolo}"? Sono qui per aiutarti.`}
                suggestions={BANDO_SUGGESTIONS}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
