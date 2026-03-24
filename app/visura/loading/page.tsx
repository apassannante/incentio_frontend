import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import LoadingContent from './LoadingContent';

export default function VisuraLoadingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
          <Loader2 size={32} className="text-[#38BDF8] animate-spin" />
        </div>
      }
    >
      <LoadingContent />
    </Suspense>
  );
}
