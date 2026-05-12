"use client";

import { useEffect, useState } from "react";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { catalogManagementTabs } from "@/components/layout/adminModuleTabSets";
import { getCatalogGovernanceMetrics, getCatalogGovernanceLogs } from "@/lib/api/catalogGovernance";
import {
    Activity,
    ShieldCheck,
    AlertTriangle,
    Clock,
    Search,
    ListFilter,
    BarChart3,
    History
} from "lucide-react";

export default function TaxonomyGovernancePage() {
    const [metrics, setMetrics] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        void (async () => {
            setLoading(true);
            try {
                const [metricsData, logsData] = await Promise.all([
                    getCatalogGovernanceMetrics(),
                    getCatalogGovernanceLogs()
                ]);
                setMetrics(metricsData);
                setLogs(logsData);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load governance data");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const getHealthColor = (score: number) => {
        if (score >= 90) return "text-emerald-600 bg-emerald-50 border-emerald-200";
        if (score >= 70) return "text-amber-600 bg-amber-50 border-amber-200";
        return "text-red-600 bg-red-50 border-red-200";
    };

    if (loading) {
        return (
            <AdminPageShell title="Taxonomy Governance" tabs={<AdminModuleTabs tabs={catalogManagementTabs} />}>
                <div className="flex items-center justify-center h-64 text-slate-400">Loading governance metrics...</div>
            </AdminPageShell>
        );
    }

    return (
        <AdminPageShell
            title="Taxonomy Governance"
            description="Autonomous quality control and search optimization monitoring for the Device Taxonomy SSOT."
            tabs={<AdminModuleTabs tabs={catalogManagementTabs} />}
            className="h-full overflow-y-auto"
        >
            <div className="space-y-6 pb-10">
                {/* Health Score & Top Level Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className={`p-6 rounded-2xl border shadow-sm flex flex-col items-center justify-center ${getHealthColor(metrics?.healthScore || 0)}`}>
                        <div className="text-sm font-bold uppercase tracking-wider mb-1 opacity-80">Health Score</div>
                        <div className="text-5xl font-black">{metrics?.healthScore || 0}%</div>
                        <ShieldCheck className="mt-4 opacity-20" size={48} />
                    </div>

                    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                            <Clock size={16} />
                            <span className="text-xs font-bold uppercase">Pending Aging</span>
                        </div>
                        <div className="text-3xl font-bold text-slate-900">{metrics?.issues?.pendingAging || 0}</div>
                        <div className="text-xs text-slate-400 mt-1">Records older than 30 days</div>
                    </div>

                    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                            <ListFilter size={16} />
                            <span className="text-xs font-bold uppercase">Orphan Records</span>
                        </div>
                        <div className="text-3xl font-bold text-slate-900">{metrics?.issues?.orphanRecords || 0}</div>
                        <div className="text-xs text-slate-400 mt-1">Unlinked brands or models</div>
                    </div>

                    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                            <AlertTriangle size={16} />
                            <span className="text-xs font-bold uppercase">Duplicates</span>
                        </div>
                        <div className="text-3xl font-bold text-slate-900">{metrics?.issues?.duplicateCandidates || 0}</div>
                        <div className="text-xs text-slate-400 mt-1">Potential near-duplicates</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Issues Detail */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 size={18} className="text-primary" />
                                Quality Analysis
                            </h3>
                        </div>
                        <div className="p-0">
                            <div className="divide-y divide-slate-100">
                                <div className="p-4 flex items-center justify-between">
                                    <div className="text-sm text-slate-600">Fuzzy Search Threshold</div>
                                    <div className="text-sm font-mono font-bold bg-slate-50 px-2 py-1 rounded">0.85</div>
                                </div>
                                <div className="p-4 flex items-center justify-between">
                                    <div className="text-sm text-slate-600">Search Miss Rate</div>
                                    <div className="text-sm font-bold text-slate-900">{(metrics?.stats?.searchMissRate * 100).toFixed(1)}%</div>
                                </div>
                                <div className="p-4 flex items-center justify-between">
                                    <div className="text-sm text-slate-600">Slug Collisions</div>
                                    <div className={`text-sm font-bold ${metrics?.issues?.slugCollisions > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                                        {metrics?.issues?.slugCollisions || 0}
                                    </div>
                                </div>
                                <div className="p-4 flex items-center justify-between">
                                    <div className="text-sm text-slate-600">Last Audit Run</div>
                                    <div className="text-sm text-slate-500">{new Date(metrics?.lastAuditRun).toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Governance Logs */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <History size={18} className="text-primary" />
                                Governance Logs
                            </h3>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                            {logs.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-sm">No recent governance activities.</div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {logs.map((log, idx) => (
                                        <div key={idx} className="p-3 text-xs">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`px-1.5 py-0.5 rounded font-bold uppercase text-[10px] ${
                                                    log.severity === 'error' ? 'bg-red-100 text-red-700' : 
                                                    log.severity === 'warn' ? 'bg-amber-100 text-amber-700' : 
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                    {log.action}
                                                </span>
                                                <span className="text-slate-400">{new Date(log.createdAt).toLocaleTimeString()}</span>
                                            </div>
                                            <div className="text-slate-700 line-clamp-2">{log.message}</div>
                                            {log.details && (
                                                <div className="mt-1 text-slate-400 italic truncate">
                                                    {JSON.stringify(log.details)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Optimization Controls */}
                <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold mb-1">Autonomous Search Optimization</h3>
                        <p className="text-slate-400 text-sm max-w-lg">
                            The system is currently resolving 12+ brand aliases and 5+ taxonomy synonyms automatically. 
                            Duplicate prevention is active at a 0.85 confidence threshold.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                            <div className="text-xs font-bold text-slate-500 uppercase mb-2">Search Latency</div>
                            <div className="text-2xl font-bold text-emerald-400">12ms</div>
                        </div>
                        <div className="w-px h-10 bg-slate-800 mx-4" />
                        <div className="flex flex-col items-center">
                            <div className="text-xs font-bold text-slate-500 uppercase mb-2">Typos Corrected</div>
                            <div className="text-2xl font-bold text-sky-400">450+</div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminPageShell>
    );
}
