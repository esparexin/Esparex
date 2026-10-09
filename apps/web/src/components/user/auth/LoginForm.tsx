"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useCallback } from "react";
import { useLoginStepFocus } from "@/hooks/useLoginStepFocus";

import { useOtpFlow } from "@/hooks/useOtpFlow";
import { formatSeconds } from "@/lib/otpHelpers";
import { validateIndianMobile } from "@/lib/mobileUtils";

import { Form } from "@esparex/ui";

import { loginFormSchema, type LoginFormValues } from "@esparex/contracts";
import { LoginOtpStep } from "./LoginOtpStep";
import { LoginMobileStep } from "./LoginMobileStep";

interface LoginFormProps {
  flow: ReturnType<typeof useOtpFlow>;
  onBack?: () => void;
  onRegisterBackAction?: (action: (() => void) | null) => void;
}

/**
 * Presentation-agnostic login form (single source of truth): owns the
 * react-hook-form instance, step transitions, and submit handling for the
 * mobile-number and OTP steps. Rendered by the single responsive `Login`.
 */
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
    isSendRateLimited,
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
    if (isSendRateLimited) return;

    const lockInfo = getMobileLockInfo(values.mobile);
    if (lockInfo && lockInfo.remainingSeconds > 0) {
      form.setError("mobile", {
        message: `Account temporarily locked. Try again in ${formatSeconds(lockInfo.remainingSeconds)}.`,
      });
      document.querySelector<HTMLInputElement>('input[name="mobile"]')?.focus({ preventScroll: true });
      return;
    }

    await requestOtp(values.mobile, "Failed to send OTP. Please try again.");
  };

  const onOtpSubmit = async () => {
    if (requiresName && !nameValue.trim()) {
      form.setError("name", { message: "Please enter your name to continue" });
      document.querySelector<HTMLInputElement>('input[name="name"]')?.focus({ preventScroll: true });
      return;
    }
    if (otpValue.length !== 6) {
      form.setError("otp", { message: "Please enter the 6-digit OTP code." });
      document.getElementById("otp-digit-1")?.focus({ preventScroll: true });
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
        className="flex flex-col gap-5 flex-1 min-h-0"
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
