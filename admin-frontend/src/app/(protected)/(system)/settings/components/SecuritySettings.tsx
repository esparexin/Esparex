"use client";

import { GenericSettingsSection, type SettingsFieldSchema } from "./GenericSettingsSection";
import type { SectionProps } from "./types";

const FIELDS: SettingsFieldSchema[] = [
  {
    type: "toggle",
    label: "2FA Enforcement",
    description: "Require admin 2FA on login.",
    path: "twoFactor.enabled",
    default: false,
  },
  {
    type: "number",
    label: "Session Timeout (minutes)",
    path: "sessionTimeoutMinutes",
    default: 60,
    min: 5,
  },
  {
    type: "text",
    label: "IP Whitelist (comma separated)",
    path: "ipWhitelist",
    default: "",
    transform: (val: string[]) => (val || []).join(", "),
    serialize: (val: string) =>
      val
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
  },
];

export function SecuritySettings(props: SectionProps) {
  return (
    <GenericSettingsSection
      {...props}
      title="Security"
      description="Admin security and hardening controls."
      configPath="security"
      successMessage="Security settings updated"
      fields={FIELDS}
    />
  );
}

