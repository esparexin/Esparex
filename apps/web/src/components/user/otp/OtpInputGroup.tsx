"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export interface OtpInputGroupProps {
  otp: string[];
  otpInputsRef: React.MutableRefObject<(HTMLInputElement | null)[]>;
  handleOtpChange: (index: number, value: string) => void;
  handleOtpKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleOtpPaste: (index: number, e: React.ClipboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  hasError?: boolean;
  shakeAnimation?: boolean;
}

function areOtpInputGroupPropsEqual(
  prevProps: OtpInputGroupProps,
  nextProps: OtpInputGroupProps
): boolean {
  return (
    prevProps.disabled === nextProps.disabled &&
    prevProps.hasError === nextProps.hasError &&
    prevProps.shakeAnimation === nextProps.shakeAnimation &&
    prevProps.otp.length === nextProps.otp.length &&
    prevProps.otp.every((digit, i) => digit === nextProps.otp[i])
  );
}

export const OtpInputGroup = memo(function OtpInputGroup({
  otp,
  otpInputsRef,
  handleOtpChange,
  handleOtpKeyDown,
  handleOtpPaste,
  disabled,
  hasError,
  shakeAnimation,
}: OtpInputGroupProps) {
  return (
    <div
      className={cn(
        "flex justify-center gap-2 sm:gap-3 py-2",
        shakeAnimation && "animate-[shake_0.28s_ease-in-out]"
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
          disabled={disabled}
          className="h-12 w-11 text-center text-base font-semibold sm:w-12 sm:text-lg"
          inputMode="numeric"
          aria-label={`OTP digit ${index + 1}`}
          aria-invalid={hasError}
          autoComplete={index === 0 ? "one-time-code" : "off"}
        />
      ))}
    </div>
  );
}, areOtpInputGroupPropsEqual);

OtpInputGroup.displayName = "OtpInputGroup";
