"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { adminFetch } from "@/lib/api/adminClient";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { ADMIN_UI_ROUTES, adminListingModerationRoute } from "@/lib/adminUiRoutes";

type SearchBucket = "users" | "ads" | "businesses" | "reports" | "transactions";
type SearchItem = {
    id: string;
    label: string;
    meta: string;
    href: string;
};

type SearchState = Record<SearchBucket, SearchItem[]>;

const EMPTY_STATE: SearchState = {
    users: [],
    ads: [],
    businesses: [],
    reports: [],
    transactions: [],
};

const SECTION_LABELS: Record<SearchBucket, string> = {
    users: "Users",
    ads: "Listings",
    businesses: "Businesses",
    reports: "Reports",
    transactions: "Transactions",
};

export function AdminGlobalSearch({ autoFocus, onClose }: { autoFocus?: boolean; onClose?: () => void }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchState>(EMPTY_STATE);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);

    useEffect(() => {
        const trimmed = query.trim();
        if (trimmed.length < 2) {
            setResults(EMPTY_STATE);
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);
                const timer = setTimeout(async () => {
            try {
                const limit = "3";
                const [users, ads, businesses, reports, transactions] = await Promise.all([
                    adminFetch<any>(`${ADMIN_ROUTES.USERS}?${new URLSearchParams({ search: trimmed, page: "1", limit }).toString()}`),
                    adminFetch<any>(`${ADMIN_ROUTES.LISTINGS}?${new URLSearchParams({ search: trimmed, page: "1", limit }).toString()}`),
                    adminFetch<any>(`${ADMIN_ROUTES.BUSINESS_ACCOUNTS}?${new URLSearchParams({ search: trimmed, page: "1", limit, status: "all" }).toString()}`),
                    adminFetch<any>(`${ADMIN_ROUTES.REPORTED_ADS}?${new URLSearchParams({ search: trimmed, page: "1", limit }).toString()}`),
                    adminFetch<any>(`${ADMIN_ROUTES.FINANCE_TRANSACTIONS}?${new URLSearchParams({ search: trimmed, page: "1", limit }).toString()}`),
                ]);

                if (cancelled) return;

                const nextState: SearchState = {
                    users: parseAdminResponse<Record<string, unknown>>(users).items.map((item) => ({
                        id: String(item.id || item._id || item.mobile || ""),
                        label: String(item.name || item.mobile || "Unknown user"),
                        meta: String(item.mobile || item.email || "User"),
                        href: ADMIN_UI_ROUTES.users({ search: trimmed }),
                    })),
                    ads: parseAdminResponse<Record<string, unknown>>(ads).items.map((item) => ({
                        id: String(item.id || item._id || ""),
                        label: String(item.title || item.id || "Untitled ad"),
                        meta: String(item.status || item.sellerName || item.listingType || "Listing"),
                        href: adminListingModerationRoute(
                            item.listingType === "service"
                                ? "service"
                                : item.listingType === "spare_part"
                                    ? "spare_part"
                                    : "ad",
                            { search: trimmed }
                        ),
                    })),
                    businesses: parseAdminResponse<Record<string, unknown>>(businesses).items.map((item) => ({
                        id: String(item.id || item._id || ""),
                        label: String(item.name || item.email || "Business"),
                        meta: String(item.status || item.email || "Business"),
                        href: ADMIN_UI_ROUTES.businesses({ status: "all", search: trimmed }),
                    })),
                    reports: parseAdminResponse<Record<string, unknown>>(reports).items.map((item) => ({
                        id: String(item.id || item._id || ""),
                        label: String(item.reason || item.reportType || "Report"),
                        meta: String(item.status || item.adId || "Report"),
                        href: ADMIN_UI_ROUTES.reports({ search: trimmed }),
                    })),
                    transactions: parseAdminResponse<Record<string, unknown>>(transactions).items.map((item) => ({
                        id: String(item.id || item._id || ""),
                        label: String(item.reference || item.transactionId || "Transaction"),
                        meta: String(item.status || item.amount || "Transaction"),
                        href: ADMIN_UI_ROUTES.finance({ search: trimmed }),
                    })),
                };

                setResults(nextState);
            } catch {
                if (!cancelled) {
                    setResults(EMPTY_STATE);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }, 250);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [query]);

    const sections = useMemo(
        () =>
            (Object.entries(results) as Array<[SearchBucket, SearchItem[]]>).filter(([, items]) => items.length > 0),
        [results]
    );

    return (
        <div className="relative max-w-xl flex-1" ref={containerRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
                type="text"
                autoFocus={autoFocus}
                value={query}
                onChange={(event) => {
                    setQuery(event.target.value);
                    setIsOpen(true);
                }}
                onKeyDown={(e) => {
                    if (e.key === "Escape" && onClose) onClose();
                }}
                onFocus={() => setIsOpen(true)}
                placeholder="Search users, listings, businesses, reports, and transactions"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 pl-10 pr-4 text-sm text-slate-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-sky-200"
            />

            {isOpen && query.trim().length >= 2 && (
                <div className="absolute inset-x-0 top-full z-50 mt-2 max-h-[28rem] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl">
                    {loading && sections.length === 0 ? (
                        <div className="px-3 py-6 text-sm text-slate-500">Searching…</div>
                    ) : sections.length > 0 ? (
                        <div className="space-y-4">
                            {sections.map(([bucket, items]) => (
                                <div key={bucket} className="space-y-2">
                                    <p className="px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                        {SECTION_LABELS[bucket]}
                                    </p>
                                    <div className="space-y-1">
                                        {items.map((item) => (
                                            <Link
                                                key={`${bucket}-${item.id}`}
                                                href={item.href}
                                                onClick={() => setIsOpen(false)}
                                                className="block rounded-xl px-3 py-2 hover:bg-slate-50"
                                            >
                                                <p className="text-sm font-medium text-slate-900">{item.label}</p>
                                                <p className="text-xs text-slate-500">{item.meta}</p>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="px-3 py-6 text-sm text-slate-500">No matching admin records found.</div>
                    )}
                </div>
            )}
        </div>
    );
}
