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
    <div ref={dropdownRef} className="space-y-3 font-sans">
      {/* Primary ATECO */}
      <div>
        <label className="block text-xs font-semibold text-zinc-350 mb-1.5 uppercase tracking-wider">{label} primario</label>
        <button
          type="button"
          onClick={() => { setMode('primary'); setShowDropdown(!showDropdown); setSearch(''); }}
          className="w-full text-left px-3.5 py-2.5 rounded-xl bg-zinc-950/40 border border-zinc-800 text-xs flex items-center justify-between hover:border-zinc-700 transition-colors focus:outline-none"
        >
          <span className={primaryValue ? 'text-zinc-100 font-semibold' : 'text-zinc-500'}>
            {primaryValue ? getLabel(primaryValue) : 'Seleziona codice ATECO primario'}
          </span>
          <ChevronDown size={14} className="text-zinc-500" />
        </button>
      </div>

      {/* Secondary ATECOs */}
      <div>
        <label className="block text-xs font-semibold text-zinc-350 mb-1.5 uppercase tracking-wider">{label} secondari</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {secondaryValues.map(c => (
            <span key={c} className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold">
              {c}
              <button type="button" onClick={() => removeSecondary(c)} className="hover:text-white transition-colors">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={() => { setMode('secondary'); setShowDropdown(!showDropdown); setSearch(''); }}
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          + Aggiungi ATECO secondario
        </button>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="relative z-50">
          <div className="absolute top-1 left-0 right-0 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
            {/* Search input */}
            <div className="p-2 border-b border-zinc-900 bg-zinc-950/80">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Cerca per codice o descrizione..."
                  autoFocus
                  className="w-full pl-8 pr-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-550/20"
                />
              </div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1.5 px-1">
                {mode === 'primary' ? 'Seleziona il codice ATECO primario' : 'Aggiungi codice secondario'}
              </p>
            </div>

            {/* Results list */}
            <ul className="max-h-52 overflow-y-auto bg-zinc-950">
              {filtered.length === 0 && (
                <li className="px-3 py-4 text-center text-zinc-500 text-xs font-medium">Nessun risultato</li>
              )}
              {filtered.map(c => (
                <li key={c.codice}>
                  <button
                    type="button"
                    onClick={() => handleSelect(c.codice)}
                    disabled={c.codice === primaryValue || secondaryValues.includes(c.codice)}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-zinc-900/50 transition-colors flex items-center gap-2 ${
                      c.codice === primaryValue ? 'text-indigo-400 bg-indigo-500/5 font-semibold' :
                      secondaryValues.includes(c.codice) ? 'text-zinc-600' : 'text-zinc-200'
                    }`}
                  >
                    <span className="font-mono text-indigo-400 w-14 shrink-0 font-semibold">{c.codice}</span>
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
