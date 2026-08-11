"use client";

import { Plus, Eye, Edit2, Trash2, Layers } from "lucide-react";
import type { AdCampaignItem, InContentPlacementId } from "@esparex/contracts";

export const PLACEMENT_LABELS: Record<InContentPlacementId, string> = {
  listing_detail_sidebar_bottom: "Listing Detail — Sidebar Bottom (300×250)",
  listing_detail_below_description: "Listing Detail — Below Description (728×90)",
  home_below_hero: "Home — Below Search Hero (Leaderboard)",
  home_between_sections: "Home — Between Sections (Divider Banner)",
  browse_in_feed: "Browse / Search — In-Feed Card (Native)",
  global_footer: "Global — Above Footer Banner",
};

interface CampaignListTableProps {
  campaigns: AdCampaignItem[];
  onNew: () => void;
  onEdit: (campaign: AdCampaignItem) => void;
  onDelete: (id: string) => Promise<void>;
  onOpenPreview: () => void;
}

export function CampaignListTable({
  campaigns,
  onNew,
  onEdit,
  onDelete,
  onOpenPreview,
}: CampaignListTableProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">In-Content Campaigns & Placements</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage priority order, schedule windows, and targeting rules per placement.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenPreview}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Live Preview</span>
          </button>
          <button
            type="button"
            onClick={onNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Campaign</span>
          </button>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <Layers className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-700">No Advertising Campaigns Configured</p>
          <p className="text-2xs text-slate-400 mt-0.5">
            Click &quot;New Campaign&quot; to configure in-content ad placements.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-2xs uppercase tracking-wider text-slate-400">
                <th className="pb-3 font-semibold">Priority</th>
                <th className="pb-3 font-semibold">Campaign Name</th>
                <th className="pb-3 font-semibold">Placement Slot</th>
                <th className="pb-3 font-semibold">Provider</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Impressions / Clicks</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {campaigns.map((camp) => (
                <tr key={camp.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 font-mono font-bold text-blue-600">P{camp.priority}</td>
                  <td className="py-3.5 font-bold text-slate-800">{camp.name}</td>
                  <td className="py-3.5 text-slate-600">{PLACEMENT_LABELS[camp.placementId] || camp.placementId}</td>
                  <td className="py-3.5">
                    <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-slate-100 text-slate-700 capitalize">
                      {camp.providerType.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-2xs font-semibold ${
                        camp.status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : camp.status === "paused"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {camp.status}
                    </span>
                  </td>
                  <td className="py-3.5 text-slate-600 font-mono text-2xs">
                    {camp.metrics?.impressions || 0} imp · {camp.metrics?.clicks || 0} clicks ({camp.metrics?.ctr || 0}%)
                  </td>
                  <td className="py-3.5 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => onEdit(camp)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 transition-colors"
                      aria-label="Edit campaign"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void onDelete(camp.id)}
                      className="p-1.5 text-slate-500 hover:text-red-600 transition-colors"
                      aria-label="Delete campaign"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
