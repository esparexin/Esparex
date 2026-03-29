"use client";

import { GenericSettingsSection, type SettingsFieldSchema } from "./GenericSettingsSection";
import type { SectionProps } from "./types";

const FIELDS: SettingsFieldSchema[] = [
  {
    type: "toggle",
    label: "AI Moderation Enabled",
    description: "Controls the moderation service kill-switch for automated checks.",
    path: "moderation.enabled",
    default: true,
  },
  {
    type: "number",
    label: "Auto-hide Report Threshold",
    description: "Number of open reports needed before a listing is auto-hidden.",
    path: "moderation.reportAutoHideThreshold",
    default: 5,
    min: 1,
  },
  {
    type: "toggle",
    label: "SEO Title Generation",
    description: "Allows AI-generated listing titles when generation is requested.",
    path: "seo.enableTitleSEO",
    default: true,
  },
  {
    type: "toggle",
    label: "SEO Description Generation",
    description: "Allows AI-generated listing descriptions when generation is requested.",
    path: "seo.enableDescriptionSEO",
    default: true,
  },
  {
    type: "password",
    label: "OpenAI API Key",
    description: "Used by AI identify, moderation, and SEO generation.",
    path: "seo.openaiApiKey",
    default: "",
    placeholder: "Leave blank to keep current key",
    preserveMasked: true,
  },
  {
    type: "text",
    label: "OpenAI Model",
    path: "seo.model",
    default: "gpt-4o",
  },
  {
    type: "number",
    label: "Temperature",
    description: "Applied to AI SEO generation and moderation requests.",
    path: "seo.temperature",
    default: 0.7,
    min: 0,
    max: 2,
    step: 0.1,
  },
  {
    type: "number",
    label: "Max Tokens",
    path: "seo.maxTokens",
    default: 500,
    min: 1,
  },
];

export function ModerationSettings(props: SectionProps) {
  return (
    <GenericSettingsSection
      {...props}
      title="Moderation & AI"
      description="Only runtime-backed moderation and AI generation controls are exposed here."
      configPath="ai"
      successMessage="Moderation and AI settings updated"
      fields={FIELDS}
      columns={3}
    />
  );
}
