"use client";

import { ModerationFilters } from "@/components/moderation/moderationTypes";

const SORT_OPTIONS: Array<{ label: string; value: ModerationFilters["sort"] }> = [
    { label: "Newest", value: "newest" },
    { label: "Oldest", value: "oldest" },
    { label: "Price High", value: "price_high" },
    { label: "Price Low", value: "price_low" }
];

type AdsFilterToolbarExtrasProps = {
    filters: ModerationFilters;
    updateFilter: (key: keyof ModerationFilters, value: ModerationFilters[keyof ModerationFilters]) => void;
    clearFilters: () => void;
};

export function AdsFilterToolbarExtras({
    filters,
    updateFilter,
    clearFilters,
}: AdsFilterToolbarExtrasProps) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <select
                value={filters.sort}
                onChange={(e) => updateFilter("sort", e.target.value as ModerationFilters["sort"])}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-200"
                aria-label="Sort listings"
            >
                {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>

            <input
                value={filters.sellerId}
                onChange={(e) => updateFilter("sellerId", e.target.value)}
                placeholder="Seller ID"
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 w-28"
                aria-label="Filter by Seller ID"
            />

            <input
                value={filters.locationId}
                onChange={(e) => updateFilter("locationId", e.target.value)}
                placeholder="Location ID"
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 w-32"
                aria-label="Filter by Location ID"
            />

            <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => updateFilter("dateFrom", e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 shrink-0"
                aria-label="Filter from date"
            />

            <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => updateFilter("dateTo", e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 shrink-0"
                aria-label="Filter to date"
            />
            
            {/* Expiry Warning Filters */}
            <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2">
                <select
                    value={filters.expiryWarningStatus}
                    onChange={(e) => updateFilter("expiryWarningStatus", e.target.value as ModerationFilters["expiryWarningStatus"])}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-200 min-w-[110px]"
                    aria-label="Expiry warning status filter"
                >
                    <option value="all">Warning: All</option>
                    <option value="sent">Warning Sent</option>
                    <option value="not_sent">Not Sent</option>
                </select>
                <input
                    type="number"
                    value={filters.expiringWithinDays}
                    onChange={(e) => updateFilter("expiringWithinDays", e.target.value)}
                    placeholder="Exp Days"
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-200 w-24"
                    aria-label="Expiring within days"
                />
            </div>

            {/* Spotlight Warning Filters */}
            <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2">
                <select
                    value={filters.spotlightWarningStatus}
                    onChange={(e) => updateFilter("spotlightWarningStatus", e.target.value as ModerationFilters["spotlightWarningStatus"])}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-200 min-w-[110px]"
                    aria-label="Spotlight warning status filter"
                >
                    <option value="all">Spotlight: All</option>
                    <option value="sent">Spotlight Sent</option>
                    <option value="not_sent">Not Sent</option>
                </select>
                <input
                    type="number"
                    value={filters.spotlightExpiringWithinDays}
                    onChange={(e) => updateFilter("spotlightExpiringWithinDays", e.target.value)}
                    placeholder="Spot Days"
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-200 w-24"
                    aria-label="Spotlight expiring within days"
                />
            </div>

            <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-foreground-secondary hover:bg-slate-200 transition-colors"
            >
                Clear
            </button>
        </div>
    );
}

