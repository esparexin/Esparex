"use client";

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

export function Login({ onLoginSuccess, onBack, mode = "page" }: LoginProps) {
  const flow = useOtpFlow(onLoginSuccess);
  const { step } = flow;

  const isModal = mode === "modal";

  // Modal mode: return just the content, relying on the parent Dialog for boundaries,
  // background, and max-width.
  if (isModal) {
    return (
      <div className="w-full flex flex-col justify-center my-auto">
        <div className="relative text-center pb-3 pt-2 sm:pt-0">
          <div className="mx-auto mb-6 w-fit">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              <img src="https://esparexdev.s3.ap-south-1.amazonaws.com/public/images/recycle-icon.png" alt="Recycle Logo" className="h-12 w-12 object-contain" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl sm:text-2xl font-semibold tracking-tight">
              {step === "enterMobile" ? "Welcome to Esparex" : "Verify OTP"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {step === "enterMobile"
                ? "Login to buy & sell mobile spares"
                : "Enter the code sent to your mobile"}
            </p>
          </div>
        </div>
        <div className="px-6 sm:px-0 pb-3 sm:pb-0">
          <LoginForm flow={flow} onBack={onBack} />
        </div>
      </div>
    );
  }

  // Page mode: return the standardized Card primitive, 
  // relying on the parent AuthLayout for page-level centering and gradients.
  return (
    <Card className="w-full max-w-sm mx-auto border-0 shadow-none sm:border-slate-200/70 sm:shadow-lg rounded-none sm:rounded-xl">
      <CardHeader className="relative space-y-2 text-center sm:pt-8 pb-3 sm:pb-4">
        <div className="mx-auto mb-3 w-fit">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
            <img src="https://esparexdev.s3.ap-south-1.amazonaws.com/public/images/recycle-icon.png" alt="Recycle Logo" className="h-12 w-12 object-contain" />
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
          "px-4 sm:px-8",
          step === "enterMobile" ? "space-y-4" : "space-y-4",
          "pb-4 sm:pb-8"
        )}
      >
        <LoginForm flow={flow} onBack={onBack} />
      </CardContent>
    </Card>
  );
}

// ----------------------------------------------------------------------
// Presentation-Agnostic LoginForm
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

                  {onBack && step !== "enterMobile" && (
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
                  <div className="py-2.5 px-4 bg-slate-50/50 rounded-xl border border-slate-200/60 shadow-sm">
                    <div className="flex items-center justify-center gap-2">
                      <p className="text-sm text-slate-700">
                        OTP sent to <span className="font-semibold text-slate-900">+91 {mobile}</span>
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={resetToMobileStep}
                        disabled={isSendingOTP}
                        aria-label="Edit mobile number"
                        className="h-7 w-7 text-primary hover:text-primary/80 hover:bg-primary/10 rounded-full"
                      >
                        <Pencil size={13} />
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
              );
}
