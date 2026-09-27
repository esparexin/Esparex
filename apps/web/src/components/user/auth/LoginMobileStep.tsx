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

export function WhatsAppIcon({ className = "w-4 h-4", ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
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
              <p className="text-tiny text-muted-foreground mt-1">
                A 6-digit verification code will be sent to your WhatsApp
              </p>
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
          className="flex-1 h-12 rounded-xl font-semibold text-body bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition-all disabled:opacity-40 disabled:bg-emerald-600 disabled:text-white disabled:shadow-none disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
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
