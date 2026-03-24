'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Fonte {
  nome: string;
  data: string;
}

export default function FontiAttive() {
  const [fonti, setFonti] = useState<Fonte[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFonti() {
      try {
        const supabase = createClient();
        // Fallback to ente_erogatore if source does not exist
        const { data, error } = await supabase
          .from('bandi')
          .select('ente_erogatore, data_rilevamento');
          
        if (error) {
          console.error('Error fetching fonti:', error);
          return;
        }

        if (data) {
          const fontiMap = new Map<string, string>();
          data.forEach((row: any) => {
            const fonteNome = row.ente_erogatore || row.source; // try ente_erogatore, fallout to source
            if (!fonteNome) return;
            
            const curr = fontiMap.get(fonteNome);
            if (!curr || new Date(row.data_rilevamento) > new Date(curr)) {
              fontiMap.set(fonteNome, row.data_rilevamento);
            }
          });

          const result = Array.from(fontiMap.entries())
            .map(([nome, data]) => ({ nome, data }))
            .sort((a, b) => a.nome.localeCompare(b.nome));
            
          setFonti(result);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchFonti();
  }, []);

  if (loading || fonti.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-8 mt-[-1rem]">
      <div className="flex items-center gap-1 font-medium text-gray-700">
        <ShieldCheck size={14} className="text-[#1A7A4A]" />
        Fonti istituzionali verificate:
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {fonti.map((fonte, idx) => {
          const dateFormatted = new Date(fonte.data).toLocaleDateString('it-IT', { 
            day: '2-digit', month: '2-digit', year: 'numeric' 
          });
          
          return (
            <div key={fonte.nome} className="flex items-center">
              <span 
                className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap cursor-help hover:bg-gray-200 transition-colors"
                title={`Ultimo aggiornamento: ${dateFormatted}`}
              >
                {fonte.nome}
              </span>
              {idx < fonti.length - 1 && <span className="text-gray-300 ml-1.5">·</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
