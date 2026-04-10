"use client";
import { mapErrorToMessage } from '@/lib/mapErrorToMessage';

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ColumnDef } from "@/components/ui/DataTable";
import { Transaction, FinanceStats } from "@/types/transaction";
import { fetchFinanceStats, fetchFinanceTransactions } from "@/lib/api/finance";
import {
    DollarSign,
    Search,
    Filter,
    Download,
    CreditCard,
    TrendingUp,
    Calendar,
    Wallet,
} from "lucide-react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { FinancePageTemplate } from "@/components/finance/FinancePageTemplate";
import {
    buildUrlWithSearchParams,
    normalizeSearchParamValue,
    parsePositiveIntParam,
    updateSearchParams,
} from "@/lib/urlSearchParams";

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

    const rawSearch = searchParams.get("search");
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

    const replaceQueryState = (updates: Record<string, string | number | null | undefined>) => {
        const nextUrl = buildUrlWithSearchParams(pathname, updateSearchParams(searchParams, updates));
        const currentUrl = buildUrlWithSearchParams(pathname, new URLSearchParams(searchParams.toString()));
        if (nextUrl !== currentUrl) {
            router.replace(nextUrl, { scroll: false });
        }
    };

    const fetchFinanceData = async () => {
        setLoading(true);
        setError("");
        try {
            const [{ items, pagination: nextPagination }, statsData] = await Promise.all([
                fetchFinanceTransactions({
                    search,
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
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            void fetchFinanceData();
        }, 300);
        return () => clearTimeout(timer);
    }, [page, search, statusFilter]);

    useEffect(() => {
        const nextUrl = buildUrlWithSearchParams(
            pathname,
            updateSearchParams(searchParams, {
                search,
                status: rawStatus === null ? null : statusFilter,
                page: page > 1 ? page : null,
            })
        );
        const currentUrl = buildUrlWithSearchParams(pathname, new URLSearchParams(searchParams.toString()));

        if (nextUrl !== currentUrl) {
            router.replace(nextUrl, { scroll: false });
        }
    }, [page, pathname, rawStatus, router, search, searchParams, statusFilter]);

    useEffect(() => {
        if (!loading && page > pagination.pages) {
            replaceQueryState({ page: pagination.pages > 1 ? pagination.pages : null });
        }
    }, [loading, page, pagination.pages]);

    const columns: ColumnDef<Transaction>[] = [
        {
            header: "Transaction ID",
            cell: (t) => (
                <div className="font-mono text-[10px] text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100 uppercase">
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
                        <div className="font-bold text-slate-900 leading-none mb-1">
                            {user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Unknown'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                            {user?.email || user?.mobile || 'No contact'}
                        </div>
                    </div>
                );
            }
        },
        {
            header: "Amount",
            cell: (t) => (
                <div className="font-bold text-slate-900">
                    <span className="text-slate-400 font-medium mr-1">{t.currency}</span>
                    {t.amount?.toLocaleString() || '0'}
                </div>
            )
        },
        {
            header: "Status",
            cell: (t) => (
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${t.status === 'SUCCESS' ? "bg-emerald-100 text-emerald-700" :
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
                <div className="text-xs text-slate-500 max-w-[200px] truncate italic">
                    {t.description || 'System transaction'}
                </div>
            )
        },
        {
            header: "Date",
            cell: (t) => (
                <div className="text-xs text-slate-500 font-medium">
                    {new Date(t.createdAt).toLocaleDateString()}
                    <span className="text-[10px] text-slate-300 ml-2">
                        {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            )
        }
    ];

    return (
        <FinancePageTemplate<Transaction>
            title="Finance Management"
            description="Monitor revenue, sales, and transaction audits"
            data={transactions}
            columns={columns}
            isLoading={loading}
            error={error}
            emptyMessage="No transaction history found"
            pagination={{
                currentPage: page,
                totalPages: pagination.pages,
                totalItems: pagination.total,
                pageSize: pagination.limit,
                onPageChange: (nextPage) => replaceQueryState({ page: nextPage > 1 ? nextPage : null }),
            }}
            actions={
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-bold text-sm shadow-sm hover:bg-slate-50 transition-colors">
                        <Download size={16} /> Export
                    </button>
                    <button className="flex items-center gap-2 bg-primary text-white px-3 py-1.5 rounded-lg font-bold text-sm shadow-sm hover:bg-blue-600 transition-colors">
                        <Wallet size={16} /> Adjust Wallet
                    </button>
                </div>
            }
            stats={
                <>
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
                </>
            }
            filters={
                <>
                    <div className="relative flex-1 w-full text-black">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by Payment ID, User or description..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-black outline-none"
                            value={search}
                            onChange={(e) => replaceQueryState({ search: e.target.value, page: null })}
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto text-black">
                        <Filter className="text-slate-400" size={18} />
                        <select
                            className="flex-1 md:w-40 bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-black outline-none"
                            value={statusFilter}
                            onChange={(e) => replaceQueryState({ status: e.target.value, page: null })}
                        >
                            <option value="all">All Status</option>
                            <option value="SUCCESS">Success</option>
                            <option value="FAILED">Failed</option>
                            <option value="INITIATED">Initiated</option>
                        </select>
                    </div>
                </>
            }
        />
    );
}
