"use client";
import { mapErrorToMessage } from '@/lib/mapErrorToMessage';

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Transaction, FinanceStats } from "@/types/transaction";
import { fetchFinanceStats, fetchFinanceTransactions } from "@/lib/api/finance";
import {
    DollarSign,
    CreditCard,
    TrendingUp,
    Calendar,
    DataTable,
    AlertCircle,
    type ColumnDef,
} from "@esparex/ui";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { financeTabs } from "@/components/layout/adminModuleTabSets";
import { AdminFilterToolbar } from "@/components/layout/AdminFilterToolbar";
import { useAdminQuerySync } from "@/hooks/useAdminQuerySync";
import { normalizeSearchParamValue, parsePositiveIntParam } from "@/lib/urlSearchParams";

const DEFAULT_STATUS = "all";
const FINANCE_STATUSES = new Set(["all", "SUCCESS", "FAILED", "INITIATED"]);

export default function FinancePage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState<FinanceStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [pagination, setPagination] = useState({
        total: 0,
        pages: 1,
        limit: 20,
    });

    const rawSearch = searchParams.get("q") ?? searchParams.get("search");
    const rawStatus = searchParams.get("status");
    const rawPage = searchParams.get("page");

    const search = normalizeSearchParamValue(rawSearch);
    const statusFilter =
        rawStatus === "All"
            ? DEFAULT_STATUS
            : rawStatus && FINANCE_STATUSES.has(rawStatus)
                ? rawStatus
                : DEFAULT_STATUS;
    const page = parsePositiveIntParam(rawPage, 1);

    const { replaceQueryState } = useAdminQuerySync({
        loading,
        initialPage: page,
        totalPages: pagination.pages,
    });

    const fetchFinanceData = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const [{ items, pagination: nextPagination }, statsData] = await Promise.all([
                fetchFinanceTransactions({
                    q: search,
                    status: statusFilter,
                    page,
                    limit: 20,
                }),
                fetchFinanceStats(),
            ]);
            setTransactions(items);
            setPagination({
                total: nextPagination.total,
                pages: nextPagination.pages,
                limit: nextPagination.limit,
            });
            setStats(statsData);
        } catch (err) {
            setError(mapErrorToMessage(err, "Failed to load finance data"));
        } finally {
            setLoading(false);
        }
    }, [page, search, statusFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            void fetchFinanceData();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchFinanceData]);

    const columns: ColumnDef<Transaction>[] = [
        {
            header: "Transaction ID",
            cell: (t) => (
                <div className="font-mono text-tiny text-foreground-tertiary bg-muted/40 px-2 py-1 rounded border border-border uppercase">
                    {t.gatewayPaymentId || t.id.substring(0, 12)}
                </div>
            )
        },
        {
            header: "User",
            cell: (t) => {
                const user = (t.userId && typeof t.userId === 'object') ? t.userId : null;
                return (
                    <div>
                        <div className="font-bold text-foreground leading-none mb-1">
                            {user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Unknown'}
                        </div>
                        <div className="text-tiny text-foreground-subtle font-medium">
                            {user?.email || user?.mobile || 'No contact'}
                        </div>
                    </div>
                );
            }
        },
        {
            header: "Amount",
            cell: (t) => (
                <div className="font-bold text-foreground">
                    <span className="text-foreground-subtle font-medium mr-1">{t.currency}</span>
                    {t.amount?.toLocaleString() || '0'}
                </div>
            )
        },
        {
            header: "Status",
            cell: (t) => (
                <span className={`px-2 py-1 rounded text-tiny font-bold uppercase tracking-wider ${t.status === 'SUCCESS' ? "bg-emerald-100 text-emerald-700" :
                        t.status === 'FAILED' ? "bg-red-100 text-red-700" :
                            "bg-amber-100 text-amber-700"
                    }`}>
                    {t.status}
                </span>
            )
        },
        {
            header: "Description",
            cell: (t) => (
                <div className="text-xs text-foreground-tertiary max-w-[200px] truncate italic">
                    {t.description || 'System transaction'}
                </div>
            )
        },
        {
            header: "Date",
            cell: (t) => (
                <div className="text-xs text-foreground-tertiary font-medium">
                    {new Date(t.createdAt).toLocaleDateString()}
                    <span className="text-tiny text-foreground-subtle ml-2">
                        {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            )
        }
    ];

    return (
        <AdminPageShell
            title="Finance Management"
            description="Monitor revenue, sales, and transaction audits"
            tabs={<AdminModuleTabs tabs={financeTabs} />}
        >
            <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl">
                    <DashboardCard
                        title="Total Revenue"
                        value={`₹${stats?.totalRevenue.toLocaleString() || '0'}`}
                        icon={DollarSign}
                        trend={{ value: 12.5, isUp: true }}
                        description="Success Transactions"
                    />
                    <DashboardCard
                        title="Today's Revenue"
                        value={`₹${stats?.todayRevenue.toLocaleString() || '0'}`}
                        icon={TrendingUp}
                        trend={{ value: 4.2, isUp: true }}
                        description="Last 24 hours"
                    />
                    <DashboardCard
                        title="Total Sales"
                        value={stats?.totalSales.toString() || '0'}
                        icon={CreditCard}
                        description="Plan Subscriptions"
                    />
                    <DashboardCard
                        title="This Month"
                        value={`₹${stats?.thisMonthRevenue.toLocaleString() || '0'}`}
                        icon={Calendar}
                        description="MTD Earnings"
                    />
                </div>

                <AdminFilterToolbar
                    search={search}
                    onSearchChange={(val) => replaceQueryState({ q: val, page: null })}
                    searchPlaceholder="Search by Payment ID, User, or description..."
                    status={statusFilter}
                    onStatusChange={(val) => replaceQueryState({ status: val, page: null })}
                    statusOptions={[
                        { value: "all", label: "All Status" },
                        { value: "SUCCESS", label: "Success" },
                        { value: "FAILED", label: "Failed" },
                        { value: "INITIATED", label: "Initiated" },
                    ]}
                />

                {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4 text-body font-medium flex items-center gap-2">
                        <AlertCircle size={18} /> {error}
                    </div>
                )}

                <div className="min-h-0 flex-1">
                    <DataTable
                        data={transactions}
                        columns={columns}
                        isLoading={loading}
                        emptyMessage="No transaction history found"
                        enableCsvExport
                        csvFileName="finance-transactions.csv"
                        enableColumnVisibility
                        pagination={{
                            currentPage: page,
                            totalPages: pagination.pages,
                            totalItems: pagination.total,
                            pageSize: pagination.limit,
                            onPageChange: (nextPage) => replaceQueryState({ page: nextPage > 1 ? nextPage : null }),
                        }}
                    />
                </div>
            </div>
        </AdminPageShell>
    );
}
