"use client";

import { GenericSettingsSection, type SettingsFieldSchema } from "./GenericSettingsSection";
import type { SectionProps } from "./types";

const FIELDS: SettingsFieldSchema[] = [
  {
    type: "toggle",
    label: "Email Notifications",
    description: "Enable system and transactional emails.",
    path: "email.enabled",
    default: true,
  },
  {
    type: "select",
    label: "Provider",
    path: "email.provider",
    default: "smtp",
    options: [
      { value: "smtp", label: "SMTP" },
      { value: "sendgrid", label: "SendGrid" },
      { value: "aws-ses", label: "AWS SES" },
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
];

export function NotificationSettings(props: SectionProps) {
  return (
    <GenericSettingsSection
      {...props}
      title="Notifications"
      description="Email delivery channel for platform notifications."
      configPath="notifications"
      successMessage="Notification settings updated"
      fields={FIELDS}
    />
  );
}

