"use client";

import { GenericSettingsSection, type SettingsFieldSchema } from "./GenericSettingsSection";
import type { SectionProps } from "./types";

const FIELDS: SettingsFieldSchema[] = [
  {
    type: "toggle",
    label: "Google AdSense Enabled",
    description: "Toggles programmatic display advertisements across web and mobile web layouts.",
    path: "googleAdsense.enabled",
    default: false,
  },
  {
    type: "text",
    label: "AdSense Publisher ID",
    description: "Format: ca-pub-16Digits (e.g. ca-pub-1234567890123456)",
    path: "googleAdsense.publisherId",
    placeholder: "ca-pub-1234567890123456",
    default: "",
  },
  {
    type: "text",
    label: "Listing Detail Bottom Slot ID",
    description: "Numeric 10-digit slot ID generated in Google AdSense Console.",
    path: "googleAdsense.slots.listingDetailBottom",
    placeholder: "1234567890",
    default: "",
  },
  {
    type: "text",
    label: "Homepage Hero Slot ID",
    description: "Numeric 10-digit slot ID for homepage hero placement.",
    path: "googleAdsense.slots.homepageHero",
    placeholder: "1234567890",
    default: "",
  },
  {
    type: "text",
    label: "Search Sidebar Slot ID",
    description: "Numeric 10-digit slot ID for search results sidebar placement.",
    path: "googleAdsense.slots.searchSidebar",
    placeholder: "1234567890",
    default: "",
  },
];

export function DisplayAdsSettings(props: SectionProps) {
  return (
    <GenericSettingsSection
      {...props}
      title="Display Ads & Monetization"
      description="Manage Google AdSense publisher client credentials and slot placements across the platform."
      configPath="integrations"
      successMessage="Display Ads settings updated successfully"
      fields={FIELDS}
    />
  );
}
