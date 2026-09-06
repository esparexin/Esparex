"use client";

import type { ReactNode } from "react";
import { Button, Switch } from "@esparex/ui";

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
  onChange,
  disabled,
  id,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
}) {
  return (
    <Switch
      checked={checked}
      onCheckedChange={onChange}
      disabled={disabled}
      id={id}
      aria-label={ariaLabel}
    />
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
    <Button
      type="button"
      onClick={onClick}
      disabled={saving}
      className="font-semibold"
    >
      {saving ? "Saving..." : label}
    </Button>
  );
}
