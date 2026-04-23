"use client";

import { useEffect, useState } from "react";
import { Field, SaveButton, SettingsSection, Toggle } from "./shared";
import type { SectionProps } from "./types";
import type { SystemConfigPatch } from "@/types/systemConfig";

type SettingsPrimitive = string | number | boolean | null | undefined;
type SettingsValue =
  | SettingsPrimitive
  | SettingsPrimitive[]
  | { [key: string]: SettingsValue };
type SettingsObject = Record<string, SettingsValue>;

export type SettingsFieldSchema = {
  type: "toggle" | "number" | "text" | "password" | "datetime-local" | "select" | "textarea";
  label: string;
  description?: string;
  path: string; // nested path within the section config
  default?: SettingsValue;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
  placeholder?: string;
  /** Custom transform from config value to local state (e.g. join array) */
  transform?: (val: unknown) => SettingsValue;
  /** Custom serialize from local state to config value (e.g. split string) */
  serialize?: (val: SettingsValue) => SettingsValue;
  /** Preserve existing secret when the UI only receives a masked placeholder from the API. */
  preserveMasked?: boolean;
};

interface GenericSettingsSectionProps extends SectionProps {
  title: string;
  description: string;
  configPath: string; // The top-level key in config (e.g. 'location', 'security')
  successMessage: string;
  fields: SettingsFieldSchema[];
  columns?: 1 | 2 | 3;
}

export function GenericSettingsSection({
  config,
  saving,
  onSave,
  title,
  description,
  configPath,
  successMessage,
  fields,
  columns = 2,
}: GenericSettingsSectionProps) {
  const [formData, setFormData] = useState<Record<string, SettingsValue>>({});

  // Sync from config when it changes
  useEffect(() => {
    const rootConfig = config as Record<string, unknown> | null;
    const sectionConfig = (rootConfig?.[configPath] ?? {}) as SettingsObject;
    const initialData: Record<string, SettingsValue> = {};

    fields.forEach((field) => {
      // Handle nested paths if needed
      const parts = field.path.split(".");
      let val: unknown = parts.reduce(
        (acc, part) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[part] : undefined),
        sectionConfig as unknown
      );

      if (val === undefined) val = field.default;

      if (field.transform) {
        val = field.transform(val);
      }
      if (field.preserveMasked && typeof val === "string" && val.includes("*")) {
        val = "";
      }
      initialData[field.path] = val as SettingsValue;
    });

    setFormData(initialData);
  }, [config, configPath, fields]);

  const handleSave = () => {
    const payload: SettingsObject = {};
    fields.forEach((field) => {
      let val = formData[field.path];
      if (field.preserveMasked && (val === "" || val === undefined || val === null)) {
        return;
      }
      if (field.serialize) {
        val = field.serialize(val);
      }

      // Reconstruct nested object structure
      const parts = field.path.split(".");
      const last = parts.pop()!;
      let current: SettingsObject = payload;
      parts.forEach((part) => {
        const existing = current[part];
        if (!existing || typeof existing !== "object" || Array.isArray(existing)) {
          current[part] = {};
        }
        current = current[part] as SettingsObject;
      });
      current[last] = val;
    });

    void onSave({ [configPath]: payload } as SystemConfigPatch, successMessage);
  };

  const updateField = (path: string, value: SettingsValue) => {
    setFormData((prev) => ({ ...prev, [path]: value }));
  };

  return (
    <SettingsSection
      title={title}
      description={description}
      actions={<SaveButton saving={saving} onClick={handleSave} />}
    >
      <div className={`grid gap-4 ${
        columns === 3 ? "md:grid-cols-3" : 
        columns === 2 ? "md:grid-cols-2" : 
        "grid-cols-1"
      }`}>
        {fields.map((field) => (
          <div
            key={field.path}
            className={field.type === "toggle" ? "col-span-full" : ""}
          >
            {field.type === "toggle" ? (
              <div className="flex flex-col gap-3 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{field.label}</p>
                  {field.description && (
                    <p className="text-xs text-slate-500">{field.description}</p>
                  )}
                </div>
                <div className="self-start sm:self-center">
                  <Toggle
                    checked={Boolean(formData[field.path])}
                    onChange={(val) => updateField(field.path, val)}
                  />
                </div>
              </div>
            ) : (
              <Field label={field.label} hint={field.description}>
                {field.type === "select" ? (
                  <select
                    value={(formData[field.path] ?? "") as any}
                    onChange={(e) => updateField(field.path, e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                  >
                    {field.placeholder && <option value="">{field.placeholder}</option>}
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea
                    value={(formData[field.path] ?? "") as any}
                    onChange={(e) => updateField(field.path, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                    rows={3}
                  />
                ) : (
                  <input
                    type={field.type}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={(formData[field.path] ?? "") as any}
                    onChange={(e) =>
                      updateField(
                        field.path,
                        field.type === "number" ? Number(e.target.value) : e.target.value
                      )
                    }
                    placeholder={field.placeholder}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                )}
              </Field>
            )}
          </div>
        ))}
      </div>
    </SettingsSection>
  );
}
