"use client";

import Image from "next/image";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useCallback } from "react";

import { cn } from "@/lib/utils";
import { useOtpFlow } from "@/hooks/useOtpFlow";
import { formatSeconds } from "@/lib/otpHelpers";
import { validateIndianMobile } from "@/lib/mobileUtils";

import { Form, ArrowLeft } from "@esparex/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@esparex/ui";

import { loginFormSchema, type LoginFormValues } from "@esparex/contracts";
import { LoginMobileStep } from "./auth/LoginMobileStep";
import { LoginOtpStep } from "./auth/LoginOtpStep";

interface LoginProps {
  onLoginSuccess: () => void;
  onBack?: () => void;
  mode?: "page" | "modal";
  onRegisterBackAction?: (action: (() => void) | null) => void;
}

export function Login({
  onLoginSuccess,
  onBack,
  mode = "modal",
  onRegisterBackAction,
}: LoginProps) {
  const flow = useOtpFlow(onLoginSuccess);
  const { step } = flow;
  const isModal = mode === "modal";

  return (
    <Card
      className={cn(
        "w-full max-w-sm mx-auto border-0 shadow-none sm:border-0 rounded-none bg-transparent flex-1 flex flex-col justify-between h-full",
        isModal && "sm:border-0 sm:shadow-none"
      )}
    >
      <CardHeader className="relative text-center p-0 mb-6 sm:mb-7 shrink-0">
        {!isModal && onBack && (
          <button
            type="button"
            onClick={step !== "enterMobile" ? () => flow.resetToMobileStep() : onBack}
            className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-muted/80 hover:bg-muted text-foreground-secondary hover:text-foreground transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <div className="mx-auto mb-2 w-fit">
          <div className="flex items-center justify-center h-11 w-11 rounded-2xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/15 p-2">
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
      <CardContent className="p-0 w-full flex-1 flex flex-col justify-between min-h-0">
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

  // Auto-focus management for step transitions within the sheet
  // Initial mobile focus is handled by Sheet onOpenAutoFocus
  useEffect(() => {
    if (step === "enterNameAndOtp") {
      const id = setTimeout(() => {
        const input = document.querySelector<HTMLInputElement>('input[name="name"]');
        if (input) {
          input.focus({ preventScroll: true });
        } else {
          form.setFocus("name");
        }
      }, 250);
      return () => clearTimeout(id);
    }
    if (step === "enterOtp") {
      let raf2: number | null = null;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          const firstOtpInput = document.getElementById("otp-digit-1") as HTMLInputElement | null;
          firstOtpInput?.focus({ preventScroll: true });
        });
      });
      return () => {
        cancelAnimationFrame(raf1);
        if (raf2 !== null) cancelAnimationFrame(raf2);
      };
    }
    return undefined;
  }, [step, form]);

  const onMobileSubmit = async (values: LoginFormValues) => {
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

  // Sync internal UI errors with form errors
  useEffect(() => {
    if (mobileServerError(mobileValue)) {
      form.setError("mobile", { message: mobileServerError(mobileValue) });
    }
  }, [mobileServerError, mobileValue, form]);

  return (
    <Form {...form}>
      <form
        key={`step-${step}`}
        onSubmit={form.handleSubmit(onSubmit)}
        className="animate-in fade-in-0 slide-in-from-bottom-1 duration-200 flex-1 flex flex-col justify-between h-full"
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
