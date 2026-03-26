"use client";

import { GenericSettingsSection, type SettingsFieldSchema } from "./GenericSettingsSection";
import type { SectionProps } from "./types";

const FIELDS: SettingsFieldSchema[] = [
  {
    type: "toggle",
    label: "Autocomplete",
    description: "Enable location search suggestions.",
    path: "enableAutoComplete",
    default: true,
  },
  {
    type: "number",
    label: "Autocomplete Min Characters",
    path: "autoCompleteMinChars",
    default: 3,
    min: 1,
  },
  {
    type: "select",
    label: "Distance Unit",
    path: "distanceUnit",
    default: "km",
    options: [
      { value: "km", label: "Kilometers" },
      { value: "miles", label: "Miles" },
    ],
  },
];

export function SearchSettings(props: SectionProps) {
  return (
    <GenericSettingsSection
      {...props}
      title="Search"
      description="Search UX and location autocompletion controls."
      configPath="location"
      successMessage="Search settings updated"
      fields={FIELDS}
    />
  );
}

