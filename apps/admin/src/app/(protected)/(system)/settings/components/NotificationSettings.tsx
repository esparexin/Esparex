"use client";

import { GenericSettingsSection, type SettingsFieldSchema } from "./GenericSettingsSection";
import type { SectionProps } from "./types";

const FIELDS: SettingsFieldSchema[] = [
  {
    type: "toggle",
    label: "Email Notifications",
    description: "Disables runtime email sending when turned off.",
    path: "email.enabled",
    default: true,
  },
  {
    type: "select",
    label: "Provider",
    description: "SMTP is the only implemented runtime provider.",
    path: "email.provider",
    default: "smtp",
    transform: () => "smtp",
    options: [
      { value: "smtp", label: "SMTP" },
    ],
  },
  {
    type: "text",
    label: "Sender Name",
    path: "email.senderName",
    default: "Esparex Team",
  },
  {
    type: "text",
    label: "Sender Email",
    path: "email.senderEmail",
    default: "noreply@esparex.com",
  },
  {
    type: "text",
    label: "SMTP Host",
    path: "email.host",
    default: "",
  },
  {
    type: "number",
    label: "SMTP Port",
    path: "email.port",
    default: 587,
    min: 1,
    max: 65535,
  },
  {
    type: "text",
    label: "SMTP Username",
    path: "email.username",
    default: "",
  },
  {
    type: "password",
    label: "SMTP Password",
    path: "email.password",
    default: "",
    placeholder: "Leave blank to keep current password",
    preserveMasked: true,
  },
  {
    type: "select",
    label: "Encryption",
    path: "email.encryption",
    default: "tls",
    options: [
      { value: "none", label: "None" },
      { value: "tls", label: "TLS" },
      { value: "ssl", label: "SSL" },
    ],
  },
  {
    type: "toggle",
    label: "Push Notifications",
    description: "Controls runtime push delivery for chat and in-app events.",
    path: "push.enabled",
    default: false,
  },
  {
    type: "select",
    label: "Push Provider",
    description: "Firebase is the only implemented runtime provider.",
    path: "push.provider",
    default: "firebase",
    transform: () => "firebase",
    options: [
      { value: "firebase", label: "Firebase" },
    ],
  },
];

export function NotificationSettings(props: SectionProps) {
  return (
    <GenericSettingsSection
      {...props}
      title="Notifications"
      description="SMTP email and push delivery controls backed by the live runtime."
      configPath="notifications"
      successMessage="Notification settings updated"
      fields={FIELDS}
      columns={2}
    />
  );
}
