"use client";

import { Plus, Eye, Edit2, Trash2, Layers } from "lucide-react";
import type { AdCampaignItem, InContentPlacementId } from "@esparex/contracts";

export const PLACEMENT_LABELS: Record<InContentPlacementId, string> = {
  homepage_hero_top: "Homepage — Hero Top Leaderboard (728×90)",
  homepage_feed_inline: "Homepage — Feed Inline Divider",
  search_results_header: "Search / Browse — Header Banner (728×90)",
  search_results_inline: "Search / Browse — In-Feed Card (Native)",
  category_page_header: "Category Page — Header Leaderboard",
  category_page_inline: "Category Page — In-Feed Card",
  listing_details_sidebar: "Listing Detail — Sidebar Right Rail (300×250)",
  listing_details_incontent: "Listing Detail — In-Content Below Description (728×90)",
  services_page_header: "Services Page — Header Banner",
  spare_parts_header: "Spare Parts — Header Banner",
  business_profile_sidebar: "Business Directory — Sidebar (300×250)",
  user_dashboard_top: "User Dashboard — Top Banner",
  user_my_listings_inline: "My Listings — In-Feed Native",
  business_dashboard_top: "Business Dashboard — Top Banner",
  static_pages_footer: "Static Pages (FAQ/About) — Footer Banner",
  footer_leaderboard: "Global Footer — Leaderboard Banner",
  mobile_sticky_bottom: "Mobile Viewport — Sticky Bottom Banner (320×50)",
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
    <div className="rounded-2xl border border-border bg-card p-6 shadow-2xs flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h3 className="text-body-lg font-bold text-foreground">In-Content Campaigns & Placements</h3>
          <p className="text-caption text-muted-foreground mt-0.5">
            Manage priority order, schedule windows, and targeting rules per placement.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenPreview}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-caption font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Live Preview</span>
          </button>
          <button
            type="button"
            onClick={onNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-caption font-bold transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Campaign</span>
          </button>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-border rounded-2xl bg-muted/40">
          <Layers className="h-8 w-8 text-foreground-subtle mx-auto mb-2" />
          <p className="text-caption font-bold text-foreground">No Advertising Campaigns Configured</p>
          <p className="text-tiny text-foreground-subtle mt-0.5">
            Click &quot;New Campaign&quot; to configure in-content ad placements.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-caption">
            <thead>
              <tr className="border-b border-border text-tiny uppercase tracking-wider text-foreground-subtle">
                <th className="pb-3 font-semibold">Priority</th>
                <th className="pb-3 font-semibold">Campaign Name</th>
                <th className="pb-3 font-semibold">Placement Slot</th>
                <th className="pb-3 font-semibold">Provider</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Impressions / Clicks</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {campaigns.map((camp) => (
                <tr key={camp.id} className="hover:bg-muted/40 transition-colors">
                  <td className="py-3.5 font-mono font-bold text-primary">P{camp.priority}</td>
                  <td className="py-3.5 font-bold text-foreground">{camp.name}</td>
                  <td className="py-3.5 text-foreground-secondary">{PLACEMENT_LABELS[camp.placementId] || camp.placementId}</td>
                  <td className="py-3.5">
                    <span className="px-2 py-0.5 rounded-full text-tiny font-semibold bg-muted text-foreground-secondary capitalize">
                      {camp.providerType.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-tiny font-semibold ${
                        camp.status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : camp.status === "paused"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-muted text-foreground-secondary"
                      }`}
                    >
                      {camp.status}
                    </span>
                  </td>
                  <td className="py-3.5 text-foreground-secondary font-mono text-tiny">
                    {camp.metrics?.impressions || 0} imp · {camp.metrics?.clicks || 0} clicks ({camp.metrics?.ctr || 0}%)
                  </td>
                  <td className="py-3.5 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => onEdit(camp)}
                      className="p-1.5 text-foreground-subtle hover:text-primary transition-colors cursor-pointer"
                      aria-label="Edit campaign"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void onDelete(camp.id)}
                      className="p-1.5 text-foreground-subtle hover:text-destructive transition-colors cursor-pointer"
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
