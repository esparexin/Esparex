"use client";

import { GenericSettingsSection, type SettingsFieldSchema } from "./GenericSettingsSection";
import type { SectionProps } from "./types";

const splitLines = (value: string) =>
  value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

const joinLines = (value?: string[]) => (value || []).join("\n");

const toDateTimeLocal = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const fromDateTimeLocal = (value: string) => (value ? new Date(value).toISOString() : undefined);

const FIELDS: SettingsFieldSchema[] = [
  {
    type: "toggle",
    label: "Maintenance Mode",
    description: "Immediately enables the live maintenance middleware for the public API.",
    path: "maintenance.enabled",
    default: false,
  },
  {
    type: "textarea",
    label: "Maintenance Message",
    description: "Public message shown while maintenance mode is enabled.",
    path: "maintenance.message",
    default: "",
  },
  {
    type: "textarea",
    label: "Allowed IPs",
    description: "One IP per line. These IPs bypass maintenance mode.",
    path: "maintenance.allowedIps",
    default: "",
    transform: (value?: string[]) => joinLines(value),
    serialize: (value: string) => splitLines(value),
  },
  {
    type: "datetime-local",
    label: "Scheduled End",
    description: "Optional estimated end time for maintenance mode.",
    path: "maintenance.scheduledEnd",
    default: "",
    transform: (value?: string) => toDateTimeLocal(value),
    serialize: (value: string) => fromDateTimeLocal(value),
  },
  {
    type: "password",
    label: "Bypass Token",
    description: "Secret token accepted by the maintenance middleware for emergency access.",
    path: "maintenance.bypassToken",
    default: "",
    placeholder: "Leave blank to keep current token",
    preserveMasked: true,
  },
];

export function PlatformSettings(props: SectionProps) {
  return (
    <GenericSettingsSection
      {...props}
      title="Platform"
      description="Live maintenance controls for the public marketplace."
      configPath="platform"
      successMessage="Platform settings updated"
      fields={FIELDS}
      columns={2}
    />
  );
}
