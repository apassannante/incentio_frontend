import ProfiloForm from '@/components/ProfiloForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
    title: 'Profilo azienda — Incentio',
    description: 'Inserisci il profilo della tua azienda per trovare i bandi più compatibili.',
};

export default function ProfiloPage() {
    return (
        <div className="min-h-screen bg-[#0A0F1E] text-white">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#0A0F1E]/90 backdrop-blur border-b border-[#38BDF8]/20 px-6 py-4">
                <div className="max-w-5xl mx-auto flex items-center gap-4">
                    <Link
                        href="/"
                        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#38BDF8] transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Home
                    </Link>
                    <span className="text-xl font-bold text-white">
                        Incent<span className="text-[#38BDF8]">io</span>
                    </span>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-6 py-12">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-white">Descrivi la tua azienda</h1>
                    <p className="text-gray-400 mt-2">
                        In 2 minuti troviamo i bandi più adatti al tuo profilo
                    </p>
                </div>
                <ProfiloForm />
            </div>
        </div>
    );
}
