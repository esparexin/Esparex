"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  ChevronLeft,
  Cpu,
  CreditCard,
  RefreshCcw,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  Users,
  Zap,
  MessageCircle,
  LayoutGrid,
} from "lucide-react";

import Link from "next/link";
import { getSystemConfig, updateSystemConfig } from "@/lib/api/systemConfig";
import type { SystemConfig, SystemConfigPatch } from "@/types/systemConfig";
import { PlatformSettings } from "./components/PlatformSettings";
import { AdsSettings } from "./components/AdsSettings";
import { ModerationSettings } from "./components/ModerationSettings";
import { UserSettings } from "./components/UserSettings";
import { MessagingSettings } from "./components/MessagingSettings";
import { PaymentSettings } from "./components/PaymentSettings";
import { FraudSettings } from "./components/FraudSettings";
import { NotificationSettings } from "./components/NotificationSettings";
import { SecuritySettings } from "./components/SecuritySettings";
import { SearchSettings } from "./components/SearchSettings";
import { FeatureFlags } from "./components/FeatureFlags";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { platformConfigTabs } from "@/components/layout/adminModuleTabSets";

type SettingsTab =
  | "platform"
  | "ads"
  | "moderation"
  | "users"
  | "messaging"
  | "payments"
  | "fraud"
  | "notifications"
  | "security"
  | "search"
  | "featureFlags";

const SETTINGS_TABS: Array<{ key: SettingsTab; label: string; icon: typeof Settings }> = [
  { key: "platform", label: "Platform", icon: LayoutGrid },
  { key: "ads", label: "Ads", icon: Settings },
  { key: "moderation", label: "Moderation", icon: Cpu },
  { key: "users", label: "Users", icon: Users },
  { key: "messaging", label: "Messaging", icon: MessageCircle },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "fraud", label: "Fraud Detection", icon: ShieldAlert },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "security", label: "Security", icon: Shield },
  { key: "search", label: "Search", icon: Search },
  { key: "featureFlags", label: "Feature Flags", icon: Zap },
];

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>("platform");
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadConfig = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getSystemConfig();
      setConfig(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load system configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadConfig();
  }, []);

  useEffect(() => {
    const requestedTab = searchParams.get("tab");
    const validTabs = new Set<SettingsTab>(SETTINGS_TABS.map((tab) => tab.key));
    if (requestedTab && validTabs.has(requestedTab as SettingsTab)) {
      setActiveTab(requestedTab as SettingsTab);
    }
  }, [searchParams]);

  const handleSaveSection = async (patch: SystemConfigPatch, successMessage: string) => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const updated = await updateSystemConfig(patch);
      setConfig(updated);
      setSuccess(successMessage);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const tabPanel = useMemo(() => {
    const props = { config, saving, onSave: handleSaveSection };
    switch (activeTab) {
      case "platform":
        return <PlatformSettings {...props} />;
      case "ads":
        return <AdsSettings {...props} />;
      case "moderation":
        return <ModerationSettings {...props} />;
      case "users":
        return <UserSettings {...props} />;
      case "messaging":
        return <MessagingSettings {...props} />;
      case "payments":
        return <PaymentSettings {...props} />;
      case "fraud":
        return <FraudSettings {...props} />;
      case "notifications":
        return <NotificationSettings {...props} />;
      case "security":
        return <SecuritySettings {...props} />;
      case "search":
        return <SearchSettings {...props} />;
      case "featureFlags":
        return <FeatureFlags {...props} />;
      default:
        return null;
    }
  }, [activeTab, config, saving, handleSaveSection]);

  return (
    <AdminPageShell
      title="Admin Settings"
      description="Centralized platform configuration (single SystemConfig document)."
      tabs={<AdminModuleTabs tabs={platformConfigTabs} />}
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/admin-users"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <ChevronLeft size={14} /> Administration
          </Link>
          <button
            type="button"
            onClick={() => void loadConfig()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw size={14} /> Refresh
          </button>
        </div>
      }
    >
    <div className="space-y-6">

      {(error || success) && (
        <div
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium ${
            error
              ? "border-red-100 bg-red-50 text-red-700"
              : "border-emerald-100 bg-emerald-50 text-emerald-700"
          }`}
        >
          {error ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          {error || success}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading settings...</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <nav className="space-y-1">
              {SETTINGS_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => { setActiveTab(tab.key); router.replace(`/settings?tab=${tab.key}`); }}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive ? "bg-primary text-white" : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Icon size={15} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <main>{tabPanel}</main>
        </div>
      )}
    </div>
    </AdminPageShell>
  );
}
