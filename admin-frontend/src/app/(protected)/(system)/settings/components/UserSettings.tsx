"use client";

import { useEffect, useState } from "react";
import { Field, SaveButton, SettingsSection } from "./shared";
import type { SectionProps } from "./types";

export function UserSettings({ config, saving, onSave }: SectionProps) {
  const [sessionTimeout, setSessionTimeout] = useState(60);
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5);

  useEffect(() => {
    setSessionTimeout(Number(config?.security?.sessionTimeoutMinutes ?? 60));
    setMaxLoginAttempts(Number(config?.security?.maxLoginAttempts ?? 5));
  }, [config]);

  return (
    <SettingsSection
      title="Users"
      description="Account safety controls impacting user sessions."
      actions={
        <SaveButton
          saving={saving}
          onClick={() =>
            void onSave(
              { security: { sessionTimeoutMinutes: sessionTimeout, maxLoginAttempts } },
              "User settings updated"
            )
          }
        />
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Session Timeout (minutes)">
          <input
            type="number"
            min={5}
            value={sessionTimeout}
            onChange={(e) => setSessionTimeout(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Max Login Attempts">
          <input
            type="number"
            min={1}
            value={maxLoginAttempts}
            onChange={(e) => setMaxLoginAttempts(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          />
        </Field>
      </div>
    </SettingsSection>
  );
}

