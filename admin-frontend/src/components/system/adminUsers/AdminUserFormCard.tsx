"use client";

import type { LucideIcon } from "lucide-react";
import type {
    AdminStatus,
    AdminRole,
    AdminUserFormValues,
} from "@/components/system/adminUsers/adminUsers";

interface AdminUserFormCardProps {
    title?: string;
    values: AdminUserFormValues;
    submitLabel: string;
    secondaryLabel: string;
    submitIcon: LucideIcon;
    secondaryIcon: LucideIcon;
    isSubmitting: boolean;
    showPassword?: boolean;
    showStatus?: boolean;
    permissionsPlaceholder: string;
    onChange: (field: keyof AdminUserFormValues, value: string) => void;
    onSubmit: () => void;
    onSecondary: () => void;
}

const ROLE_OPTIONS: AdminRole[] = ["moderator", "admin", "super_admin"];
const STATUS_OPTIONS: AdminStatus[] = ["live", "inactive", "suspended", "banned"];

export function AdminUserFormCard({
    title,
    values,
    submitLabel,
    secondaryLabel,
    submitIcon: SubmitIcon,
    secondaryIcon: SecondaryIcon,
    isSubmitting,
    showPassword = false,
    showStatus = false,
    permissionsPlaceholder,
    onChange,
    onSubmit,
    onSecondary,
}: AdminUserFormCardProps) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            {title ? <h2 className="mb-3 text-base font-semibold text-slate-900">{title}</h2> : null}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                <input
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="First name"
                    value={values.firstName}
                    onChange={(event) => onChange("firstName", event.target.value)}
                />
                <input
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="Last name"
                    value={values.lastName}
                    onChange={(event) => onChange("lastName", event.target.value)}
                />
                <input
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="Email"
                    value={values.email}
                    onChange={(event) => onChange("email", event.target.value)}
                />

                {showPassword ? (
                    <input
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Password"
                        type="password"
                        value={values.password || ""}
                        onChange={(event) => onChange("password", event.target.value)}
                    />
                ) : null}

                <select
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={values.role}
                    onChange={(event) => onChange("role", event.target.value)}
                >
                    {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                            {role}
                        </option>
                    ))}
                </select>

                {showStatus ? (
                    <select
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={values.status || "live"}
                        onChange={(event) => onChange("status", event.target.value)}
                    >
                        {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </select>
                ) : null}

                <input
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-5"
                    placeholder={permissionsPlaceholder}
                    value={values.permissionsText}
                    onChange={(event) => onChange("permissionsText", event.target.value)}
                />
            </div>

            <div className="mt-3 flex items-center gap-2">
                <button
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                    disabled={isSubmitting}
                    onClick={onSubmit}
                >
                    <SubmitIcon size={14} /> {submitLabel}
                </button>
                <button
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    onClick={onSecondary}
                >
                    <SecondaryIcon size={14} /> {secondaryLabel}
                </button>
            </div>
        </div>
    );
}
