import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import VisuraContent from './VisuraContent';

export const dynamic = 'force-dynamic';

export default function VisuraPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
          <Loader2 size={32} className="text-zinc-500 animate-spin" />
        </div>
      }
    >
      <VisuraContent />
    </Suspense>
  );
}
