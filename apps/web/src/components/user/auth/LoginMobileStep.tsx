"use client";

import type { UseFormReturn } from "react-hook-form";

import { cn } from "@/lib/utils";
import { useOtpFlow } from "@/hooks/useOtpFlow";
import { formatSeconds } from "@/lib/otpHelpers";

import {
  Button,
  FieldRoot,
  FieldControl,
  FieldLabel,
  FieldMessage,
  Input,
  FormError as UiFormError,
  Loader2,
} from "@esparex/ui";

import { normalizeIndianMobileInput, type LoginFormValues } from "@esparex/contracts";
import { WhatsAppIcon } from "./WhatsAppIcon";

interface LoginMobileStepProps {
  form: UseFormReturn<LoginFormValues>;
  flow: ReturnType<typeof useOtpFlow>;
  isValidMobile: boolean;
  mobileValue: string;
}

export function LoginMobileStep({
  form,
  flow,
  isValidMobile,
  mobileValue,
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
    <div className="flex flex-col gap-6">
      <div className="space-y-4">
        <FieldRoot<LoginFormValues, "mobile">
          name="mobile"
          render={({ field }) => (
            <div className="space-y-2 text-left">
              <FieldLabel className="text-body font-medium text-foreground">
                Mobile Number
              </FieldLabel>
              <FieldControl>
                <div
                  className={cn(
                    "flex items-center h-12 rounded-xl border border-border/80 bg-background transition-colors shadow-sm overflow-hidden",
                    "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
                    isValidMobile && "border-primary/80 ring-2 ring-primary/10"
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="flex items-center justify-center h-full px-3.5 bg-muted/30 border-r border-border/70 text-muted-foreground font-medium text-body shrink-0 select-none"
                  >
                    +91
                  </span>
                  <Input
                    type="tel"
                    enterKeyHint="send"
                    placeholder="9876543210"
                    maxLength={16}
                    className="h-full border-0 rounded-none bg-transparent px-3.5 text-body-lg md:text-body tracking-wider font-normal text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none flex-1 min-w-0"
                    autoComplete="tel"
                    inputMode="numeric"
                    {...field}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (isValidMobile && backendReady && !isSendingOTP && !isSendRateLimited && !getMobileLockInfo(mobileValue)?.remainingSeconds) {
                          e.currentTarget.form?.requestSubmit();
                        }
                      }
                    }}
                    onChange={(e) => {
                      field.onChange(normalizeIndianMobileInput(e.target.value));
                      form.clearErrors("mobile");
                      clearAuthErrorOfTypes(["generic"]);
                    }}
                    onPaste={(e) => {
                      const pasted = e.clipboardData?.getData("text");
                      if (pasted) {
                        e.preventDefault();
                        field.onChange(normalizeIndianMobileInput(pasted));
                        form.clearErrors("mobile");
                        clearAuthErrorOfTypes(["generic"]);
                      }
                    }}
                  />
                </div>
              </FieldControl>
              <FieldMessage className="text-caption mt-1" />
              <p className="text-tiny text-muted-foreground mt-1">
                A 6-digit verification code will be sent to your WhatsApp
              </p>
            </div>
          )}
        />

        {authError?.type === "generic" && (
          <UiFormError message={authError.message} className="mt-0" />
        )}

        {authError?.type === "blocked" && (
          <UiFormError message={authError.message} className="mt-0 text-center" />
        )}

        {!backendReady && (
          <div className="rounded-2xl border border-warning/20 bg-warning/10 p-3 space-y-1" role="status">
            <p className="text-caption font-semibold text-warning flex items-center gap-2">
              <Loader2 className="animate-spin h-3.5 w-3.5 text-warning" />
              Waking up server...
            </p>
            <p className="text-tiny text-warning">
              Our high-security backend is initializing. Please wait a few seconds.
            </p>
          </div>
        )}
      </div>

      <div className="pt-4 sm:pt-6 mt-auto">
        <Button
          type="submit"
          disabled={isSendingOTP || !isValidMobile || isSendRateLimited || Boolean(getMobileLockInfo(mobileValue)?.remainingSeconds) || !backendReady}
          className="w-full h-12 rounded-xl font-semibold text-body bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/20 transition-colors disabled:opacity-40 disabled:bg-primary disabled:text-primary-foreground disabled:shadow-none disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
        >
          {isSendingOTP ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <WhatsAppIcon className="w-5 h-5 shrink-0 fill-current" />
          )}
          <span>
            {!backendReady
              ? "Connecting…"
              : isSendRateLimited
              ? `WhatsApp OTP (${formatSeconds(rateLimitRemainingSeconds)})`
              : "WhatsApp OTP"}
          </span>
        </Button>
      </div>
    </div>
  );
}
