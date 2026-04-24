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
    color: 'text-[#38BDF8]',
    bg: 'bg-[#38BDF8]/10',
  },
  {
    icon: Leaf,
    label: 'Green',
    title: 'Efficienza Energetica',
    description:
      'Incentivi per fotovoltaico, efficienza energetica, mobilità sostenibile e transizione ecologica.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
  },
  {
    icon: Users,
    label: 'People',
    title: 'Formazione & HR',
    description:
      'Fondi per formazione del personale, competenze digitali, assunzioni e welfare aziendale.',
    color: 'text-orange-300',
    bg: 'bg-orange-400/10',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0A0F1E]/90 backdrop-blur border-b border-[#38BDF8]/15 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-2xl tracking-tight">
            <span className="font-extrabold text-white">Incent</span><span className="font-extrabold text-[#38BDF8]">io</span>
          </span>
          <Link
            href="/visura?nuovo=true"
            className="hidden sm:inline-flex items-center gap-1.5 bg-[#38BDF8] text-[#0A0F1E] text-sm font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-all"
          >
            Inizia gratis <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main>
        <section className="bg-gradient-to-br from-[#0F1F3D] to-[#0A0F1E]">
          <div className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
            <div className="inline-flex items-center gap-2 bg-[#38BDF8]/10 text-[#38BDF8] text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-[#38BDF8]/25">
              <Zap size={12} className="fill-[#38BDF8]" />
              Aggiornato ogni giorno da fonti ufficiali
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight mb-6">
              Cerca. Candidati.
              <br />
              <span className="text-[#38BDF8]">Tu sì.</span>
            </h1>

            <div className="border-l-[3px] border-[#38BDF8] pl-4 text-left max-w-xl mx-auto mb-8">
              <p className="text-lg sm:text-xl text-white/65 leading-relaxed">
                Monitoriamo ogni giorno centinaia di bandi su tecnologia, sostenibilità e formazione.
                Ti mostriamo solo quelli compatibili con la tua azienda.
              </p>
            </div>

            <Link
              href="/visura?nuovo=true"
              className="inline-flex items-center gap-2 bg-[#38BDF8] text-[#0A0F1E] text-lg font-bold px-8 py-4 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-[#38BDF8]/20"
            >
              Scopri i bandi per la tua azienda
              <ArrowRight size={20} />
            </Link>

            <p className="mt-4 text-sm text-white/40">
              Nessuna registrazione richiesta. Risultati in 30 secondi.
            </p>
          </div>
        </section>

        {/* Module Cards */}
        <section className="max-w-5xl mx-auto px-6 py-24">
          <h2 className="text-xl font-semibold text-center text-white/50 mb-8">
            Tre aree di finanziamento monitorate
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {modules.map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.label}
                  className="bg-[#0F1F3D] rounded-2xl p-6 border border-[#38BDF8]/20 hover:border-[#38BDF8]/50 hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className={`${mod.bg} rounded-xl w-11 h-11 flex items-center justify-center mb-4`}>
                    <Icon className={`${mod.color}`} size={22} />
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-widest ${mod.color}`}>
                    {mod.label}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1 mb-2">{mod.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{mod.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* How it works */}
        <section className="bg-[#0F1F3D] border-t border-[#38BDF8]/10 py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-white mb-12">Come funziona</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                { step: '01', title: 'Descrivi la tua azienda', desc: 'Settore, dimensione, obiettivi e budget disponibile. Richiede meno di 2 minuti.' },
                { step: '02', title: 'Analizziamo i bandi', desc: 'Il nostro algoritmo confronta il tuo profilo con centinaia di bandi attivi.' },
                { step: '03', title: 'Ricevi la tua lista', desc: 'Vedi solo i bandi compatibili, ordinati per rilevanza, con checklist documenti.' },
              ].map((item) => (
                <div key={item.step} className="text-left">
                  <span className="text-4xl font-black text-[#38BDF8]/20">{item.step}</span>
                  <h3 className="text-base font-bold text-white mt-2 mb-1">{item.title}</h3>
                  <p className="text-sm text-white/50">{item.desc}</p>
                </div>
              ))}
            </div>
            <Link
              href="/visura?nuovo=true"
              className="inline-flex items-center gap-2 mt-12 bg-[#38BDF8] text-[#0A0F1E] font-bold px-6 py-3 rounded-lg hover:opacity-90 transition-all"
            >
              Inizia ora — è gratis <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#0A0F1E] border-t border-[#38BDF8]/10 py-8 px-6 text-center">
        <p className="text-sm text-white/40">
          <span className="font-bold text-white">Incent</span><span className="font-bold text-[#38BDF8]">io</span>
          <span className="ml-2">— Varese, Lombardia</span>
        </p>
      </footer>
    </div>
  );
}
