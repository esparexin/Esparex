"use client";

import { GenericSettingsSection, type SettingsFieldSchema } from "./GenericSettingsSection";
import type { SectionProps } from "./types";

const FIELDS: SettingsFieldSchema[] = [
  {
    type: "number",
    label: "Session Timeout (minutes)",
    path: "sessionTimeoutMinutes",
    default: 60,
    min: 5,
  },
  {
    type: "number",
    label: "Max Login Attempts",
    path: "maxLoginAttempts",
    default: 5,
    min: 1,
  },
];

export function UserSettings(props: SectionProps) {
  return (
    <GenericSettingsSection
      {...props}
      title="Users"
      description="Account safety controls impacting user sessions."
      configPath="security"
      successMessage="User settings updated"
      fields={FIELDS}
    />
  );
}

