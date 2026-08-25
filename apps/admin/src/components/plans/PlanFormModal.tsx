"use client";

import { useEffect } from "react";
import { useForm, Controller, useWatch, type SubmitErrorHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, CreditCard, AlertCircle } from "@esparex/ui";
import { createPlan, updatePlan } from "@/lib/api/plans";
import { AdminApiError } from "@/lib/api/adminClient";
import { showAdminPopup } from "@/lib/popup/popupEvents";
import type { Plan } from "@esparex/contracts";
import { planFormSchema, type PlanFormValues } from "./planForm.schema";
import {
  type PlanType,
  PLAN_ACTIVE_FIELD,
  FIELD_LABELS,
  DEFAULT_FORM,
  planToForm,
  formToPayload,
  FieldError,
} from "./PlanFormHelpers";
import { PlanTypeLimitsSection } from "./PlanTypeLimitsSection";

interface PlanFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editPlan?: Plan | null;
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
      if (firstField) setFocus(firstField);
    }
  };

  if (!open) return null;

  const inputCls = "w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-body text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
  const labelCls = "block text-caption font-semibold text-foreground-secondary mb-1";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CreditCard size={16} />
            </div>
            <div>
              <h2 className="text-body font-semibold text-foreground">
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
            className="rounded-lg p-1.5 text-foreground-subtle hover:bg-muted hover:text-foreground-secondary cursor-pointer"
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
            {/* Error Summary */}
            {hasSummaryErrors && (
              <div
                role="alert"
                aria-live="polite"
                className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-caption text-destructive shadow-xs animate-in fade-in slide-in-from-top-1"
              >
                <div className="flex items-center gap-2 font-semibold text-destructive">
                  <AlertCircle size={16} className="text-destructive shrink-0" />
                  <span>
                    {rootError ? `Cannot Complete Action — ${rootError}` : "Validation Error — Please correct the highlighted fields:"}
                  </span>
                </div>
                {hasValidationErrors && (
                  <ul className="mt-2 space-y-1 pl-6 list-disc font-medium text-destructive">
                    {validationErrorList.map(({ field, message }) => (
                      <li key={field}>
                        <span className="font-semibold">{field}:</span> {message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Plan Type */}
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

            {/* Basic Info */}
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

            {/* Pricing + Validity */}
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
                <select {...register("userType")} className={inputCls + " cursor-pointer"}>
                  <option value="both">Both</option>
                  <option value="normal">Normal</option>
                  <option value="business">Business</option>
                </select>
              </div>
            </div>

            {/* Limits & Credits conditional sub-form */}
            <PlanTypeLimitsSection
              formType={formType}
              register={register}
              errors={errors}
              setValue={setValue}
              notificationChannels={notificationChannels}
              inputCls={inputCls}
              labelCls={labelCls}
            />

            {/* Flags */}
            <div className="flex flex-wrap items-center gap-6">
              {formType === "FREE_DEFAULT" && (
                <label className="flex cursor-pointer items-center gap-2 text-body font-medium text-foreground-secondary">
                  <input
                    type="checkbox"
                    {...register("isDefault", {
                      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                        if (e.target.checked) setValue("price", 0, { shouldValidate: true });
                      }
                    })}
                    disabled={Boolean(editPlan?.isDefault)}
                    className="accent-primary disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  Free / Default Plan
                </label>
              )}
              <label className={`flex items-center gap-2 text-body font-medium ${editPlan?.isDefault && (editPlan?.status === 'ACTIVE' || editPlan?.active) ? 'text-foreground-tertiary cursor-not-allowed' : 'text-foreground-secondary cursor-pointer'}`}>
                <input
                  type="checkbox"
                  {...register(PLAN_ACTIVE_FIELD)}
                  disabled={Boolean(editPlan?.isDefault && (editPlan?.status === 'ACTIVE' || editPlan?.active))}
                  className="accent-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed"
                />
                Active (visible to users)
              </label>
            </div>

            {/* Default Plan Status Note */}
            {formType === "FREE_DEFAULT" && editPlan?.isDefault && (
              <p className="text-caption text-primary bg-primary/5 border border-primary/20 p-2.5 rounded-lg">
                ℹ️ This is the active platform Default Free Plan. To change the default plan, designate a different Free Plan as default.
              </p>
            )}
            {formType === "FREE_DEFAULT" && isDefault && !editPlan?.isDefault && (
              <p className="text-caption text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
                ⚠️ Designating this plan as Default will automatically demote the current Default Free Plan.
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border bg-card px-4 py-2 text-body font-medium text-foreground-secondary hover:bg-muted cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-body font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
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
