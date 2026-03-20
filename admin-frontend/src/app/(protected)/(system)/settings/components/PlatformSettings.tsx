"use client";

import { useEffect, useState } from "react";
import { Field, SaveButton, SettingsSection, Toggle } from "./shared";
import type { SectionProps } from "./types";

export function PlatformSettings({ config, saving, onSave }: SectionProps) {
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [platformName, setPlatformName] = useState("Esparex");
  const [primaryColor, setPrimaryColor] = useState("#0E8345");

  useEffect(() => {
    setMaintenanceEnabled(Boolean(config?.platform?.maintenance?.enabled));
    setMaintenanceMessage(config?.platform?.maintenance?.message || "");
    setPlatformName(config?.platform?.branding?.platformName || "Esparex");
    setPrimaryColor(config?.platform?.branding?.primaryColor || "#0E8345");
  }, [config]);

  return (
    <SettingsSection
      title="Platform"
      description="Maintenance and branding settings."
      actions={
        <SaveButton
          saving={saving}
          onClick={() =>
            void onSave(
              {
                platform: {
                  maintenance: { enabled: maintenanceEnabled, message: maintenanceMessage },
                  branding: { platformName, primaryColor }
                }
              },
              "Platform settings updated"
            )
          }
        />
      }
    >
      <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
        <div>
          <p className="text-sm font-medium text-slate-900">Maintenance Mode</p>
          <p className="text-xs text-slate-500">Temporarily restrict user traffic.</p>
        </div>
        <Toggle checked={maintenanceEnabled} onChange={setMaintenanceEnabled} />
      </div>

      <Field label="Maintenance Message">
        <textarea
          value={maintenanceMessage}
          onChange={(e) => setMaintenanceMessage(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          rows={3}
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Platform Name">
          <input
            value={platformName}
            onChange={(e) => setPlatformName(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Primary Color">
          <input
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          />
        </Field>
      </div>
    </SettingsSection>
  );
}

