import ProfiloForm from '@/components/ProfiloForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
    title: 'Profilo azienda — Incentio',
    description: 'Inserisci il profilo della tua azienda per trovare i bandi più compatibili.',
};

export default function ProfiloPage() {
    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur border-b border-zinc-900 px-6 py-4">
                <div className="max-w-5xl mx-auto flex items-center gap-4">
                    <Link
                        href="/"
                        className="flex items-center gap-1.5 text-xs font-semibold text-zinc-450 text-zinc-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={14} />
                        Home
                    </Link>
                    <span className="text-sm font-semibold tracking-tight text-white">
                        Incentio
                    </span>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-6 py-12">
                <div className="text-center mb-10">
                    <h1 className="text-2xl font-bold text-white">Descrivi la tua azienda</h1>
                    <p className="text-xs text-zinc-400 mt-2">
                        In 2 minuti troviamo i bandi più adatti al tuo profilo
                    </p>
                </div>
                <ProfiloForm />
            </div>
        </div>
    );
}
