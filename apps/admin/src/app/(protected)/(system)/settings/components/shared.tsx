"use client";

import type { ReactNode } from "react";

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
  return (
    <section className="rounded-xl border border-border bg-card shadow-sm">
      <header className="border-b border-border px-5 py-4">
        <div>
          <h2 className="text-body-lg font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-caption text-foreground-tertiary">{description}</p>
        </div>
      </header>
      <div className="space-y-4 p-6">{children}</div>
      {actions ? <footer className="border-t border-border px-5 py-6">{actions}</footer> : null}
    </section>
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
      <span className="text-caption font-semibold uppercase tracking-wide text-foreground-tertiary">{label}</span>
      {children}
      {hint ? <span className="block text-tiny text-foreground-subtle">{hint}</span> : null}
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
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 cursor-pointer ${
        checked ? "bg-primary" : "bg-muted"
      }`}
    >
      <span
        className={`pointer-events-none absolute left-0.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-background shadow-sm transition-transform ${
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
      className="rounded-lg bg-primary px-4 py-2 text-body font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
    >
      {saving ? "Saving..." : label}
    </button>
  );
}
