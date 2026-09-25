"use client";

import type { UseFormReturn } from "react-hook-form";
import { ArrowLeft, Loader2 } from "@esparex/ui";
import { cn } from "@/lib/utils";
import { formatSeconds } from "@/lib/otpHelpers";
import {
  Button,
  FieldRoot,
  FieldControl,
  FieldLabel,
  FieldMessage,
  Input,
  FormError as UiFormError,
} from "@esparex/ui";
import type { LoginFormValues } from "@esparex/contracts";
import type { useOtpFlow } from "@/hooks/useOtpFlow";

interface LoginMobileStepProps {
  form: UseFormReturn<LoginFormValues>;
  flow: ReturnType<typeof useOtpFlow>;
  isValidMobile: boolean;
  mobileValue: string;
  onBack?: () => void;
}

export function LoginMobileStep({
  form,
  flow,
  isValidMobile,
  mobileValue,
  onBack,
}: LoginMobileStepProps) {
  const {
    backendReady,
    isSendingOTP,
    authError,
    clearAuthErrorOfTypes,
    isSendRateLimited,
    rateLimitRemainingSeconds,
    getMobileLockInfo,
  } = flow;

  return (
    <div className="space-y-4 sm:space-y-5">
      <FieldRoot<LoginFormValues, "mobile">
        name="mobile"
        render={({ field }) => (
          <div className="space-y-2 text-left">
            <FieldLabel className="text-body sm:text-body-lg font-medium text-foreground">
              Mobile Number
            </FieldLabel>
            <FieldControl animateOnError>
              <div className="flex items-center gap-2">
                <div
                  aria-hidden="true"
                  className="flex items-center justify-center h-12 w-14 rounded-xl border border-border/80 bg-muted/40 text-foreground-secondary font-medium text-body-lg shrink-0 select-none shadow-xs"
                >
                  +91
                </div>
                <Input
                  placeholder="9876543210"
                  maxLength={10}
                  className={cn(
                    "h-12 px-4 text-body-lg sm:text-body tracking-wider font-normal text-foreground bg-background border-border/80 rounded-xl focus-visible:border-emerald-600 focus-visible:ring-4 focus-visible:ring-emerald-600/15 transition-all shadow-xs flex-1 min-w-0",
                    isValidMobile && "border-emerald-600 ring-4 ring-emerald-600/15"
                  )}
                  autoComplete="tel"
                  inputMode="numeric"
                  {...field}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    if (val.length <= 10) field.onChange(val);
                    form.clearErrors("mobile");
                    clearAuthErrorOfTypes(["generic"]);
                  }}
                />
              </div>
            </FieldControl>
            <FieldMessage className="text-caption mt-1" />
          </div>
        )}
      />

      {authError?.type === "generic" && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-3">
          <UiFormError message={authError.message} className="mt-0 text-caption text-destructive" />
        </div>
      )}

      {authError?.type === "blocked" && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-3 text-center">
          <p className="text-caption font-semibold text-destructive">{authError.message}</p>
        </div>
      )}

      {!backendReady && (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 dark:bg-amber-950/30 dark:border-amber-800/40 p-3 space-y-1">
          <p className="text-caption font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-2">
            <Loader2 className="animate-spin h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            Waking up server...
          </p>
          <p className="text-tiny text-amber-700 dark:text-amber-400">
            Our high-security backend is initializing. Please wait a few seconds.
          </p>
        </div>
      )}

      <div className="pt-1 transition-transform active:scale-[0.985]">
        <Button
          type="submit"
          disabled={
            isSendingOTP ||
            !isValidMobile ||
            isSendRateLimited ||
            Boolean(getMobileLockInfo(mobileValue)?.remainingSeconds) ||
            !backendReady
          }
          className="w-full h-12 rounded-xl font-semibold text-body-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all disabled:opacity-100 disabled:bg-muted disabled:text-muted-foreground/80 disabled:border disabled:border-border/60 disabled:shadow-none disabled:cursor-not-allowed cursor-pointer"
        >
          {isSendingOTP && <Loader2 className="animate-spin mr-2" size={18} />}
          {!backendReady ? "Connecting…" : isSendRateLimited ? `Send OTP (${formatSeconds(rateLimitRemainingSeconds)})` : "Send OTP"}
        </Button>
      </div>

      {onBack && (
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="w-full h-10 text-body font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl cursor-pointer"
        >
          <ArrowLeft size={16} className="mr-1.5" />
          Back
        </Button>
      )}
    </div>
  );
}
