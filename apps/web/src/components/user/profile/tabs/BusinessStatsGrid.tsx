"use client";

interface BusinessStatsGridProps {
    businessStats?: { totalServices: number; approvedServices: number; pendingServices: number; views: number };
}

export function BusinessStatsGrid({ businessStats }: BusinessStatsGridProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="rounded-xl border border-border bg-card p-2.5 sm:p-3 shadow-2xs flex items-center justify-between">
                <span className="text-tiny uppercase font-bold text-foreground-subtle tracking-wider">Total Services</span>
                <span className="text-body-lg font-bold text-foreground">{businessStats?.totalServices ?? 0}</span>
            </div>
            <div className="rounded-xl border border-border bg-card p-2.5 sm:p-3 shadow-2xs flex items-center justify-between">
                <span className="text-tiny uppercase font-bold text-emerald-700 tracking-wider">Approved</span>
                <span className="text-body-lg font-bold text-emerald-600">{businessStats?.approvedServices ?? 0}</span>
            </div>
            <div className="rounded-xl border border-border bg-card p-2.5 sm:p-3 shadow-2xs flex items-center justify-between">
                <span className="text-tiny uppercase font-bold text-amber-700 tracking-wider">Pending</span>
                <span className="text-body-lg font-bold text-amber-600">{businessStats?.pendingServices ?? 0}</span>
            </div>
            <div className="rounded-xl border border-border bg-card p-2.5 sm:p-3 shadow-2xs flex items-center justify-between">
                <span className="text-tiny uppercase font-bold text-primary tracking-wider">Profile Views</span>
                <span className="text-body-lg font-bold text-primary">{businessStats?.views ?? 0}</span>
            </div>
        </div>
    );
}
