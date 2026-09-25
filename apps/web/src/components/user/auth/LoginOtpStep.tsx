"use client";

import type { UseFormReturn } from "react-hook-form";
import { Loader2, Pencil } from "@esparex/ui";
import { formatSeconds } from "@/lib/otpHelpers";
import {
  Button,
  FieldRoot,
  FieldControl,
  FieldLabel,
  FieldMessage,
  Input,
  ControlledOtp,
  FormError as UiFormError,
} from "@esparex/ui";
import type { LoginFormValues } from "@esparex/contracts";
import type { useOtpFlow } from "@/hooks/useOtpFlow";

interface LoginOtpStepProps {
  form: UseFormReturn<LoginFormValues>;
  flow: ReturnType<typeof useOtpFlow>;
  mobileValue: string;
  nameValue: string;
  otpValue: string;
  handleEditMobile: () => void;
  handleResend: () => void;
}

export function LoginOtpStep({
  form,
  flow,
  mobileValue,
  nameValue,
  otpValue,
  handleEditMobile,
  handleResend,
}: LoginOtpStepProps) {
  const {
    step,
    existingUserName,
    isSendingOTP,
    isVerifying,
    authError,
    requiresName,
    isBlocked,
    isLocked,
    isSendRateLimited,
    isVerifyRateLimited,
    canResend,
    otpErrorMessage,
    otpRateLimitMessage,
    lockRemainingSeconds,
    resendRemainingSeconds,
    rateLimitRemainingSeconds,
  } = flow;

  const otpInputDisabled = isBlocked || isLocked || (requiresName && !nameValue.trim());
  const isOtpComplete = otpValue.length === 6;

  return (
    <div className="space-y-2.5 sm:space-y-3">
      {/* Unboxed Fluid Recipient Pill & Greeting */}
      <div className="flex flex-col items-center justify-center gap-1.5 py-1 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 dark:bg-primary/20 text-caption font-semibold text-primary">
          <span>Sent to +91 {mobileValue}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleEditMobile}
            disabled={isSendingOTP}
            aria-label="Edit mobile number"
            className="relative h-5 w-5 text-primary hover:text-primary/90 hover:bg-primary/20 rounded-full shrink-0 cursor-pointer before:absolute before:inset-[-9px] before:content-[''] p-0"
          >
            <Pencil size={11} />
          </Button>
        </div>
        {existingUserName && step === "enterOtp" && (
          <p className="text-caption text-emerald-700 dark:text-emerald-400 font-semibold animate-in fade-in-0 duration-200">
            Welcome back, <span className="font-bold">{existingUserName}</span>!
          </p>
        )}
      </div>

      {authError?.type === "blocked" && (
        <div className="text-center py-2.5 px-3 bg-destructive/5 rounded-2xl border border-destructive/20">
          <p className="text-caption text-destructive font-semibold">{authError.message}</p>
        </div>
      )}

      {step === "locked" && (
        <div className="text-center p-3 bg-amber-50/90 dark:bg-amber-950/30 rounded-2xl border border-amber-300/80 dark:border-amber-800/40 space-y-0.5">
          <p className="text-caption font-bold text-amber-900 dark:text-amber-300">
            Too many incorrect OTP attempts.
          </p>
          <p className="text-caption text-amber-800 dark:text-amber-400">
            Account locked. Try again in {formatSeconds(lockRemainingSeconds)}
          </p>
        </div>
      )}

      {!isLocked && otpRateLimitMessage && (
        <div className="text-center py-2.5 px-3 bg-destructive/5 rounded-2xl border border-destructive/20">
          <p className="text-caption text-destructive font-semibold">{otpRateLimitMessage}</p>
        </div>
      )}

      {step === "enterNameAndOtp" && (
        <FieldRoot<LoginFormValues, "name">
          name="name"
          render={({ field }) => (
            <div className="space-y-1.5">
              <FieldLabel className="text-body font-semibold text-foreground-secondary">
                Your Name <span className="text-destructive">*</span>
              </FieldLabel>
              <FieldControl animateOnError>
                <Input
                  placeholder="Enter your name"
                  className="h-12 text-body-lg md:text-body font-medium bg-muted/40 hover:bg-muted/60 focus-visible:bg-background border-border/70 rounded-2xl focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15 transition-all shadow-2xs"
                  disabled={isBlocked || isLocked}
                  autoComplete="name"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    form.clearErrors("name");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && field.value?.trim()) {
                      e.preventDefault();
                      const firstOtpInput = document.getElementById("otp-digit-1") as HTMLInputElement | null;
                      firstOtpInput?.focus({ preventScroll: true });
                    }
                  }}
                />
              </FieldControl>
              <FieldMessage className="text-caption" />
            </div>
          )}
        />
      )}

      {requiresName && !nameValue.trim() && (
        <p className="text-center text-tiny font-medium text-foreground-subtle -mb-1">
          Enter your name above to enable OTP entry
        </p>
      )}

      <ControlledOtp<LoginFormValues, "otp">
        name="otp"
        length={6}
        disabled={otpInputDisabled}
        autoFocus={step === "enterOtp"}
        className="justify-center py-1"
        animateOnError
      />

      {/* Inline Resend & Error Area */}
      <div className="flex flex-col items-center gap-0.5 my-1">
        {otpErrorMessage && (
          <UiFormError message={otpErrorMessage} className="text-center text-caption text-destructive m-0" />
        )}

        {resendRemainingSeconds > 0 && !isLocked ? (
          <p
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="text-center text-caption text-foreground-subtle font-medium"
          >
            Resend available in <span className="font-semibold text-foreground-secondary">{formatSeconds(resendRemainingSeconds)}</span>
          </p>
        ) : canResend ? (
          <Button
            type="button"
            variant="link"
            disabled={isSendingOTP || isVerifying || isBlocked || isLocked || isSendRateLimited}
            onClick={handleResend}
            className="h-auto p-0 text-caption font-bold text-primary hover:text-primary/90 cursor-pointer"
          >
            {isSendingOTP && <Loader2 className="animate-spin mr-1.5" size={13} />}
            {isSendRateLimited ? `Resend OTP in ${formatSeconds(rateLimitRemainingSeconds)}` : "Resend OTP"}
          </Button>
        ) : null}
      </div>

      <div className="transition-transform active:scale-[0.985]">
        <Button
          type="submit"
          variant="primary"
          disabled={
            isVerifying ||
            isBlocked ||
            isLocked ||
            isVerifyRateLimited ||
            !isOtpComplete ||
            (requiresName && !nameValue.trim())
          }
          className="w-full h-12 rounded-2xl font-bold text-body shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50 cursor-pointer"
        >
          {isVerifying && <Loader2 className="animate-spin mr-2" size={18} />}
          Verify OTP
        </Button>
      </div>
    </div>
  );
}
