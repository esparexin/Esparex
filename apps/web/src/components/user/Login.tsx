"use client";

import Image from "next/image";
import { useForm, useWatch, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useCallback } from "react";
import { useLoginStepFocus } from "@/hooks/useLoginStepFocus";

import { cn } from "@/lib/utils";
import { useOtpFlow } from "@/hooks/useOtpFlow";
import { formatSeconds } from "@/lib/otpHelpers";
import { validateIndianMobile } from "@/lib/mobileUtils";

import {
  Form,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  FieldRoot,
  FieldControl,
  FieldLabel,
  FieldMessage,
  Input,
  FormError as UiFormError,
  Loader2,
} from "@esparex/ui";

import { loginFormSchema, normalizeIndianMobileInput, type LoginFormValues } from "@esparex/contracts";
import { LoginOtpStep } from "./auth/LoginOtpStep";

interface LoginProps {
  onLoginSuccess: () => void;
  onBack?: () => void;
  onRegisterBackAction?: (action: (() => void) | null) => void;
}

export function Login({
  onLoginSuccess,
  onBack,
  onRegisterBackAction,
}: LoginProps) {
  const flow = useOtpFlow(onLoginSuccess);
  const { step } = flow;

  return (
    <Card
      className="w-full max-w-sm mx-auto border-0 shadow-none sm:border-0 rounded-none bg-transparent flex flex-col"
    >
      <CardHeader className="relative text-center p-0 mb-4 sm:mb-7 shrink-0">
        <div className="mx-auto mb-2 w-fit">
          <div className="flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-primary text-primary-foreground shadow-sm shadow-primary/15 p-2">
            <Image
              src="/images/recycle-icon.png"
              alt="Esparex Recycle Logo"
              width={44}
              height={44}
              priority
              className="w-full h-full object-contain brightness-0 invert drop-shadow-xs"
            />
          </div>
        </div>
        <div className="space-y-1">
          <CardTitle
            className={cn(
              "text-h3 font-semibold tracking-tight text-foreground",
              step === "enterMobile" && "flex items-center justify-center gap-1.5"
            )}
            aria-label={step === "enterMobile" ? "Welcome to Esparex" : "Verify OTP"}
          >
            {step === "enterMobile" ? (
              <>
                <span>Welcome to</span>
                <Image
                  src="/icons/logo.png"
                  alt="Esparex"
                  width={495}
                  height={112}
                  unoptimized
                  priority
                  className="h-5 w-auto inline-block object-contain"
                />
              </>
            ) : (
              "Verify OTP"
            )}
          </CardTitle>
          {step === "enterMobile" && (
            <p className="text-body text-muted-foreground font-normal leading-normal">
              Login to buy & sell mobile spares
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0 w-full flex flex-col">
        <LoginForm
          flow={flow}
          onBack={onBack}
          onRegisterBackAction={onRegisterBackAction}
        />
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
  onRegisterBackAction?: (action: (() => void) | null) => void;
}

export function LoginForm({
  flow,
  onBack,
  onRegisterBackAction,
}: LoginFormProps) {
  const {
    step,
    authError,
    clearAuthErrorOfTypes,
    isOtpStep,
    requiresName,
    mobileServerError,
    getMobileLockInfo,
    requestOtp,
    handleResendOtp,
    resetToMobileStep,
    verifyOtpCode,
  } = flow;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { mobile: "", name: "", otp: "" },
  });

  const mobileValue = useWatch({ control: form.control, name: "mobile" }) ?? "";
  const nameValue = useWatch({ control: form.control, name: "name" }) ?? "";
  const otpValue = useWatch({ control: form.control, name: "otp" }) ?? "";

  // Auto-focus management for step transitions (initial mobile focus handled by Sheet onOpenAutoFocus)
  useLoginStepFocus(step, form);

  const onMobileSubmit = async (values: LoginFormValues) => {
    if (authError?.type === "generic") clearAuthErrorOfTypes(["generic"]);

    const serverErr = mobileServerError(values.mobile);
    if (serverErr) { form.setError("mobile", { message: serverErr }); return; }

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

  const onSubmit = (values: LoginFormValues) => {
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

  useEffect(() => {
    if (!onRegisterBackAction) return;
    if (step !== "enterMobile") {
      onRegisterBackAction(handleEditMobile);
    } else {
      onRegisterBackAction(onBack ?? null);
    }
    return () => {
      onRegisterBackAction(null);
    };
  }, [step, onRegisterBackAction, handleEditMobile, onBack]);

  const isValidMobile = mobileValue.length === 10 && validateIndianMobile(mobileValue);
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-5"
      >
        {step === "enterMobile" ? (
          <LoginMobileStep
            form={form}
            flow={flow}
            isValidMobile={isValidMobile}
            mobileValue={mobileValue}
          />
        ) : (
          <LoginOtpStep
            form={form}
            flow={flow}
            mobileValue={mobileValue}
            nameValue={nameValue}
            otpValue={otpValue}
            handleEditMobile={handleEditMobile}
            handleResend={handleResend}
          />
        )}
      </form>
    </Form>
  );
}

// ----------------------------------------------------------------------
// Login steps (P1-1 — single responsive login)
// ----------------------------------------------------------------------
// `LoginMobileStep` (the "enter mobile number" step) was a separate file with
// no desktop counterpart; it is folded into this single responsive `Login.tsx`
// as an internal step section. The old file remains as a deprecated
// re-export shim (deleted in Phase 4). `WhatsAppIcon` lives in
// `./auth/WhatsAppIcon` (leaf module shared with `LoginOtpStep`, avoiding a
// `Login ↔ LoginOtpStep` import cycle) and is re-exported here for call-site compat.

import { WhatsAppIcon } from "./auth/WhatsAppIcon";
export { WhatsAppIcon };

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
                    "flex items-center h-12 rounded-xl border border-border/80 bg-background transition-colors shadow-xs overflow-hidden",
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
                    className="h-full border-0 rounded-none bg-transparent px-3.5 text-body-lg sm:text-body tracking-wider font-normal text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none flex-1 min-w-0"
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
          <div className="rounded-2xl border border-warning/20 bg-warning/10 p-3 space-y-1">
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
