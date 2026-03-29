"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  ChevronLeft,
  Cpu,
  CreditCard,
  Globe,
  ListChecks,
  RefreshCcw,
  Search,
  Shield,
  Settings,
} from "lucide-react";

import Link from "next/link";
import { getSystemConfig, updateSystemConfig } from "@/lib/api/systemConfig";
import type { SystemConfig, SystemConfigPatch } from "@/types/systemConfig";
import { PlatformSettings } from "./components/PlatformSettings";
import { ModerationSettings } from "./components/ModerationSettings";
import { PaymentSettings } from "./components/PaymentSettings";
import { NotificationSettings } from "./components/NotificationSettings";
import { SecuritySettings } from "./components/SecuritySettings";
import { SearchSettings } from "./components/SearchSettings";
import { ListingSettings } from "./components/ListingSettings";
import { AdminPageShell } from "@/components/layout/AdminPageShell";

type SettingsTab =
  | "platform"
  | "listing"
  | "moderation"
  | "notifications"
  | "payments"
  | "security"
  | "location";

const SETTINGS_TABS: Array<{ key: SettingsTab; label: string; icon: typeof Settings }> = [
  { key: "platform", label: "Platform", icon: Globe },
  { key: "listing", label: "Listing Rules", icon: ListChecks },
  { key: "moderation", label: "Moderation", icon: Cpu },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "security", label: "Security", icon: Shield },
  { key: "location", label: "Search & Location", icon: Search },
];

const isSettingsTab = (value: string | null): value is SettingsTab =>
  SETTINGS_TABS.some((tab) => tab.key === value);

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const requestedTab = searchParams.get("tab");
  const activeTab: SettingsTab = isSettingsTab(requestedTab) ? requestedTab : "platform";

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
    if (requestedTab !== activeTab) {
      router.replace(`/settings?tab=${activeTab}`, { scroll: false });
    }
  }, [activeTab, requestedTab, router]);

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

  const props = { config, saving, onSave: handleSaveSection };
  const tabPanel = (() => {
    switch (activeTab) {
      case "platform":
        return <PlatformSettings {...props} />;
      case "listing":
        return <ListingSettings {...props} />;
      case "moderation":
        return <ModerationSettings {...props} />;
      case "notifications":
        return <NotificationSettings {...props} />;
      case "payments":
        return <PaymentSettings {...props} />;
      case "security":
        return <SecuritySettings {...props} />;
      case "location":
        return <SearchSettings {...props} />;
      default:
        return null;
    }
  })();

  return (
    <AdminPageShell
      title="Admin Settings"
      description="Runtime-backed platform configuration from the single SystemConfig document."
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
            <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-600">
              Only runtime-backed sections are shown here. Experimental flags and env-only knobs were removed so this screen matches the live system contract.
            </div>
            <nav className="space-y-1">
              {SETTINGS_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => router.replace(`/settings?tab=${tab.key}`, { scroll: false })}
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
