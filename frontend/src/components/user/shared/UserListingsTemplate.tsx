import { PlusCircle, LayoutGrid } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface UserListingsTemplateProps<TStatus extends string, TItem> {
    title: string;
    icon?: React.ReactNode;
    // Sub-tabs (Ads, Services, etc)
    subTabs?: {
        value: string;
        label: string;
        icon: React.ReactNode;
        color: string;
    }[];
    activeSubTab?: string;
    onSubTabChange?: (value: string) => void;
    // Status filters (Live, Pending, etc)
    statusTabs: readonly TStatus[];
    selectedStatus: TStatus;
    onStatusChange: (status: TStatus) => void;
    getStatusCount?: (status: TStatus) => number;
    // Actions
    onPost?: () => void;
    postLabel?: string;
    // Content
    items: TItem[];
    loading: boolean;
    error?: any;
    errorMessage?: string;
    onRetry?: () => void;
    getItemKey: (item: TItem) => string | number;
    renderItem: (item: TItem) => React.ReactNode;
    emptyState: {
        icon: React.ReactNode;
        title: string;
        description: string;
        cta?: React.ReactNode;
    };
}

export function UserListingsTemplate<TStatus extends string, TItem>({
    title, icon, subTabs, activeSubTab, onSubTabChange,
    statusTabs, selectedStatus, onStatusChange, getStatusCount,
    onPost, postLabel,
    items, loading, error, errorMessage = "Failed to load listings.", onRetry,
    getItemKey, renderItem, emptyState
}: UserListingsTemplateProps<TStatus, TItem>) {
    
    const activeSubTabColor = subTabs?.find(t => t.value === activeSubTab)?.color ?? "blue";
    const activeTabClass = {
        blue: "border-blue-600 text-blue-700",
        violet: "border-violet-600 text-violet-700",
        teal: "border-teal-600 text-teal-700",
    }[activeSubTabColor as "blue" | "violet" | "teal"] || "border-blue-600 text-blue-700";

    const postBtnClass = {
        blue: "bg-blue-600 hover:bg-blue-700",
        violet: "bg-violet-600 hover:bg-violet-700",
        teal: "bg-teal-600 hover:bg-teal-700",
    }[activeSubTabColor as "blue" | "violet" | "teal"] || "bg-blue-600 hover:bg-blue-700";

    return (
        <Card className="border-0 shadow-sm md:border md:shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-4 md:px-6 pt-5 pb-0">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        {icon || <LayoutGrid className="h-5 w-5 text-blue-600" />}
                        {title}
                    </h2>
                    {onPost && (
                        <Button
                            onClick={onPost}
                            size="sm"
                            className={`${postBtnClass} text-white text-xs h-11 px-3`}
                        >
                            <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                            {postLabel || "Post New"}
                        </Button>
                    )}
                </div>

                {/* Sub-tabs */}
                {subTabs && onSubTabChange && (
                    <div className="flex gap-0 border-b border-slate-100 overflow-x-auto scrollbar-hide">
                        {subTabs.map(t => (
                            <button
                                key={t.value}
                                onClick={() => onSubTabChange(t.value)}
                                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px whitespace-nowrap
                                    ${activeSubTab === t.value
                                        ? activeTabClass
                                        : "border-transparent text-slate-500 hover:text-slate-700"
                                    }`}
                            >
                                {t.icon}
                                {t.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <CardContent className="px-3 md:px-6 pt-3 pb-5">
                {/* Status Pills */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-3">
                    {statusTabs.map((status) => (
                        <button
                            key={status}
                            onClick={() => onStatusChange(status)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${selectedStatus === status
                                ? "bg-slate-900 text-white shadow"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                            {getStatusCount ? (
                                <span className="ml-1.5 text-[10px] opacity-60">
                                    {getStatusCount(status)}
                                </span>
                            ) : null}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {loading ? (
                    <LoadingSkeleton />
                ) : error ? (
                    <div className="py-12 text-center">
                        <p className="text-slate-500 text-sm mb-4">{errorMessage}</p>
                        {onRetry && <Button onClick={onRetry} variant="outline" size="sm">Retry</Button>}
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <div className="mb-4 text-slate-200">{emptyState.icon}</div>
                        <h3 className="text-sm font-semibold text-slate-900 mb-1">{emptyState.title}</h3>
                        <p className="text-xs text-slate-500 max-w-[240px] mb-6">{emptyState.description}</p>
                        {emptyState.cta}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {items.map((item) => (
                            <div key={getItemKey(item)}>{renderItem(item)}</div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 p-3 rounded-xl border border-slate-100 bg-white">
                    <Skeleton className="h-20 w-20 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/4" />
                        <div className="flex gap-2 pt-2">
                            <Skeleton className="h-3 w-12" />
                            <Skeleton className="h-3 w-12" />
                        </div>
                        <div className="flex justify-end gap-2 mt-2">
                            <Skeleton className="h-7 w-16" />
                            <Skeleton className="h-7 w-16" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
