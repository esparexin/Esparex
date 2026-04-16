"use client";

import { ArrowLeft, Loader2, Pencil, Smartphone } from "lucide-react";

import { cn } from "@/lib/utils";
import { useOtpFlow } from "@/hooks/useOtpFlow";
import { formatSeconds } from "@/lib/otpHelpers";

import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { FormError } from "../ui/FormError";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface LoginProps {
  onLoginSuccess: (options?: { requiresProfileSetup?: boolean }) => void;
  onBack?: () => void;
  mode?: "page" | "modal";
}

export function Login({ onLoginSuccess, onBack, mode = "page" }: LoginProps) {
  const {
    backendReady,
    step,
    mobile, setMobile,
    newUserName, setNewUserName,
    existingUserName,
    isSendingOTP, isVerifying,
    mobileError, setMobileError,
    nameError, setNameError,
    authError, clearAuthErrorOfTypes,
    mobileInputRef, nameInputRef, otpInputsRef,
    requiresName, isValidMobile, isBlocked, isLocked,
    isSendRateLimited, isVerifyRateLimited, otpInputDisabled, canResend,
    mobileServerError, otpErrorMessage, otpRateLimitMessage,
    lockRemainingSeconds, resendRemainingSeconds, rateLimitRemainingSeconds,
    otp, otpValue, isOtpComplete, handleOtpChange, handleOtpKeyDown, handleOtpPaste,
    handleMobileSubmit, handleResendOtp, resetToMobileStep, verifyOtpCode,
  } = useOtpFlow(onLoginSuccess);

  const isModal = mode === "modal";

  return (
    <div
      className={cn(
        "bg-white flex flex-col transition-all duration-200 ease-out",
        isModal ? "min-h-0" : "min-h-[100dvh]",
        !isModal && "sm:bg-gradient-to-br sm:from-emerald-50 sm:via-white sm:to-green-50"
      )}
    >
      <div
        className={cn(
          "w-full transition-all",
          isModal
            ? "px-4 py-4 sm:px-5 sm:py-5"
            : "flex-1 px-4 py-6 sm:px-6 sm:py-8 flex items-center justify-center"
        )}
      >
        <Card
          className={cn(
            "w-full max-w-md border-0 shadow-none",
            isModal ? "rounded-xl" : "rounded-none sm:rounded-xl sm:shadow-lg"
          )}
        >
          <CardHeader
            className={cn(
              "relative space-y-2 text-center",
              isModal ? "pb-2 pt-2 sm:pt-3" : "pb-3 sm:pb-4"
            )}
          >
            <div className="mx-auto mb-1">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Smartphone className="h-6 w-6 text-primary" />
              </div>
            </div>

            <div>
              <CardTitle className="text-xl sm:text-2xl">
                {step === "enterMobile" ? "Welcome to Esparex" : "Verify OTP"}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {step === "enterMobile"
                  ? "Login to buy & sell mobile spares"
                  : "Enter the code sent to your mobile"}
              </p>
            </div>
          </CardHeader>

          <CardContent
            className={cn(
              "px-4 sm:px-6",
              step === "enterMobile" ? "space-y-4" : "space-y-3",
              isModal ? "pb-3 sm:pb-4" : "pb-4 sm:pb-5"
            )}
          >
            {step === "enterMobile" ? (
                <form
                  key="step-enter-mobile"
                  onSubmit={handleMobileSubmit}
                  className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-1 duration-200"
                >
                  <div className="space-y-2">
                    <Label htmlFor="mobile" className="text-sm font-medium">
                      Mobile Number
                    </Label>

                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground pointer-events-none">
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
                        onKeyDown={(e) => {
                          // Allow navigation and deletion
                          if (["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)) return;
                          if (e.metaKey || e.ctrlKey) return; // Allow copy paste
                          // Prevent non-numeric typing
                          if (!/[0-9]/.test(e.key)) e.preventDefault();
                        }}
                        placeholder="9876543210"
                        maxLength={10}
                        className={cn(
                          "pl-12 pr-10 tracking-[0.02em]",
                          (mobileError || mobileServerError) && "border-destructive",
                          isValidMobile && "border-green-500"
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
                      className="text-xs sm:text-sm text-destructive"
                    />
                  </div>

                  {authError?.type === "generic" && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2">
                      <FormError
                        message={authError.message}
                        className="mt-0 text-xs sm:text-sm text-red-600"
                      />
                    </div>
                  )}

                  {authError?.type === "blocked" && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-center">
                      <p className="text-sm text-red-700 font-semibold">{authError.message}</p>
                    </div>
                  )}

                  {!backendReady && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 space-y-1">
                      <p className="text-xs font-semibold text-amber-900 flex items-center gap-2">
                        <Loader2 className="animate-spin h-3 w-3" />
                        Waking up server...
                      </p>
                      <p className="text-[10px] text-amber-700 leading-tight">
                        Our high-security backend is currently initializing. This usually takes a few seconds.
                      </p>
                    </div>
                  )}

                  <div className="transition-transform active:scale-[0.985]">
                    <Button
                      type="submit"
                      disabled={isSendingOTP || !isValidMobile || isSendRateLimited || !backendReady}
                      className="w-full h-11"
                    >
                      {isSendingOTP && (
                        <Loader2 className="animate-spin mr-2" size={18} />
                      )}
                      {!backendReady ? "Connecting…" : isSendRateLimited ? `Send OTP (${formatSeconds(rateLimitRemainingSeconds)})` : "Send OTP"}
                    </Button>
                  </div>

                  {onBack && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={onBack}
                      className="w-full h-11"
                    >
                      <ArrowLeft size={16} className="mr-1" />
                      Back
                    </Button>
                  )}
                </form>
              ) : (
                <div
                  key={`step-${step}`}
                  className="space-y-3 animate-in fade-in-0 slide-in-from-bottom-1 duration-200"
                >
                  <div className="py-2 px-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-blue-800">
                        OTP sent to <span className="font-semibold">+91 {mobile}</span>
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={resetToMobileStep}
                        disabled={isSendingOTP}
                        aria-label="Edit phone number"
                        className="h-11 w-11 text-link-dark hover:text-blue-900"
                      >
                        <Pencil size={14} />
                      </Button>
                    </div>
                  </div>

                  {existingUserName && step === "enterOtp" && (
                    <div className="text-center py-2 px-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-800">
                        Welcome back, <span className="font-semibold">{existingUserName}</span>!
                      </p>
                    </div>
                  )}

                  {authError?.type === "blocked" && (
                    <div className="text-center py-2 px-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm text-red-700 font-semibold">{authError.message}</p>
                    </div>
                  )}

                  {step === "locked" && (
                    <div className="text-center py-2 px-3 bg-amber-50 rounded-lg border border-amber-300">
                      <p className="text-sm text-amber-800 font-semibold">
                        {authError?.type === "locked" ? authError.message : "Too many failed attempts."}
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        Try again in {formatSeconds(lockRemainingSeconds)}
                      </p>
                    </div>
                  )}

                  {!isLocked && otpRateLimitMessage && (
                    <div className="text-center py-2 px-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm text-red-700 font-semibold">{otpRateLimitMessage}</p>
                    </div>
                  )}

                  {resendRemainingSeconds > 0 && !isLocked && (
                    <p className="text-center text-xs text-muted-foreground">
                      Resend available in {formatSeconds(resendRemainingSeconds)}
                    </p>
                  )}

                  {step === "enterNameAndOtp" && (
                    <div className="space-y-2">
                      <Label htmlFor="userName" className="text-sm font-medium">
                        Your Name <span className="text-destructive">*</span>
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
                        className={cn(
                          !newUserName.trim() && nameError && "border-destructive"
                        )}
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
                    <p className="text-center text-xs text-muted-foreground -mb-1">
                      Enter your name above to enable OTP entry
                    </p>
                  )}

                  <div
                    className={cn(
                      "flex justify-center gap-2 sm:gap-3 py-2",
                      authError?.type === "invalid" && "animate-[shake_0.28s_ease-in-out]"
                    )}
                  >
                    {otp.map((digit: string, index: number) => (
                      <Input
                        key={index}
                        id={`otp-digit-${index + 1}`}
                        name={`otpDigit${index + 1}`}
                        ref={(el) => {
                          otpInputsRef.current[index] = el;
                        }}
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={(e) => handleOtpPaste(index, e)}
                        disabled={otpInputDisabled}
                        className="h-12 w-11 text-center text-base font-semibold sm:w-12 sm:text-lg"
                        inputMode="numeric"
                        aria-label={`OTP digit ${index + 1}`}
                        aria-invalid={!!otpErrorMessage}
                        autoComplete={index === 0 ? "one-time-code" : "off"}
                      />
                    ))}
                  </div>

                  <div className="flex flex-col items-center mt-1 mb-2">
                    <FormError
                      id="otp-error"
                      message={otpErrorMessage}
                      className="text-center text-xs sm:text-sm text-destructive m-0 mb-2"
                    />
                    {canResend && (
                      <Button
                        variant="link"
                        disabled={isSendingOTP || isVerifying || isBlocked || isLocked || isSendRateLimited}
                        onClick={handleResendOtp}
                        className="h-auto p-0 text-sm font-semibold text-link hover:text-link-dark"
                      >
                        {isSendingOTP && (
                          <Loader2 className="animate-spin mr-2" size={14} />
                        )}
                        {isSendRateLimited ? `Resend OTP in ${formatSeconds(rateLimitRemainingSeconds)}` : "Resend OTP"}
                      </Button>
                    )}
                  </div>

                  {authError?.type === "generic" && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 mt-2">
                      <FormError
                        message={authError.message}
                        className="mt-0 text-xs sm:text-sm text-red-600"
                      />
                    </div>
                  )}

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
                      className="mt-2 w-full h-11"
                    >
                      {isVerifying && (
                        <Loader2 className="animate-spin mr-2" size={18} />
                      )}
                      Verify OTP
                    </Button>
                  </div>
                </div>
              )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
