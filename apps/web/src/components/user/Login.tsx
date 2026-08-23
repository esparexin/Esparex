"use client";

import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useCallback } from "react";

import { ArrowLeft, Loader2, Pencil } from "@/icons/IconRegistry";
import { cn } from "@/lib/utils";
import { useOtpFlow } from "@/hooks/useOtpFlow";
import { formatSeconds } from "@/lib/otpHelpers";
import { validateIndianMobile } from "@/lib/validation";

import {
  Button,
  Form,
  FieldRoot,
  FieldControl,
  FieldLabel,
  FieldMessage,
  InputGroup,
  InputPrefix,
  Input,
  ControlledOtp,
  FormError as UiFormError,
} from "@esparex/ui";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

import { loginSchema, type LoginValues } from "@/schemas/login.schema";

interface LoginProps {
  onLoginSuccess: () => void;
  onBack?: () => void;
  mode?: "page" | "modal";
}

export function Login({ onLoginSuccess, onBack, mode = "modal" }: LoginProps) {
  const flow = useOtpFlow(onLoginSuccess);
  const { step } = flow;
  const isModal = mode === "modal";

  return (
    <Card
      className={cn(
        "w-full max-w-sm mx-auto border-0 shadow-none sm:border-border sm:shadow-lg rounded-none sm:rounded-2xl bg-transparent sm:bg-card",
        isModal && "sm:border-0 sm:shadow-none"
      )}
    >
      <CardHeader className="relative space-y-1.5 text-center p-0 mb-3 sm:mb-4">
        <div className="mx-auto mb-1.5 sm:mb-2 w-fit">
          <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-emerald-50/80 border border-emerald-200/60 flex items-center justify-center p-2.5 shadow-xs">
            <Image
              src="/images/recycle-icon.png"
              alt="Esparex Recycle Logo"
              width={48}
              height={48}
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        <div>
          <CardTitle className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground">
            {step === "enterMobile" ? "Welcome to Esparex" : "Verify OTP"}
          </CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground font-medium">
            {step === "enterMobile"
              ? "Login to buy & sell mobile spares"
              : "Enter the code sent to your mobile"}
          </p>
        </div>
      </CardHeader>
      <CardContent className="p-0 space-y-3 sm:space-y-4">
        <LoginForm flow={flow} onBack={onBack} />
      </CardContent>
    </Card>
  );
}

// ----------------------------------------------------------------------
// Presentation-Agnostic LoginForm (Single Source of Truth)
// ----------------------------------------------------------------------

interface LoginFormProps {
  flow: ReturnType<typeof useOtpFlow>;
  onBack?: () => void;
}

export function LoginForm({ flow, onBack }: LoginFormProps) {
  const {
    backendReady, step, existingUserName,
    isSendingOTP, isVerifying,
    authError, clearAuthErrorOfTypes,
    isOtpStep, requiresName, isBlocked, isLocked, isSendRateLimited,
    isVerifyRateLimited, canResend, mobileServerError, otpErrorMessage,
    otpRateLimitMessage, lockRemainingSeconds, resendRemainingSeconds, rateLimitRemainingSeconds,
    getMobileLockInfo, requestOtp, handleResendOtp, resetToMobileStep, verifyOtpCode,
  } = flow;

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { mobile: "", name: "", otp: "" },
  });

  const mobileValue = form.watch("mobile") || "";
  const nameValue = form.watch("name") || "";
  const otpValue = form.watch("otp") || "";

  // Auto-focus management using RHF & DOM element targeting
  useEffect(() => {
    if (step === "enterMobile") {
      const id = setTimeout(() => form.setFocus("mobile"), 0);
      return () => clearTimeout(id);
    }
    if (step === "enterNameAndOtp") {
      const id = setTimeout(() => form.setFocus("name"), 0);
      return () => clearTimeout(id);
    }
    if (step === "enterOtp") {
      const id = setTimeout(() => {
        const firstOtpInput = document.getElementById("otp-digit-1") as HTMLInputElement | null;
        firstOtpInput?.focus();
      }, 50);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [step, form]);

  const onMobileSubmit = async (values: LoginValues) => {
    if (authError?.type === "generic") clearAuthErrorOfTypes(["generic"]);

    const lockInfo = getMobileLockInfo(values.mobile);
    if (lockInfo && lockInfo.remainingSeconds > 0) {
      form.setError("mobile", {
        message: `Account temporarily locked. Try again in ${formatSeconds(lockInfo.remainingSeconds)}.`,
      });
      return;
    }

    await requestOtp(values.mobile, "Failed to send OTP. Please try again.");
  };

  const onOtpSubmit = async () => {
    if (requiresName && !nameValue.trim()) {
      form.setError("name", { message: "Please enter your name to continue" });
      form.setFocus("name");
      return;
    }
    if (otpValue.length !== 6) {
      form.setError("otp", { message: "Please enter the 6-digit OTP code." });
      return;
    }

    await verifyOtpCode(mobileValue, otpValue, nameValue);
  };

  const onSubmit = (values: LoginValues) => {
    if (step === "enterMobile") {
      void onMobileSubmit(values);
    } else if (isOtpStep) {
      void onOtpSubmit();
    }
  };

  const handleEditMobile = useCallback(() => {
    resetToMobileStep(mobileValue);
    form.resetField("otp");
    form.resetField("name");
  }, [resetToMobileStep, mobileValue, form]);

  const handleResend = useCallback(() => {
    form.resetField("otp");
    void handleResendOtp(mobileValue);
  }, [form, handleResendOtp, mobileValue]);

  const isValidMobile = mobileValue.length === 10 && validateIndianMobile(mobileValue);
  const otpInputDisabled = isBlocked || isLocked || (requiresName && !nameValue.trim());
  const isOtpComplete = otpValue.length === 6;

  // Sync internal UI errors with form errors
  useEffect(() => {
    if (mobileServerError(mobileValue)) {
      form.setError("mobile", { message: mobileServerError(mobileValue) });
    }
  }, [mobileServerError, mobileValue, form]);

  if (step === "enterMobile") {
    return (
      <Form {...form}>
        <form
          key="step-enter-mobile"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-3.5 animate-in fade-in-0 slide-in-from-bottom-1 duration-200"
        >
          <FieldRoot<LoginValues, "mobile">
            name="mobile"
            render={({ field }) => (
              <div className="space-y-1.5">
                <FieldLabel className="text-xs font-semibold text-foreground-secondary">
                  Mobile Number
                </FieldLabel>
                <FieldControl animateOnError>
                  <InputGroup>
                    <InputPrefix className="text-sm font-bold text-foreground-tertiary pointer-events-none pl-3.5">
                      +91
                    </InputPrefix>
                    <Input
                      placeholder="9876543210"
                      maxLength={10}
                      className={cn(
                        "pl-12 pr-4 h-11 tracking-wider font-semibold text-foreground border-border rounded-xl focus-visible:border-primary focus-visible:ring-primary/20",
                        isValidMobile && "border-primary ring-2 ring-primary/10"
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
                <FieldMessage className="text-xs" />
              </div>
            )}
          />

          {authError?.type === "generic" && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-2.5">
              <UiFormError message={authError.message} className="mt-0 text-xs text-red-600" />
            </div>
          )}

          {authError?.type === "blocked" && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-center">
              <p className="text-xs font-semibold text-red-700">{authError.message}</p>
            </div>
          )}

          {!backendReady && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 space-y-0.5">
              <p className="text-xs font-semibold text-amber-900 flex items-center gap-2">
                <Loader2 className="animate-spin h-3.5 w-3.5 text-amber-600" />
                Waking up server...
              </p>
              <p className="text-tiny text-amber-700">
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
              className="w-full h-11 rounded-xl font-bold text-sm shadow-md shadow-primary/20 transition-all disabled:opacity-50"
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
              className="w-full h-9 text-xs font-semibold text-foreground-secondary hover:text-foreground hover:bg-muted rounded-xl"
            >
              <ArrowLeft size={14} className="mr-1.5" />
              Back
            </Button>
          )}
        </form>
      </Form>
    );
  }

  return (
    <Form {...form}>
      <form
        key={`step-${step}`}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-3 animate-in fade-in-0 slide-in-from-bottom-1 duration-200"
      >
        {/* Streamlined Status & Recipient Info Bar */}
        <div className="py-2 px-3 bg-slate-50 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-slate-700 font-medium truncate">
              OTP sent to <span className="font-bold text-slate-900">+91 {mobileValue}</span>
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleEditMobile}
              disabled={isSendingOTP}
              aria-label="Edit mobile number"
              className="h-6 w-6 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full shrink-0"
            >
              <Pencil size={12} />
            </Button>
          </div>
          {existingUserName && step === "enterOtp" && (
            <p className="text-xs text-emerald-700 font-semibold border-t border-slate-200/60 pt-1">
              Welcome back, <span className="font-bold">{existingUserName}</span>!
            </p>
          )}
        </div>

        {authError?.type === "blocked" && (
          <div className="text-center py-2 px-3 bg-red-50 rounded-xl border border-red-200">
            <p className="text-xs text-red-700 font-semibold">{authError.message}</p>
          </div>
        )}

        {step === "locked" && (
          <div className="text-center p-2.5 bg-amber-50 rounded-xl border border-amber-300 space-y-0.5">
            <p className="text-xs font-bold text-amber-900">
              Too many incorrect OTP attempts.
            </p>
            <p className="text-xs text-amber-800">
              Account locked. Try again in {formatSeconds(lockRemainingSeconds)}
            </p>
          </div>
        )}

        {!isLocked && otpRateLimitMessage && (
          <div className="text-center py-2 px-3 bg-red-50 rounded-xl border border-red-200">
            <p className="text-xs text-red-700 font-semibold">{otpRateLimitMessage}</p>
          </div>
        )}

        {step === "enterNameAndOtp" && (
          <FieldRoot<LoginValues, "name">
            name="name"
            render={({ field }) => (
              <div className="space-y-1.5">
                <FieldLabel className="text-xs font-semibold text-slate-700">
                  Your Name <span className="text-red-500">*</span>
                </FieldLabel>
                <FieldControl animateOnError>
                  <Input
                    placeholder="Enter your name"
                    className="h-10 text-xs font-medium border-slate-200 rounded-xl"
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
                <FieldMessage className="text-xs" />
              </div>
            )}
          />
        )}

        {requiresName && !nameValue.trim() && (
          <p className="text-center text-tiny font-medium text-slate-500 -mb-1">
            Enter your name above to enable OTP entry
          </p>
        )}

        <ControlledOtp<LoginValues, "otp">
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
            <UiFormError message={otpErrorMessage} className="text-center text-xs text-destructive m-0" />
          )}

          {resendRemainingSeconds > 0 && !isLocked ? (
            <p className="text-center text-xs text-slate-500 font-medium">
              Resend available in <span className="font-semibold text-slate-700">{formatSeconds(resendRemainingSeconds)}</span>
            </p>
          ) : canResend ? (
            <Button
              type="button"
              variant="link"
              disabled={isSendingOTP || isVerifying || isBlocked || isLocked || isSendRateLimited}
              onClick={handleResend}
              className="h-auto p-0 text-xs font-bold text-blue-600 hover:text-blue-700"
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
            className="w-full h-11 rounded-xl font-bold text-sm shadow-md shadow-primary/20 transition-all disabled:opacity-50"
          >
            {isVerifying && <Loader2 className="animate-spin mr-2" size={18} />}
            Verify OTP
          </Button>
        </div>
      </form>
    </Form>
  );
}
