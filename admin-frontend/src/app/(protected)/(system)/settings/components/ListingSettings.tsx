"use client";

import { GenericSettingsSection, type SettingsFieldSchema } from "./GenericSettingsSection";
import type { SectionProps } from "./types";

const FIELDS: SettingsFieldSchema[] = [
  {
    type: "number",
    label: "Ad Expiry (days)",
    description: "Used by the listing expiry service for standard ads.",
    path: "expiryDays.ad",
    default: 30,
    min: 1,
  },
  {
    type: "number",
    label: "Service Expiry (days)",
    description: "Used by the listing expiry service for service listings.",
    path: "expiryDays.service",
    default: 30,
    min: 1,
  },
  {
    type: "number",
    label: "Spare-Part Expiry (days)",
    description: "Used by the listing expiry service for spare-part listings.",
    path: "expiryDays.spare_part",
    default: 30,
    min: 1,
  },
  {
    type: "number",
    label: "Individual Spare-Part Limit",
    description: "Maximum live or pending spare-part listings allowed before business upgrade is required.",
    path: "thresholds.proSparePartLimit",
    default: 5,
    min: 0,
  },
];

export function ListingSettings(props: SectionProps) {
  return (
    <GenericSettingsSection
      {...props}
      title="Listing Rules"
      description="Live listing expiry and seller-threshold settings."
      configPath="listing"
      successMessage="Listing rules updated"
      fields={FIELDS}
      columns={2}
    />
  );
}
