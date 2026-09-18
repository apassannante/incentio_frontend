import Link from 'next/link';
import { Cpu, Leaf, Users, ArrowRight, Zap } from 'lucide-react';

export const metadata = {
  title: 'Incentio — Trova i fondi pubblici per la tua azienda',
  description:
    'Monitoriamo ogni giorno centinaia di bandi su tecnologia, sostenibilità e formazione. Ti mostriamo solo quelli compatibili con la tua azienda.',
};

const modules = [
  {
    icon: Cpu,
    label: 'Tech',
    title: 'Digitalizzazione & AI',
    description:
      'Bandi per innovazione tecnologica, automazione, intelligenza artificiale e Industry 4.0.',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
  },
  {
    icon: Leaf,
    label: 'Green',
    title: 'Efficienza Energetica',
    description:
      'Incentivi per fotovoltaico, efficienza energetica, mobilità sostenibile e transizione ecologica.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Users,
    label: 'People',
    title: 'Formazione & HR',
    description:
      'Fondi per formazione del personale, competenze digitali, assunzioni e welfare aziendale.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-zinc-800 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-md border-b border-zinc-900 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight text-white">
            Incentio
          </span>
          <Link
            href="/auth"
            className="inline-flex items-center gap-1.5 bg-zinc-100 text-zinc-950 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-zinc-200 transition-all duration-200"
          >
            Inizia gratis <ArrowRight size={12} />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main>
        <section className="bg-gradient-to-b from-zinc-900/30 to-[#09090b] border-b border-zinc-900">
          <div className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-400 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-8 border border-indigo-500/20">
              <Zap size={11} className="fill-indigo-400 text-indigo-400" />
              Aggiornato oggi da fonti ufficiali
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.1] tracking-tight mb-8 max-w-3xl mx-auto">
              Cerca. Candidati.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-zinc-350 to-zinc-500">Tu sì.</span>
            </h1>

            <div className="border-l-2 border-indigo-500 pl-5 text-left max-w-xl mx-auto mb-10">
              <p className="text-base sm:text-lg text-zinc-400 leading-relaxed font-normal">
                Monitoriamo ogni giorno centinaia di bandi su tecnologia, sostenibilità e formazione.
                Ti mostriamo solo quelli compatibili con la tua azienda.
              </p>
            </div>

            <Link
              href="/auth"
              className="inline-flex items-center gap-2 bg-zinc-100 text-zinc-950 text-base font-semibold px-7 py-3.5 rounded-xl hover:bg-zinc-200 active:scale-[0.98] transition-all duration-200 shadow-sm"
            >
              Scopri i bandi per la tua azienda
              <ArrowRight size={16} />
            </Link>

            <p className="mt-4 text-xs text-zinc-555 text-zinc-500 font-medium">
              Nessuna registrazione richiesta per iniziare. Risultati in 30 secondi.
            </p>
          </div>
        </section>

        {/* Module Cards */}
        <section className="max-w-5xl mx-auto px-6 py-24">
          <h2 className="text-xs font-bold tracking-widest text-center text-zinc-500 uppercase mb-12">
            Aree di finanziamento monitorate
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {modules.map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.label}
                  className="bg-zinc-900/20 rounded-2xl p-6 border border-zinc-900 hover:border-zinc-800 hover:bg-zinc-900/30 hover:shadow-[0_0_24px_rgba(255,255,255,0.01)] hover:-translate-y-0.5 transition-all duration-250"
                >
                  <div className={`${mod.bg} rounded-xl w-10 h-10 flex items-center justify-center mb-5`}>
                    <Icon className={`${mod.color}`} size={18} />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${mod.color}`}>
                    {mod.label}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1 mb-2">{mod.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{mod.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* How it works */}
        <section className="bg-zinc-900/10 border-t border-zinc-900 py-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-xl font-bold text-white mb-16 tracking-tight">Come funziona</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
              {[
                { step: '01', title: 'Descrivi la tua azienda', desc: 'Settore, dimensione, obiettivi e budget disponibile. Richiede meno di 2 minuti.' },
                { step: '02', title: 'Analizziamo i bandi', desc: 'Il nostro algoritmo confronta il tuo profilo con centinaia di bandi attivi.' },
                { step: '03', title: 'Ricevi la tua lista', desc: 'Vedi solo i bandi compatibili, ordinati per rilevanza, con checklist documenti.' },
              ].map((item) => (
                <div key={item.step} className="text-left space-y-2">
                  <span className="text-3xl font-bold text-zinc-800 font-mono tracking-tighter">{item.step}</span>
                  <h3 className="text-sm font-bold text-zinc-100">{item.title}</h3>
                  <p className="text-xs text-zinc-450 text-zinc-400 leading-relaxed font-normal">{item.desc}</p>
                </div>
              ))}
            </div>
            <Link
              href="/auth"
              className="inline-flex items-center gap-1.5 mt-16 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-semibold px-5 py-2.5 rounded-lg transition-all duration-200"
            >
              Inizia ora — è gratis <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#09090b] border-t border-zinc-900 py-10 px-6 text-center">
        <p className="text-xs text-zinc-500 font-medium">
          <span className="font-bold text-zinc-300">Incentio</span>
          <span className="ml-2">— Varese, Lombardia</span>
        </p>
      </footer>
    </div>
  );
}
