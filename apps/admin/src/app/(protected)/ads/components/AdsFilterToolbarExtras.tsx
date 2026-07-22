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
    updateFilter: (key: keyof ModerationFilters, value: any) => void;
    clearFilters: () => void;
};

export function AdsFilterToolbarExtras({
    filters,
    updateFilter,
    clearFilters,
}: AdsFilterToolbarExtrasProps) {
    return (
        <>
            <input
                value={filters.sellerId}
                onChange={(e) => updateFilter("sellerId", e.target.value)}
                placeholder="Seller ID"
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 w-32"
            />
            <input
                value={filters.locationId}
                onChange={(e) => updateFilter("locationId", e.target.value)}
                placeholder="Location ID"
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 w-44"
            />
            <select
                value={filters.sort}
                onChange={(e) => updateFilter("sort", e.target.value as ModerationFilters["sort"])}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-200"
            >
                {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => updateFilter("dateFrom", e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
            <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => updateFilter("dateTo", e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
            
            {/* Expiry Warning Filters */}
            <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3 ml-1">
                <select
                    value={filters.expiryWarningStatus}
                    onChange={(e) => updateFilter("expiryWarningStatus", e.target.value as ModerationFilters["expiryWarningStatus"])}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-200"
                >
                    <option value="all">Warning: All</option>
                    <option value="sent">Warning Sent</option>
                    <option value="not_sent">Not Sent</option>
                </select>
                <input
                    type="number"
                    value={filters.expiringWithinDays}
                    onChange={(e) => updateFilter("expiringWithinDays", e.target.value)}
                    placeholder="Exp: Days"
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-200 w-20"
                />
            </div>

            {/* Spotlight Warning Filters */}
            <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3 ml-1">
                <select
                    value={filters.spotlightWarningStatus}
                    onChange={(e) => updateFilter("spotlightWarningStatus", e.target.value as ModerationFilters["spotlightWarningStatus"])}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-200"
                >
                    <option value="all">Spot: All</option>
                    <option value="sent">Spot Warn Sent</option>
                    <option value="not_sent">Not Sent</option>
                </select>
                <input
                    type="number"
                    value={filters.spotlightExpiringWithinDays}
                    onChange={(e) => updateFilter("spotlightExpiringWithinDays", e.target.value)}
                    placeholder="Spot: Days"
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-200 w-20"
                />
            </div>

            <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 ml-1"
            >
                Clear
            </button>
        </>
    );
}
