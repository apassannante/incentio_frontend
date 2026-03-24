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
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-[#1C1C1C]">📋 Documenti necessari</h2>
                <span className="text-xs text-gray-400 font-medium">
                    {completati}/{documenti.length} pronti
                </span>
            </div>

            {/* Progress bar */}
            {onToggle && (
                <div className="h-1.5 bg-gray-100 rounded-full mb-4 overflow-hidden">
                    <div
                        className="h-full bg-[#1A7A4A] rounded-full transition-all duration-500"
                        style={{ width: `${documenti.length > 0 ? (completati / documenti.length) * 100 : 0}%` }}
                    />
                </div>
            )}

            <ul className="space-y-2">
                {documenti.map((doc) => {
                    const isChecked = !!checkedItems[doc];
                    return (
                        <li key={doc}>
                            <button
                                type="button"
                                onClick={() => onToggle?.(doc)}
                                className={`w-full flex items-start gap-3 p-3 rounded-lg text-left text-sm transition-all ${onToggle ? 'hover:bg-[#F5F7FA] cursor-pointer' : 'cursor-default'
                                    } ${isChecked ? 'opacity-60' : ''}`}
                            >
                                {isChecked ? (
                                    <CheckCircle
                                        size={18}
                                        className="text-[#1A7A4A] shrink-0 mt-0.5"
                                        fill="currentColor"
                                    />
                                ) : (
                                    <Circle size={18} className="text-gray-300 shrink-0 mt-0.5" />
                                )}
                                <span className={`${isChecked ? 'line-through text-gray-400' : 'text-[#1C1C1C]'}`}>
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
