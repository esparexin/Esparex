"use client";

import { Clock } from "@/icons/IconRegistry";
import { Z_INDEX } from "@/constants/zIndex";

interface HeaderSearchDropdownProps {
  isOpen: boolean;
  isRecent: boolean;
  searchItems: readonly string[] | string[];
  onSelectSearch: (term: string) => void;
  onClearHistory: () => void;
}

export function HeaderSearchDropdown({
  isOpen,
  isRecent,
  searchItems,
  onSelectSearch,
  onClearHistory,
}: HeaderSearchDropdownProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{ zIndex: Z_INDEX.userHeaderDropdown }}
      className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-2"
    >
      <div className="flex items-center justify-between px-2 mb-1">
        <span className="text-xs font-semibold text-muted-foreground uppercase">
          {isRecent ? "Recent Searches" : "Popular Searches"}
        </span>
        {isRecent && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClearHistory();
            }}
            className="text-xs text-muted-foreground hover:text-foreground font-medium"
          >
            Clear
          </button>
        )}
      </div>
      {searchItems.map((s) => (
        <button
          key={s}
          onClick={() => onSelectSearch(s)}
          className="w-full text-left px-2 py-2 hover:bg-muted rounded flex items-center gap-2 text-sm"
        >
          <Clock className="h-3 w-3 text-muted-foreground" />
          {s}
        </button>
      ))}
    </div>
  );
}
