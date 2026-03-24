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
      <div className="bg-white rounded-2xl p-6 border border-gray-100 flex flex-col items-center text-center gap-4">
        <h2 className="text-lg font-bold text-[#1C1C1C]">Pronto per candidarti?</h2>
        <p className="text-sm text-gray-500 max-w-md">
          Prima di generare il pacchetto, verifichiamo la compatibilità esatta della tua azienda con i requisiti del bando.
        </p>
        <Button onClick={handleAnalyze} className="gap-2 text-base px-6 py-3">
          Genera pacchetto candidatura <ArrowRight size={18} />
        </Button>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-gray-100 flex flex-col items-center text-center gap-4">
        <Loader2 className="animate-spin text-[#1A7A4A] mb-2" size={40} />
        <h2 className="text-lg font-bold text-[#1C1C1C]">Analizzo la compatibilità della tua azienda con questo bando...</h2>
        <p className="text-sm text-gray-500">
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
        <div className="bg-red-50 rounded-2xl p-6 border border-red-100 flex flex-col gap-5">
          <div className="flex items-center gap-3 text-red-700">
            <XCircle size={24} />
            <h2 className="text-lg font-bold">La tua azienda non soddisfa i requisiti minimi</h2>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-red-800">Requisiti bloccanti:</h3>
            <ul className="space-y-2">
              {requisiti_mancanti?.map((req, i) => (
                <li key={i} className="flex gap-2 text-sm text-red-700">
                  <span className="shrink-0 mt-0.5"><AlertCircle size={16} /></span>
                  {req.requisito}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="pt-2">
            <Button variant="secondary" onClick={() => router.push('/bandi')}>
              Torna ai bandi compatibili
            </Button>
          </div>
        </div>
      );
    }

    const isWarning = score_ammissibilita < 60;
    const isGood = score_ammissibilita >= 60;
    
    return (
      <div className={`rounded-2xl p-6 border flex flex-col gap-6 ${isGood ? 'bg-emerald-50 border-emerald-100' : 'bg-yellow-50 border-yellow-100'}`}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {isGood ? (
              <CheckCircle2 size={24} className="text-[#1A7A4A]" />
            ) : (
              <AlertTriangle size={24} className="text-yellow-600" />
            )}
            <h2 className={`text-lg font-bold ${isGood ? 'text-[#1A7A4A]' : 'text-yellow-700'}`}>
              {isGood ? 'La tua azienda è compatibile' : 'Attenzione — verifica questi requisiti prima di candidarti'}
            </h2>
          </div>
          <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-gray-100">
            <span className="text-sm font-semibold text-gray-600">Score: {score_ammissibilita}%</span>
            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${score_ammissibilita >= 80 ? 'bg-emerald-500' : score_ammissibilita >= 60 ? 'bg-yellow-400' : 'bg-red-400'}`}
                style={{ width: `${score_ammissibilita}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requisiti_soddisfatti?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 hover:text-gray-900 transition-colors">Requisiti soddisfatti</h3>
              <ul className="space-y-2">
                {requisiti_soddisfatti.map((req, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-600">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {requisiti_mancanti?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 hover:text-gray-900 transition-colors">Da verificare o mancanti</h3>
              <ul className="space-y-3">
                {requisiti_mancanti.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded shrink-0 mt-0.5 ${
                      req.priorita === 'bloccante' ? 'bg-red-100 text-red-700' : 
                      req.priorita === 'importante' ? 'bg-yellow-100 text-yellow-700' : 
                      'bg-gray-200 text-gray-700'
                    }`}>
                      {req.priorita}
                    </span>
                    <span className="text-gray-700">{req.requisito}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 pt-4 border-t border-black/5">
          {isGood ? (
            <Button onClick={handleProceed} className="gap-2">
              Procedi con il pacchetto completo <ArrowRight size={16} />
            </Button>
          ) : (
            <>
              <Button onClick={() => router.push('/bandi')} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                Torna ai bandi
              </Button>
              <Button onClick={handleProceed} variant="secondary">
                Procedi comunque <ArrowRight size={16} />
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}
