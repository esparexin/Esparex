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
  InputGroup,
  InputPrefix,
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
    <div className="space-y-3 sm:space-y-3.5">
      <FieldRoot<LoginFormValues, "mobile">
        name="mobile"
        render={({ field }) => (
          <div className="space-y-1.5">
            <FieldLabel className="text-body font-semibold text-foreground-secondary">
              Mobile Number
            </FieldLabel>
            <FieldControl animateOnError>
              <InputGroup>
                <InputPrefix className="text-body font-bold text-foreground-tertiary pointer-events-none pl-3.5">
                  +91
                </InputPrefix>
                <Input
                  placeholder="9876543210"
                  maxLength={10}
                  className={cn(
                    "pl-12 pr-4 h-12 text-body-lg md:text-body tracking-wider font-semibold text-foreground bg-muted/40 hover:bg-muted/60 focus-visible:bg-background border-border/70 rounded-2xl focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15 transition-all shadow-2xs",
                    isValidMobile && "border-primary bg-background ring-4 ring-primary/15 shadow-xs"
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
              </InputGroup>
            </FieldControl>
            <FieldMessage className="text-caption" />
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

      <div className="transition-transform active:scale-[0.985]">
        <Button
          type="submit"
          variant="primary"
          disabled={
            isSendingOTP ||
            !isValidMobile ||
            isSendRateLimited ||
            Boolean(getMobileLockInfo(mobileValue)?.remainingSeconds) ||
            !backendReady
          }
          className="w-full h-12 rounded-2xl font-bold text-body shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50 cursor-pointer"
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
          className="w-full h-9 text-caption font-semibold text-foreground-secondary hover:text-foreground hover:bg-muted rounded-xl cursor-pointer"
        >
          <ArrowLeft size={14} className="mr-1.5" />
          Back
        </Button>
      )}
    </div>
  );
}
