"use client";

import { useEffect, useState } from "react";
import { Field, SaveButton, SettingsSection, Toggle } from "./shared";
import type { SectionProps } from "./types";

export function MessagingSettings({ config, saving, onSave }: SectionProps) {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [provider, setProvider] = useState<"firebase" | "onesignal">("firebase");

  useEffect(() => {
    setPushEnabled(Boolean(config?.notifications?.push?.enabled ?? false));
    setProvider((config?.notifications?.push?.provider as "firebase" | "onesignal") || "firebase");
  }, [config]);

  return (
    <SettingsSection
      title="Messaging"
      description="Push provider and real-time delivery controls."
      actions={
        <SaveButton
          saving={saving}
          onClick={() =>
            void onSave(
              { notifications: { push: { enabled: pushEnabled, provider } } },
              "Messaging settings updated"
            )
          }
        />
      }
    >
      <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
        <div>
          <p className="text-sm font-medium text-slate-900">Push Notifications</p>
          <p className="text-xs text-slate-500">Enable push channel for app notifications.</p>
        </div>
        <Toggle checked={pushEnabled} onChange={setPushEnabled} />
      </div>

      <Field label="Push Provider">
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as "firebase" | "onesignal")}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
        >
          <option value="firebase">Firebase</option>
          <option value="onesignal">OneSignal</option>
        </select>
      </Field>
    </SettingsSection>
  );
}

