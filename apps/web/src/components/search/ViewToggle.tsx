"use client";

import * as React from "react";
import { LayoutGrid, List } from "@esparex/ui";
import { cn } from "@/lib/utils";

type BrowseViewToggleValue = "grid" | "list";

interface ViewToggleProps {
    view: BrowseViewToggleValue;
    onViewChange: (v: BrowseViewToggleValue) => void;
}

function ViewToggleButton({
    active,
    label,
    onClick,
    children,
}: {
    active: boolean;
    label: string;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            title={label}
            aria-pressed={active}
            className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer",
                active
                    ? "bg-muted text-foreground"
                    : "text-foreground-secondary hover:bg-muted hover:text-foreground"
            )}
        >
            {children}
        </button>
    );
}

/**
 * Icon-only grid/list view toggle.
 * Renders the existing persisted view state owned by browseViewPreference;
 * no state, persistence, or layout logic lives here.
 */
export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
    return (
        <div className="flex items-center gap-1" role="group" aria-label="Listing view">
            <ViewToggleButton
                active={view === "grid"}
                label="Grid view"
                onClick={() => onViewChange("grid")}
            >
                <LayoutGrid className="h-4 w-4" aria-hidden="true" />
            </ViewToggleButton>
            <ViewToggleButton
                active={view === "list"}
                label="List view"
                onClick={() => onViewChange("list")}
            >
                <List className="h-4 w-4" aria-hidden="true" />
            </ViewToggleButton>
        </div>
    );
}
