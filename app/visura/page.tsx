import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import VisuraContent from './VisuraContent';

export const dynamic = 'force-dynamic';

export default function VisuraPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
          <Loader2 size={32} className="text-[#38BDF8] animate-spin" />
        </div>
      }
    >
      <VisuraContent />
    </Suspense>
  );
}
