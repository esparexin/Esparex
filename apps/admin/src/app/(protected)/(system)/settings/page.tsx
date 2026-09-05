"use client";

import { useEffect } from "react";
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
import { type LucideIcon } from "lucide-react";
import { PlatformSettings } from "./components/PlatformSettings";
import { ListingSettings } from "./components/ListingSettings";
import { ModerationSettings } from "./components/ModerationSettings";
import { PaymentSettings } from "./components/PaymentSettings";
import { NotificationSettings } from "./components/NotificationSettings";
import { SecuritySettings } from "./components/SecuritySettings";
import { SearchSettings } from "./components/SearchSettings";
import { MonetizationSettings } from "./components/MonetizationSettings";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { useSystemConfig } from "@/hooks/useSystemConfig";

type SettingsTab =
  | "platform"
  | "listing"
  | "moderation"
  | "notifications"
  | "payments"
  | "security"
  | "location"
  | "monetization";

const SETTINGS_TABS: Array<{ key: SettingsTab; label: string; icon: LucideIcon }> = [
  { key: "platform", label: "Platform", icon: Globe },
  { key: "listing", label: "Listing Rules", icon: ListChecks },
  { key: "moderation", label: "Moderation", icon: Cpu },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "monetization", label: "Monetization & Ads", icon: Settings },
  { key: "security", label: "Security", icon: Shield },
  { key: "location", label: "Search & Location", icon: Search },
];

const isSettingsTab = (value: string | null): value is SettingsTab =>
  SETTINGS_TABS.some((tab) => tab.key === value);

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const {
      config,
      loading,
      saving,
      error,
      success,
      loadConfig,
      handleSaveSection
  } = useSystemConfig();

  const requestedTab = searchParams.get("tab");
  const activeTab: SettingsTab = isSettingsTab(requestedTab) ? requestedTab : "platform";

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    if (requestedTab !== activeTab) {
      router.replace(`/settings?tab=${activeTab}`, { scroll: false });
    }
  }, [activeTab, requestedTab, router]);

  const props = { config, saving, onSave: handleSaveSection };
  const tabPanel = (() => {
    if (!config) return null;
    switch (activeTab) {
      case "platform":
        return <PlatformSettings {...props} config={config} />;
      case "listing":
        return <ListingSettings {...props} config={config} />;
      case "moderation":
        return <ModerationSettings {...props} config={config} />;
      case "notifications":
        return <NotificationSettings {...props} config={config} />;
      case "payments":
        return <PaymentSettings {...props} config={config} />;
      case "security":
        return <SecuritySettings {...props} config={config} />;
      case "location":
        return <SearchSettings {...props} config={config} />;
      case "monetization":
        return <MonetizationSettings />;
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
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-body font-medium text-foreground-secondary hover:bg-muted/50 transition-colors"
          >
            <ChevronLeft size={14} /> Administration
          </Link>
          <button
            type="button"
            onClick={() => void loadConfig()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-body font-medium text-foreground-secondary hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-60 transition-colors cursor-pointer"
          >
            <RefreshCcw size={14} /> Refresh
          </button>
        </div>
      }
    >
    <div className="space-y-6">

      {(error || success) && (
        <div
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-body font-medium ${
            error
              ? "border-destructive/20 bg-destructive/10 text-destructive"
              : "border-emerald-100 bg-emerald-50 text-emerald-700"
          }`}
        >
          {error ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          {error || success}
        </div>
      )}

      {loading && !config ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-body text-foreground-tertiary">Loading settings...</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="rounded-xl border border-border bg-card p-3 shadow-sm h-fit">
            <div className="rounded-lg border border-border bg-muted/50 px-3 py-3 text-tiny leading-relaxed text-foreground-secondary mb-4">
              Runtime sections match the live system contract. Experimental flags are excluded.
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
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-body font-medium transition cursor-pointer ${
                      isActive ? "bg-foreground text-background font-semibold" : "text-foreground-secondary hover:bg-muted"
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
