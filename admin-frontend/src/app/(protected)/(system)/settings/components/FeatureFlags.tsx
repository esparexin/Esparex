"use client";

import { useEffect, useState } from "react";
import { SaveButton, SettingsSection } from "./shared";
import type { SectionProps } from "./types";

const DEFAULT_FLAGS: Record<string, boolean> = {
  enableSpotlightAds: true,
  enableSmartAlerts: true,
  enableFraudShield: true,
};

export function FeatureFlags({ config, saving, onSave }: SectionProps) {
  const [flags, setFlags] = useState<Record<string, boolean>>(DEFAULT_FLAGS);

  useEffect(() => {
    const incoming = config?.featureFlags || {};
    setFlags({ ...DEFAULT_FLAGS, ...incoming });
  }, [config]);

  const toggleFlag = (key: string) => {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <SettingsSection
      title="Feature Flags"
      description="Controlled rollout toggles for major product capabilities."
      actions={
        <SaveButton
          saving={saving}
          onClick={() => void onSave({ featureFlags: flags }, "Feature flags updated")}
        />
      }
    >
      <div className="space-y-2">
        {Object.entries(flags).map(([key, value]) => (
          <button
            key={key}
            type="button"
            onClick={() => toggleFlag(key)}
            className="flex w-full items-center justify-between rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50"
          >
            <span className="text-sm font-medium text-slate-800">{key}</span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                value ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
              }`}
            >
              {value ? "Enabled" : "Disabled"}
            </span>
          </button>
        ))}
      </div>
    </SettingsSection>
  );
}

