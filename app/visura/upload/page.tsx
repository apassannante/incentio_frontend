'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, FileText, X, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export default function VisuraUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const validateFile = (f: File): string => {
    if (f.type !== 'application/pdf') return 'Il file deve essere un PDF.';
    if (f.size > 10 * 1024 * 1024) return 'Il file non può superare 10 MB.';
    return '';
  };

  const selectFile = (f: File) => {
    const err = validateFile(f);
    if (err) { setError(err); return; }
    setError('');
    setFile(f);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) selectFile(dropped);
  }, []);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (picked) selectFile(picked);
  };

  const handleUpload = () => {
    if (!file) return;
    setError('');
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('visura', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/api/visura/upload`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          const sessionId: string = data.session_id;
          localStorage.setItem('visura_session_id', sessionId);
          router.push(`/visura/loading?session_id=${sessionId}`);
        } catch {
          setError('Risposta del server non valida. Riprova.');
          setUploading(false);
        }
      } else {
        setError(`Errore durante l'upload (${xhr.status}). Riprova.`);
        setUploading(false);
      }
    };

    xhr.onerror = () => {
      setError('Errore di rete. Controlla la connessione e riprova.');
      setUploading(false);
    };

    xhr.send(formData);
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0A0F1E]/90 backdrop-blur border-b border-[#38BDF8]/15 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl">
            <span className="font-extrabold text-white">Incent</span>
            <span className="font-extrabold text-[#38BDF8]">io</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-white/60">
            <Link href="/candidature" className="hover:text-white transition-colors">Candidature</Link>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-xl">
          {/* Title */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold text-white mb-2">Visura Camerale</h1>
            <p className="text-white/50 text-sm">
              Carica la visura camerale della tua azienda in formato PDF.<br />
              Analizzeremo i tuoi dati e troveremo i bandi più compatibili.
            </p>
          </div>

          {/* Drop Zone */}
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => !file && !uploading && fileInputRef.current?.click()}
            className={`relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer
              ${dragging ? 'border-[#38BDF8] bg-[#38BDF8]/10' : 'border-white/20 hover:border-[#38BDF8]/50 hover:bg-white/5'}
              ${file ? 'cursor-default' : ''}
              p-10 flex flex-col items-center gap-4 text-center`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={onFileChange}
              disabled={uploading}
            />

            {!file ? (
              <>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors
                  ${dragging ? 'bg-[#38BDF8]/20' : 'bg-white/5'}`}>
                  <UploadCloud size={32} className={dragging ? 'text-[#38BDF8]' : 'text-white/40'} />
                </div>
                <div>
                  <p className="text-white font-semibold">Trascina qui il tuo PDF</p>
                  <p className="text-white/40 text-sm mt-1">oppure clicca per selezionare il file</p>
                </div>
                <p className="text-xs text-white/30">Solo PDF · max 10 MB</p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-[#38BDF8]/10 flex items-center justify-center">
                  <FileText size={28} className="text-[#38BDF8]" />
                </div>
                <div className="flex-1 min-w-0 text-center">
                  <p className="text-white font-semibold truncate max-w-xs mx-auto">{file.name}</p>
                  <p className="text-white/40 text-sm mt-0.5">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                {!uploading && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); setProgress(0); }}
                    className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                    title="Rimuovi file"
                  >
                    <X size={16} />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Progress bar */}
          {uploading && (
            <div className="mt-5">
              <div className="flex justify-between text-xs text-white/50 mb-1.5">
                <span>Upload in corso…</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-[#38BDF8] rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-red-300 text-sm font-semibold">Errore</p>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className={`mt-6 w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2
              ${file && !uploading
                ? 'bg-[#38BDF8] text-[#0A0F1E] hover:opacity-90 shadow-lg shadow-[#38BDF8]/20 cursor-pointer'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
          >
            <UploadCloud size={18} />
            {uploading ? 'Upload in corso…' : 'Analizza la Visura'}
          </button>

          <p className="text-center text-xs text-white/25 mt-4">
            I dati vengono elaborati in modo sicuro e non vengono condivisi con terze parti.
          </p>
        </div>
      </main>
    </div>
  );
}
