"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Mail } from "lucide-react";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { adminFetch, AdminApiError } from "@/lib/api/adminClient";
import { GenericSettingsSection, type SettingsFieldSchema } from "./GenericSettingsSection";
import type { SectionProps } from "./types";

const FIELDS: SettingsFieldSchema[] = [
  {
    type: "toggle",
    label: "Email Notifications",
    description: "Disables runtime email sending when turned off.",
    path: "email.enabled",
    default: true,
  },
  {
    type: "select",
    label: "Provider",
    description: "SMTP is the only implemented runtime provider.",
    path: "email.provider",
    default: "smtp",
    transform: () => "smtp",
    options: [
      { value: "smtp", label: "SMTP" },
    ],
  },
  {
    type: "text",
    label: "Sender Name",
    path: "email.senderName",
    default: "Esparex Team",
  },
  {
    type: "text",
    label: "Sender Email",
    path: "email.senderEmail",
    default: "noreply@esparex.com",
  },
  {
    type: "text",
    label: "SMTP Host",
    path: "email.host",
    default: "",
  },
  {
    type: "number",
    label: "SMTP Port",
    path: "email.port",
    default: 587,
    min: 1,
    max: 65535,
  },
  {
    type: "text",
    label: "SMTP Username",
    path: "email.username",
    default: "",
  },
  {
    type: "password",
    label: "SMTP Password",
    path: "email.password",
    default: "",
    placeholder: "Leave blank to keep current password",
    preserveMasked: true,
  },
  {
    type: "select",
    label: "Encryption",
    path: "email.encryption",
    default: "tls",
    options: [
      { value: "none", label: "None" },
      { value: "tls", label: "TLS" },
      { value: "ssl", label: "SSL" },
    ],
  },
  {
    type: "toggle",
    label: "Push Notifications",
    description: "Controls runtime push delivery for chat and in-app events.",
    path: "push.enabled",
    default: false,
  },
  {
    type: "select",
    label: "Push Provider",
    description: "Firebase is the only implemented runtime provider.",
    path: "push.provider",
    default: "firebase",
    transform: () => "firebase",
    options: [
      { value: "firebase", label: "Firebase" },
    ],
  },
];

export function NotificationSettings(props: SectionProps) {
  const [testEmail, setTestEmail] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const recipient = testEmail.trim();
    if (!recipient || !recipient.includes("@")) {
      setTestResult({ success: false, message: "Please enter a valid recipient email address." });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await adminFetch<{ success: boolean; message?: string }>(ADMIN_ROUTES.SYSTEM_CONFIG_TEST_EMAIL, {
        method: "POST",
        body: { recipientEmail: recipient },
      });
      setTestResult({
        success: true,
        message: res.message || `Test email sent successfully to ${recipient}`,
      });
    } catch (err: unknown) {
      setTestResult({
        success: false,
        message: AdminApiError.resolveMessage(err, "Failed to send test email. Verify SMTP settings and try again."),
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <GenericSettingsSection
        {...props}
        title="Notifications"
        description="SMTP email and push delivery controls backed by the live runtime."
        configPath="notifications"
        successMessage="Notification settings updated"
        fields={FIELDS}
        columns={2}
      />

      <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <h3 className="text-body font-bold text-foreground">SMTP Diagnostic Test</h3>
        </div>
        <p className="text-caption text-foreground-secondary">
          Send an automated test probe to verify that your active SMTP host, credentials, and network connectivity are operational.
        </p>

        <form onSubmit={handleTestEmail} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center max-w-lg">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="admin@example.com"
            disabled={testing}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-body-lg md:text-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          <button
            type="submit"
            disabled={testing}
            className="shrink-0 rounded-lg bg-primary px-4 py-2 text-caption font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {testing ? "Testing..." : "Send Test Email"}
          </button>
        </form>

        {testResult ? (
          <div
            className={`rounded-lg px-4 py-3 text-caption flex items-center gap-2 ${
              testResult.success
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-destructive/10 text-destructive border border-destructive/20"
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
            )}
            <span>{testResult.message}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

