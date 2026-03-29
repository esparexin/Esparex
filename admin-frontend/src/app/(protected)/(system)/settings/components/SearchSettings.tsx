"use client";

import { GenericSettingsSection, type SettingsFieldSchema } from "./GenericSettingsSection";
import type { SectionProps } from "./types";

const FIELDS: SettingsFieldSchema[] = [
  {
    type: "toggle",
    label: "Autocomplete",
    description: "Enables live location suggestions in the public search flow.",
    path: "enableAutoComplete",
    default: true,
  },
  {
    type: "number",
    label: "Autocomplete Min Characters",
    description: "Minimum query length before autocomplete requests are served.",
    path: "autoCompleteMinChars",
    default: 3,
    min: 1,
  },
  {
    type: "number",
    label: "Max Search Radius (km)",
    description: "Maximum radius accepted by location-based search endpoints.",
    path: "maxSearchRadius",
    default: 100,
    min: 1,
  },
  {
    type: "toggle",
    label: "Reverse Geocoding",
    description: "Allows runtime reverse-geocode lookups for location resolution.",
    path: "enableReverseGeocoding",
    default: true,
  },
];

export function SearchSettings(props: SectionProps) {
  return (
    <GenericSettingsSection
      {...props}
      title="Search & Location"
      description="Only runtime-backed location search controls are shown."
      configPath="location"
      successMessage="Search and location settings updated"
      fields={FIELDS}
    />
  );
}
