"use client";

import { useEffect, useState, type ReactNode } from "react";
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
import { MapPin, TrendingUp, BarChart2, Users, Search, Flame } from "lucide-react";

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

    const filters: LocationAnalyticsFilters = {
        city: initialCity || undefined,
        district: initialDistrict || undefined,
        state: initialState || undefined,
        country: initialCountry || undefined,
    };

    useEffect(() => {
        setCityInput(initialCity);
    }, [initialCity]);

    useEffect(() => {
        setDistrictInput(initialDistrict);
    }, [initialDistrict]);

    const replaceQueryState = (updates: Record<string, string | number | null | undefined>) => {
        const nextUrl = buildUrlWithSearchParams(pathname, updateSearchParams(searchParams, updates));
        const currentUrl = buildUrlWithSearchParams(pathname, new URLSearchParams(searchParams.toString()));
        if (nextUrl !== currentUrl) {
            router.replace(nextUrl, { scroll: false });
        }
    };

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
    }, [cityInput, initialCity]);

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
    }, [districtInput, initialDistrict]);

    useEffect(() => {
        setLoading(true);
        setError(null);
        getLocationAnalytics(filters)
            .then(setData)
            .catch((e: Error) => setError(e.message || "Failed to load analytics"))
            .finally(() => setLoading(false));
    }, [initialCity, initialDistrict, initialState, initialCountry]);

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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Filter by city..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={cityInput}
                            onChange={(e) => setCityInput(e.target.value)}
                        />
                    </div>
                    <input
                        type="text"
                        placeholder="Filter by district..."
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        value={districtInput}
                        onChange={(e) => setDistrictInput(e.target.value)}
                    />
                    <select
                        className="bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none"
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
                        className="bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none"
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
                            <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />
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
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
                                    <TrendingUp size={18} className="text-primary" />
                                    <h3 className="font-bold text-slate-900">Top Cities by Ads</h3>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {data.topCities?.length ? data.topCities.map((city, i) => (
                                        <div key={`${city.city}-${city.state}-${i}`} className="flex items-center justify-between px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center">
                                                    {i + 1}
                                                </span>
                                                <div>
                                                    <div className="font-semibold text-slate-900 text-sm">{city.city}</div>
                                                    <div className="text-xs text-slate-400">{city.state}</div>
                                                </div>
                                            </div>
                                            <span className="font-bold text-slate-700 text-sm">{city.adsCount ?? 0} ads</span>
                                        </div>
                                    )) : (
                                        <p className="px-5 py-4 text-sm text-slate-400">No city data available.</p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
                                    <BarChart2 size={18} className="text-primary" />
                                    <h3 className="font-bold text-slate-900">Ads by State</h3>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {adsByStateRows.length ? adsByStateRows.map((row) => (
                                        <div key={row.key} className="flex items-center justify-between px-5 py-3">
                                            <span className="text-sm font-medium text-slate-700">{row.label}</span>
                                            <div className="flex items-center gap-3">
                                                <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary rounded-full"
                                                        style={{
                                                            width: `${Math.min(100, Math.round((row.count / maxStateAdsCount) * 100))}%`
                                                        }}
                                                    />
                                                </div>
                                                <span className="font-bold text-slate-700 text-sm w-12 text-right">{row.count}</span>
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="px-5 py-4 text-sm text-slate-400">No state data available.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {data.hotZones?.length ? (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
                                    <Flame size={18} className="text-orange-500" />
                                    <h3 className="font-bold text-slate-900">Hot Zones</h3>
                                    <span className="ml-auto text-xs text-slate-400 font-medium">High search & ad activity</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                                    {data.hotZones.map((zone, idx) => (
                                        <div key={`${zone._id}-${idx}`} className="flex items-center justify-between px-5 py-3">
                                            <div>
                                                <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                                                    {zone.isHotZone && <Flame size={13} className="text-orange-500" />}
                                                    {zone.city}
                                                </div>
                                                <div className="text-xs text-slate-400">{zone.state}</div>
                                            </div>
                                            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
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
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
                {icon}
            </div>
            <div>
                <div className="text-2xl font-black text-slate-900">{value?.toLocaleString() ?? "—"}</div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</div>
            </div>
        </div>
    );
}
