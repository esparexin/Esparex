"use client";

import type {
  AdCampaignItem,
  InContentPlacementId,
  AdProviderType,
} from "@esparex/contracts";
import { PLACEMENT_LABELS } from "./CampaignListTable";

interface CampaignEditModalProps {
  isOpen: boolean;
  campaign: Partial<AdCampaignItem>;
  onChange: (updated: Partial<AdCampaignItem>) => void;
  onSave: () => Promise<void>;
  onClose: () => void;
  saving: boolean;
}

export function CampaignEditModal({
  isOpen,
  campaign,
  onChange,
  onSave,
  onClose,
  saving,
}: CampaignEditModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl bg-white rounded-3xl p-6 shadow-xl max-h-[90vh] overflow-y-auto flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-800">
            {campaign.id ? "Edit Campaign" : "New In-Content Campaign"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Campaign Name</label>
            <input
              type="text"
              value={campaign.name || ""}
              onChange={(e) => onChange({ ...campaign, name: e.target.value })}
              placeholder="e.g. Hyderabad Screen Repair Sponsor"
              className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs text-slate-800"
            />
          </div>

          <div className="grid gap-3" style={{gridTemplateColumns:'repeat(2,1fr)'}}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Placement Slot</label>
              <select
                value={campaign.placementId}
                onChange={(e) =>
                  onChange({ ...campaign, placementId: e.target.value as InContentPlacementId })
                }
                className="w-full h-9 px-2 rounded-xl border border-slate-200 text-xs text-slate-800"
              >
                {Object.entries(PLACEMENT_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Provider Type</label>
              <select
                value={campaign.providerType}
                onChange={(e) =>
                  onChange({ ...campaign, providerType: e.target.value as AdProviderType })
                }
                className="w-full h-9 px-2 rounded-xl border border-slate-200 text-xs text-slate-800"
              >
                <option value="google_adsense">Google AdSense</option>
                <option value="custom_banner">Custom Sponsor Banner</option>
                <option value="house_ad">Internal House Promotion</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3" style={{gridTemplateColumns:'repeat(2,1fr)'}}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority Rank (1 = Highest)</label>
              <input
                type="number"
                min="1"
                value={campaign.priority || 1}
                onChange={(e) => onChange({ ...campaign, priority: Number(e.target.value) })}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={campaign.status}
                onChange={(e) => onChange({ ...campaign, status: e.target.value as any })}
                className="w-full h-9 px-2 rounded-xl border border-slate-200 text-xs text-slate-800"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          {/* Provider Config Fields */}
          {campaign.providerType === "google_adsense" ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Google AdSense Slot ID</label>
              <input
                type="text"
                value={campaign.providerConfig?.googleSlotId || ""}
                onChange={(e) =>
                  onChange({
                    ...campaign,
                    providerConfig: { ...campaign.providerConfig, googleSlotId: e.target.value },
                  })
                }
                placeholder="e.g. 1234567890"
                className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs text-slate-800"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-2 border-t border-slate-100 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Banner Image URL</label>
                <input
                  type="text"
                  value={campaign.providerConfig?.bannerImageUrl || ""}
                  onChange={(e) =>
                    onChange({
                      ...campaign,
                      providerConfig: { ...campaign.providerConfig, bannerImageUrl: e.target.value },
                    })
                  }
                  placeholder="https://example.com/banner.png"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Destination URL</label>
                <input
                  type="text"
                  value={campaign.providerConfig?.bannerTargetUrl || ""}
                  onChange={(e) =>
                    onChange({
                      ...campaign,
                      providerConfig: { ...campaign.providerConfig, bannerTargetUrl: e.target.value },
                    })
                  }
                  placeholder="https://partner.com"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs text-slate-800"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Campaign"}
          </button>
        </div>
      </div>
    </div>
  );
}
