"use client";

import type { UseFormReturn } from "react-hook-form";
import { Loader2, Pencil } from "@esparex/ui";
import { formatSeconds } from "@/lib/otpHelpers";
import { WhatsAppIcon } from "./LoginMobileStep";
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
    <div className="flex-1 flex flex-col justify-between h-full">
      <div className="space-y-4">
        {/* Recipient Notice & Change */}
        <div className="flex flex-col items-center justify-center gap-0.5 text-center -mt-2 sm:-mt-3 pb-1">
          {existingUserName && step === "enterOtp" && (
            <p className="text-body font-semibold text-emerald-700 dark:text-emerald-400">
              Welcome back, <span className="font-bold">{existingUserName}</span>!
            </p>
          )}
          <p className="text-body text-muted-foreground font-medium leading-normal">
            Code sent via WhatsApp to
          </p>
          <div className="inline-flex items-center justify-center gap-2 mt-0.5">
            <span className="font-bold text-foreground tracking-wide text-body leading-normal whitespace-nowrap">
              +91 {mobileValue}
            </span>
            <button
              type="button"
              onClick={handleEditMobile}
              disabled={isSendingOTP}
              aria-label="Edit mobile number"
              className="relative inline-flex items-center gap-1 text-primary hover:text-primary/80 font-semibold text-caption leading-normal underline underline-offset-2 cursor-pointer shrink-0 before:absolute before:inset-[-9px] before:content-['']"
            >
              <span>Change</span>
              <Pencil size={11} className="shrink-0" />
            </button>
          </div>
        </div>

        {authError?.type === "blocked" && (
          <div className="text-center py-2.5 px-3 bg-destructive/5 rounded-xl border border-destructive/20">
            <p className="text-caption text-destructive font-semibold">{authError.message}</p>
          </div>
        )}

        {step === "locked" && (
          <div className="text-center p-3 bg-amber-50/90 dark:bg-amber-950/30 rounded-xl border border-amber-300/80 dark:border-amber-800/40 space-y-0.5">
            <p className="text-caption font-bold text-amber-900 dark:text-amber-300">
              Too many incorrect OTP attempts.
            </p>
            <p className="text-caption text-amber-800 dark:text-amber-400">
              Account locked. Try again in {formatSeconds(lockRemainingSeconds)}
            </p>
          </div>
        )}

        {!isLocked && otpRateLimitMessage && (
          <div className="text-center py-2.5 px-3 bg-destructive/5 rounded-xl border border-destructive/20">
            <p className="text-caption text-destructive font-semibold">{otpRateLimitMessage}</p>
          </div>
        )}

        {step === "enterNameAndOtp" && (
          <FieldRoot<LoginFormValues, "name">
            name="name"
            render={({ field }) => (
              <div className="space-y-2 text-left">
                <FieldLabel className="text-body sm:text-body-lg font-medium text-foreground">
                  Your Full Name <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldControl animateOnError>
                  <Input
                    placeholder="Enter your name"
                    className="h-12 px-4 text-body-lg sm:text-body font-medium bg-background border-border/80 rounded-xl focus-visible:border-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-600/20 transition-all shadow-xs"
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
                <FieldMessage className="text-caption mt-1" />
              </div>
            )}
          />
        )}

        <div className="space-y-2 text-center">
          <ControlledOtp<LoginFormValues, "otp">
            name="otp"
            length={6}
            disabled={otpInputDisabled}
            autoFocus={step === "enterOtp"}
            className="justify-center py-1 sm:py-2"
            animateOnError
          />
          <p className="text-body text-muted-foreground font-normal">
            Enter the 6-digit code sent to your WhatsApp
          </p>
        </div>

        {otpErrorMessage && (
          <UiFormError message={otpErrorMessage} className="text-center text-caption text-destructive m-0" />
        )}
      </div>

      {/* Screen Reader Live Status for Timer */}
      <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {resendRemainingSeconds > 0
          ? `Resend available in ${formatSeconds(resendRemainingSeconds)}`
          : "Resend on WhatsApp is now available"}
      </span>

      <div className="flex items-center gap-3 pt-6 mt-auto">
        <Button
          type="button"
          variant="outline"
          onClick={handleResend}
          disabled={!canResend || isSendingOTP || isVerifying}
          className="h-12 px-4 rounded-xl text-body font-medium border border-border/80 bg-background hover:bg-muted/60 text-foreground transition-all cursor-pointer shrink-0 disabled:opacity-60 shadow-xs flex items-center justify-center gap-1.5"
        >
          {isSendingOTP ? (
            <>
              <Loader2 className="animate-spin mr-1.5" size={16} />
              Sending…
            </>
          ) : resendRemainingSeconds > 0 ? (
            `Resend in ${formatSeconds(resendRemainingSeconds)}`
          ) : isSendRateLimited ? (
            `Resend (${formatSeconds(rateLimitRemainingSeconds)})`
          ) : (
            <>
              <WhatsAppIcon className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-500 fill-current" />
              <span>Resend OTP</span>
            </>
          )}
        </Button>
        <Button
          type="submit"
          disabled={
            isVerifying ||
            isBlocked ||
            isLocked ||
            isVerifyRateLimited ||
            !isOtpComplete ||
            (requiresName && !nameValue.trim())
          }
          className="flex-1 h-12 rounded-xl font-semibold text-body bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition-all disabled:opacity-40 disabled:bg-emerald-600 disabled:text-white disabled:shadow-none disabled:cursor-not-allowed cursor-pointer"
        >
          {isVerifying && <Loader2 className="animate-spin mr-2" size={18} />}
          Verify OTP
        </Button>
      </div>
    </div>
  );
}
