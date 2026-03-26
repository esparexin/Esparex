"use client";

import { GenericSettingsSection, type SettingsFieldSchema } from "./GenericSettingsSection";
import type { SectionProps } from "./types";

const FIELDS: SettingsFieldSchema[] = [
  {
    type: "toggle",
    label: "Maintenance Mode",
    description: "Temporarily restrict user traffic.",
    path: "maintenance.enabled",
    default: false,
  },
  {
    type: "textarea",
    label: "Maintenance Message",
    path: "maintenance.message",
    default: "",
  },
  {
    type: "text",
    label: "Platform Name",
    path: "branding.platformName",
    default: "Esparex",
  },
  {
    type: "text",
    label: "Primary Color",
    path: "branding.primaryColor",
    default: "#0E8345",
  },
];

export function PlatformSettings(props: SectionProps) {
  return (
    <GenericSettingsSection
      {...props}
      title="Platform"
      description="Maintenance and branding settings."
      configPath="platform"
      successMessage="Platform settings updated"
      fields={FIELDS}
      columns={2}
    />
  );
}

