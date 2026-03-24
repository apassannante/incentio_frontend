import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import LoadingContent from './LoadingContent';

export const dynamic = 'force-dynamic';

export default function VisuraLoadingPage() {
  return (
    <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
      <Suspense fallback={<Loader2 size={32} className="text-[#38BDF8] animate-spin" />}>
        <LoadingContent />
      </Suspense>
    </div>
  );
}
