"use client";

import { useId } from "react";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
    Z_INDEX,
} from "@esparex/ui";
import { cn } from "@/lib/utils";
import {
    MultiSelectCatalogDropdown,
    type CatalogItem,
} from "./MultiSelectCatalogDropdown";

export type { CatalogItem };

export interface CatalogSelectDropdownProps {
    items: CatalogItem[];
    value: string | string[];
    onChange: (val: string | string[]) => void;
    multiSelect?: boolean;
    placeholder?: string;
    disabled?: boolean;
    error?: string;
    id?: string;
}

export function CatalogSelectDropdown({
    items,
    value,
    onChange,
    multiSelect = false,
    placeholder = "Select an option...",
    disabled = false,
    error,
    id,
}: CatalogSelectDropdownProps) {
    const generatedId = useId();
    const resolvedId = id || `catalog-select-${generatedId}`;

    // ── Single-Select Mode (Spare Part Type) ─────────────────────────
    if (!multiSelect) {
        const singleVal = typeof value === "string" ? value : "";
        return (
            <div className="w-full space-y-1.5">
                <Select
                    value={singleVal}
                    onValueChange={(newVal) => onChange(newVal)}
                    disabled={disabled}
                >
                    <SelectTrigger
                        id={resolvedId}
                        aria-invalid={Boolean(error)}
                        className={cn(
                            "h-11 rounded-xl text-body-lg md:text-body font-normal border-border bg-background shadow-2xs focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary",
                            error && "border-destructive ring-destructive/20",
                            disabled && "opacity-60 cursor-not-allowed"
                        )}
                    >
                        <SelectValue placeholder={placeholder} />
                    </SelectTrigger>
                    {/* design-token-ignore: z-index must use Z_INDEX token via inline style per zIndex.ts governance */}
                    <SelectContent className="max-h-60 rounded-xl border-border bg-popover text-popover-foreground shadow-lg" style={{ zIndex: Z_INDEX.alertDialogOverlay }}>
                        {items.map((item) => {
                            const itemId = item.id || (item._id as string);
                            return (
                                <SelectItem
                                    key={itemId}
                                    value={itemId}
                                    className="cursor-pointer text-body py-2.5 px-3 rounded-lg focus:bg-accent focus:text-accent-foreground"
                                >
                                    {item.name}
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>
            </div>
        );
    }

    // ── Multi-Select Mode (Service Types) ────────────────────────────
    return (
        <MultiSelectCatalogDropdown
            items={items}
            value={Array.isArray(value) ? value : value ? [value] : []}
            onChange={(selected) => onChange(selected)}
            placeholder={placeholder}
            disabled={disabled}
            error={error}
            id={resolvedId}
        />
    );
}
