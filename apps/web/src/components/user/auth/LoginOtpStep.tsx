"use client";

import type { UseFormReturn } from "react-hook-form";
import { Loader2, Pencil } from "@/icons/IconRegistry";
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
import type { LoginFormValues } from "@/schemas/login.schema";
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
    <div className="space-y-3">
      {/* Streamlined Status & Recipient Info Bar */}
      <div className="py-2 px-3 bg-muted/60 rounded-xl border border-border/80 shadow-2xs space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-caption text-foreground-secondary font-medium truncate">
            OTP sent to <span className="font-bold text-foreground">+91 {mobileValue}</span>
          </p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleEditMobile}
            disabled={isSendingOTP}
            aria-label="Edit mobile number"
            className="h-6 w-6 text-primary hover:text-primary/90 hover:bg-primary/10 rounded-full shrink-0 cursor-pointer"
          >
            <Pencil size={12} />
          </Button>
        </div>
        {existingUserName && step === "enterOtp" && (
          <p className="text-caption text-emerald-700 font-semibold border-t border-border/60 pt-1">
            Welcome back, <span className="font-bold">{existingUserName}</span>!
          </p>
        )}
      </div>

      {authError?.type === "blocked" && (
        <div className="text-center py-2 px-3 bg-destructive/5 rounded-xl border border-destructive/20">
          <p className="text-caption text-destructive font-semibold">{authError.message}</p>
        </div>
      )}

      {step === "locked" && (
        <div className="text-center p-2.5 bg-amber-50 rounded-xl border border-amber-300 space-y-0.5">
          <p className="text-caption font-bold text-amber-900">
            Too many incorrect OTP attempts.
          </p>
          <p className="text-caption text-amber-800">
            Account locked. Try again in {formatSeconds(lockRemainingSeconds)}
          </p>
        </div>
      )}

      {!isLocked && otpRateLimitMessage && (
        <div className="text-center py-2 px-3 bg-destructive/5 rounded-xl border border-destructive/20">
          <p className="text-caption text-destructive font-semibold">{otpRateLimitMessage}</p>
        </div>
      )}

      {step === "enterNameAndOtp" && (
        <FieldRoot<LoginFormValues, "name">
          name="name"
          render={({ field }) => (
            <div className="space-y-1.5">
              <FieldLabel className="text-caption font-semibold text-foreground-secondary">
                Your Name <span className="text-destructive">*</span>
              </FieldLabel>
              <FieldControl animateOnError>
                <Input
                  placeholder="Enter your name"
                  className="h-10 text-body-lg md:text-body font-medium border-border rounded-xl"
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
                      firstOtpInput?.focus();
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
        className="justify-center"
        animateOnError
      />

      {/* Inline Resend & Error Area */}
      <div className="flex flex-col items-center gap-1 my-1">
        {otpErrorMessage && (
          <UiFormError message={otpErrorMessage} className="text-center text-caption text-destructive m-0" />
        )}

        {resendRemainingSeconds > 0 && !isLocked ? (
          <p className="text-center text-caption text-foreground-subtle font-medium">
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
          className="w-full h-11 rounded-xl font-bold text-body shadow-md shadow-primary/20 transition-all disabled:opacity-50 cursor-pointer"
        >
          {isVerifying && <Loader2 className="animate-spin mr-2" size={18} />}
          Verify OTP
        </Button>
      </div>
    </div>
  );
}
