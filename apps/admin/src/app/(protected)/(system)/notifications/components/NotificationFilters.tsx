"use client";

import { Search } from "@esparex/ui";

interface NotificationFiltersProps {
    searchInput: string;
    setSearchInput: (val: string) => void;
    status: string;
    historyTargetType: string;
    onFilterChange: (updates: Record<string, string | number | null | undefined>) => void;
}

export function NotificationFilters({
    searchInput,
    setSearchInput,
    status,
    historyTargetType,
    onFilterChange
}: NotificationFiltersProps) {
    return (
        <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
            <div className="relative min-w-[220px] flex-1">
                <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-subtle"
                    size={16}
                />
                <input
                    type="text"
                    placeholder="Search title or body..."
                    className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-body text-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                />
            </div>
            <select
                className="rounded-lg border border-input bg-background px-3 py-2 text-body text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                value={status}
                onChange={(event) =>
                    onFilterChange({ status: event.target.value === "all" ? null : event.target.value, page: null })
                }
            >
                <option value="all">All statuses</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
                <option value="scheduled">Scheduled</option>
            </select>
            <select
                className="rounded-lg border border-input bg-background px-3 py-2 text-body text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                value={historyTargetType}
                onChange={(event) =>
                    onFilterChange({
                        targetType: event.target.value === "any" ? null : event.target.value,
                        page: null,
                    })
                }
            >
                <option value="any">All audiences</option>
                <option value="all">All Users</option>
                <option value="topic">Topic audience</option>
                <option value="users">Direct users</option>
            </select>
        </div>
    );
}
