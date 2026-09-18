'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, ChevronRight, Building2, Users, MapPin, Settings, Bell, Search } from 'lucide-react';

const SETTORI_GROUPS = [
  { sezione: 'Manifattura (C)', voci: [
    { value: '10', label: '10 — Industria alimentare' },
    { value: '13', label: '13 — Industria tessile' },
    { value: '22', label: '22 — Materie plastiche e gomma' },
    { value: '25', label: '25 — Lavorazione metalli' },
    { value: '28', label: '28 — Fabbricazione macchinari' },
    { value: '29', label: '29 — Automotive' },
    { value: '30', label: '30 — Altri mezzi di trasporto' },
    { value: '32', label: '32 — Altre manifatture' },
  ]},
  { sezione: 'IT e Software (J)', voci: [
    { value: '62', label: '62 — Sviluppo software e consulenza IT' },
    { value: '62.01', label: '62.01 — Produzione di software' },
    { value: '62.02', label: '62.02 — Consulenza IT' },
    { value: '63.11', label: '63.11 — Data center e hosting' },
    { value: '63.12', label: '63.12 — Portali web' },
  ]},
  { sezione: 'Ricerca e Ingegneria (M)', voci: [
    { value: '71.12', label: '71.12 — Studi di ingegneria' },
    { value: '71.20', label: '71.20 — Collaudi e analisi tecniche' },
    { value: '72', label: '72 — Ricerca e sviluppo' },
    { value: '72.19', label: '72.19 — R&D scienze naturali' },
    { value: '72.20', label: '72.20 — R&D scienze sociali' },
  ]},
  { sezione: 'Energia (D)', voci: [
    { value: '35', label: '35 — Fornitura energia e gas' },
    { value: '35.11', label: '35.11 — Produzione energia elettrica' },
    { value: '35.13', label: '35.13 — Distribuzione energia' },
    { value: '35.30', label: '35.30 — Vapore e aria condizionata' },
  ]},
  { sezione: 'Ambiente e Rifiuti (E)', voci: [
    { value: '38.21', label: '38.21 — Trattamento rifiuti' },
    { value: '38.32', label: '38.32 — Recupero e riciclo' },
    { value: '39.00', label: '39.00 — Risanamento ambientale' },
  ]},
  { sezione: 'Logistica e Trasporti (H)', voci: [
    { value: '49.41', label: '49.41 — Trasporto merci su strada' },
    { value: '52.10', label: '52.10 — Magazzinaggio' },
    { value: '52.21', label: '52.21 — Servizi trasporti' },
  ]},
  { sezione: 'Istruzione e Sanità (P/Q)', voci: [
    { value: '85.42', label: '85.42 — Università e ricerca' },
    { value: '85.59', label: '85.59 — Altri tipi di istruzione' },
    { value: '86.10', label: '86.10 — Ospedali e cliniche' },
    { value: '86.22', label: '86.22 — Studi medici specialistici' },
  ]},
];
const SETTORI_FLAT = SETTORI_GROUPS.flatMap(g => g.voci);
const DIMENSIONI = ['micro', 'piccola', 'media', 'grande'] as const;
const PROVINCE_LOM = ['VA', 'MI', 'CO', 'MB', 'LO', 'BG', 'BS', 'CR', 'LC', 'MN', 'PV', 'SO', 'altro'];
const MODULI_INFO = [
  { id: 'tech', label: 'Tech & Digitale', desc: 'Industria 4.0/5.0, AI, automazione, software' },
  { id: 'green', label: 'Green & Energia', desc: 'Efficienza energetica, rinnovabili, economia circolare' },
  { id: 'people', label: 'Formazione AI', desc: 'FSE+, fondi interprofessionali, upskilling dipendenti' },
];
const FREQUENZE = [
  { id: 'immediata', label: 'Immediata', desc: 'Appena trovato un nuovo bando' },
  { id: 'giornaliera', label: 'Digest giornaliero', desc: 'Una email ogni mattina' },
  { id: 'settimanale', label: 'Digest settimanale', desc: 'Un riassunto il lunedì' },
];

const STEPS = [
  { icon: Building2, label: 'Azienda' },
  { icon: Settings, label: 'Interessi' },
  { icon: Bell, label: 'Notifiche' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [settoreSearch, setSettoreSearch] = useState('');

  const [form, setForm] = useState({
    ragione_sociale: '',
    settore: '' as string,
    dimensione: '' as typeof DIMENSIONI[number] | '',
    provincia: '',
    num_dipendenti: '',
    moduli: [] as string[],
    soglia_importo_min: 0,
    notifiche_email: true,
    email_notifiche: '',
    frequenza_digest: 'immediata',
  });

  function toggleModulo(id: string) {
    setForm((f) => ({
      ...f,
      moduli: f.moduli.includes(id) ? f.moduli.filter((m) => m !== id) : [...f.moduli, id],
    }));
  }

  // Mappa moduli onboarding → obiettivi matcher
  function moduliToObiettivi(moduli: string[]): string[] {
    const map: Record<string, string[]> = {
      tech:   ['digitalizzazione', 'macchinari'],
      green:  ['energia'],
      people: ['formazione'],
    };
    return [...new Set(moduli.flatMap(m => map[m] ?? []))];
  }

  async function handleFinish() {
    setError('');
    setLoading(true);
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) throw new Error('Sessione scaduta. Rieffettua il login.');

      // 1. Salva profilo esteso su Supabase (notifiche, ragione sociale, ecc.)
      const { error: sbErr } = await supabase.from('profiles').upsert({
        user_id: user.id,
        ragione_sociale: form.ragione_sociale,
        settore: form.settore,
        dimensione: form.dimensione,
        provincia: form.provincia,
        num_dipendenti: form.num_dipendenti ? parseInt(form.num_dipendenti) : null,
        moduli: form.moduli,
        soglia_importo_min: form.soglia_importo_min,
        notifiche_email: form.notifiche_email,
        email_notifiche: form.email_notifiche || user.email,
        frequenza_digest: form.frequenza_digest,
      }, { onConflict: 'user_id' });

      if (sbErr) throw sbErr;

      // 2. Salva profilo nel matcher locale per ottenere profileId
      if (!form.settore || !form.dimensione) {
        throw new Error('Seleziona settore e dimensione aziendale prima di continuare.');
      }

      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const { authHeaders } = await import('@/lib/api');
      const headers = await authHeaders();
      const matcherRes = await fetch(`${API_BASE}/api/profile`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id: user.id,  // usa Supabase user.id come profileId → dashboard trova le candidature
          settore_ateco: form.settore,
          dimensione: form.dimensione,
          provincia: form.provincia,
          obiettivi: moduliToObiettivi(form.moduli),
          de_minimis: null,
          fatturato_range: null,
          budget_coinvestimento: null,
          anno_fondazione: null,
        }),
      });

      if (!matcherRes.ok) throw new Error('Errore nel salvataggio del profilo bandi.');
      const { id: profileId } = await matcherRes.json();

      // 3. Redirect con profileId → matcher funziona
      router.push(`/risultati?id=${profileId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Errore nel salvataggio');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4 py-12 font-sans text-zinc-100">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Incentio
          </h1>
          <p className="text-zinc-500 mt-1 text-xs">Configura il tuo profilo aziendale</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < step ? 'bg-indigo-500 text-white' :
                i === step ? 'bg-zinc-100 text-zinc-950 ring-4 ring-zinc-800/50' :
                'bg-zinc-900 text-zinc-500 border border-zinc-800'
              }`}>
                {i < step ? '✓' : <s.icon size={13} />}
              </div>
              <span className={`text-xs font-semibold hidden sm:block ${i === step ? 'text-zinc-100' : 'text-zinc-500'}`}>{s.label}</span>
              {i < STEPS.length - 1 && <div className={`w-8 h-px ${i < step ? 'bg-indigo-500' : 'bg-zinc-850'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800 p-8 backdrop-blur-md">
          {/* STEP 0: Dati azienda */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Building2 size={18} className="text-zinc-400" /> La tua azienda
                </h2>
                <p className="text-xs text-zinc-500 mt-1">Questi dati ci permettono di trovare i bandi più adatti.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">Ragione sociale</label>
                <input
                  type="text"
                  value={form.ragione_sociale}
                  onChange={(e) => setForm({ ...form, ragione_sociale: e.target.value })}
                  placeholder="Es. Rossi Meccanica S.r.l."
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950/40 text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-550/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">Settore ATECO</label>
                <div className="relative mb-1.5">
                  <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Cerca settore..."
                    value={settoreSearch}
                    onChange={(e) => setSettoreSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-800 bg-zinc-950/40 text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-550/20 focus:border-indigo-500"
                  />
                </div>
                <div className="max-h-44 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950">
                  {(() => {
                    const q = settoreSearch.toLowerCase();
                    const gruppi = q
                      ? [{ sezione: 'Risultati', voci: SETTORI_FLAT.filter(v => v.label.toLowerCase().includes(q) || v.value.includes(q)) }]
                      : SETTORI_GROUPS;
                    return gruppi.map((g) => (
                      g.voci.length === 0 ? null :
                      <div key={g.sezione}>
                        <div className="px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-900 sticky top-0 border-b border-zinc-850">
                          {g.sezione}
                        </div>
                        {g.voci.map((s) => (
                          <button key={s.value} type="button"
                            onClick={() => { setForm(f => ({ ...f, settore: s.value })); setSettoreSearch(''); }}
                            className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                              form.settore === s.value ? 'bg-indigo-500/10 text-indigo-400 font-semibold' : 'text-zinc-300 hover:bg-zinc-900/50'
                            }`}
                          >{s.label}</button>
                        ))}
                      </div>
                    ));
                  })()}
                </div>
                {form.settore && (
                  <p className="text-xs text-indigo-400 font-semibold mt-1">
                    ✓ {SETTORI_FLAT.find(s => s.value === form.settore)?.label ?? form.settore}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">Dimensione</label>
                <div className="flex gap-2">
                  {DIMENSIONI.map((d) => (
                    <button key={d} type="button"
                      onClick={() => setForm(f => ({ ...f, dimensione: d }))}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all capitalize ${
                        form.dimensione === d
                          ? 'bg-zinc-100 text-zinc-950 border-zinc-100 shadow-sm'
                          : 'border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700 hover:text-white'
                      }`}
                    >{d}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                    <MapPin size={12} className="text-zinc-500" /> Provincia
                  </label>
                  <select
                    value={form.provincia}
                    onChange={(e) => setForm({ ...form, provincia: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950/40 text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-550/20 focus:border-indigo-500"
                  >
                    <option value="">Seleziona</option>
                    {PROVINCE_LOM.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                    <Users size={12} className="text-zinc-500" /> Dipendenti
                  </label>
                  <input
                    type="number"
                    value={form.num_dipendenti}
                    onChange={(e) => setForm({ ...form, num_dipendenti: e.target.value })}
                    placeholder="Es. 25"
                    min={1}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950/40 text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-550/20 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: Moduli e soglia */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Settings size={18} className="text-zinc-400" /> Aree di interesse
                </h2>
                <p className="text-xs text-zinc-500 mt-1">Seleziona i temi su cui vuoi ricevere bandi.</p>
              </div>

              <div className="space-y-3">
                {MODULI_INFO.map((m) => (
                  <button key={m.id} type="button"
                    onClick={() => toggleModulo(m.id)}
                    className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all ${
                      form.moduli.includes(m.id)
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${form.moduli.includes(m.id) ? 'text-indigo-400' : 'text-zinc-200'}`}>{m.label}</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                        form.moduli.includes(m.id) ? 'border-indigo-500 bg-indigo-500' : 'border-zinc-700 bg-zinc-950'
                      }`}>
                        {form.moduli.includes(m.id) && <span className="text-white text-[9px] font-bold">✓</span>}
                      </div>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{m.desc}</p>
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2 uppercase tracking-wider">
                  Importo minimo bando: <span className="text-indigo-400 font-bold">€{form.soglia_importo_min.toLocaleString('it-IT')}</span>
                </label>
                <input
                  type="range"
                  min={0} max={500000} step={5000}
                  value={form.soglia_importo_min}
                  onChange={(e) => setForm({ ...form, soglia_importo_min: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer bg-zinc-800 h-1 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] text-zinc-550 mt-1.5 font-semibold">
                  <span>€0</span><span>€500k</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Notifiche */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Bell size={18} className="text-zinc-400" /> Preferenze notifiche
                </h2>
                <p className="text-xs text-zinc-500 mt-1">Quando vuoi essere avvisato dei nuovi bandi?</p>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setForm({ ...form, notifiche_email: !form.notifiche_email })}
                    className={`w-10 h-5.5 rounded-full transition-colors relative ${form.notifiche_email ? 'bg-indigo-500' : 'bg-zinc-800'}`}
                  >
                    <div className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-all ${form.notifiche_email ? 'left-5' : 'left-0.5'}`} />
                  </div>
                  <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Ricevi notifiche via email</span>
                </label>
              </div>

              {form.notifiche_email && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">Email per le notifiche</label>
                    <input
                      type="email"
                      value={form.email_notifiche}
                      onChange={(e) => setForm({ ...form, email_notifiche: e.target.value })}
                      placeholder="La tua email (lascia vuoto per usare quella di login)"
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950/40 text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-550/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-2 uppercase tracking-wider">Frequenza</label>
                    <div className="space-y-2">
                      {FREQUENZE.map((f) => (
                        <button key={f.id} type="button"
                          onClick={() => setForm({ ...form, frequenza_digest: f.id })}
                          className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                            form.frequenza_digest === f.id
                              ? 'border-indigo-500 bg-indigo-500/10'
                              : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700'
                          }`}
                        >
                          <span className={`text-xs font-bold block ${form.frequenza_digest === f.id ? 'text-indigo-400' : 'text-zinc-200'}`}>{f.label}</span>
                          <span className="text-[10px] text-zinc-500 mt-0.5 font-medium">{f.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {error && <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/30 rounded-lg px-3.5 py-2.5 font-medium">{error}</p>}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button type="button"
                onClick={() => setStep(step - 1)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-xs font-semibold text-zinc-400 hover:border-zinc-700 hover:text-white transition-all duration-200"
              >
                Indietro
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button type="button"
                onClick={() => setStep(step + 1)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-100 text-zinc-950 text-xs font-bold hover:bg-zinc-200 transition-all duration-200 flex items-center justify-center gap-1.5"
              >
                Continua <ChevronRight size={14} />
              </button>
            ) : (
              <button type="button"
                onClick={handleFinish}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-zinc-100 text-zinc-950 text-xs font-bold hover:bg-zinc-200 disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-1.5"
              >
                {loading && <Loader2 size={12} className="animate-spin" />}
                Inizia a trovare bandi
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
