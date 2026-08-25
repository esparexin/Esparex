import { Button } from "@esparex/ui";
import { Skeleton } from "@/components/ui/skeleton";

interface UserListingsTemplateProps<TStatus extends string, TItem> {
    title?: string;
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
    error?: unknown;
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
    title: _title, icon: _icon, subTabs, activeSubTab, onSubTabChange,
    statusTabs, selectedStatus, onStatusChange, getStatusCount,
    onPost: _onPost, postLabel: _postLabel,
    items, loading, error, errorMessage = "Failed to load listings.", onRetry,
    getItemKey, renderItem, emptyState
}: UserListingsTemplateProps<TStatus, TItem>) {
    
    const activeSubTabColor = subTabs?.find(t => t.value === activeSubTab)?.color ?? "blue";
    const activeTabClass = {
        blue: "border-primary text-primary",
        violet: "border-violet-600 text-violet-700",
        teal: "border-teal-600 text-teal-700",
    }[activeSubTabColor as "blue" | "violet" | "teal"] || "border-primary text-primary";

    const colCount = statusTabs.length > 0 ? statusTabs.length : 3;

    return (
        <div className="w-full">
            {/* ── Header (Sub-tabs and status filters) ── */}
            <div className="pb-2 md:pt-1 md:pb-2.5">
                {/* Sub-tabs */}
                {subTabs && subTabs.length > 1 && onSubTabChange && (
                    <div className="flex gap-0 border-b border-border overflow-x-auto no-scrollbar touch-pan-x py-1 mb-3">
                        {subTabs.map(t => (
                            <button
                                key={t.value}
                                onClick={() => onSubTabChange(t.value)}
                                className={`flex items-center gap-1.5 px-4 py-2 text-caption font-semibold border-b-2 transition-colors -mb-px whitespace-nowrap min-h-[36px] cursor-pointer
                                    ${activeSubTab === t.value
                                        ? activeTabClass
                                        : "border-transparent text-muted-foreground hover:text-foreground-secondary"
                                    }`}
                            >
                                {t.icon}
                                {t.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Segmented Control Status Tabs */}
                <div
                    className="grid gap-0.5 bg-muted p-0.5 rounded-lg h-8 max-w-xs"
                    role="tablist"
                    aria-label="Filter listings by status"
                    style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
                >
                    {statusTabs.map((status) => (
                        <button
                            key={status}
                            role="tab"
                            aria-selected={selectedStatus === status}
                            onClick={() => onStatusChange(status)}
                            className={`h-7 flex items-center justify-center rounded-md text-tiny font-semibold whitespace-nowrap transition-all px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 cursor-pointer ${selectedStatus === status
                                ? "bg-card text-foreground shadow-xs"
                                : "text-foreground-tertiary hover:text-foreground hover:bg-muted/60"
                                }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                            {getStatusCount ? (
                                <span className="ml-0.5 opacity-60">
                                    ({getStatusCount(status)})
                                </span>
                            ) : null}
                        </button>
                    ))}
                </div>
            </div>

            <div className="pb-3">
                {/* Content */}
                {loading ? (
                    <LoadingSkeleton />
                ) : error ? (
                    <div className="py-12 text-center">
                        <p className="text-muted-foreground text-body mb-4">{errorMessage}</p>
                        {onRetry && <Button onClick={onRetry} variant="outline" size="sm" className="cursor-pointer">Retry</Button>}
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <div className="mb-4 text-foreground-subtle flex justify-center [&>svg]:h-10 [&>svg]:w-10 md:[&>svg]:h-12 md:[&>svg]:w-12">{emptyState.icon}</div>
                        <h3 className="text-body font-semibold text-foreground mb-1">{emptyState.title}</h3>
                        <p className="text-caption text-muted-foreground max-w-[240px] mb-6">{emptyState.description}</p>
                        {emptyState.cta}
                    </div>
                ) : (
                    <div className="divide-y divide-border border-t border-border">
                        {items.map((item) => (
                            <div key={getItemKey(item)}>{renderItem(item)}</div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="divide-y divide-border border-t border-border">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start gap-3 py-3 md:gap-4 md:py-3.5">
                    <Skeleton className="h-16 w-16 md:h-[72px] md:w-[72px] rounded-lg shrink-0" />
                    <div className="flex-1 space-y-1.5 pt-0.5">
                        <Skeleton className="h-[15px] w-4/5" />
                        <Skeleton className="h-[15px] w-1/4" />
                        <Skeleton className="h-3 w-2/5" />
                    </div>
                    <Skeleton className="h-8 w-16 rounded-md shrink-0" />
                </div>
            ))}
        </div>
    );
}
