"use client";

import { useEffect, useState } from "react";
import { Field, SaveButton, SettingsSection, Toggle } from "./shared";
import type { SectionProps } from "./types";

export function NotificationSettings({ config, saving, onSave }: SectionProps) {
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [provider, setProvider] = useState<"smtp" | "sendgrid" | "aws-ses">("smtp");
  const [senderName, setSenderName] = useState("Esparex Team");
  const [senderEmail, setSenderEmail] = useState("noreply@esparex.com");

  useEffect(() => {
    setEmailEnabled(Boolean(config?.notifications?.email?.enabled ?? true));
    setProvider((config?.notifications?.email?.provider as "smtp" | "sendgrid" | "aws-ses") || "smtp");
    setSenderName(config?.notifications?.email?.senderName || "Esparex Team");
    setSenderEmail(config?.notifications?.email?.senderEmail || "noreply@esparex.com");
  }, [config]);

  return (
    <SettingsSection
      title="Notifications"
      description="Email delivery channel for platform notifications."
      actions={
        <SaveButton
          saving={saving}
          onClick={() =>
            void onSave(
              {
                notifications: {
                  email: {
                    enabled: emailEnabled,
                    provider,
                    senderName,
                    senderEmail
                  }
                }
              },
              "Notification settings updated"
            )
          }
        />
      }
    >
      <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
        <div>
          <p className="text-sm font-medium text-slate-900">Email Notifications</p>
          <p className="text-xs text-slate-500">Enable system and transactional emails.</p>
        </div>
        <Toggle checked={emailEnabled} onChange={setEmailEnabled} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Provider">
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as "smtp" | "sendgrid" | "aws-ses")}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          >
            <option value="smtp">SMTP</option>
            <option value="sendgrid">SendGrid</option>
            <option value="aws-ses">AWS SES</option>
          </select>
        </Field>
        <Field label="Sender Name">
          <input
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          />
        </Field>
      </div>

      <Field label="Sender Email">
        <input
          value={senderEmail}
          onChange={(e) => setSenderEmail(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
        />
      </Field>
    </SettingsSection>
  );
}

