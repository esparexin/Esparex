"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, CreditCard, Zap, BellRing, Package } from "lucide-react";
import { adminFetch } from "@/lib/api/adminClient";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import type { Plan } from "@shared/types/Plan";
import { planFormSchema, type PlanFormValues } from "./planForm.schema";

type PlanType = "AD_PACK" | "SPOTLIGHT" | "SMART_ALERT";
type MatchFrequency = "realtime" | "hourly" | "daily";

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
    AD_PACK: {
        label: "Ad Pack (Boost)",
        icon: <Package size={16} />,
        color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    SPOTLIGHT: {
        label: "Spotlight",
        icon: <Zap size={16} />,
        color: "bg-amber-50 text-amber-700 border-amber-200",
    },
    SMART_ALERT: {
        label: "Smart Alert",
        icon: <BellRing size={16} />,
        color: "bg-purple-50 text-purple-700 border-purple-200",
    },
};

function planToForm(plan: Plan): PlanFormValues {
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
        active: plan.active,
        maxAds: plan.limits?.maxAds ?? 0,
        maxServices: plan.limits?.maxServices ?? 0,
        maxParts: plan.limits?.maxParts ?? 0,
        spotlightCredits: plan.limits?.spotlightCredits ?? 0,
        smartAlerts: plan.limits?.smartAlerts ?? 0,
        matchFrequency: plan.smartAlertConfig?.matchFrequency ?? "daily",
        radiusLimitKm: plan.smartAlertConfig?.radiusLimitKm ?? 50,
        notificationChannels: plan.smartAlertConfig?.notificationChannels ?? ["push"],
        priorityWeight: plan.features?.priorityWeight ?? 1,
        businessBadge: plan.features?.businessBadge ?? false,
        canEditAd: plan.features?.canEditAd ?? true,
        showOnHomePage: plan.features?.showOnHomePage ?? false,
    };
}

function formToPayload(f: PlanFormValues) {
    const payload: Record<string, unknown> = {
        code: f.code.trim().toUpperCase(),
        name: f.name.trim(),
        description: f.description?.trim() || undefined,
        type: f.type,
        userType: f.userType,
        price: Number(f.price),
        currency: f.currency,
        durationDays: f.isDefault ? 0 : Number(f.durationDays),
        isDefault: f.isDefault,
        active: f.active,
        limits: {
            maxAds: Number(f.maxAds),
            maxServices: Number(f.maxServices),
            maxParts: Number(f.maxParts),
            spotlightCredits: Number(f.spotlightCredits),
            smartAlerts: Number(f.smartAlerts),
        },
        features: {
            priorityWeight: Number(f.priorityWeight),
            businessBadge: f.businessBadge,
            canEditAd: f.canEditAd,
            showOnHomePage: f.showOnHomePage,
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

// Inline field error helper — matches admin-frontend style
function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

export function PlanFormModal({ open, onClose, onSaved, editPlan }: PlanFormModalProps) {
    const isEdit = Boolean(editPlan);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        control,
        formState: { errors, isSubmitting },
    } = useForm<PlanFormValues>({
        resolver: zodResolver(planFormSchema),
        defaultValues: DEFAULT_FORM,
    });

    const formType = watch("type");
    const isDefault = watch("isDefault");
    const notificationChannels = watch("notificationChannels");

    useEffect(() => {
        if (open) {
            reset(editPlan ? planToForm(editPlan) : DEFAULT_FORM);
        }
    }, [open, editPlan, reset]);

    const onValidSubmit = async (data: PlanFormValues) => {
        const payload = formToPayload(data);
        if (isEdit && editPlan) {
            await adminFetch(ADMIN_ROUTES.PLAN_BY_ID(editPlan.id), { method: "PUT", body: payload });
        } else {
            await adminFetch(ADMIN_ROUTES.PLANS, { method: "POST", body: payload });
        }
        onSaved();
        onClose();
    };

    if (!open) return null;

    const inputCls = "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100";
    const labelCls = "block text-xs font-semibold text-slate-600 mb-1";

    // API errors from adminFetch surface via the popup system (emitAdminErrorPopup)
    // and are not re-shown here. Only field-level Zod errors appear inline.
    const apiError = errors.root?.message;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                            <CreditCard size={18} />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">
                                {isEdit ? "Edit Plan" : "Create New Plan"}
                            </h2>
                            <p className="text-xs text-slate-500">
                                {isEdit ? `Editing: ${editPlan?.name}` : "Configure plan type, pricing, and limits"}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <form
                    onSubmit={(e) => { void handleSubmit(onValidSubmit)(e); }}
                    className="flex-1 overflow-y-auto"
                >
                    <div className="space-y-5 px-6 py-5">

                        {/* Plan Type selector */}
                        <div>
                            <label className={labelCls}>Plan Type</label>
                            <Controller
                                name="type"
                                control={control}
                                render={({ field }) => (
                                    <div className="grid grid-cols-3 gap-2">
                                        {(Object.keys(TYPE_META) as PlanType[]).map((t) => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => field.onChange(t)}
                                                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all ${field.value === t
                                                        ? TYPE_META[t].color + " ring-2 ring-offset-1 ring-sky-400"
                                                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                                                    }`}
                                            >
                                                {TYPE_META[t].icon}
                                                {TYPE_META[t].label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            />
                        </div>

                        {/* Basic info row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Plan Code *</label>
                                <input
                                    {...register("code")}
                                    className={inputCls}
                                    placeholder="e.g. SPOTLIGHT_3"
                                    onChange={(e) => setValue("code", e.target.value.toUpperCase(), { shouldValidate: true })}
                                    disabled={isEdit}
                                />
                                {isEdit && <p className="mt-1 text-[10px] text-slate-400">Code cannot be changed after creation.</p>}
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
                                    className={inputCls}
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
                            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Limits & Credits</p>
                            {formType === "AD_PACK" && (
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className={labelCls}>Max Ads</label>
                                        <input type="number" min={0} {...register("maxAds", { valueAsNumber: true })} className={inputCls} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Max Services</label>
                                        <input type="number" min={0} {...register("maxServices", { valueAsNumber: true })} className={inputCls} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Max Spare Parts</label>
                                        <input type="number" min={0} {...register("maxParts", { valueAsNumber: true })} className={inputCls} />
                                    </div>
                                </div>
                            )}
                            {formType === "SPOTLIGHT" && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelCls}>Spotlight Credits</label>
                                        <input type="number" min={1} {...register("spotlightCredits", { valueAsNumber: true })} className={inputCls} />
                                        <p className="mt-1 text-[10px] text-slate-400">1 credit = 1 ad featured for the duration</p>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Priority Weight</label>
                                        <input type="number" min={1} max={10} {...register("priorityWeight", { valueAsNumber: true })} className={inputCls} />
                                        <FieldError message={errors.priorityWeight?.message} />
                                    </div>
                                </div>
                            )}
                            {formType === "SMART_ALERT" && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelCls}>Alert Slots</label>
                                        <input type="number" min={1} {...register("smartAlerts", { valueAsNumber: true })} className={inputCls} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Match Frequency</label>
                                        <select {...register("matchFrequency")} className={inputCls}>
                                            <option value="realtime">Realtime</option>
                                            <option value="hourly">Hourly</option>
                                            <option value="daily">Daily</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Radius Limit (km)</label>
                                        <input type="number" min={1} {...register("radiusLimitKm", { valueAsNumber: true })} className={inputCls} />
                                        <FieldError message={errors.radiusLimitKm?.message} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Notification Channels</label>
                                        <div className="flex gap-3 pt-1">
                                            {["push", "email", "sms"].map((ch) => (
                                                <label key={ch} className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
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
                                                    {ch.charAt(0).toUpperCase() + ch.slice(1)}
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
                            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                                <input
                                    type="checkbox"
                                    {...register("isDefault")}
                                    className="accent-sky-600"
                                    onChange={(e) => {
                                        setValue("isDefault", e.target.checked, { shouldValidate: true });
                                        if (e.target.checked) setValue("price", 0, { shouldValidate: true });
                                    }}
                                />
                                Free / Default Plan
                            </label>
                            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                                <input type="checkbox" {...register("active")} className="accent-emerald-600" />
                                Active (visible to users)
                            </label>
                            {formType === "SPOTLIGHT" && (
                                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                                    <input type="checkbox" {...register("showOnHomePage")} className="accent-amber-500" />
                                    Feature on Home Page
                                </label>
                            )}
                            {formType === "AD_PACK" && (
                                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                                    <input type="checkbox" {...register("businessBadge")} className="accent-blue-600" />
                                    Business Badge
                                </label>
                            )}
                        </div>

                        {apiError && (
                            <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                                {apiError}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
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
