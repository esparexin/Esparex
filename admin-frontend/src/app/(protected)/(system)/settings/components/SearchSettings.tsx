"use client";

import { useEffect, useState } from "react";
import { Field, SaveButton, SettingsSection, Toggle } from "./shared";
import type { SectionProps } from "./types";

export function SearchSettings({ config, saving, onSave }: SectionProps) {
  const [autoCompleteEnabled, setAutoCompleteEnabled] = useState(true);
  const [autoCompleteMinChars, setAutoCompleteMinChars] = useState(3);
  const [distanceUnit, setDistanceUnit] = useState<"km" | "miles">("km");

  useEffect(() => {
    setAutoCompleteEnabled(Boolean(config?.location?.enableAutoComplete ?? true));
    setAutoCompleteMinChars(Number(config?.location?.autoCompleteMinChars ?? 3));
    setDistanceUnit((config?.location?.distanceUnit as "km" | "miles") || "km");
  }, [config]);

  return (
    <SettingsSection
      title="Search"
      description="Search UX and location autocompletion controls."
      actions={
        <SaveButton
          saving={saving}
          onClick={() =>
            void onSave(
              {
                location: {
                  enableAutoComplete: autoCompleteEnabled,
                  autoCompleteMinChars,
                  distanceUnit
                }
              },
              "Search settings updated"
            )
          }
        />
      }
    >
      <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
        <div>
          <p className="text-sm font-medium text-slate-900">Autocomplete</p>
          <p className="text-xs text-slate-500">Enable location search suggestions.</p>
        </div>
        <Toggle checked={autoCompleteEnabled} onChange={setAutoCompleteEnabled} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Autocomplete Min Characters">
          <input
            type="number"
            min={1}
            value={autoCompleteMinChars}
            onChange={(e) => setAutoCompleteMinChars(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Distance Unit">
          <select
            value={distanceUnit}
            onChange={(e) => setDistanceUnit(e.target.value as "km" | "miles")}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          >
            <option value="km">Kilometers</option>
            <option value="miles">Miles</option>
          </select>
        </Field>
      </div>
    </SettingsSection>
  );
}

