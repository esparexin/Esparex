"use client";

import { GenericSettingsSection, type SettingsFieldSchema } from "./GenericSettingsSection";
import type { SectionProps } from "./types";

const FIELDS: SettingsFieldSchema[] = [
  {
    type: "number",
    label: "Scam Detection",
    path: "moderation.thresholds.scamDetection",
    default: 75,
    min: 1,
    max: 100,
  },
  {
    type: "number",
    label: "Spam Detection",
    path: "moderation.thresholds.spamDetection",
    default: 70,
    min: 1,
    max: 100,
  },
  {
    type: "number",
    label: "Counterfeits",
    path: "moderation.thresholds.counterfeits",
    default: 85,
    min: 1,
    max: 100,
  },
];

export function FraudSettings(props: SectionProps) {
  return (
    <GenericSettingsSection
      {...props}
      title="Fraud Detection"
      description="Risk signal thresholds used by AI moderation."
      configPath="ai"
      successMessage="Fraud detection settings updated"
      fields={FIELDS}
      columns={3}
    />
  );
}

