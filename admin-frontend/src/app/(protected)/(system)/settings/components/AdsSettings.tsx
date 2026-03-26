"use client";

import { GenericSettingsSection, type SettingsFieldSchema } from "./GenericSettingsSection";
import type { SectionProps } from "./types";

const FIELDS: SettingsFieldSchema[] = [
  {
    type: "toggle",
    label: "Enable Nearby Ads",
    description: "Use geo-priority in ad listing feed.",
    path: "enableNearbySearch",
    default: true,
  },
  {
    type: "number",
    label: "Default Search Radius (km)",
    path: "defaultSearchRadius",
    default: 25,
    min: 1,
  },
  {
    type: "number",
    label: "Max Search Radius (km)",
    path: "maxSearchRadius",
    default: 100,
    min: 1,
  },
];

export function AdsSettings(props: SectionProps) {
  return (
    <GenericSettingsSection
      {...props}
      title="Ads"
      description="Ad discovery and geo radius controls."
      configPath="location"
      successMessage="Ads settings updated"
      fields={FIELDS}
    />
  );
}

