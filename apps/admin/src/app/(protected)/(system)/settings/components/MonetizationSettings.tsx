"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import type {
  AdCampaignItem,
  MonetizationSystemState,
} from "@esparex/contracts";
import {
  getAdminCampaigns,
  createAdminCampaign,
  updateAdminCampaign,
  deleteAdminCampaign,
  getAdminMonetizationConfig,
  updateAdminMonetizationConfig,
} from "@/lib/api/monetization";
import { GlobalGovernanceCard } from "./monetization/GlobalGovernanceCard";
import { CampaignListTable } from "./monetization/CampaignListTable";
import { CampaignEditModal } from "./monetization/CampaignEditModal";
import { AdPreviewSimulatorModal } from "./monetization/AdPreviewSimulatorModal";

export function MonetizationSettings() {
  const [config, setConfig] = useState<MonetizationSystemState>({
    featureEnabled: true,
    publishingEnabled: true,
    providers: { googleAdsense: { publisherId: "", autoAdsEnabled: false } },
  });
  const [campaigns, setCampaigns] = useState<AdCampaignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const [editingCampaign, setEditingCampaign] = useState<Partial<AdCampaignItem>>({
    name: "",
    placementId: "listing_detail_sidebar_bottom",
    providerType: "google_adsense",
    priority: 1,
    status: "active",
    targeting: { device: "all", userType: "all", states: [], cities: [], categories: [] },
    providerConfig: { googleFormat: "auto", openInNewTab: true },
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedConfig, fetchedCampaigns] = await Promise.all([
        getAdminMonetizationConfig(),
        getAdminCampaigns(),
      ]);
      setConfig(fetchedConfig);
      setCampaigns(fetchedCampaigns);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load monetization data";
      setFeedback({ type: "error", text: msg });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSaveConfig = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const updated = await updateAdminMonetizationConfig(config);
      setConfig(updated);
      setFeedback({ type: "success", text: "Monetization configuration saved successfully." });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save configuration";
      setFeedback({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCampaign = async () => {
    setSaving(true);
    try {
      if (editingCampaign.id) {
        await updateAdminCampaign(editingCampaign.id, editingCampaign);
      } else {
        await createAdminCampaign(editingCampaign);
      }
      setIsEditModalOpen(false);
      await loadData();
      setFeedback({ type: "success", text: "Campaign saved successfully." });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save campaign";
      setFeedback({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;
    try {
      await deleteAdminCampaign(id);
      await loadData();
      setFeedback({ type: "success", text: "Campaign deleted successfully." });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete campaign";
      setFeedback({ type: "error", text: msg });
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-body text-foreground-subtle">Loading monetization engine...</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      {feedback && (
        <div
          className={`flex items-center gap-2 p-3.5 rounded-xl border text-caption font-semibold ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{feedback.text}</span>
        </div>
      )}

      <GlobalGovernanceCard
        config={config}
        onChange={setConfig}
        onSave={handleSaveConfig}
        saving={saving}
      />

      <CampaignListTable
        campaigns={campaigns}
        onNew={() => {
          setEditingCampaign({
            name: "",
            placementId: "listing_detail_sidebar_bottom",
            providerType: "google_adsense",
            priority: 1,
            status: "active",
            targeting: { device: "all", userType: "all", states: [], cities: [], categories: [] },
            providerConfig: { googleFormat: "auto", openInNewTab: true },
          });
          setIsEditModalOpen(true);
        }}
        onEdit={(camp) => {
          setEditingCampaign(camp);
          setIsEditModalOpen(true);
        }}
        onDelete={handleDeleteCampaign}
        onOpenPreview={() => setIsPreviewModalOpen(true)}
      />

      <CampaignEditModal
        isOpen={isEditModalOpen}
        campaign={editingCampaign}
        onChange={setEditingCampaign}
        onSave={handleSaveCampaign}
        onClose={() => setIsEditModalOpen(false)}
        saving={saving}
      />

      <AdPreviewSimulatorModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        publishingEnabled={config.publishingEnabled}
      />
    </div>
  );
}
