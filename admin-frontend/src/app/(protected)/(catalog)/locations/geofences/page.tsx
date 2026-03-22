"use client";

import { useState, useEffect } from "react";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { locationsTabs } from "@/components/layout/adminModuleTabSets";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { getGeofences, toggleGeofenceStatus, deleteGeofence, Geofence } from "@/lib/api/locations";
import { useToast } from "@/context/ToastContext";
import { Shield, CheckCircle, XCircle, Trash2 } from "lucide-react";

export default function GeofencesPage() {
    const { showToast } = useToast();
    const [geofences, setGeofences] = useState<Geofence[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        setError(null);
        getGeofences()
            .then(setGeofences)
            .catch((e: Error) => setError(e.message || "Failed to load geofences"))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const handleToggle = async (id: string) => {
        try {
            const updated = await toggleGeofenceStatus(id);
            setGeofences(prev => prev.map(g => g.id === id ? updated : g));
            showToast("Geofence status updated", "success");
        } catch (e: unknown) {
            showToast((e as Error).message || "Failed to update geofence", "error");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this geofence? This action cannot be undone.")) return;
        try {
            await deleteGeofence(id);
            setGeofences(prev => prev.filter(g => g.id !== id));
            showToast("Geofence deleted", "success");
        } catch (e: unknown) {
            showToast((e as Error).message || "Failed to delete geofence", "error");
        }
    };

    const columns: ColumnDef<Geofence>[] = [
        {
            header: "Geofence",
            cell: (g) => (
                <div className="flex items-center gap-3">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: g.color + "22", color: g.color }}
                    >
                        <Shield size={16} />
                    </div>
                    <div>
                        <div className="font-semibold text-slate-900 text-sm">{g.name}</div>
                        <div className="text-xs text-slate-400 capitalize">{g.type}</div>
                    </div>
                </div>
            )
        },
        {
            header: "Color",
            cell: (g) => (
                <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded border border-slate-200 inline-block" style={{ backgroundColor: g.color }} />
                    <span className="text-xs text-slate-500 font-mono">{g.color}</span>
                </div>
            )
        },
        {
            header: "Created",
            cell: (g) => g.createdAt ? (
                <span className="text-xs text-slate-500">
                    {new Date(g.createdAt).toLocaleDateString()}
                </span>
            ) : null
        },
        {
            header: "Status",
            cell: (g) => (
                <button
                    onClick={() => void handleToggle(g.id)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        g.isActive
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-red-100 text-red-700 hover:bg-red-200"
                    }`}
                >
                    {g.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    {g.isActive ? "Active" : "Inactive"}
                </button>
            )
        },
        {
            header: "Actions",
            className: "text-right",
            cell: (g) => (
                <div className="flex items-center justify-end">
                    <button
                        onClick={() => void handleDelete(g.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <AdminPageShell
            title="Geofences"
            description="Manage custom polygon geofences used for location-based features."
            tabs={<AdminModuleTabs tabs={locationsTabs} />}
            className="h-full overflow-y-auto pr-1"
        >
            <div className="space-y-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
                        {error}
                    </div>
                )}

                <DataTable
                    data={geofences}
                    columns={columns}
                    isLoading={loading}
                    emptyMessage="No geofences configured yet."
                    enableColumnVisibility
                    enableCsvExport
                    csvFileName="geofences.csv"
                />

                <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-sm text-amber-800">
                    <strong>Note:</strong> Geofences are created programmatically via the API or ops scripts.
                    Visual creation (map draw) is planned for a future release.
                </div>
            </div>
        </AdminPageShell>
    );
}
