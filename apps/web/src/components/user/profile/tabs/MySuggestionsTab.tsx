"use client";

import { useEffect, useState, useCallback } from "react";
import { ClipboardList, RefreshCw, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getMyCatalogRequests, type CatalogRequest } from "@/lib/api/user/catalogRequest";
import { formatDate } from "@/lib/formatters";
import { cn } from "@/components/ui/utils";

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: CatalogRequest["status"] }) {
    const map: Record<CatalogRequest["status"], { label: string; className: string }> = {
        pending:   { label: "Pending Review", className: "bg-amber-100 text-amber-700" },
        approved:  { label: "Approved",       className: "bg-emerald-100 text-emerald-700" },
        rejected:  { label: "Not Added",      className: "bg-red-100 text-red-700" },
        duplicate: { label: "Already Exists", className: "bg-blue-100 text-blue-700" },
    };
    const { label, className } = map[status] ?? { label: status, className: "bg-slate-100 text-slate-600" };
    return (
        <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider", className)}>
            {label}
        </span>
    );
}

// ─── Type Badge ───────────────────────────────────────────────────────────────

function TypeBadge({ requestType }: { requestType: CatalogRequest["requestType"] }) {
    return (
        <span className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
            requestType === "brand"
                ? "bg-violet-100 text-violet-700"
                : "bg-sky-100 text-sky-700"
        )}>
            {requestType === "brand" ? "Brand" : "Model"}
        </span>
    );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
                <ClipboardList className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-foreground-secondary">No suggestions yet</p>
            <p className="text-xs text-muted-foreground max-w-xs">
                When you can&apos;t find a brand or model while posting an ad, tap the&nbsp;
                <span className="font-bold text-foreground">+</span> button to request it.
                Your submissions will appear here.
            </p>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MySuggestionsTab() {
    const [items, setItems] = useState<CatalogRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getMyCatalogRequests({ limit: 50 });
            setItems(result.items);
        } catch {
            setError("Failed to load your suggestions. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            void load();
        }, 0);
        return () => clearTimeout(timer);
    }, [load]);

    return (
        <div className="space-y-4">
            {/* Header Card */}
            <Card className="bg-gradient-to-br from-violet-50 to-sky-50 border-violet-200 gap-0">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-violet-700">
                        <ClipboardList className="h-5 w-5 text-violet-600" />
                        My Brand &amp; Model Suggestions
                    </CardTitle>
                    <CardDescription>
                        Track the status of brands and models you&apos;ve requested. Our team reviews each submission manually.
                    </CardDescription>
                </CardHeader>
                {items.length > 0 && (
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-2xl font-bold text-amber-600">
                                    {items.filter(i => i.status === "pending").length}
                                </p>
                                <p className="text-xs text-muted-foreground">Pending</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-emerald-600">
                                    {items.filter(i => i.status === "approved").length}
                                </p>
                                <p className="text-xs text-muted-foreground">Approved</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-400">
                                    {items.filter(i => i.status === "rejected" || i.status === "duplicate").length}
                                </p>
                                <p className="text-xs text-muted-foreground">Not Added</p>
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* List Card */}
            <Card className="gap-0">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <ClipboardList className="h-5 w-5" />
                            Submissions
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { void load(); }}
                            disabled={loading}
                            className="h-8 px-2 text-muted-foreground"
                            aria-label="Refresh suggestions"
                        >
                            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center gap-3 py-8 text-center">
                            <AlertCircle className="h-8 w-8 text-red-400" />
                            <p className="text-sm text-red-600">{error}</p>
                            <Button variant="outline" size="sm" onClick={() => { void load(); }}>
                                Try Again
                            </Button>
                        </div>
                    ) : items.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <div className="space-y-2">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 transition-colors hover:bg-slate-100/60"
                                >
                                    <div className="flex flex-col gap-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-semibold text-foreground truncate">
                                                {item.requestedName}
                                            </span>
                                            <TypeBadge requestType={item.requestType} />
                                        </div>
                                        <p className="text-[11px] text-muted-foreground">
                                            Submitted {formatDate(item.createdAt)}
                                        </p>
                                    </div>
                                    <div className="shrink-0">
                                        <StatusBadge status={item.status} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
