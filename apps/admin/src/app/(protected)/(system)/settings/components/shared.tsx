"use client";

import { useMemo, useState, type ReactNode } from "react";

type SettingsHelpCopy = {
  description: string;
  impact: string;
};

const SETTINGS_HELP: Record<string, SettingsHelpCopy> = {
  Platform: {
    description: "Controls the live maintenance middleware for the public marketplace.",
    impact: "Turning on maintenance mode or changing bypass controls affects public traffic immediately."
  },
  "Listing Rules": {
    description: "Controls live listing expiry windows and spare-part seller thresholds.",
    impact: "Changing these values affects validation and lifecycle jobs without a deploy."
  },
  "Moderation & AI": {
    description: "Controls the live moderation kill-switch, community auto-hide threshold, and AI generation settings.",
    impact: "These values directly affect report auto-hide behavior and AI content generation."
  },
  Payments: {
    description: "Controls the active Razorpay checkout configuration used by user plan purchases.",
    impact: "Disabling Razorpay immediately blocks new plan purchases."
  },
  Notifications: {
    description: "Controls runtime SMTP email delivery and push notification delivery.",
    impact: "Invalid SMTP or push values can break password reset, invoices, chat, and alert notifications."
  },
  Security: {
    description: "Controls admin session lifetime, 2FA issuer labeling, and sign-in IP allowlisting.",
    impact: "Incorrect values can shorten sessions or block admin login from expected networks."
  },
  "Search & Location": {
    description: "Controls the live location-search settings used by autocomplete and reverse-geocoding flows.",
    impact: "Aggressive limits can reduce discoverability; permissive values can increase noisy requests."
  }
};

export function SettingsSection({
  title,
  description,
  children,
  actions
}: {
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const [helpOpen, setHelpOpen] = useState(false);
  const help = useMemo(() => SETTINGS_HELP[title], [title]);

  return (
    <>
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">{title}</h2>
              <p className="mt-1 text-xs text-slate-500">{description}</p>
            </div>
            {help ? (
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50"
                aria-label={`Help for ${title}`}
                title={`Help for ${title}`}
              >
                ?
              </button>
            ) : null}
          </div>
        </header>
        <div className="space-y-4 p-5">{children}</div>
        {actions ? <footer className="border-t border-slate-100 px-5 py-4">{actions}</footer> : null}
      </section>

      {helpOpen && help ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
            <h3 className="text-base font-semibold text-slate-900">{title} Help</h3>
            <div className="mt-3 space-y-3 text-sm text-slate-700">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">What this controls</p>
                <p className="mt-1">{help.description}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Impact</p>
                <p className="mt-1">{help.impact}</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function Field({
  label,
  hint,
  children
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
      {hint ? <span className="block text-[11px] text-slate-400">{hint}</span> : null}
    </label>
  );
}

export function Toggle({
  checked,
  onChange
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
        checked ? "bg-primary" : "bg-slate-300"
      }`}
    >
      <span
        className={`pointer-events-none absolute left-0.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export function SaveButton({
  label = "Save Changes",
  saving,
  onClick
}: {
  label?: string;
  saving: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {saving ? "Saving..." : label}
    </button>
  );
}
