"use client";

import Image from "next/image";
import { ArrowLeft, Loader2, Pencil } from "@/icons/IconRegistry";

import { cn } from "@/lib/utils";
import { useOtpFlow } from "@/hooks/useOtpFlow";
import { formatSeconds } from "@/lib/otpHelpers";

import { Button } from "@esparex/ui";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { FormError } from "../ui/FormError";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { OtpInputGroup } from "./otp/OtpInputGroup";

interface LoginProps {
  onLoginSuccess: (options?: { requiresProfileSetup?: boolean }) => void;
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
        "w-full max-w-sm mx-auto border-0 shadow-none sm:border-slate-200/70 sm:shadow-lg rounded-none sm:rounded-2xl bg-transparent sm:bg-white",
        isModal && "sm:border-0 sm:shadow-none"
      )}
    >
      <CardHeader className="relative space-y-2 text-center pt-2 sm:pt-6 pb-2 sm:pb-3">
        <div className="mx-auto mb-2 sm:mb-3 w-fit">
          <div className="h-16 w-16 sm:h-28 sm:w-28 rounded-2xl sm:rounded-3xl bg-emerald-50/80 border border-emerald-200/60 flex items-center justify-center p-2.5 sm:p-4 shadow-sm">
            <Image
              src="/images/recycle-icon.png"
              alt="Esparex Recycle Logo"
              width={72}
              height={72}
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        <div>
          <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {step === "enterMobile" ? "Welcome to Esparex" : "Verify OTP"}
          </CardTitle>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            {step === "enterMobile"
              ? "Login to buy & sell mobile spares"
              : "Enter the code sent to your mobile"}
          </p>
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
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
    backendReady, step, mobile, setMobile, newUserName, setNewUserName,
    existingUserName, isSendingOTP, isVerifying, mobileError, setMobileError,
    nameError, setNameError, authError, clearAuthErrorOfTypes,
    mobileInputRef, nameInputRef, otpInputsRef, requiresName, isValidMobile,
    isBlocked, isLocked, isSendRateLimited, isVerifyRateLimited, otpInputDisabled,
    canResend, mobileServerError, otpErrorMessage, otpRateLimitMessage,
    lockRemainingSeconds, resendRemainingSeconds, rateLimitRemainingSeconds,
    otp, otpValue, isOtpComplete, handleOtpChange, handleOtpKeyDown, handleOtpPaste,
    handleMobileSubmit, handleResendOtp, resetToMobileStep, verifyOtpCode,
  } = flow;

  return step === "enterMobile" ? (
    <form
      key="step-enter-mobile"
      onSubmit={handleMobileSubmit}
      className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-1 duration-200"
    >
      <div className="space-y-2">
        <Label htmlFor="mobile" className="text-xs sm:text-sm font-semibold text-slate-700">
          Mobile Number
        </Label>

        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-600 pointer-events-none">
            +91
          </span>
          <Input
            ref={mobileInputRef}
            id="mobile"
            name="mobile"
            value={mobile}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "");
              if (val.length <= 10) setMobile(val);
              if (mobileError) setMobileError("");
              if (authError?.type === "generic") {
                clearAuthErrorOfTypes(["generic"]);
              }
            }}
            placeholder="9876543210"
            maxLength={10}
            className={cn(
              "pl-12 pr-4 h-11 tracking-wider font-semibold text-slate-900 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-blue-500/20",
              isValidMobile && "border-blue-500 ring-2 ring-blue-500/10"
            )}
            aria-label="Mobile number"
            aria-required="true"
            aria-invalid={!!mobileError || !!mobileServerError}
            aria-describedby={mobileError || mobileServerError ? "mobile-error" : undefined}
            autoComplete="tel"
            inputMode="numeric"
          />
        </div>

        <FormError
          id="mobile-error"
          message={mobileError || mobileServerError}
          className="text-xs text-destructive"
        />
      </div>

      {authError?.type === "generic" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3">
          <FormError
            message={authError.message}
            className="mt-0 text-xs text-red-600"
          />
        </div>
      )}

      {authError?.type === "blocked" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center">
          <p className="text-xs font-semibold text-red-700">{authError.message}</p>
        </div>
      )}

      {!backendReady && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-1">
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
          disabled={isSendingOTP || !isValidMobile || isSendRateLimited || !backendReady}
          className="w-full h-11 sm:h-12 rounded-xl bg-[#8ba4f9] hover:bg-[#7895f8] active:bg-[#6686f7] text-white font-bold text-sm shadow-md shadow-blue-400/20 transition-all disabled:opacity-50"
        >
          {isSendingOTP && (
            <Loader2 className="animate-spin mr-2" size={18} />
          )}
          {!backendReady ? "Connecting…" : isSendRateLimited ? `Send OTP (${formatSeconds(rateLimitRemainingSeconds)})` : "Send OTP"}
        </Button>
      </div>

      {onBack && step !== "enterMobile" && (
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="w-full h-10 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
        >
          <ArrowLeft size={14} className="mr-1.5" />
          Back
        </Button>
      )}
    </form>
  ) : (
    <div
      key={`step-${step}`}
      className="space-y-3 animate-in fade-in-0 slide-in-from-bottom-1 duration-200"
    >
      <div className="py-2.5 px-3.5 bg-slate-50 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-slate-700 font-medium">
            OTP sent to <span className="font-bold text-slate-900">+91 {mobile}</span>
          </p>
          <Button
            variant="ghost"
            size="icon"
            onClick={resetToMobileStep}
            disabled={isSendingOTP}
            aria-label="Edit mobile number"
            className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full shrink-0"
          >
            <Pencil size={13} />
          </Button>
        </div>
      </div>

      {existingUserName && step === "enterOtp" && (
        <div className="text-center py-2 px-3 bg-green-50 rounded-xl border border-green-200">
          <p className="text-xs text-green-800 font-medium">
            Welcome back, <span className="font-bold">{existingUserName}</span>!
          </p>
        </div>
      )}

      {authError?.type === "blocked" && (
        <div className="text-center py-2 px-3 bg-red-50 rounded-xl border border-red-200">
          <p className="text-xs text-red-700 font-semibold">{authError.message}</p>
        </div>
      )}

      {step === "locked" && (
        <div className="text-center py-2.5 px-3 bg-amber-50 rounded-xl border border-amber-300">
          <p className="text-xs text-amber-900 font-semibold">
            {authError?.type === "locked" ? authError.message : "Too many failed attempts."}
          </p>
          <p className="text-tiny text-amber-700 mt-0.5">
            Try again in {formatSeconds(lockRemainingSeconds)}
          </p>
        </div>
      )}

      {!isLocked && otpRateLimitMessage && (
        <div className="text-center py-2 px-3 bg-red-50 rounded-xl border border-red-200">
          <p className="text-xs text-red-700 font-semibold">{otpRateLimitMessage}</p>
        </div>
      )}

      {resendRemainingSeconds > 0 && !isLocked && (
        <p className="text-center text-tiny font-medium text-slate-500">
          Resend available in {formatSeconds(resendRemainingSeconds)}
        </p>
      )}

      {step === "enterNameAndOtp" && (
        <div className="space-y-1.5">
          <Label htmlFor="userName" className="text-xs font-semibold text-slate-700">
            Your Name <span className="text-red-500">*</span>
          </Label>
          <Input
            ref={nameInputRef}
            id="userName"
            name="name"
            placeholder="Enter your name"
            value={newUserName}
            onChange={(e) => {
              setNewUserName(e.target.value);
              if (nameError) setNameError("");
            }}
            disabled={isBlocked || isLocked}
            className="h-10 text-xs font-medium border-slate-200 rounded-xl"
            aria-label="Your name"
            aria-required="true"
            aria-invalid={!!nameError}
            aria-describedby={nameError ? "name-error" : undefined}
            autoComplete="name"
          />
          <FormError
            id="name-error"
            message={nameError}
            className="text-xs text-destructive"
          />
        </div>
      )}

      {requiresName && !newUserName.trim() && (
        <p className="text-center text-tiny font-medium text-slate-500 -mb-1">
          Enter your name above to enable OTP entry
        </p>
      )}

      <OtpInputGroup
        otp={otp}
        otpInputsRef={otpInputsRef}
        handleOtpChange={handleOtpChange}
        handleOtpKeyDown={handleOtpKeyDown}
        handleOtpPaste={handleOtpPaste}
        disabled={otpInputDisabled}
        hasError={!!otpErrorMessage}
        shakeAnimation={authError?.type === "invalid"}
      />

      <div className="flex flex-col items-center mt-1 mb-2">
        <FormError
          id="otp-error"
          message={otpErrorMessage}
          className="text-center text-xs text-destructive m-0 mb-2"
        />
        {canResend && (
          <Button
            variant="link"
            disabled={isSendingOTP || isVerifying || isBlocked || isLocked || isSendRateLimited}
            onClick={handleResendOtp}
            className="h-auto p-0 text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            {isSendingOTP && (
              <Loader2 className="animate-spin mr-1.5" size={13} />
            )}
            {isSendRateLimited ? `Resend OTP in ${formatSeconds(rateLimitRemainingSeconds)}` : "Resend OTP"}
          </Button>
        )}
      </div>

      <div className="transition-transform active:scale-[0.985]">
        <Button
          disabled={
            isVerifying ||
            isBlocked ||
            isLocked ||
            isVerifyRateLimited ||
            !isOtpComplete ||
            (requiresName && !newUserName.trim())
          }
          onClick={() => void verifyOtpCode(otpValue)}
          className="mt-2 w-full h-11 sm:h-12 rounded-xl bg-[#8ba4f9] hover:bg-[#7895f8] active:bg-[#6686f7] text-white font-bold text-sm shadow-md shadow-blue-400/20 transition-all disabled:opacity-50"
        >
          {isVerifying && (
            <Loader2 className="animate-spin mr-2" size={18} />
          )}
          Verify OTP
        </Button>
      </div>
    </div>
  );
}
