"use client";

import Image from "next/image";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useCallback } from "react";

import { cn } from "@/lib/utils";
import { useOtpFlow } from "@/hooks/useOtpFlow";
import { formatSeconds } from "@/lib/otpHelpers";
import { validateIndianMobile } from "@/lib/mobileUtils";

import { Form } from "@esparex/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@esparex/ui";

import { loginFormSchema, type LoginFormValues } from "@esparex/contracts";
import { LoginMobileStep } from "./auth/LoginMobileStep";
import { LoginOtpStep } from "./auth/LoginOtpStep";

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
        "w-full max-w-sm mx-auto border-0 shadow-none sm:border-0 rounded-none bg-transparent",
        isModal && "sm:border-0 sm:shadow-none"
      )}
    >
      <CardHeader className="relative space-y-2 sm:space-y-2.5 text-center p-0 mb-5 sm:mb-6">
        {step !== "enterMobile" && (
          <div data-keyboard-hide-on-mobile="true" className="mx-auto mb-2 sm:mb-3 w-fit">
            <Image
              src="/icons/logo.png"
              alt="Esparex Logo"
              width={495}
              height={112}
              unoptimized
              priority
              className="h-6 sm:h-7 w-auto object-contain"
            />
          </div>
        )}
        <div className="space-y-1 sm:space-y-1.5">
          <CardTitle
            className={cn(
              "text-h3 sm:text-h2 font-bold tracking-tight text-foreground",
              step === "enterMobile" && "flex items-center justify-center gap-2"
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
                  className="h-6 sm:h-7 w-auto inline-block object-contain"
                />
              </>
            ) : (
              "Verify OTP"
            )}
          </CardTitle>
          <p
            data-keyboard-hide-on-mobile="true"
            className="text-body sm:text-body-lg text-muted-foreground font-normal leading-relaxed"
          >
            {step === "enterMobile"
              ? "Login to buy & sell mobile spares"
              : "Enter the 6-digit code sent to your mobile"}
          </p>
        </div>
      </CardHeader>
      <CardContent className="p-0 w-full">
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

  // Auto-focus management with preventScroll to stop iOS WebKit focus-scrolling
  useEffect(() => {
    if (step === "enterMobile") {
      const id = setTimeout(() => {
        const input = document.querySelector<HTMLInputElement>('input[name="mobile"]');
        if (input) {
          input.focus({ preventScroll: true });
        } else {
          form.setFocus("mobile");
        }
      }, 0);
      return () => clearTimeout(id);
    }
    if (step === "enterNameAndOtp") {
      const id = setTimeout(() => {
        const input = document.querySelector<HTMLInputElement>('input[name="name"]');
        if (input) {
          input.focus({ preventScroll: true });
        } else {
          form.setFocus("name");
        }
      }, 0);
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
        className="animate-in fade-in-0 slide-in-from-bottom-1 duration-200"
      >
        {step === "enterMobile" ? (
          <LoginMobileStep
            form={form}
            flow={flow}
            isValidMobile={isValidMobile}
            mobileValue={mobileValue}
            onBack={onBack}
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
