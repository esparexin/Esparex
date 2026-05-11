"use client";

import { useEffect, useState } from "react";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { notificationsTabs } from "@/components/layout/adminModuleTabSets";
import { useSmartAlertLogs } from "@/hooks/useSmartAlertLogs";
import { useSmartAlerts } from "@/hooks/useSmartAlerts";
import { Loader2, RefreshCw, BellRing, Navigation, Trash2, History } from "lucide-react";
import { format } from "date-fns";

type AlertLog = {
    _id: string;
    alertId: string | { name?: string; criteria?: Record<string, unknown> };
    adId: string | { title: string; location?: string; price?: number };
    deliveredAt: string;
};
type AlertItem = {
    _id?: string;
    id?: string;
    name?: string;
    userId: string;
    criteria?: Record<string, unknown>;
    isActive: boolean;
    expiresAt?: string;
    expiryWarningCount?: number;
    expiryWarningSentAt?: string;
};

export default function SmartAlertsPage() {
    const [activeView, setActiveView] = useState<'logs' | 'management'>('logs');
    const { logs, loading: logsLoading, error: logsError, pagination: logsPagination, getLogs } = useSmartAlertLogs();
    const { alerts, loading: alertsLoading, error: alertsError, pagination: alertsPagination, getAlerts, handleDeleteAlert, handleBulkResend } = useSmartAlerts();
    
    const [page, setPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    
    useEffect(() => {
        if (activeView === 'logs') {
            getLogs({ page, limit: 50 });
        } else {
            getAlerts({ page, limit: 50 });
        }
        setSelectedIds(new Set());
    }, [page, activeView, getLogs, getAlerts]);

    const isLoading = activeView === 'logs' ? logsLoading : alertsLoading;
    const error = activeView === 'logs' ? logsError : alertsError;
    const pagination = activeView === 'logs' ? logsPagination : alertsPagination;
    const items = activeView === 'logs' ? logs : alerts;

    const toggleSelectAll = () => {
        if (selectedIds.size === alerts.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(alerts.map(a => a._id || a.id)));
        }
    };

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    return (
        <AdminPageShell
            title="Smart Alerts"
            description="Manage saved search alerts and monitor real-time delivery performance."
            tabs={<AdminModuleTabs tabs={notificationsTabs} />}
        >
            <div className="flex flex-col gap-6">
                {/* View Switcher */}
                <div className="flex items-center justify-between">
                    <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                        <button
                            onClick={() => { setActiveView('logs'); setPage(1); }}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeView === 'logs' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Delivery Logs
                        </button>
                        <button
                            onClick={() => { setActiveView('management'); setPage(1); }}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeView === 'management' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Alert Management
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        {activeView === 'management' && selectedIds.size > 0 && (
                            <button
                                onClick={() => {
                                    void handleBulkResend(Array.from(selectedIds));
                                    setSelectedIds(new Set());
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 transition-colors font-bold"
                            >
                                <History className="h-4 w-4" />
                                Resend Warnings ({selectedIds.size})
                            </button>
                        )}
                        <button 
                            onClick={() => activeView === 'logs' ? getLogs({ page, limit: 50 }) : getAlerts({ page, limit: 50 })}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors text-slate-700 font-medium"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-slate-400' : 'text-slate-500'}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-600">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                {activeView === 'logs' ? (
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Alert Owner</th>
                                        <th className="px-6 py-4 font-semibold">Matched Listing</th>
                                        <th className="px-6 py-4 font-semibold tracking-wider">Alert Configuration</th>
                                        <th className="px-6 py-4 font-semibold">Delivered At</th>
                                    </tr>
                                ) : (
                                    <tr>
                                        <th className="px-4 py-4 w-10">
                                            <input
                                                type="checkbox"
                                                checked={alerts.length > 0 && selectedIds.size === alerts.length}
                                                onChange={toggleSelectAll}
                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                            />
                                        </th>
                                        <th className="px-6 py-4 font-semibold">Alert Name / User</th>
                                        <th className="px-6 py-4 font-semibold">Criteria</th>
                                        <th className="px-6 py-4 font-semibold">Lifecycle</th>
                                        <th className="px-6 py-4 font-semibold">Last Warning</th>
                                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                    </tr>
                                )}
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading && items.length === 0 ? (
                                    <tr>
                                        <td colSpan={activeView === 'logs' ? 4 : 6} className="h-48 text-center text-slate-400">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                                                <span className="text-sm font-medium">Fetching data...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : error ? (
                                    <tr>
                                        <td colSpan={activeView === 'logs' ? 4 : 6} className="h-48 text-center text-red-500">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-md mb-1">Error fetching data</span>
                                                <span className="text-sm">{error}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : items.length === 0 ? (
                                    <tr>
                                        <td colSpan={activeView === 'logs' ? 4 : 6} className="h-48 text-center bg-slate-50/30">
                                            <div className="flex flex-col items-center justify-center gap-3 py-6">
                                                <div className="h-12 w-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                                                    <BellRing className="h-5 w-5 text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="text-slate-600 font-medium">{activeView === 'logs' ? 'No Alerts Delivered Yet' : 'No Alerts Found'}</p>
                                                    <p className="text-sm text-slate-400 mt-1 max-w-sm">
                                                        {activeView === 'logs' 
                                                            ? 'When an active listing matches a user\'s saved criteria, the delivery log will appear here.'
                                                            : 'There are no active or expired smart alerts in the system.'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : activeView === 'logs' ? (
                                    (items as AlertLog[]).map((log) => (
                                        <tr key={log._id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {typeof log.alertId === "object" ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-slate-800 flex items-center gap-2">
                                                            <BellRing className="h-3 w-3 text-emerald-500" />
                                                            {log.alertId.name || 'Unnamed Alert'}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 font-mono text-xs">{log.alertId}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {typeof log.adId === "object" ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-slate-800 hover:text-blue-600 cursor-pointer flex items-center gap-2 transition-colors">
                                                            <span className="line-clamp-1">{log.adId.title}</span>
                                                        </span>
                                                        <div className="flex items-center gap-1.5 mt-1.5">
                                                            {log.adId.location && (
                                                                <>
                                                                    <Navigation className="h-3 w-3 text-slate-400" />
                                                                    <span className="text-xs text-slate-500 mr-1">{log.adId.location}</span>
                                                                </>
                                                            )}
                                                            <span className="text-2xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                                                {log.adId.price > 0 ? `$${log.adId.price}` : "Free"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 font-mono text-xs">{log.adId}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {typeof log.alertId === "object" && log.alertId.criteria ? (
                                                    <div className="flex gap-1.5 flex-wrap">
                                                        {Object.entries(log.alertId.criteria).map(([k, v]) => {
                                                            if (!v) return null;
                                                            return (
                                                                <span key={k} className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                                                    <span className="text-slate-400 mr-1 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                                                    {String(v)}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">Unknown Criteria</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-slate-700">
                                                        {new Date(log.deliveredAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                    <span className="text-xs text-slate-400 mt-0.5">
                                                        {new Date(log.deliveredAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    (items as AlertItem[]).map((alert) => (
                                        <tr key={alert._id || alert.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-4 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(alert._id || alert.id)}
                                                    onChange={() => toggleSelect(alert._id || alert.id)}
                                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900">{alert.name || 'Unnamed Alert'}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono">UID: {alert.userId}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-1 flex-wrap max-w-xs">
                                                    {Object.entries(alert.criteria || {}).map(([k, v]) => 
                                                        v ? (
                                                            <span key={k} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] border border-slate-200">
                                                                {k}: {String(v)}
                                                            </span>
                                                        ) : null
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded w-fit ${alert.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                                                        {alert.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                    <span className="text-xs text-slate-500 mt-1">Exp: {alert.expiresAt ? format(new Date(alert.expiresAt), "MMM d, yyyy") : 'Never'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-medium text-slate-700">Count: {alert.expiryWarningCount || 0}</span>
                                                    {alert.expiryWarningSentAt && (
                                                        <span className="text-[10px] text-slate-400 italic">{format(new Date(alert.expiryWarningSentAt), "MMM d HH:mm")}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleDeleteAlert(alert._id || alert.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {pagination.pages > 1 && (
                        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <span className="text-sm font-medium text-slate-500">
                                Showing page {page} of {pagination.pages}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                    className="px-3 py-1.5 text-sm font-medium bg-white border border-slate-200 rounded-md shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-colors"
                                >
                                    Previous
                                </button>
                                <button
                                    disabled={page === pagination.pages}
                                    onClick={() => setPage(p => p + 1)}
                                    className="px-3 py-1.5 text-sm font-medium bg-white border border-slate-200 rounded-md shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminPageShell>
    );
}

