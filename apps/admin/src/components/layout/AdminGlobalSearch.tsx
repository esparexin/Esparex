"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search } from "@esparex/ui";
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-subtle" size={18} />
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
                className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-4 text-body text-foreground-secondary placeholder:text-muted-foreground shadow-xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />

            {isOpen && query.trim().length >= 2 && (
                <div className="absolute inset-x-0 top-full z-50 mt-2 max-h-[28rem] overflow-y-auto rounded-2xl border border-border bg-card p-3 shadow-2xl">
                    {loading && sections.length === 0 ? (
                        <div className="px-3 py-6 text-body text-foreground-tertiary">Searching…</div>
                    ) : sections.length > 0 ? (
                        <div className="space-y-4">
                            {sections.map(([bucket, items]) => (
                                <div key={bucket} className="space-y-2">
                                    <p className="px-2 text-tiny font-bold uppercase tracking-[0.14em] text-foreground-subtle">
                                        {SECTION_LABELS[bucket]}
                                    </p>
                                    <div className="space-y-1">
                                        {items.map((item) => (
                                            <Link
                                                key={`${bucket}-${item.id}`}
                                                href={item.href}
                                                onClick={() => setIsOpen(false)}
                                                className="block rounded-xl px-3 py-2 hover:bg-muted/50 transition-colors"
                                            >
                                                <p className="text-body font-medium text-foreground">{item.label}</p>
                                                <p className="text-caption text-foreground-tertiary">{item.meta}</p>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="px-3 py-6 text-body text-foreground-tertiary">No matching admin records found.</div>
                    )}
                </div>
            )}
        </div>
    );
}
