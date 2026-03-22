"use client";

import { useState, useEffect } from "react";
import { X, CreditCard, Zap, BellRing, Package } from "lucide-react";
import { adminFetch } from "@/lib/api/adminClient";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import type { Plan } from "@/types/plan";

type PlanType = "AD_PACK" | "SPOTLIGHT" | "SMART_ALERT";
type UserType = "normal" | "business" | "both";
type MatchFrequency = "instant" | "hourly" | "daily";

interface PlanFormState {
    code: string;
    name: string;
    description: string;
    type: PlanType;
    userType: UserType;
    price: number;
    currency: string;
    durationDays: number;
    isDefault: boolean;
    active: boolean;
    // limits
    maxAds: number;
    maxServices: number;
    maxParts: number;
    spotlightCredits: number;
    smartAlertSlots: number;
    // smartAlertConfig
    matchFrequency: MatchFrequency;
    radiusLimitKm: number;
    notificationChannels: string[];
    // features
    priorityWeight: number;
    businessBadge: boolean;
    canEditAd: boolean;
    showOnHomePage: boolean;
}

const DEFAULT_FORM: PlanFormState = {
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
    smartAlertSlots: 0,
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

function planToForm(plan: Plan): PlanFormState {
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
        smartAlertSlots: plan.limits?.smartAlerts ?? 0,
        matchFrequency: "daily",
        radiusLimitKm: 50,
        notificationChannels: ["push"],
        priorityWeight: plan.features?.priorityWeight ?? 1,
        businessBadge: plan.features?.businessBadge ?? false,
        canEditAd: plan.features?.canEditAd ?? true,
        showOnHomePage: plan.features?.showOnHomePage ?? false,
    };
}

function formToPayload(f: PlanFormState) {
    const payload: Record<string, unknown> = {
        code: f.code.trim().toUpperCase(),
        name: f.name.trim(),
        description: f.description.trim() || undefined,
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
            smartAlerts: Number(f.smartAlertSlots),
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
            maxAlerts: Number(f.smartAlertSlots),
            matchFrequency: f.matchFrequency,
            radiusLimitKm: Number(f.radiusLimitKm),
            notificationChannels: f.notificationChannels,
        };
    }

    return payload;
}

export function PlanFormModal({ open, onClose, onSaved, editPlan }: PlanFormModalProps) {
    const [form, setForm] = useState<PlanFormState>(DEFAULT_FORM);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const isEdit = Boolean(editPlan);

    useEffect(() => {
        if (open) {
            setForm(editPlan ? planToForm(editPlan) : DEFAULT_FORM);
            setError("");
        }
    }, [open, editPlan]);

    const set = <K extends keyof PlanFormState>(key: K, value: PlanFormState[K]) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!form.code.trim()) { setError("Plan code is required."); return; }
        if (!form.name.trim()) { setError("Plan name is required."); return; }
        if (form.price < 0) { setError("Price cannot be negative."); return; }
        if (!form.isDefault && form.durationDays < 1) { setError("Validity (days) must be at least 1."); return; }

        setSaving(true);
        try {
            const payload = formToPayload(form);
            if (isEdit && editPlan) {
                await adminFetch(ADMIN_ROUTES.PLAN_BY_ID(editPlan.id), {
                    method: "PUT",
                    body: payload,
                });
            } else {
                await adminFetch(ADMIN_ROUTES.PLANS, {
                    method: "POST",
                    body: payload,
                });
            }
            onSaved();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save plan");
        } finally {
            setSaving(false);
        }
    };

    if (!open) return null;

    const inputCls = "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100";
    const labelCls = "block text-xs font-semibold text-slate-600 mb-1";

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
                <form onSubmit={(e) => { void handleSubmit(e); }} className="flex-1 overflow-y-auto">
                    <div className="space-y-5 px-6 py-5">

                        {/* Plan Type selector */}
                        <div>
                            <label className={labelCls}>Plan Type</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(Object.keys(TYPE_META) as PlanType[]).map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => set("type", t)}
                                        className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all ${
                                            form.type === t
                                                ? TYPE_META[t].color + " ring-2 ring-offset-1 ring-sky-400"
                                                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                                        }`}
                                    >
                                        {TYPE_META[t].icon}
                                        {TYPE_META[t].label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Basic info row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Plan Code *</label>
                                <input
                                    className={inputCls}
                                    placeholder="e.g. SPOTLIGHT_3"
                                    value={form.code}
                                    onChange={(e) => set("code", e.target.value.toUpperCase())}
                                    disabled={isEdit}
                                />
                                {isEdit && <p className="mt-1 text-[10px] text-slate-400">Code cannot be changed after creation.</p>}
                            </div>
                            <div>
                                <label className={labelCls}>Plan Name *</label>
                                <input className={inputCls} placeholder="e.g. Spotlight 3 Credits" value={form.name} onChange={(e) => set("name", e.target.value)} />
                            </div>
                        </div>

                        <div>
                            <label className={labelCls}>Description</label>
                            <textarea
                                className={inputCls + " resize-none"}
                                rows={2}
                                placeholder="Short description shown to users"
                                value={form.description}
                                onChange={(e) => set("description", e.target.value)}
                            />
                        </div>

                        {/* Pricing + validity */}
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className={labelCls}>Price (₹)</label>
                                <input type="number" min={0} className={inputCls} value={form.price} onChange={(e) => set("price", Number(e.target.value))} />
                            </div>
                            <div>
                                <label className={labelCls}>Validity (Days)</label>
                                <input
                                    type="number"
                                    min={1}
                                    className={inputCls}
                                    value={form.durationDays}
                                    onChange={(e) => set("durationDays", Number(e.target.value))}
                                    disabled={form.isDefault}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>For Users</label>
                                <select className={inputCls} value={form.userType} onChange={(e) => set("userType", e.target.value as UserType)}>
                                    <option value="both">Both</option>
                                    <option value="normal">Normal</option>
                                    <option value="business">Business</option>
                                </select>
                            </div>
                        </div>

                        {/* Limits — conditional by type */}
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Limits & Credits</p>
                            {form.type === "AD_PACK" && (
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className={labelCls}>Max Ads</label>
                                        <input type="number" min={0} className={inputCls} value={form.maxAds} onChange={(e) => set("maxAds", Number(e.target.value))} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Max Services</label>
                                        <input type="number" min={0} className={inputCls} value={form.maxServices} onChange={(e) => set("maxServices", Number(e.target.value))} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Max Spare Parts</label>
                                        <input type="number" min={0} className={inputCls} value={form.maxParts} onChange={(e) => set("maxParts", Number(e.target.value))} />
                                    </div>
                                </div>
                            )}
                            {form.type === "SPOTLIGHT" && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelCls}>Spotlight Credits</label>
                                        <input type="number" min={1} className={inputCls} value={form.spotlightCredits} onChange={(e) => set("spotlightCredits", Number(e.target.value))} />
                                        <p className="mt-1 text-[10px] text-slate-400">1 credit = 1 ad featured for the duration</p>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Priority Weight</label>
                                        <input type="number" min={1} max={10} className={inputCls} value={form.priorityWeight} onChange={(e) => set("priorityWeight", Number(e.target.value))} />
                                    </div>
                                </div>
                            )}
                            {form.type === "SMART_ALERT" && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelCls}>Alert Slots</label>
                                        <input type="number" min={1} className={inputCls} value={form.smartAlertSlots} onChange={(e) => set("smartAlertSlots", Number(e.target.value))} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Match Frequency</label>
                                        <select className={inputCls} value={form.matchFrequency} onChange={(e) => set("matchFrequency", e.target.value as MatchFrequency)}>
                                            <option value="instant">Instant</option>
                                            <option value="hourly">Hourly</option>
                                            <option value="daily">Daily</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Radius Limit (km)</label>
                                        <input type="number" min={1} className={inputCls} value={form.radiusLimitKm} onChange={(e) => set("radiusLimitKm", Number(e.target.value))} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Notification Channels</label>
                                        <div className="flex gap-3 pt-1">
                                            {["push", "email", "sms"].map((ch) => (
                                                <label key={ch} className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={form.notificationChannels.includes(ch)}
                                                        onChange={(e) => {
                                                            const updated = e.target.checked
                                                                ? [...form.notificationChannels, ch]
                                                                : form.notificationChannels.filter((c) => c !== ch);
                                                            set("notificationChannels", updated);
                                                        }}
                                                        className="accent-sky-600"
                                                    />
                                                    {ch.charAt(0).toUpperCase() + ch.slice(1)}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Flags */}
                        <div className="flex flex-wrap items-center gap-5">
                            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                                <input type="checkbox" className="accent-sky-600" checked={form.isDefault} onChange={(e) => { set("isDefault", e.target.checked); if (e.target.checked) { set("price", 0); } }} />
                                Free / Default Plan
                            </label>
                            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                                <input type="checkbox" className="accent-emerald-600" checked={form.active} onChange={(e) => set("active", e.target.checked)} />
                                Active (visible to users)
                            </label>
                            {form.type === "SPOTLIGHT" && (
                                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                                    <input type="checkbox" className="accent-amber-500" checked={form.showOnHomePage} onChange={(e) => set("showOnHomePage", e.target.checked)} />
                                    Feature on Home Page
                                </label>
                            )}
                            {form.type === "AD_PACK" && (
                                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                                    <input type="checkbox" className="accent-blue-600" checked={form.businessBadge} onChange={(e) => set("businessBadge", e.target.checked)} />
                                    Business Badge
                                </label>
                            )}
                        </div>

                        {error && (
                            <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                                {error}
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
                            disabled={saving}
                            className="flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                        >
                            <CreditCard size={15} />
                            {saving ? "Saving…" : isEdit ? "Update Plan" : "Create Plan"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
