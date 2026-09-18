import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, AlertTriangle, AlertCircle, ArrowRight, XCircle } from 'lucide-react';
import { startApplication, GapAnalysis } from '@/lib/api';
import Button from './ui/Button';

interface GapAnalysisSectionProps {
  bandoId: string;
  profileId: string;
}

export default function GapAnalysisSection({ bandoId, profileId }: GapAnalysisSectionProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<GapAnalysis | null>(null);
  const [appId, setAppId] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function handleAnalyze() {
    setLoading(true);
    setError('');
    try {
      const res = await startApplication(bandoId, profileId);
      setAnalysis(res.gap_analysis);
      if (res.id) setAppId(res.id);
    } catch (err) {
      console.error(err);
      setError('Errore durante l\'analisi. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  }

  function handleProceed() {
    if (appId) {
      router.push(`/application/${appId}?profileId=${profileId}`);
    } else {
      router.push(`/application/${bandoId}?profileId=${profileId}`); // fallback
    }
  }

  if (!loading && !analysis) {
    return (
      <div className="bg-zinc-900/20 rounded-2xl p-6 border border-zinc-800 flex flex-col items-center text-center gap-4 shadow-sm">
        <h2 className="text-sm font-bold text-white uppercase tracking-widest">Pronto per candidarti?</h2>
        <p className="text-xs text-zinc-400 max-w-md font-normal leading-relaxed">
          Prima di generare il pacchetto, verifichiamo la compatibilità esatta della tua azienda con i requisiti del bando.
        </p>
        <Button onClick={handleAnalyze} className="gap-2 text-xs font-bold px-5 py-2.5">
          Genera pacchetto candidatura <ArrowRight size={14} />
        </Button>
        {error && <p className="text-xs text-red-400 font-semibold">{error}</p>}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-zinc-900/20 rounded-2xl p-8 border border-zinc-800 flex flex-col items-center text-center gap-4 shadow-sm">
        <Loader2 className="animate-spin text-zinc-500 mb-2" size={32} />
        <h2 className="text-sm font-bold text-white uppercase tracking-widest">Analizzo la compatibilità...</h2>
        <p className="text-xs text-zinc-400 font-normal">
          Stiamo confrontando i tuoi dati con i requisiti minimi del bando.
        </p>
      </div>
    );
  }

  if (analysis) {
    const { score_ammissibilita, ammissibile, requisiti_soddisfatti, requisiti_mancanti } = analysis;
    
    // Panel 4. HTTP 422 (ammissibile: false)
    if (!ammissibile) {
      return (
        <div className="bg-red-950/10 rounded-2xl p-6 border border-red-900/20 flex flex-col gap-5 text-red-300">
          <div className="flex items-center gap-3 text-red-400">
            <XCircle size={20} />
            <h2 className="text-sm font-bold uppercase tracking-wider">La tua azienda non soddisfa i requisiti minimi</h2>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-red-400 uppercase tracking-wide">Requisiti bloccanti:</h3>
            <ul className="space-y-2">
              {requisiti_mancanti?.map((req, i) => (
                <li key={i} className="flex gap-2 text-xs text-red-300 font-medium">
                  <span className="shrink-0 mt-0.5"><AlertCircle size={14} className="text-red-400" /></span>
                  {req.requisito}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="pt-2">
            <Button variant="secondary" onClick={() => router.push('/bandi')} className="text-xs">
              Torna ai bandi compatibili
            </Button>
          </div>
        </div>
      );
    }

    const isWarning = score_ammissibilita < 60;
    const isGood = score_ammissibilita >= 60;
    
    return (
      <div className={`rounded-2xl p-6 border flex flex-col gap-6 ${isGood ? 'bg-emerald-950/10 border-emerald-900/20 text-emerald-300' : 'bg-amber-950/10 border-amber-900/20 text-amber-300'}`}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {isGood ? (
              <CheckCircle2 size={20} className="text-emerald-400" />
            ) : (
              <AlertTriangle size={20} className="text-amber-400" />
            )}
            <h2 className={`text-sm font-bold uppercase tracking-wider ${isGood ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isGood ? 'La tua azienda è compatibile' : 'Attenzione — verifica questi requisiti prima di candidarti'}
            </h2>
          </div>
          <div className="flex items-center gap-3 bg-zinc-950/50 px-3 py-1.5 rounded-lg border border-zinc-850">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Score: {score_ammissibilita}%</span>
            <div className="w-20 h-1.5 bg-zinc-900 border border-zinc-850 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${score_ammissibilita >= 80 ? 'bg-emerald-500' : score_ammissibilita >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${score_ammissibilita}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requisiti_soddisfatti?.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wide mb-3">Requisiti soddisfatti</h3>
              <ul className="space-y-2">
                {requisiti_soddisfatti.map((req, i) => (
                  <li key={i} className="flex gap-2 text-xs text-zinc-300 font-medium">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {requisiti_mancanti?.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wide mb-3">Da verificare o mancanti</h3>
              <ul className="space-y-3">
                {requisiti_mancanti.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs font-medium">
                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded shrink-0 mt-0.5 ${
                      req.priorita === 'bloccante' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                      req.priorita === 'importante' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                      'bg-zinc-800 text-zinc-400 border border-zinc-750'
                    }`}>
                      {req.priorita}
                    </span>
                    <span className="text-zinc-300">{req.requisito}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 pt-4 border-t border-zinc-900 justify-end">
          {isGood ? (
            <Button onClick={handleProceed} className="gap-2 text-xs font-bold">
              Procedi con il pacchetto completo <ArrowRight size={14} />
            </Button>
          ) : (
            <>
              <Button onClick={() => router.push('/bandi')} className="bg-amber-500 text-zinc-950 hover:bg-amber-400 text-xs font-bold">
                Torna ai bandi
              </Button>
              <Button onClick={handleProceed} variant="secondary" className="text-xs">
                Procedi comunque <ArrowRight size={14} />
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}
