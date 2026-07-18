"use client";

import { Building2, MapPin, Ban, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import type { ColumnDef } from "@/components/ui/DataTable";
import { Business } from "@esparex/contracts";
import { BusinessTypesCell, BusinessActionButton, createBusinessStatusColumn, createBusinessActionsColumn } from "@/components/business/BusinessListPrimitives";

export function buildColumns(opts: { onView: (b: Business) => void; onEdit: (b: Business) => void; onDelete: (b: Business) => void; toggleSelect: (id: string) => void; toggleSelectAll: () => void; selectedIds: Set<string>; allCount: number; setSuspendTarget: (b: Business | null) => void; handleActivate: (id: string) => Promise<void> }): ColumnDef<Business>[] {
    const { onView, onEdit, onDelete, toggleSelect, toggleSelectAll, selectedIds, allCount, setSuspendTarget, handleActivate } = opts;
    return [
        {
            id: "selection",
            header: <input type="checkbox" checked={allCount > 0 && selectedIds.size === allCount} onChange={toggleSelectAll} className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4" />,
            cell: (biz) => <input type="checkbox" checked={selectedIds.has(biz.id)} onChange={() => toggleSelect(biz.id)} onClick={(e) => e.stopPropagation()} className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4" />,
            className: "w-10 px-4",
        },
        {
            header: "Business",
            cell: (biz) => (
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400"><Building2 size={20} /></div>
                    <div className="min-w-0">
                        <div className="font-bold text-slate-900 leading-tight truncate">{biz.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{biz.id}</div>
                    </div>
                </div>
            ),
        },
        {
            header: "Trust",
            cell: (biz) => {
                const score = biz.trustScore ?? 0;
                const hue = Math.round((score / 100) * 120);
                const color = `hsl(${hue}, 84%, 45%)`;
                return (
                    <div className="flex flex-col gap-1.5 w-16 group cursor-default">
                        <div className="flex items-center justify-between">
                            <div className="text-[10px] font-black tracking-tighter tabular-nums" style={{ color }}>{score}%</div>
                            {score > 85 && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_4px_theme(colors.emerald.400)]" />}
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 shadow-inner">
                            <div className="h-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(0,0,0,0.1)]" style={{ width: `${score}%`, backgroundColor: color, backgroundImage: `linear-gradient(to right, transparent, rgba(255,255,255,0.3))` }} />
                        </div>
                    </div>
                );
            },
        },
        { header: "Category", cell: (biz) => <BusinessTypesCell businessTypes={biz.businessTypes} /> },
        { header: "Location", cell: (biz) => <div className="flex items-center gap-1.5 text-xs text-slate-600"><MapPin size={12} className="text-slate-400 shrink-0" /><span className="truncate max-w-[110px]">{biz.location?.city || "—"}</span></div> },
        { header: "Active Since", cell: (biz) => <div className="space-y-0.5"><div className="text-xs text-slate-700 font-medium">{biz.approvedAt ? format(new Date(biz.approvedAt), "MMM d, yyyy") : "N/A"}</div>{biz.expiresAt && <div className="text-[9px] text-slate-400 italic">Exp {format(new Date(biz.expiresAt), "MMM d, yyyy")}</div>}</div> },
        createBusinessStatusColumn(true),
        createBusinessActionsColumn({
            onView, onEdit, onDelete, editTitle: "Edit Business", deleteTitle: "Delete Business",
            canEdit: (b) => !b.isDeleted, canDelete: (b) => !b.isDeleted,
            renderExtraActions: (biz) => biz.status === "live" ? <BusinessActionButton onClick={() => setSuspendTarget(biz)} title="Suspend Business" tone="warning" icon={<Ban size={15} />} />
                : biz.status === "suspended" ? <BusinessActionButton onClick={() => void handleActivate(biz.id)} title="Reactivate Business" tone="success" icon={<RotateCcw size={15} />} /> : undefined,
        }),
    ];
}
