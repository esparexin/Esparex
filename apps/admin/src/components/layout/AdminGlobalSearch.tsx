"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import {
    EMPTY_ADMIN_SEARCH_STATE,
    searchAdminRecords,
    type AdminSearchBucket,
    type AdminSearchItem,
} from "@/lib/api/adminSearch";

const SECTION_LABELS: Record<AdminSearchBucket, string> = {
    users: "Users",
    ads: "Listings",
    businesses: "Businesses",
    reports: "Reports",
    transactions: "Transactions",
};

export function AdminGlobalSearch({ autoFocus, onClose }: { autoFocus?: boolean; onClose?: () => void }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState(EMPTY_ADMIN_SEARCH_STATE);
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
        void (async () => {
            const trimmed = query.trim();
            if (trimmed.length < 2) {
                setResults(EMPTY_ADMIN_SEARCH_STATE);
                setLoading(false);
                return;
            }
            setLoading(true);
        })();

        let cancelled = false;
        const timer = setTimeout(async () => {
            const trimmed = query.trim();
            if (trimmed.length < 2) return;
            try {
                const nextState = await searchAdminRecords(trimmed);
                if (cancelled) return;
                setResults(nextState);
            } catch {
                if (!cancelled) {
                    setResults(EMPTY_ADMIN_SEARCH_STATE);
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
            (Object.entries(results) as Array<[AdminSearchBucket, AdminSearchItem[]]>).filter(([, items]) => items.length > 0),
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
