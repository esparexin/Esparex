"use client";

import { GenericSettingsSection, type SettingsFieldSchema } from "./GenericSettingsSection";
import type { SectionProps } from "./types";

const FIELDS: SettingsFieldSchema[] = [
  {
    type: "toggle",
    label: "Push Notifications",
    description: "Enable push channel for app notifications.",
    path: "push.enabled",
    default: false,
  },
  {
    type: "select",
    label: "Push Provider",
    path: "push.provider",
    default: "firebase",
    options: [
      { value: "firebase", label: "Firebase" },
      { value: "onesignal", label: "OneSignal" },
    ],
  },
];

export function MessagingSettings(props: SectionProps) {
  return (
    <GenericSettingsSection
      {...props}
      title="Messaging"
      description="Push provider and real-time delivery controls."
      configPath="notifications"
      successMessage="Messaging settings updated"
      fields={FIELDS}
    />
  );
}

