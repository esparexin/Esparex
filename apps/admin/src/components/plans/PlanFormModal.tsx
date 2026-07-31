"use client";

import { useEffect } from "react";
import { useForm, Controller, useWatch, type SubmitErrorHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, CreditCard, Zap, BellRing, Package, AlertCircle } from "@esparex/ui";
import { createPlan, updatePlan } from "@/lib/api/plans";
import { AdminApiError } from "@/lib/api/adminClient";
import { showAdminPopup } from "@/lib/popup/popupEvents";
import { API_KEY_STATUS } from "@esparex/contracts";
import { Plan } from "@esparex/contracts";
import { planFormSchema, type PlanFormValues } from "./planForm.schema";

type PlanType = "FREE_DEFAULT" | "AD_PACK" | "BOOST_AD" | "SPOTLIGHT" | "SMART_ALERT";

const FIELD_LABELS: Record<string, string> = {
    code: "Plan Code",
    name: "Plan Name",
    description: "Description",
    type: "Plan Type",
    userType: "Target Audience",
    price: "Price",
    currency: "Currency",
    durationDays: "Validity (Days)",
    maxAds: "Ad Slots / Credits",
    maxServices: "Max Services",
    maxParts: "Max Parts",
    spotlightCredits: "Spotlight Credits",
    smartAlerts: "Alert Slots",
    matchFrequency: "Match Frequency",
    radiusLimitKm: "Radius Limit",
    notificationChannels: "Notification Channels",
    priorityWeight: "Priority Weight",
};

const DEFAULT_FORM: PlanFormValues = {
    code: "",
    name: "",
    description: "",
    type: "AD_PACK",
    userType: "both",
    price: 0,
    currency: "INR",
    durationDays: 30,
    isDefault: false,
    active: true,
    maxAds: 0,
    maxServices: 0,
    maxParts: 0,
    spotlightCredits: 0,
    smartAlerts: 0,
    matchFrequency: "daily",
    radiusLimitKm: 50,
    notificationChannels: ["push"],
    priorityWeight: 1,
    businessBadge: false,
    canEditAd: true,
    showOnHomePage: false,
};

interface PlanFormModalProps {
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
    editPlan?: Plan | null;
}

const TYPE_META: Record<PlanType, { label: string; icon: React.ReactNode; color: string }> = {
    FREE_DEFAULT: {
        label: "Free Plan (Default)",
        icon: <Package size={16} />,
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    AD_PACK: {
        label: "Ad Pack",
        icon: <Package size={16} />,
        color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    BOOST_AD: {
        label: "Boost Ad",
        icon: <Zap size={16} />,
        color: "bg-amber-50 text-amber-700 border-amber-200",
    },
    SPOTLIGHT: {
        label: "Spotlight",
        icon: <Zap size={16} />,
        color: "bg-purple-50 text-purple-700 border-purple-200",
    },
    SMART_ALERT: {
        label: "Smart Alert",
        icon: <BellRing size={16} />,
        color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
};

function planToForm(plan: Plan): PlanFormValues {
    const legacyCredits = typeof plan.credits === "number" ? plan.credits : 0;
    return {
        code: plan.code,
        name: plan.name,
        description: plan.description ?? "",
        type: plan.type,
        userType: plan.userType,
        price: plan.price,
        currency: plan.currency,
        durationDays: plan.durationDays ?? 30,
        isDefault: plan.isDefault ?? false,
        active: plan.status ? plan.status === "ACTIVE" : Boolean(plan.active),
        maxAds: plan.limits?.maxAds ?? legacyCredits ?? 0,
        maxServices: plan.limits?.maxServices ?? 0,
        maxParts: plan.limits?.maxParts ?? 0,
        spotlightCredits: plan.limits?.spotlightCredits ?? legacyCredits ?? 0,
        smartAlerts: plan.limits?.smartAlerts ?? plan.smartAlertConfig?.maxAlerts ?? legacyCredits ?? 0,
        matchFrequency: (plan.smartAlertConfig?.matchFrequency === "instant" ? "realtime" : plan.smartAlertConfig?.matchFrequency) ?? "daily",
        radiusLimitKm: plan.smartAlertConfig?.radiusLimitKm ?? 50,
        notificationChannels: plan.smartAlertConfig?.notificationChannels ?? ["push"],
        priorityWeight: plan.features?.priorityWeight ?? 1,
        businessBadge: plan.features?.businessBadge ?? false,
        canEditAd: plan.features?.canEditAd ?? true,
        showOnHomePage: plan.features?.showOnHomePage ?? false,
    };
}

function formToPayload(f: PlanFormValues) {
    const isFreePlan = f.type === "FREE_DEFAULT";
    const primaryCredits = (f.type === "FREE_DEFAULT" || f.type === "AD_PACK")
        ? (Number(f.maxAds) || 0)
        : f.type === "SPOTLIGHT"
            ? (Number(f.spotlightCredits) || 0)
            : f.type === "SMART_ALERT"
                ? (Number(f.smartAlerts) || 0)
                : 0;

    const payload: Record<string, unknown> = {
        code: f.code.trim().toUpperCase(),
        name: f.name.trim(),
        description: f.description?.trim() || undefined,
        type: f.type,
        userType: f.userType,
        price: isFreePlan ? 0 : Number(f.price),
        currency: f.currency,
        durationDays: isFreePlan ? 0 : Number(f.durationDays),
        isDefault: isFreePlan ? f.isDefault : false,
        active: f.active,
        status: f.active ? "ACTIVE" : "INACTIVE",
        credits: primaryCredits,
        limits: {

        },
        features: {
            priorityWeight: (f.type === "BOOST_AD" || f.type === "SPOTLIGHT") ? (Number(f.priorityWeight) || 1) : 1,
            canEditAd: true,
        },
    };

    if (f.type === "SMART_ALERT") {
        payload.smartAlertConfig = {
            maxAlerts: Number(f.smartAlerts),
            matchFrequency: f.matchFrequency,
            radiusLimitKm: Number(f.radiusLimitKm),
            notificationChannels: f.notificationChannels,
        };
    }

    return payload;
}

function FieldError({ id, message }: { id?: string; message?: string }) {
    if (!message) return null;
    return (
        <p id={id} className="mt-1 text-xs font-medium text-red-600 flex items-center gap-1">
            <span aria-hidden="true">•</span> {message}
        </p>
    );
}

export function PlanFormModal({ open, onClose, onSaved, editPlan }: PlanFormModalProps) {
    const isEdit = Boolean(editPlan);

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        control,
        setFocus,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<PlanFormValues>({
        resolver: zodResolver(planFormSchema),
        defaultValues: DEFAULT_FORM,
    });

    const formType = useWatch({ control, name: "type" }) as PlanFormValues["type"];
    const isDefault = useWatch({ control, name: "isDefault" }) as PlanFormValues["isDefault"];
    const notificationChannels = (useWatch({ control, name: "notificationChannels" }) as PlanFormValues["notificationChannels"] | undefined) || [];

    useEffect(() => {
        if (open) {
            reset(editPlan ? planToForm(editPlan) : DEFAULT_FORM);
        }
    }, [open, editPlan, reset]);

    const onValidSubmit = async (data: PlanFormValues) => {
        try {
            const payload = formToPayload(data);
            if (isEdit && editPlan) {
                await updatePlan(editPlan.id, payload);
            } else {
                await createPlan(payload);
            }
            onSaved();
            onClose();
        } catch (err) {
            if (err instanceof AdminApiError) {
                setError("root", {
                    type: "manual",
                    message: err.message || "Unable to save plan due to a business rule violation.",
                });
                return;
            }
            const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
            showAdminPopup({
                type: "error",
                title: "System Error",
                message: msg,
            });
        }
    };

    const onInvalidSubmit: SubmitErrorHandler<PlanFormValues> = (fieldErrors) => {
        const errorKeys = Object.keys(fieldErrors) as (keyof PlanFormValues)[];
        if (errorKeys.length > 0) {
            const firstField = errorKeys[0];
            setFocus(firstField as any);
        }
    };

    if (!open) return null;

    const inputCls = "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-foreground focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
    const labelCls = "block text-xs font-semibold text-foreground-secondary mb-1";

    const validationErrorList = Object.entries(errors)
        .filter(([key, err]) => key !== "root" && err?.message)
        .map(([field, err]) => ({
            field: FIELD_LABELS[field] || field,
            message: err?.message || "Invalid value",
        }));

    const rootError = errors.root?.message;
    const hasValidationErrors = validationErrorList.length > 0;
    const hasSummaryErrors = hasValidationErrors || Boolean(rootError);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                            <CreditCard size={16} />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-foreground">
                                {isEdit ? "Edit Plan" : "Create New Plan"}
                            </h2>
                            <p className="text-tiny text-foreground-tertiary">
                                {isEdit ? `Editing: ${editPlan?.name}` : "Configure plan type, pricing, and limits"}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-foreground-subtle hover:bg-slate-100 hover:text-foreground-secondary"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <form
                    onSubmit={(e) => { void handleSubmit(onValidSubmit, onInvalidSubmit)(e); }}
                    className="flex-1 overflow-y-auto"
                >
                    <div className="space-y-4 px-5 py-4">
                        
                        {/* Application-Level Top Error Summary Panel (Business Errors + Validation) */}
                        {hasSummaryErrors && (
                            <div
                                role="alert"
                                aria-live="polite"
                                className="rounded-xl border border-red-200 bg-red-50/90 p-4 text-xs text-red-900 shadow-sm animate-in fade-in slide-in-from-top-1"
                            >
                                <div className="flex items-center gap-2 font-semibold text-red-800">
                                    <AlertCircle size={16} className="text-red-600 shrink-0" />
                                    <span>
                                        {rootError ? `Cannot Complete Action — ${rootError}` : "Validation Error — Please correct the highlighted fields:"}
                                    </span>
                                </div>
                                {hasValidationErrors && (
                                    <ul className="mt-2 space-y-1 pl-6 list-disc font-medium text-red-700">
                                        {validationErrorList.map(({ field, message }) => (
                                            <li key={field}>
                                                <span className="font-semibold">{field}:</span> {message}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        {/* Plan Type selector */}
                        <div>
                            <label className={labelCls}>Plan Type</label>
                            <Controller
                                name="type"
                                control={control}
                                render={({ field }) => (
                                    <select
                                        {...field}
                                        disabled={isEdit}
                                        className={inputCls + " font-medium" + (isEdit ? " cursor-not-allowed opacity-60" : " cursor-pointer")}
                                        onChange={(e) => {
                                            const newType = e.target.value as PlanType;
                                            field.onChange(newType);
                                            if (newType === "FREE_DEFAULT") {
                                                setValue("isDefault", true);
                                                setValue("price", 0);
                                                setValue("durationDays", 30);
                                            } else if (isDefault) {
                                                setValue("isDefault", false);
                                            }
                                        }}
                                    >
                                        <option value="FREE_DEFAULT">🆓 Free Plan (Default)</option>
                                        <option value="AD_PACK">📦 Ad Pack</option>
                                        <option value="BOOST_AD">⚡ Boost Ad</option>
                                        <option value="SPOTLIGHT">✨ Spotlight</option>
                                        <option value="SMART_ALERT">🔔 Smart Alert</option>
                                    </select>
                                )}
                            />
                            {isEdit && <p className="mt-1 text-tiny text-foreground-subtle">Plan Type cannot be changed after creation.</p>}
                        </div>

                        {/* Basic info row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Plan Code *</label>
                                <input
                                    {...register("code", {
                                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                                            setValue("code", e.target.value.toUpperCase(), { shouldValidate: true });
                                        }
                                    })}
                                    className={inputCls}
                                    placeholder="e.g. SPOTLIGHT_3"
                                    disabled={isEdit}
                                />
                                {isEdit && <p className="mt-1 text-tiny text-foreground-subtle">Code cannot be changed after creation.</p>}
                                <FieldError message={errors.code?.message} />
                            </div>
                            <div>
                                <label className={labelCls}>Plan Name *</label>
                                <input
                                    {...register("name")}
                                    className={inputCls}
                                    placeholder="e.g. Spotlight 3 Credits"
                                />
                                <FieldError message={errors.name?.message} />
                            </div>
                        </div>

                        <div>
                            <label className={labelCls}>Description</label>
                            <textarea
                                {...register("description")}
                                className={inputCls + " resize-none"}
                                rows={2}
                                placeholder="Short description shown to users"
                            />
                            <FieldError message={errors.description?.message} />
                        </div>

                        {/* Pricing + validity */}
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className={labelCls}>Price (₹)</label>
                                <input
                                    type="number"
                                    min={0}
                                    {...register("price", { valueAsNumber: true })}
                                    className={inputCls + (formType === "FREE_DEFAULT" ? " cursor-not-allowed opacity-60" : "")}
                                    disabled={formType === "FREE_DEFAULT"}
                                />
                                <FieldError message={errors.price?.message} />
                            </div>
                            <div>
                                <label className={labelCls}>Validity (Days)</label>
                                <input
                                    type="number"
                                    min={1}
                                    {...register("durationDays", { valueAsNumber: true })}
                                    className={inputCls}
                                    disabled={isDefault}
                                />
                                <FieldError message={errors.durationDays?.message} />
                            </div>
                            <div>
                                <label className={labelCls}>For Users</label>
                                <select {...register("userType")} className={inputCls}>
                                    <option value="both">Both</option>
                                    <option value="normal">Normal</option>
                                    <option value="business">Business</option>
                                </select>
                            </div>
                        </div>

                        {/* Limits — conditional by type */}
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-foreground-tertiary">Limits & Credits</p>
                
                                    </div>
                                </div>
                            )}
                            {formType === "SPOTLIGHT" && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelCls}>Spotlight Credits</label>
                                        <input type="number" min={1} {...register("spotlightCredits", { valueAsNumber: true })} className={inputCls} aria-invalid={Boolean(errors.spotlightCredits)} />
                                        <FieldError message={errors.spotlightCredits?.message} />
                                        <p className="mt-1 text-tiny text-foreground-subtle">1 credit = 1 ad featured for the duration</p>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Priority Weight</label>
                                        <input type="number" min={1} max={10} {...register("priorityWeight", { valueAsNumber: true })} className={inputCls} aria-invalid={Boolean(errors.priorityWeight)} />
                                        <FieldError message={errors.priorityWeight?.message} />
                                    </div>
                                </div>
                            )}
                            {formType === "SMART_ALERT" && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelCls}>Alert Slots</label>
                                        <input type="number" min={1} {...register("smartAlerts", { valueAsNumber: true })} className={inputCls} aria-invalid={Boolean(errors.smartAlerts)} />
                                        <FieldError message={errors.smartAlerts?.message} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Match Frequency</label>
                                        <select {...register("matchFrequency")} className={inputCls}>
                                            <option value="realtime">Realtime (Instant)</option>
                                            <option value="hourly">Hourly</option>
                                            <option value="daily">Daily</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Radius Limit (km)</label>
                                        <input type="number" min={1} {...register("radiusLimitKm", { valueAsNumber: true })} className={inputCls} aria-invalid={Boolean(errors.radiusLimitKm)} />
                                        <FieldError message={errors.radiusLimitKm?.message} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Notification Channels</label>
                                        <div className="flex gap-3 pt-1">
                                            {["push", "email", "sms"].map((ch) => (
                                                <label key={ch} className="flex items-center gap-1.5 text-xs font-medium text-foreground-secondary cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={notificationChannels.includes(ch)}
                                                        onChange={(e) => {
                                                            const updated = e.target.checked
                                                                ? [...notificationChannels, ch]
                                                                : notificationChannels.filter((c) => c !== ch);
                                                            setValue("notificationChannels", updated, { shouldValidate: true });
                                                        }}
                                                        className="accent-sky-600"
                                                    />
                                                    {ch === "sms" ? "SMS" : ch.charAt(0).toUpperCase() + ch.slice(1)}
                                                </label>
                                            ))}
                                        </div>
                                        <FieldError message={errors.notificationChannels?.message} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Flags */}
                        <div className="flex flex-wrap items-center gap-5">
                            {formType === "FREE_DEFAULT" && (
                                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground-secondary">
                                    <input
                                        type="checkbox"
                                        {...register("isDefault", {
                                            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                                                if (e.target.checked) setValue("price", 0, { shouldValidate: true });
                                            }
                                        })}
                                        disabled={Boolean(editPlan?.isDefault)}
                                        className="accent-sky-600 disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                    Free / Default Plan
                                </label>
                            )}
                            <label className={`flex items-center gap-2 text-sm font-medium ${editPlan?.isDefault && (editPlan?.status === 'ACTIVE' || editPlan?.active) ? 'text-foreground-tertiary cursor-not-allowed' : 'text-foreground-secondary cursor-pointer'}`}>
                                <input
                                    type="checkbox"
                                    {...register("active")}
                                    disabled={Boolean(editPlan?.isDefault && (editPlan?.status === 'ACTIVE' || editPlan?.active))}
                                    className="accent-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed"
                                />
                                Active (visible to users)
                            </label>
                        </div>

                        {/* Default Plan Status Note */}
                        {formType === "FREE_DEFAULT" && editPlan?.isDefault && (
                            <p className="text-xs text-sky-700 bg-sky-50 border border-sky-100 p-2.5 rounded-lg">
                                ℹ️ This is the active platform Default Free Plan. To change the default plan, designate a different Free Plan as default.
                            </p>
                        )}
                        {formType === "FREE_DEFAULT" && isDefault && !editPlan?.isDefault && (
                            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 p-2.5 rounded-lg">
                                ⚠️ Designating this plan as Default will automatically demote the current Default Free Plan.
                            </p>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-foreground-secondary hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                        >
                            <CreditCard size={15} />
                            {isSubmitting ? "Saving…" : isEdit ? "Update Plan" : "Create Plan"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
