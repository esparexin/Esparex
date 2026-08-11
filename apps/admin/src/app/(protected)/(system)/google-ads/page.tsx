"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, ShieldCheck, CheckCircle, Stack } from "@esparex/ui";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { GoogleAdsTable } from "@/components/google-ads/GoogleAdsTable";
import { GoogleAdModal } from "@/components/google-ads/GoogleAdModal";
import { adminFetch } from "@/lib/api/adminClient";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { showAdminPopup } from "@/lib/popup/popupEvents";
import type { GoogleAdPlacementDTO } from "@esparex/contracts";

export default function GoogleAdsPage() {
    const [placements, setPlacements] = useState<GoogleAdPlacementDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchInput, setSearchInput] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlacement, setEditingPlacement] = useState<GoogleAdPlacementDTO | null>(null);

    const fetchPlacements = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: "10",
                status: statusFilter,
            });
            if (searchInput.trim()) {
                params.set("q", searchInput.trim());
            }

            const response = await adminFetch<unknown>(`${ADMIN_ROUTES.GOOGLE_ADS_PLACEMENTS}?${params.toString()}`);
            const parsed = parseAdminResponse<GoogleAdPlacementDTO>(response);

            setPlacements(parsed.items || []);
            setTotal(parsed.pagination?.total ?? parsed.items.length);
        } catch (err: unknown) {
            showAdminPopup({
                type: "error",
                title: "Error",
                message: err instanceof Error ? err.message : "Failed to load Google Ad placements",
            });
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, searchInput]);

    useEffect(() => {
        fetchPlacements();
    }, [fetchPlacements]);

    const handleCreate = () => {
        setEditingPlacement(null);
        setIsModalOpen(true);
    };

    const handleEdit = (placement: GoogleAdPlacementDTO) => {
        setEditingPlacement(placement);
        setIsModalOpen(true);
    };

    const handleSave = async (data: Partial<GoogleAdPlacementDTO>): Promise<boolean> => {
        try {
            if (editingPlacement) {
                await adminFetch(ADMIN_ROUTES.GOOGLE_ADS_PLACEMENT_BY_ID(editingPlacement.id), {
                    method: "PATCH",
                    body: JSON.stringify(data),
                });
                showAdminPopup({ type: "success", title: "Saved", message: "Ad placement updated successfully" });
            } else {
                await adminFetch(ADMIN_ROUTES.GOOGLE_ADS_PLACEMENTS, {
                    method: "POST",
                    body: JSON.stringify(data),
                });
                showAdminPopup({ type: "success", title: "Created", message: "Ad placement created successfully" });
            }
            fetchPlacements();
            return true;
        } catch (err: unknown) {
            showAdminPopup({
                type: "error",
                title: "Error",
                message: err instanceof Error ? err.message : "Failed to save placement",
            });
            return false;
        }
    };

    const handleToggleStatus = async (placement: GoogleAdPlacementDTO) => {
        const nextStatus = placement.status === "active" ? "paused" : "active";
        try {
            await adminFetch(ADMIN_ROUTES.GOOGLE_ADS_PLACEMENT_STATUS(placement.id), {
                method: "PATCH",
                body: JSON.stringify({ status: nextStatus }),
            });
            showAdminPopup({
                type: "success",
                title: "Status Updated",
                message: `Ad placement is now ${nextStatus}`,
            });
            fetchPlacements();
        } catch (err: unknown) {
            showAdminPopup({
                type: "error",
                title: "Error",
                message: err instanceof Error ? err.message : "Failed to toggle placement status",
            });
        }
    };

    const handleDelete = async (placement: GoogleAdPlacementDTO) => {
        if (!confirm(`Are you sure you want to delete '${placement.name}'?`)) return;
        try {
            await adminFetch(ADMIN_ROUTES.GOOGLE_ADS_PLACEMENT_BY_ID(placement.id), {
                method: "DELETE",
            });
            showAdminPopup({ type: "success", title: "Deleted", message: "Ad placement deleted successfully" });
            fetchPlacements();
        } catch (err: unknown) {
            showAdminPopup({
                type: "error",
                title: "Error",
                message: err instanceof Error ? err.message : "Failed to delete placement",
            });
        }
    };

    return (
        <AdminPageShell
            title="Google Ads Management"
            description="Centrally configure AdSense slots, target locations, responsive rules, and AdBlock fallback behavior."
            showGlobalSearch={false}
            actions={
                <button
                    type="button"
                    onClick={handleCreate}
                    className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-sky-200 hover:bg-sky-700 transition-all active:scale-95"
                >
                    <Plus size={18} /> Add Placement
                </button>
            }
        >
            <Stack direction="col" gap="md">
                {/* Master Config & Publisher Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
                            <ShieldCheck size={22} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-slate-900">Google AdSense Publisher Account</h3>
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-tiny font-bold text-emerald-700">
                                    <CheckCircle size={10} /> Active
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 font-mono">
                                Publisher ID: <span className="font-semibold text-slate-800">{process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "ca-pub-esparex-official-master"}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                        <input
                            type="text"
                            placeholder="Search placements..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:border-sky-500 focus:outline-none w-48"
                        />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:border-sky-500 focus:outline-none bg-white"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="paused">Paused</option>
                        </select>
                    </div>
                </div>

                {/* Placements Data Table */}
                <GoogleAdsTable
                    placements={placements}
                    loading={loading}
                    onEdit={handleEdit}
                    onToggleStatus={handleToggleStatus}
                    onDelete={handleDelete}
                    pagination={{
                        currentPage: page,
                        totalPages: Math.max(1, Math.ceil(total / 10)),
                        totalItems: total,
                        pageSize: 10,
                        onPageChange: setPage,
                    }}
                />

                <GoogleAdModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    editingPlacement={editingPlacement}
                />
            </Stack>
        </AdminPageShell>
    );
}
