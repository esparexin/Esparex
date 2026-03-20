"use client";

import { useEffect, useState } from "react";
import { Field, SaveButton, SettingsSection, Toggle } from "./shared";
import type { SectionProps } from "./types";

export function ModerationSettings({ config, saving, onSave }: SectionProps) {
  const [enabled, setEnabled] = useState(true);
  const [autoFlag, setAutoFlag] = useState(true);
  const [autoBlock, setAutoBlock] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(85);

  useEffect(() => {
    setEnabled(Boolean(config?.ai?.moderation?.enabled ?? true));
    setAutoFlag(Boolean(config?.ai?.moderation?.autoFlag ?? true));
    setAutoBlock(Boolean(config?.ai?.moderation?.autoBlock ?? false));
    setConfidenceThreshold(Number(config?.ai?.moderation?.confidenceThreshold ?? 85));
  }, [config]);

  return (
    <SettingsSection
      title="Moderation"
      description="Automated moderation policy controls."
      actions={
        <SaveButton
          saving={saving}
          onClick={() =>
            void onSave(
              {
                ai: {
                  moderation: {
                    enabled,
                    autoFlag,
                    autoBlock,
                    confidenceThreshold
                  }
                }
              },
              "Moderation settings updated"
            )
          }
        />
      }
    >
      <div className="grid gap-3 md:grid-cols-3">
        <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
          <span className="text-sm font-medium text-slate-900">Enabled</span>
          <Toggle checked={enabled} onChange={setEnabled} />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
          <span className="text-sm font-medium text-slate-900">Auto Flag</span>
          <Toggle checked={autoFlag} onChange={setAutoFlag} />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
          <span className="text-sm font-medium text-slate-900">Auto Block</span>
          <Toggle checked={autoBlock} onChange={setAutoBlock} />
        </div>
      </div>

      <Field label="Confidence Threshold (%)">
        <input
          type="number"
          min={1}
          max={100}
          value={confidenceThreshold}
          onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
        />
      </Field>
    </SettingsSection>
  );
}

