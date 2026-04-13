"use client";

import { useEffect, useState } from "react";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { notificationsTabs } from "@/components/layout/adminModuleTabSets";
import { useSmartAlertLogs } from "@/hooks/useSmartAlertLogs";
import { Loader2, RefreshCw, BellRing, Navigation } from "lucide-react";

export default function SmartAlertLogsPage() {
    const { logs, loading, error, pagination, getLogs } = useSmartAlertLogs();
    const [page, setPage] = useState(1);
    
    useEffect(() => {
        getLogs({ page, limit: 50 });
    }, [page, getLogs]);

    return (
        <AdminPageShell
            title="Smart Alerts Logs"
            description="View real-time delivery logs of smart alerts triggering against new listings."
            tabs={<AdminModuleTabs tabs={notificationsTabs} />}
        >
            <div className="mb-4 flex justify-end">
                <button 
                    onClick={() => getLogs({ page, limit: 50 })}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors text-slate-700 font-medium"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-slate-400' : 'text-slate-500'}`} />
                    Refresh Logs
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-600">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Alert Owner</th>
                                <th className="px-6 py-4 font-semibold">Matched Listing</th>
                                <th className="px-6 py-4 font-semibold tracking-wider">Alert Configuration</th>
                                <th className="px-6 py-4 font-semibold">Delivered At</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading && logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="h-48 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                                            <span className="text-sm font-medium">Fetching delivery logs...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={4} className="h-48 text-center text-red-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-md mb-1">Error fetching data</span>
                                            <span className="text-sm">{error}</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="h-48 text-center bg-slate-50/30">
                                        <div className="flex flex-col items-center justify-center gap-3 py-6">
                                            <div className="h-12 w-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                                                <BellRing className="h-5 w-5 text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="text-slate-600 font-medium">No Alerts Delivered Yet</p>
                                                <p className="text-sm text-slate-400 mt-1 max-w-sm">When an active listing matches a user's saved criteria, the delivery log will appear here.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log._id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {typeof log.alertId === "object" ? (
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-800 flex items-center gap-2">
                                                        <BellRing className="h-3 w-3 text-emerald-500" />
                                                        {(log.alertId as any)?.name || 'Unnamed Alert'}
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
                                                        <span className="line-clamp-1">{(log.adId as any)?.title}</span>
                                                    </span>
                                                    <div className="flex items-center gap-1.5 mt-1.5">
                                                        {(log.adId as any)?.location && (
                                                            <>
                                                                <Navigation className="h-3 w-3 text-slate-400" />
                                                                <span className="text-xs text-slate-500 mr-1">{(log.adId as any)?.location}</span>
                                                            </>
                                                        )}
                                                        <span className="text-2xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                                            {(log.adId as any)?.price > 0 ? `$${(log.adId as any)?.price}` : "Free"}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 font-mono text-xs">{log.adId}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {typeof log.alertId === "object" && (log.alertId as any)?.criteria ? (
                                                <div className="flex gap-1.5 flex-wrap">
                                                    {Object.entries((log.alertId as any)?.criteria).map(([k, v]) => {
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
        </AdminPageShell>
    );
}
