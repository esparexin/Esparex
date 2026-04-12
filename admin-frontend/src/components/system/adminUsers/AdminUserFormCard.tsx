"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { LucideIcon } from "lucide-react";
import type {
    AdminStatus,
    AdminRole,
    AdminCreateFormState,
    AdminEditFormState,
} from "@/components/system/adminUsers/adminUsers";
import {
    adminCreateUserFormSchema,
    adminEditUserFormSchema,
    type AdminCreateUserFormValues,
    type AdminEditUserFormValues,
} from "@/schemas/admin.schemas";

type AdminUserFormCardProps =
    | {
        mode: "create";
        title?: string;
        values: AdminCreateFormState;
        submitLabel: string;
        secondaryLabel: string;
        submitIcon: LucideIcon;
        secondaryIcon: LucideIcon;
        isSubmitting: boolean;
        permissionsPlaceholder: string;
        onSubmit: (values: AdminCreateUserFormValues) => void | Promise<void>;
        onSecondary: () => void;
    }
    | {
        mode: "edit";
        title?: string;
        values: AdminEditFormState;
        submitLabel: string;
        secondaryLabel: string;
        submitIcon: LucideIcon;
        secondaryIcon: LucideIcon;
        isSubmitting: boolean;
        permissionsPlaceholder: string;
        onSubmit: (values: AdminEditUserFormValues) => void | Promise<void>;
        onSecondary: () => void;
    };

const ROLE_OPTIONS: AdminRole[] = ["moderator", "admin", "super_admin"];
const STATUS_OPTIONS: AdminStatus[] = ["live", "inactive", "suspended", "banned"];

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

export function AdminUserFormCard(props: AdminUserFormCardProps) {
    const {
        title,
        submitLabel,
        secondaryLabel,
        submitIcon: SubmitIcon,
        secondaryIcon: SecondaryIcon,
        isSubmitting,
        permissionsPlaceholder,
        onSecondary,
        mode,
        values
    } = props;

    const { firstName, lastName, email, role, permissionsText } = values;
    const password = "password" in values ? values.password : undefined;
    const status = "status" in values ? values.status : undefined;

    const normalizedValues = useMemo(() => {
        return mode === "create"
            ? {
                firstName,
                lastName,
                email,
                password,
                role,
                permissionsText,
            }
            : {
                firstName,
                lastName,
                email,
                role,
                status,
                permissionsText,
            };
    }, [mode, firstName, lastName, email, password, role, status, permissionsText]);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<AdminCreateUserFormValues | AdminEditUserFormValues>({
        resolver: zodResolver(
            props.mode === "create" ? adminCreateUserFormSchema : adminEditUserFormSchema,
        ),
        defaultValues: normalizedValues,
    });

    useEffect(() => {
        reset(normalizedValues);
    }, [normalizedValues, reset]);

    const inputClassName = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";

    const handleSecondary = () => {
        reset(normalizedValues);
        onSecondary();
    };

    const onValidSubmit = handleSubmit((values) => {
        if (props.mode === "create") {
            return props.onSubmit(values as AdminCreateUserFormValues);
        }

        return props.onSubmit(values as AdminEditUserFormValues);
    });

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            {title ? <h2 className="mb-3 text-base font-semibold text-slate-900">{title}</h2> : null}

            <form onSubmit={(event) => void onValidSubmit(event)} noValidate>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                    <div>
                        <input
                            {...register("firstName")}
                            className={inputClassName}
                            placeholder="First name"
                        />
                        <FieldError message={errors.firstName?.message} />
                    </div>

                    <div>
                        <input
                            {...register("lastName")}
                            className={inputClassName}
                            placeholder="Last name"
                        />
                        <FieldError message={errors.lastName?.message} />
                    </div>

                    <div>
                        <input
                            {...register("email")}
                            className={inputClassName}
                            placeholder="Email"
                            type="email"
                            autoCapitalize="none"
                            autoCorrect="off"
                        />
                        <FieldError message={errors.email?.message} />
                    </div>

                    {props.mode === "create" ? (
                        <div>
                            <input
                                {...register("password")}
                                className={inputClassName}
                                placeholder="Password"
                                type="password"
                            />
                            <FieldError message={"password" in errors ? errors.password?.message : undefined} />
                        </div>
                    ) : null}

                    <div>
                        <select
                            {...register("role")}
                            className={inputClassName}
                        >
                            {ROLE_OPTIONS.map((role) => (
                                <option key={role} value={role}>
                                    {role}
                                </option>
                            ))}
                        </select>
                        <FieldError message={errors.role?.message} />
                    </div>

                    {props.mode === "edit" ? (
                        <div>
                            <select
                                {...register("status")}
                                className={inputClassName}
                            >
                                {STATUS_OPTIONS.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                            <FieldError message={"status" in errors ? errors.status?.message : undefined} />
                        </div>
                    ) : null}

                    <div className="md:col-span-5">
                        <input
                            {...register("permissionsText")}
                            className={inputClassName}
                            placeholder={permissionsPlaceholder}
                        />
                        <FieldError message={errors.permissionsText?.message} />
                    </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                    <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                        disabled={isSubmitting}
                    >
                        <SubmitIcon size={14} /> {submitLabel}
                    </button>
                    <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        onClick={handleSecondary}
                    >
                        <SecondaryIcon size={14} /> {secondaryLabel}
                    </button>
                </div>
            </form>
        </div>
    );
}
