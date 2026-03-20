"use client";

import { useEffect, useState } from "react";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { adminFetch } from "@/lib/api/adminClient";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { 
    Activity, 
    RefreshCw, 
    ShieldCheck, 
    Zap, 
    FileCode, 
    Trash2,
    AlertTriangle,
    Clock,
    Loader2
} from "lucide-react";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { settingsTabs } from "@/components/layout/adminModuleTabSets";

interface HealthReport {
    score: number;
    totalFiles: number;
    duplicateLines: number;
    unusedVariables: number;
    lastScan: string;
}

interface Finding {
    id: string;
    type: string;
    path: string;
    name: string;
    severity: string;
}

export default function CodeHealthPage() {
    const [report, setReport] = useState<HealthReport | null>(null);
    const [findings, setFindings] = useState<Finding[]>([]);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [cleaning, setCleaning] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [healthRes, findingsRes] = await Promise.all([
                adminFetch<any>(ADMIN_ROUTES.CODE_HEALTH_SUMMARY),
                adminFetch<any>(ADMIN_ROUTES.CODE_HEALTH)
            ]);
            const parsedHealth = parseAdminResponse<never, HealthReport>(healthRes);
            const reportPayload = parsedHealth.data ?? null;

            const parsedFindings = parseAdminResponse<Finding, { findings?: Finding[] }>(findingsRes);

            setReport(reportPayload);
            setFindings(parsedFindings.items.length > 0 ? parsedFindings.items : (parsedFindings.data?.findings || []));
        } catch (err) {
            console.error("Failed to load code health data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchData();
    }, []);

    const handleScan = async () => {
        setScanning(true);
        try {
            await adminFetch(ADMIN_ROUTES.CODE_HEALTH_SCAN, { method: "POST" });
            void fetchData();
        } catch (err) {
            console.error("Scan failed", err);
        } finally {
            setScanning(false);
        }
    };

    const handleCleanup = async () => {
        if (!confirm("Are you sure you want to remove all approved dead code?")) return;
        setCleaning(true);
        try {
            await adminFetch(ADMIN_ROUTES.CODE_HEALTH_REMOVE, { method: "POST" });
            void fetchData();
        } catch (err) {
            console.error("Cleanup failed", err);
        } finally {
            setCleaning(false);
        }
    };

    const columns: ColumnDef<Finding>[] = [
        {
            header: "Finding",
            cell: (f) => (
                <div>
                    <div className="font-bold text-slate-900 text-xs">{f.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{f.path}</div>
                </div>
            )
        },
        {
            header: "Type",
            cell: (f) => (
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold uppercase tracking-tight">
                    {f.type.replace(/_/g, ' ')}
                </span>
            )
        },
        {
            header: "Severity",
            cell: (f) => (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    f.severity === 'high' ? "bg-red-100 text-red-700" :
                    f.severity === 'medium' ? "bg-amber-100 text-amber-700" :
                    "bg-blue-100 text-blue-700"
                }`}>
                    {f.severity}
                </span>
            )
        },
        {
            header: "Actions",
            cell: () => (
                <button className="text-[10px] font-bold text-primary hover:underline">
                    Whitelist
                </button>
            )
        }
    ];

    return (
        <AdminPageShell
            title="Code Health & Infrastructure"
            description="Baseline code quality telemetry and operational diagnostics for the admin team."
            tabs={<AdminModuleTabs tabs={settingsTabs} />}
            actions={
                <div className="flex gap-2">
                    <button 
                        onClick={handleScan}
                        disabled={scanning}
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                        {scanning ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                        <span>Refresh Diagnostics</span>
                    </button>
                    <button 
                        onClick={handleCleanup}
                        disabled={cleaning}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                        {cleaning ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                        <span>Run Cleanup Action</span>
                    </button>
                </div>
            }
            className="h-full overflow-y-auto pr-1"
        >
        <div className="space-y-6">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                    <ShieldCheck size={18} className="mt-0.5 text-blue-600" />
                    <div>
                        <h2 className="text-sm font-semibold text-blue-900">Baseline diagnostics module</h2>
                        <p className="mt-1 text-xs leading-5 text-blue-800">
                            This screen currently exposes the platform&apos;s baseline code-health telemetry and administrative workflow hooks.
                            It is safe to use for visibility, but it is not yet a full autonomous remediation pipeline.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <Activity size={20} className="text-primary" />
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Optimal</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-1">{report?.score || 0}%</div>
                    <p className="text-xs font-medium text-slate-500">Overall Health Score</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <FileCode size={20} className="text-blue-500" />
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-1">{report?.totalFiles || 0}</div>
                    <p className="text-xs font-medium text-slate-500">Tracked Files</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <Zap size={20} className="text-amber-500" />
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-1">{report?.unusedVariables || 0}</div>
                    <p className="text-xs font-medium text-slate-500">Unused Exports</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <Clock size={20} className="text-slate-400" />
                    </div>
                    <div className="text-sm font-bold text-slate-900 mb-1">
                        {report?.lastScan ? new Date(report.lastScan).toLocaleDateString() : 'Never'}
                    </div>
                    <p className="text-xs font-medium text-slate-500">Last System Scan</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={18} className="text-amber-500" />
                        <h2 className="text-sm font-bold text-slate-700">Scan Findings</h2>
                    </div>
                </div>
                <DataTable
                    data={findings}
                    columns={columns}
                    isLoading={loading}
                    emptyMessage="Clean scan! No issues detected."
                    enableColumnVisibility
                    enableCsvExport
                    csvFileName="code-health-findings.csv"
                />
            </div>
            
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-start gap-3">
                <ShieldCheck size={20} className="text-blue-600 mt-0.5" />
                <div>
                    <h3 className="text-sm font-bold text-blue-900">Proactive Monitoring</h3>
                    <p className="text-xs text-blue-700 mt-1">
                        Use this dashboard for periodic diagnostics, visibility into flagged findings, and controlled cleanup workflows while deeper automation continues to mature.
                    </p>
                </div>
            </div>
        </div>
        </AdminPageShell>
    );
}
