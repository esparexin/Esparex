"use client";

import { useEffect, useState } from "react";
import { Field, SaveButton, SettingsSection, Toggle } from "./shared";
import type { SectionProps } from "./types";

export function SecuritySettings({ config, saving, onSave }: SectionProps) {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(60);
  const [ipWhitelistText, setIpWhitelistText] = useState("");

  useEffect(() => {
    setTwoFactorEnabled(Boolean(config?.security?.twoFactor?.enabled ?? false));
    setSessionTimeout(Number(config?.security?.sessionTimeoutMinutes ?? 60));
    setIpWhitelistText((config?.security?.ipWhitelist || []).join(", "));
  }, [config]);

  return (
    <SettingsSection
      title="Security"
      description="Admin security and hardening controls."
      actions={
        <SaveButton
          saving={saving}
          onClick={() =>
            void onSave(
              {
                security: {
                  twoFactor: { enabled: twoFactorEnabled },
                  sessionTimeoutMinutes: sessionTimeout,
                  ipWhitelist: ipWhitelistText
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean)
                }
              },
              "Security settings updated"
            )
          }
        />
      }
    >
      <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
        <div>
          <p className="text-sm font-medium text-slate-900">2FA Enforcement</p>
          <p className="text-xs text-slate-500">Require admin 2FA on login.</p>
        </div>
        <Toggle checked={twoFactorEnabled} onChange={setTwoFactorEnabled} />
      </div>

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
        <Field label="IP Whitelist (comma separated)">
          <input
            value={ipWhitelistText}
            onChange={(e) => setIpWhitelistText(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          />
        </Field>
      </div>
    </SettingsSection>
  );
}

