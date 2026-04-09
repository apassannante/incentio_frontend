'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';

interface AtecoCode {
  codice: string;
  descrizione: string;
}

interface AtecoSelectorProps {
  label?: string;
  primaryValue: string;
  secondaryValues: string[];
  onPrimaryChange: (codice: string) => void;
  onSecondaryChange: (codici: string[]) => void;
}

export default function AtecoSelector({
  label = 'Codice ATECO',
  primaryValue,
  secondaryValues,
  onPrimaryChange,
  onSecondaryChange,
}: AtecoSelectorProps) {
  const [codes, setCodes] = useState<AtecoCode[]>([]);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [mode, setMode] = useState<'primary' | 'secondary'>('primary');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load ATECO codes from JSON
  useEffect(() => {
    fetch('/data/ateco_completo.json')
      .then(r => r.json())
      .then((data: AtecoCode[]) => setCodes(data))
      .catch(() => console.warn('Impossibile caricare i codici ATECO'));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Filter codes by search
  const filtered = useMemo(() => {
    if (!search.trim()) return codes.slice(0, 50); // Show first 50 by default
    const q = search.toLowerCase();
    return codes.filter(c =>
      c.codice.includes(q) || c.descrizione.toLowerCase().includes(q)
    ).slice(0, 50);
  }, [codes, search]);

  const getLabel = (codice: string) => {
    const found = codes.find(c => c.codice === codice);
    return found ? `${found.codice} — ${found.descrizione}` : codice;
  };

  const handleSelect = (codice: string) => {
    if (mode === 'primary') {
      onPrimaryChange(codice);
      setShowDropdown(false);
      setSearch('');
    } else {
      if (!secondaryValues.includes(codice) && codice !== primaryValue) {
        onSecondaryChange([...secondaryValues, codice]);
      }
      setSearch('');
    }
  };

  const removeSecondary = (codice: string) => {
    onSecondaryChange(secondaryValues.filter(c => c !== codice));
  };

  return (
    <div ref={dropdownRef} className="space-y-3">
      {/* Primary ATECO */}
      <div>
        <label className="block text-sm font-medium text-white/80 mb-1.5">{label} primario</label>
        <button
          type="button"
          onClick={() => { setMode('primary'); setShowDropdown(!showDropdown); setSearch(''); }}
          className="w-full text-left px-3 py-2.5 rounded-xl bg-[#0A0F1E] border border-gray-700 text-sm flex items-center justify-between hover:border-[#38BDF8]/50 transition-colors"
        >
          <span className={primaryValue ? 'text-white' : 'text-gray-500'}>
            {primaryValue ? getLabel(primaryValue) : 'Seleziona codice ATECO primario'}
          </span>
          <ChevronDown size={14} className="text-gray-500" />
        </button>
      </div>

      {/* Secondary ATECOs */}
      <div>
        <label className="block text-sm font-medium text-white/80 mb-1.5">{label} secondari</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {secondaryValues.map(c => (
            <span key={c} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-[#38BDF8]">
              {c}
              <button type="button" onClick={() => removeSecondary(c)} className="hover:text-white">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={() => { setMode('secondary'); setShowDropdown(!showDropdown); setSearch(''); }}
          className="text-xs text-[#38BDF8] hover:underline"
        >
          + Aggiungi ATECO secondario
        </button>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="relative z-50">
          <div className="absolute top-0 left-0 right-0 bg-[#0F1F3D] border border-[#38BDF8]/30 rounded-xl shadow-2xl overflow-hidden">
            {/* Search input */}
            <div className="p-2 border-b border-gray-700">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Cerca per codice o descrizione..."
                  autoFocus
                  className="w-full pl-8 pr-3 py-2 text-sm bg-[#0A0F1E] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#38BDF8]"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 px-1">
                {mode === 'primary' ? 'Seleziona il codice ATECO primario' : 'Aggiungi codice secondario'}
              </p>
            </div>

            {/* Results list */}
            <ul className="max-h-52 overflow-y-auto">
              {filtered.length === 0 && (
                <li className="px-3 py-4 text-center text-gray-500 text-sm">Nessun risultato</li>
              )}
              {filtered.map(c => (
                <li key={c.codice}>
                  <button
                    type="button"
                    onClick={() => handleSelect(c.codice)}
                    disabled={c.codice === primaryValue || secondaryValues.includes(c.codice)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-[#38BDF8]/10 transition-colors flex items-center gap-2 ${
                      c.codice === primaryValue ? 'text-[#38BDF8] bg-[#38BDF8]/5' :
                      secondaryValues.includes(c.codice) ? 'text-gray-500' : 'text-white'
                    }`}
                  >
                    <span className="font-mono text-[#38BDF8] w-14 shrink-0">{c.codice}</span>
                    <span className="truncate">{c.descrizione}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
