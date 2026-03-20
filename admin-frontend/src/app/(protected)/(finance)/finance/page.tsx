"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { adminFetch } from "@/lib/api/adminClient";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { Transaction, FinanceStats } from "@/types/transaction";
import {
    DollarSign,
    Search,
    Filter,
    Download,
    CreditCard,
    TrendingUp,
    Calendar,
    Wallet,
    AlertCircle
} from "lucide-react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { AdminPageShell } from "@/components/layout/AdminPageShell";

export default function FinancePage() {
    const searchParams = useSearchParams();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState<FinanceStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const fetchFinanceData = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                search,
                status: statusFilter,
                page: "1",
                limit: "20"
            }).toString();

            const [transRes, statsRes] = await Promise.all([
                adminFetch<any>(`${ADMIN_ROUTES.FINANCE_TRANSACTIONS}?${query}`),
                adminFetch<any>(ADMIN_ROUTES.FINANCE_STATS)
            ]);
            const parsedTransactions = parseAdminResponse<Transaction>(transRes);
            const parsedStats = parseAdminResponse<never, FinanceStats>(statsRes);
            setTransactions(parsedTransactions.items);
            setStats(parsedStats.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load finance data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            void fetchFinanceData();
        }, 300);
        return () => clearTimeout(timer);
    }, [search, statusFilter]);

    useEffect(() => {
        const requestedSearch = searchParams.get("search") || "";
        setSearch((prev) => (prev === requestedSearch ? prev : requestedSearch));
    }, [searchParams]);

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
        <AdminPageShell
            title="Finance Management"
            description="Monitor revenue, sales, and transaction audits"
            tabs={
                <AdminModuleTabs
                    tabs={[
                        { label: "Revenue", href: "/finance" },
                        { label: "Invoices", href: "/invoices" },
                        { label: "Plans", href: "/plans" },
                        { label: "Revenue Stats", href: "/revenue" },
                    ]}
                />
            }
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
        >
        <div className="space-y-6">

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

            <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative flex-1 w-full text-black">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by Payment ID, User or description..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-black"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto text-black">
                    <Filter className="text-slate-400" size={18} />
                    <select
                        className="flex-1 md:w-40 bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-black"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="All">All Status</option>
                        <option value="SUCCESS">Success</option>
                        <option value="FAILED">Failed</option>
                        <option value="INITIATED">Initiated</option>
                    </select>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 rounded-lg p-4 text-sm font-medium flex items-center gap-2 italic">
                    <AlertCircle size={18} /> {error}
                </div>
            )}

            <DataTable
                data={transactions}
                columns={columns}
                isLoading={loading}
                emptyMessage="No transaction history found"
            />
        </div>
        </AdminPageShell>
    );
}
