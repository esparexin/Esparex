"use client";

import { GenericSettingsSection, type SettingsFieldSchema } from "./GenericSettingsSection";
import type { SectionProps } from "./types";

const FIELDS: SettingsFieldSchema[] = [
  {
    type: "toggle",
    label: "Enabled",
    description: "Enable automated AI moderation.",
    path: "moderation.enabled",
    default: true,
  },
  {
    type: "toggle",
    label: "Auto Flag",
    description: "Automatically flag suspicious content.",
    path: "moderation.autoFlag",
    default: true,
  },
  {
    type: "toggle",
    label: "Auto Block",
    description: "Automatically block high-risk content.",
    path: "moderation.autoBlock",
    default: false,
  },
  {
    type: "number",
    label: "Confidence Threshold (%)",
    path: "moderation.confidenceThreshold",
    default: 85,
    min: 1,
    max: 100,
  },
];

export function ModerationSettings(props: SectionProps) {
  return (
    <GenericSettingsSection
      {...props}
      title="Moderation"
      description="Automated moderation policy controls."
      configPath="ai"
      successMessage="Moderation settings updated"
      fields={FIELDS}
      columns={3}
    />
  );
}

