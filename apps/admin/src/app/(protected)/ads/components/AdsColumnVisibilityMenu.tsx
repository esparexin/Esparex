"use client";

import { useRef, useState, useEffect } from "react";
import { EyeOff, ChevronDown } from "lucide-react";

type ColumnOption = {
    id: string;
    label: string;
};

type AdsColumnVisibilityMenuProps = {
    columnOptions: ColumnOption[];
    columnVisibility: Record<string, boolean>;
    onChangeColumnVisibility: (columnId: string, visible: boolean) => void;
};

export function AdsColumnVisibilityMenu({
    columnOptions,
    columnVisibility,
    onChangeColumnVisibility,
}: AdsColumnVisibilityMenuProps) {
    const [showColumnMenu, setShowColumnMenu] = useState(false);
    const columnMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (columnMenuRef.current && !columnMenuRef.current.contains(event.target as Node)) {
                setShowColumnMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={columnMenuRef}>
            <button
                type="button"
                onClick={() => setShowColumnMenu(!showColumnMenu)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all active:scale-95"
            >
                <EyeOff size={14} />
                <span>Columns</span>
                <ChevronDown size={12} className={`transition-transform duration-200 ${showColumnMenu ? "rotate-180" : ""}`} />
            </button>

            {showColumnMenu && (
                <div className="absolute right-0 top-full z-40 mt-2 min-w-[200px] rounded-xl border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in zoom-in duration-200">
                    <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Toggle Columns
                    </div>
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                        {columnOptions.map((opt) => (
                            <label
                                key={opt.id}
                                className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
                            >
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-200 cursor-pointer"
                                    checked={columnVisibility[opt.id] !== false}
                                    onChange={(e) => onChangeColumnVisibility(opt.id, e.target.checked)}
                                />
                                <span className="font-medium">{opt.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
