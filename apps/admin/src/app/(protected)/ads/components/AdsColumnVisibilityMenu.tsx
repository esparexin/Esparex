"use client";

import { useRef, useState, useEffect } from "react";
import { EyeOff, ChevronDown, Checkbox } from "@esparex/ui";

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
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setShowColumnMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    return (
        <div className="relative" ref={columnMenuRef}>
            <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={showColumnMenu}
                aria-label="Toggle column visibility"
                onClick={() => setShowColumnMenu(!showColumnMenu)}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground-secondary hover:bg-muted transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            >
                <EyeOff size={14} />
                <span>Columns</span>
                <ChevronDown size={12} className={`transition-transform duration-200 ${showColumnMenu ? "rotate-180" : ""}`} />
            </button>

            {showColumnMenu && (
                <div
                    role="menu"
                    aria-label="Column visibility options"
                    className="absolute right-0 top-full z-40 mt-2 min-w-[200px] rounded-xl border border-border bg-background p-2 shadow-xl animate-in fade-in zoom-in duration-200"
                >
                    <div className="px-2 py-1.5 text-tiny font-bold uppercase tracking-wider text-foreground-subtle">
                        Toggle Columns
                    </div>
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                        {columnOptions.map((opt) => (
                            <label
                                key={opt.id}
                                className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-foreground-secondary hover:bg-muted cursor-pointer transition-colors"
                            >
                                <Checkbox
                                    checked={columnVisibility[opt.id] !== false}
                                    onCheckedChange={(checked) => onChangeColumnVisibility(opt.id, checked === true)}
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
