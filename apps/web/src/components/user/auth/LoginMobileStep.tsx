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
    <div className="flex-1 flex flex-col justify-between h-full">
      <div className="space-y-4">
        <FieldRoot<LoginFormValues, "mobile">
          name="mobile"
          render={({ field }) => (
            <div className="space-y-2 text-left">
              <FieldLabel className="text-body font-medium text-foreground">
                Mobile Number
              </FieldLabel>
              <FieldControl animateOnError>
                <div
                  className={cn(
                    "flex items-center h-12 rounded-xl border border-border/80 bg-background transition-all shadow-xs overflow-hidden",
                    "focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/20",
                    isValidMobile && "border-emerald-600/80 ring-2 ring-emerald-600/10"
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="flex items-center justify-center h-full px-3.5 bg-muted/30 border-r border-border/70 text-muted-foreground font-medium text-body shrink-0 select-none"
                  >
                    +91
                  </span>
                  <Input
                    placeholder="9876543210"
                    maxLength={10}
                    className="h-full border-0 rounded-none bg-transparent px-3.5 text-body-lg sm:text-body tracking-wider font-normal text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none flex-1 min-w-0"
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
      </div>

      <div className="flex items-center gap-3 pt-6 mt-auto">
        {onBack && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="h-12 px-5 rounded-xl text-body font-medium border border-border/80 bg-background hover:bg-muted/60 text-foreground transition-all cursor-pointer shrink-0 shadow-xs"
          >
            <ArrowLeft size={16} className="mr-1.5" />
            Back
          </Button>
        )}
        <Button
          type="submit"
          disabled={
            isSendingOTP ||
            !isValidMobile ||
            isSendRateLimited ||
            Boolean(getMobileLockInfo(mobileValue)?.remainingSeconds) ||
            !backendReady
          }
          className="flex-1 h-12 rounded-xl font-semibold text-body bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition-all disabled:opacity-40 disabled:bg-emerald-600 disabled:text-white disabled:shadow-none disabled:cursor-not-allowed cursor-pointer"
        >
          {isSendingOTP && <Loader2 className="animate-spin mr-2" size={18} />}
          {!backendReady ? "Connecting…" : isSendRateLimited ? `Send OTP (${formatSeconds(rateLimitRemainingSeconds)})` : "Send OTP"}
        </Button>
      </div>
    </div>
  );
}
