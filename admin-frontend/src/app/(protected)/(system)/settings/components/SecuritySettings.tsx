"use client";

import { GenericSettingsSection, type SettingsFieldSchema } from "./GenericSettingsSection";
import type { SectionProps } from "./types";

const splitLines = (value: string) =>
  value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

const FIELDS: SettingsFieldSchema[] = [
  {
    type: "text",
    label: "2FA Issuer",
    description: "Displayed inside authenticator apps when an admin enrolls in 2FA.",
    path: "twoFactor.issuer",
    default: "Esparex Admin",
  },
  {
    type: "number",
    label: "Session Timeout (minutes)",
    description: "Controls admin session TTL and cookie refresh duration.",
    path: "sessionTimeoutMinutes",
    default: 60,
    min: 5,
  },
  {
    type: "textarea",
    label: "Login IP Allowlist",
    description: "One IP per line. Admin login is blocked outside this allowlist when populated.",
    path: "ipWhitelist",
    default: "",
    transform: (value: string[]) => (value || []).join("\n"),
    serialize: (value: string) => splitLines(value),
  },
];

export function SecuritySettings(props: SectionProps) {
  return (
    <GenericSettingsSection
      {...props}
      title="Security"
      description="Live admin session, 2FA issuer, and sign-in IP controls."
      configPath="security"
      successMessage="Security settings updated"
      fields={FIELDS}
    />
  );
}
