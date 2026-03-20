"use client";

import { useAdminLocations } from "@/hooks/useAdminLocations";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Location } from "@/types/location";
import { useToast } from "@/context/ToastContext";
import {
    MapPin,
    Search,
    Filter,
    CheckCircle,
    XCircle,
    Trash2,
    TrendingUp,
    MoreVertical
} from "lucide-react";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { settingsTabs } from "@/components/layout/adminModuleTabSets";

export default function LocationsPage() {
    const { showToast } = useToast();
    const {
        locations,
        states,
        loading,
        error,
        filters,
        setFilters,
        handleToggleStatus,
        handleDelete,
        pagination,
        setPage
    } = useAdminLocations();

    const columns: ColumnDef<Location>[] = [
        {
            header: "Location",
            cell: (loc) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <MapPin size={20} />
                    </div>
                    <div>
                        <div className="font-bold text-slate-900">{loc.city}</div>
                        <div className="text-xs text-slate-500">{loc.state}, {loc.country}</div>
                    </div>
                </div>
            )
        },
        {
            header: "Level",
            cell: (loc) => (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                    {loc.level}
                </span>
            )
        },
        {
            header: "Popular",
            cell: (loc) => loc.isPopular ? (
                <span className="flex items-center gap-1 text-amber-600 font-bold text-xs">
                    <TrendingUp size={14} /> Popular
                </span>
            ) : null
        },
        {
            header: "Stats",
            cell: (loc) => (
                <div className="text-xs space-y-0.5">
                    <div className="text-slate-600"><span className="font-bold">{loc.adsCount || 0}</span> Ads</div>
                    <div className="text-slate-400">{loc.usersCount || 0} Users</div>
                </div>
            )
        },
        {
            header: "Status",
            cell: (loc) => (
                <button
                    onClick={() => void handleToggleStatus(loc.id)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${loc.isActive ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-red-100 text-red-700 hover:bg-red-200"
                        }`}>
                    {loc.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    {loc.isActive ? "Active" : "Inactive"}
                </button>
            )
        },
        {
            header: "Actions",
            className: "text-right",
            cell: (loc) => (
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={() => void handleDelete(loc.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete"
                    >
                        <Trash2 size={18} />
                    </button>
                    <button className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors">
                        <MoreVertical size={18} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <AdminPageShell
            title="Location Management"
            description="Manage system-wide master locations and geofences."
            tabs={<AdminModuleTabs tabs={settingsTabs} />}
            actions={
                <button
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                    onClick={() => showToast("Add Location feature coming soon", "info")}
                >
                    <MapPin size={18} />
                    Add Location
                </button>
            }
            className="h-full overflow-y-auto pr-1"
        >
        <div className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative col-span-1 md:col-span-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search city, state..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="text-slate-400" size={16} />
                    <select
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none"
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active Only</option>
                        <option value="inactive">Inactive Only</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none"
                        value={filters.state}
                        onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value }))}
                    >
                        <option value="all">All States</option>
                        {states.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none"
                        value={filters.level}
                        onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value as any }))}
                    >
                        <option value="all">All Levels</option>
                        <option value="city">City</option>
                        <option value="state">State</option>
                    </select>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
                    {error}
                </div>
            )}

            <DataTable
                data={locations}
                columns={columns}
                isLoading={loading}
                emptyMessage="No locations found"
                enableColumnVisibility
                enableCsvExport
                csvFileName="locations.csv"
                pagination={{
                    currentPage: pagination.page,
                    totalPages: pagination.totalPages || 1,
                    totalItems: pagination.total,
                    pageSize: pagination.limit,
                    onPageChange: setPage
                }}
            />
        </div>
        </AdminPageShell>
    );
}
