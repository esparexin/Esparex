"use client";

import { useEffect, useState } from "react";
import { Field, SaveButton, SettingsSection, Toggle } from "./shared";
import type { SectionProps } from "./types";

export function AdsSettings({ config, saving, onSave }: SectionProps) {
  const [enableNearby, setEnableNearby] = useState(true);
  const [defaultRadius, setDefaultRadius] = useState(25);
  const [maxRadius, setMaxRadius] = useState(100);

  useEffect(() => {
    setEnableNearby(Boolean(config?.location?.enableNearbySearch ?? true));
    setDefaultRadius(Number(config?.location?.defaultSearchRadius ?? 25));
    setMaxRadius(Number(config?.location?.maxSearchRadius ?? 100));
  }, [config]);

  return (
    <SettingsSection
      title="Ads"
      description="Ad discovery and geo radius controls."
      actions={
        <SaveButton
          saving={saving}
          onClick={() =>
            void onSave(
              {
                location: {
                  enableNearbySearch: enableNearby,
                  defaultSearchRadius: defaultRadius,
                  maxSearchRadius: maxRadius
                }
              },
              "Ads settings updated"
            )
          }
        />
      }
    >
      <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
        <div>
          <p className="text-sm font-medium text-slate-900">Enable Nearby Ads</p>
          <p className="text-xs text-slate-500">Use geo-priority in ad listing feed.</p>
        </div>
        <Toggle checked={enableNearby} onChange={setEnableNearby} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Default Search Radius (km)">
          <input
            type="number"
            min={1}
            value={defaultRadius}
            onChange={(e) => setDefaultRadius(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Max Search Radius (km)">
          <input
            type="number"
            min={1}
            value={maxRadius}
            onChange={(e) => setMaxRadius(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          />
        </Field>
      </div>
    </SettingsSection>
  );
}

