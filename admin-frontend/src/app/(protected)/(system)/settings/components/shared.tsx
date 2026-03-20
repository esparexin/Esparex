"use client";

import { useMemo, useState, type ReactNode } from "react";

type SettingsHelpCopy = {
  description: string;
  impact: string;
};

const SETTINGS_HELP: Record<string, SettingsHelpCopy> = {
  Platform: {
    description: "Controls maintenance mode and brand identity values used across the platform.",
    impact: "Turning on maintenance mode can block or limit user traffic immediately."
  },
  Ads: {
    description: "Controls ad discovery behavior such as nearby results and radius defaults.",
    impact: "Too small a radius can reduce inventory visibility; too large can reduce relevance."
  },
  Moderation: {
    description: "Controls AI-assisted moderation thresholds and automatic actions.",
    impact: "Lower thresholds increase moderation sensitivity and may increase false positives."
  },
  Users: {
    description: "Controls user account session and login protection settings.",
    impact: "Aggressive limits can reduce abuse but may increase legitimate lockouts."
  },
  Messaging: {
    description: "Controls push notification channel and provider configuration.",
    impact: "Incorrect provider settings can stop chat and alert delivery."
  },
  Payments: {
    description: "Controls enabled payment gateways for marketplace transactions.",
    impact: "Disabling a gateway immediately blocks checkout paths that rely on it."
  },
  "Fraud Detection": {
    description: "Controls AI risk thresholds used for fraud/spam/counterfeit checks.",
    impact: "Threshold changes directly influence how many ads are flagged or blocked."
  },
  Notifications: {
    description: "Controls outbound notification email channel and sender identity.",
    impact: "Invalid sender/provider values can break system emails."
  },
  Security: {
    description: "Controls admin hardening settings such as 2FA and session timeout.",
    impact: "Stricter security improves protection but can increase sign-in friction."
  },
  Search: {
    description: "Controls search UX, autocomplete behavior, and distance units.",
    impact: "Misconfigured search settings can degrade relevance and discoverability."
  },
  "Feature Flags": {
    description: "Controls feature rollout toggles without code deployment.",
    impact: "Flag changes are immediate and can expose or hide user-facing features."
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
      className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-primary" : "bg-slate-300"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
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
