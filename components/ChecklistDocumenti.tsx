import { CheckCircle, Circle } from 'lucide-react';

interface ChecklistDocumentiProps {
    documenti: string[];
    checkedItems?: Record<string, boolean>;
    onToggle?: (doc: string) => void;
}

export default function ChecklistDocumenti({
    documenti,
    checkedItems = {},
    onToggle,
}: ChecklistDocumentiProps) {
    const completati = documenti.filter((d) => checkedItems[d]).length;

    return (
        <div className="bg-zinc-900/20 rounded-2xl border border-zinc-800 p-6 font-sans">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">📋 Documenti necessari</h2>
                <span className="text-[10px] font-bold text-zinc-500 uppercase">
                    {completati}/{documenti.length} pronti
                </span>
            </div>

            {/* Progress bar */}
            {onToggle && (
                <div className="h-1.5 bg-zinc-950 border border-zinc-850 rounded-full mb-5 overflow-hidden">
                    <div
                        className="h-full bg-zinc-100 rounded-full transition-all duration-500"
                        style={{ width: `${documenti.length > 0 ? (completati / documenti.length) * 100 : 0}%` }}
                    />
                </div>
            )}

            <ul className="space-y-1.5">
                {documenti.map((doc) => {
                    const isChecked = !!checkedItems[doc];
                    return (
                        <li key={doc}>
                            <button
                                type="button"
                                onClick={() => onToggle?.(doc)}
                                className={`w-full flex items-start gap-3 p-3 rounded-lg text-left text-xs transition-all border border-transparent ${
                                    onToggle 
                                        ? 'hover:bg-zinc-900/40 hover:border-zinc-800/50 cursor-pointer' 
                                        : 'cursor-default'
                                } ${isChecked ? 'opacity-60 bg-zinc-950/20' : 'bg-zinc-950/40 border-zinc-900'}`}
                            >
                                {isChecked ? (
                                    <CheckCircle
                                        size={15}
                                        className="text-emerald-400 shrink-0 mt-0.5"
                                        fill="currentColor"
                                    />
                                ) : (
                                    <Circle size={15} className="text-zinc-700 shrink-0 mt-0.5" />
                                )}
                                <span className={`${isChecked ? 'line-through text-zinc-500 font-medium' : 'text-zinc-200 font-medium'}`}>
                                    {doc}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
