"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { locationsTabs } from "@/components/layout/adminModuleTabSets";
import {
    getDistinctStates,
    getLocationAnalytics,
    LocationAnalyticsData,
    LocationAnalyticsFilters,
} from "@/lib/api/locations";
import {
    buildUrlWithSearchParams,
    normalizeSearchParamValue,
    updateSearchParams,
} from "@/lib/urlSearchParams";
import { MapPin, TrendingUp, BarChart2, Users, Search, Flame } from "@esparex/ui";

function LocationAnalyticsPageContent({
    initialCity,
    initialDistrict,
    initialState,
    initialCountry,
}: {
    initialCity: string;
    initialDistrict: string;
    initialState: string;
    initialCountry: string;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [data, setData] = useState<LocationAnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [states, setStates] = useState<string[]>([]);
    const [cityInput, setCityInput] = useState(initialCity);
    const [districtInput, setDistrictInput] = useState(initialDistrict);

    const filters: LocationAnalyticsFilters = useMemo(() => ({
        city: initialCity || undefined,
        district: initialDistrict || undefined,
        state: initialState || undefined,
        country: initialCountry || undefined,
    }), [initialCity, initialDistrict, initialState, initialCountry]);

    useEffect(() => {
        void (async () => { setCityInput(initialCity); })();
    }, [initialCity]);

    useEffect(() => {
        void (async () => { setDistrictInput(initialDistrict); })();
    }, [initialDistrict]);

    const replaceQueryState = useCallback((updates: Record<string, string | number | null | undefined>) => {
        const nextUrl = buildUrlWithSearchParams(pathname, updateSearchParams(searchParams, updates));
        const currentUrl = buildUrlWithSearchParams(pathname, new URLSearchParams(searchParams.toString()));
        if (nextUrl !== currentUrl) {
            router.replace(nextUrl, { scroll: false });
        }
    }, [pathname, router, searchParams]);

    useEffect(() => {
        getDistinctStates()
            .then(setStates)
            .catch(() => {
                setStates([]);
            });
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            const normalizedCity = normalizeSearchParamValue(cityInput);
            if (normalizedCity !== initialCity) {
                replaceQueryState({
                    city: normalizedCity || null,
                });
            }
        }, 300);

        return () => window.clearTimeout(timer);
    }, [cityInput, initialCity, replaceQueryState]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            const normalizedDistrict = normalizeSearchParamValue(districtInput);
            if (normalizedDistrict !== initialDistrict) {
                replaceQueryState({
                    district: normalizedDistrict || null,
                });
            }
        }, 300);

        return () => window.clearTimeout(timer);
    }, [districtInput, initialDistrict, replaceQueryState]);

    useEffect(() => {
        void (async () => {
            setLoading(true);
            setError(null);
            getLocationAnalytics(filters)
                .then(setData)
                .catch((e: Error) => setError(e.message || "Failed to load analytics"))
                .finally(() => setLoading(false));
        })();
    }, [filters]);

    const adsByStateRows = (() => {
        const merged = new Map<string, { key: string; label: string; count: number }>();
        for (const row of data?.adsByState ?? []) {
            const rawLabel = typeof row?._id === "string" ? row._id : String(row?._id ?? "");
            const label = rawLabel.trim().replace(/\s+/g, " ") || "Unknown";
            const key = label.toLowerCase();
            const parsedCount = Number(row?.count ?? 0);
            const count = Number.isFinite(parsedCount) ? parsedCount : 0;
            const existing = merged.get(key);
            if (existing) {
                existing.count += count;
                continue;
            }
            merged.set(key, { key, label, count });
        }
        return Array.from(merged.values()).sort((a, b) => b.count - a.count);
    })();
    const maxStateAdsCount = adsByStateRows.length
        ? Math.max(...adsByStateRows.map((row) => row.count), 1)
        : 1;

    return (
        <AdminPageShell
            title="Geo Analytics"
            description="Hierarchy-scoped location activity, hot zones, and live listing distribution."
            tabs={<AdminModuleTabs tabs={locationsTabs} />}
            className="h-full overflow-y-auto pr-1"
        >
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-card p-4 rounded-xl border border-border shadow-xs">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-subtle" size={16} />
                        <input
                            type="text"
                            placeholder="Filter by city..."
                            className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-lg text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                            value={cityInput}
                            onChange={(e) => setCityInput(e.target.value)}
                        />
                    </div>
                    <input
                        type="text"
                        placeholder="Filter by district..."
                        className="w-full px-4 py-2 bg-background border border-input rounded-lg text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        value={districtInput}
                        onChange={(e) => setDistrictInput(e.target.value)}
                    />
                    <select
                        className="bg-background border border-input text-body text-foreground rounded-lg py-2 px-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        value={initialState}
                        onChange={(e) => replaceQueryState({ state: e.target.value || null })}
                    >
                        <option value="">All States</option>
                        {states.map((state) => (
                            <option key={state} value={state}>
                                {state}
                            </option>
                        ))}
                    </select>
                    <select
                        className="bg-background border border-input text-body text-foreground rounded-lg py-2 px-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        value={initialCountry}
                        onChange={(e) => replaceQueryState({ country: e.target.value || null })}
                    >
                        <option value="">All Countries</option>
                        <option value="India">India</option>
                    </select>
                </div>

                {(initialCity || initialDistrict || initialState || initialCountry) && (
                    <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                        Analytics cards and charts are scoped to the selected hierarchy filters.
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : data ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <StatCard icon={<MapPin size={20} />} label="Total Locations" value={data.totalLocations} color="blue" />
                            <StatCard icon={<BarChart2 size={20} />} label="Total Ads" value={data.totalAds} color="emerald" />
                            <StatCard icon={<Users size={20} />} label="Total Users" value={data.totalUsers} color="violet" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
                                <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
                                    <TrendingUp size={18} className="text-primary" />
                                    <h3 className="font-bold text-foreground">Top Cities by Ads</h3>
                                </div>
                                <div className="divide-y divide-border/60">
                                    {data.topCities?.length ? data.topCities.map((city, i) => (
                                        <div key={`${city.city}-${city.state}-${i}`} className="flex items-center justify-between px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <span className="w-6 h-6 rounded-full bg-muted text-foreground-tertiary text-caption font-bold flex items-center justify-center">
                                                    {i + 1}
                                                </span>
                                                <div>
                                                    <div className="font-semibold text-foreground text-body">{city.city}</div>
                                                    <div className="text-caption text-foreground-subtle">{city.state}</div>
                                                </div>
                                            </div>
                                            <span className="font-bold text-foreground-secondary text-body">{city.adsCount ?? 0} ads</span>
                                        </div>
                                    )) : (
                                        <p className="px-5 py-4 text-body text-foreground-subtle">No city data available.</p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
                                <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
                                    <BarChart2 size={18} className="text-primary" />
                                    <h3 className="font-bold text-foreground">Ads by State</h3>
                                </div>
                                <div className="divide-y divide-border/60">
                                    {adsByStateRows.length ? adsByStateRows.map((row) => (
                                        <div key={row.key} className="flex items-center justify-between px-5 py-3">
                                            <span className="text-body font-medium text-foreground-secondary">{row.label}</span>
                                            <div className="flex items-center gap-3">
                                                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary rounded-full"
                                                        style={{
                                                            width: `${Math.min(100, Math.round((row.count / maxStateAdsCount) * 100))}%`
                                                        }}
                                                    />
                                                </div>
                                                <span className="font-bold text-foreground-secondary text-body w-12 text-right">{row.count}</span>
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="px-5 py-4 text-body text-foreground-subtle">No state data available.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {data.hotZones?.length ? (
                            <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
                                <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
                                    <Flame size={18} className="text-orange-500" />
                                    <h3 className="font-bold text-foreground">Hot Zones</h3>
                                    <span className="ml-auto text-caption text-foreground-subtle font-medium">High search & ad activity</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-border/60">
                                    {data.hotZones.map((zone, idx) => (
                                        <div key={`${zone._id}-${idx}`} className="flex items-center justify-between px-5 py-3">
                                            <div>
                                                <div className="font-semibold text-foreground text-body flex items-center gap-1.5">
                                                    {zone.isHotZone && <Flame size={13} className="text-orange-500" />}
                                                    {zone.city}
                                                </div>
                                                <div className="text-caption text-foreground-subtle">{zone.state}</div>
                                            </div>
                                            <span className="text-caption font-bold text-foreground-tertiary bg-muted px-2 py-1 rounded">
                                                score {Math.round(zone.popularityScore)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </>
                ) : null}
            </div>
        </AdminPageShell>
    );
}

export default function LocationAnalyticsPage() {
    const searchParams = useSearchParams();

    const initialCity = normalizeSearchParamValue(searchParams.get("city"));
    const initialDistrict = normalizeSearchParamValue(searchParams.get("district"));
    const initialState = normalizeSearchParamValue(searchParams.get("state"));
    const initialCountry = normalizeSearchParamValue(searchParams.get("country"));

    return (
        <LocationAnalyticsPageContent
            initialCity={initialCity}
            initialDistrict={initialDistrict}
            initialState={initialState}
            initialCountry={initialCountry}
        />
    );
}

function StatCard({ icon, label, value, color }: {
    icon: ReactNode;
    label: string;
    value: number;
    color: "blue" | "emerald" | "violet";
}) {
    const colorMap = {
        blue: "bg-blue-50 text-blue-600",
        emerald: "bg-emerald-50 text-emerald-600",
        violet: "bg-violet-50 text-violet-600",
    };
    return (
        <div className="bg-card rounded-xl border border-border shadow-xs p-3.5 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colorMap[color]}`}>
                {icon}
            </div>
            <div>
                <div className="text-body-lg font-bold text-foreground leading-tight">{value?.toLocaleString() ?? "—"}</div>
                <div className="text-tiny font-medium text-foreground-tertiary uppercase tracking-wider">{label}</div>
            </div>
        </div>
    );
}
