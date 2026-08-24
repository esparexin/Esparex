"use client";

import type { UseFormRegister, FieldErrors, UseFormSetValue } from "react-hook-form";
import type { PlanFormValues } from "./planForm.schema";
import { FieldError } from "./PlanFormHelpers";

interface PlanTypeLimitsSectionProps {
  formType: PlanFormValues["type"];
  register: UseFormRegister<PlanFormValues>;
  errors: FieldErrors<PlanFormValues>;
  setValue: UseFormSetValue<PlanFormValues>;
  notificationChannels: string[];
  inputCls: string;
  labelCls: string;
}

export function PlanTypeLimitsSection({
  formType,
  register,
  errors,
  setValue,
  notificationChannels,
  inputCls,
  labelCls,
}: PlanTypeLimitsSectionProps) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4">
      <p className="mb-3 text-caption font-semibold uppercase tracking-widest text-foreground-subtle">
        Limits & Credits
      </p>
      {formType === "FREE_DEFAULT" && (
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className={labelCls}>Monthly Free Ad Slots (maxAds)</label>
            <input
              type="number"
              min={1}
              {...register("maxAds", { valueAsNumber: true })}
              className={inputCls}
              aria-invalid={Boolean(errors.maxAds)}
            />
            <FieldError message={errors.maxAds?.message} />
            <p className="mt-1 text-tiny text-foreground-subtle">
              Number of free ad slots reset automatically every month for registered users.
            </p>
          </div>
        </div>
      )}
      {formType === "AD_PACK" && (
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className={labelCls}>Ad Posting Credits (Slots)</label>
            <input
              type="number"
              min={1}
              {...register("maxAds", { valueAsNumber: true })}
              className={inputCls}
              aria-invalid={Boolean(errors.maxAds)}
            />
            <FieldError message={errors.maxAds?.message} />
            <p className="mt-1 text-tiny text-foreground-subtle">
              Number of ad posting slots granted to the user upon purchasing this pack.
            </p>
          </div>
        </div>
      )}
      {formType === "BOOST_AD" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Search Priority Weight (1..10)</label>
            <input
              type="number"
              min={1}
              max={10}
              {...register("priorityWeight", { valueAsNumber: true })}
              className={inputCls}
              aria-invalid={Boolean(errors.priorityWeight)}
            />
            <FieldError message={errors.priorityWeight?.message} />
            <p className="mt-1 text-tiny text-foreground-subtle">
              Boost multiplier used by SearchRankingService.
            </p>
          </div>
        </div>
      )}
      {formType === "SPOTLIGHT" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Spotlight Credits</label>
            <input
              type="number"
              min={1}
              {...register("spotlightCredits", { valueAsNumber: true })}
              className={inputCls}
              aria-invalid={Boolean(errors.spotlightCredits)}
            />
            <FieldError message={errors.spotlightCredits?.message} />
            <p className="mt-1 text-tiny text-foreground-subtle">
              1 credit = 1 ad featured for the duration
            </p>
          </div>
          <div>
            <label className={labelCls}>Priority Weight</label>
            <input
              type="number"
              min={1}
              max={10}
              {...register("priorityWeight", { valueAsNumber: true })}
              className={inputCls}
              aria-invalid={Boolean(errors.priorityWeight)}
            />
            <FieldError message={errors.priorityWeight?.message} />
          </div>
        </div>
      )}
      {formType === "SMART_ALERT" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Alert Slots</label>
            <input
              type="number"
              min={1}
              {...register("smartAlerts", { valueAsNumber: true })}
              className={inputCls}
              aria-invalid={Boolean(errors.smartAlerts)}
            />
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
            <input
              type="number"
              min={1}
              {...register("radiusLimitKm", { valueAsNumber: true })}
              className={inputCls}
              aria-invalid={Boolean(errors.radiusLimitKm)}
            />
            <FieldError message={errors.radiusLimitKm?.message} />
          </div>
          <div>
            <label className={labelCls}>Notification Channels</label>
            <div className="flex gap-3 pt-1">
              {["push", "email", "sms"].map((ch) => (
                <label
                  key={ch}
                  className="flex items-center gap-1.5 text-caption font-medium text-foreground-secondary cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={notificationChannels.includes(ch)}
                    onChange={(e) => {
                      const updated = e.target.checked
                        ? [...notificationChannels, ch]
                        : notificationChannels.filter((c) => c !== ch);
                      setValue("notificationChannels", updated, { shouldValidate: true });
                    }}
                    className="accent-primary"
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
  );
}
