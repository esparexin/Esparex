import * as React from "react";
import { cn } from "../utils";
import { Input } from "./Input";

export interface OtpInputProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  length?: number;
  value?: string;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  autoFocus?: boolean;
}

const createEmptyOtp = (length: number, value?: string): string[] => {
  const arr = Array(length).fill("");
  if (value) {
    const chars = value.split("").slice(0, length);
    chars.forEach((c, i) => { arr[i] = c; });
  }
  return arr;
};

export const OtpInput = React.forwardRef<HTMLDivElement, OtpInputProps>(
  ({ length = 6, value = "", onChange, onComplete, disabled, hasError, autoFocus, className, ...props }, ref) => {
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);
    const [otp, setOtp] = React.useState<string[]>(() => createEmptyOtp(length, value));

    React.useEffect(() => {
      setOtp(createEmptyOtp(length, value));
    }, [value, length]);

    React.useEffect(() => {
      if (autoFocus && !disabled) {
        const timer = setTimeout(() => {
          inputRefs.current[0]?.focus({ preventScroll: true });
        }, 50);
        return () => clearTimeout(timer);
      }
      return undefined;
    }, [autoFocus, disabled]);

    const focusInput = React.useCallback((index: number) => {
      inputRefs.current[index]?.focus({ preventScroll: true });
    }, []);

    const updateOtp = React.useCallback(
      (next: string[]) => {
        setOtp(next);
        const nextValue = next.join("");
        onChange?.(nextValue);
        if (nextValue.length === length) {
          onComplete?.(nextValue);
        }
      },
      [length, onChange, onComplete]
    );

    const handleChange = React.useCallback(
      (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        if (disabled) return;
        const val = e.target.value.replace(/\D/g, "");

        // Handle multi-character paste / iOS SMS autofill ("From Messages")
        if (val.length > 1) {
          const digits = val.slice(0, length).split("");
          const next = [...otp];
          digits.forEach((digit, i) => {
            if (i < length) {
              next[i] = digit;
            }
          });
          updateOtp(next);
          const nextFocus = Math.min(digits.length, length - 1);
          focusInput(nextFocus);
          return;
        }

        const next = [...otp];
        next[index] = val;

        if (val && index < length - 1) {
          focusInput(index + 1);
        }

        updateOtp(next);
      },
      [disabled, otp, length, focusInput, updateOtp]
    );

    const handleKeyDown = React.useCallback(
      (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (disabled) return;

        if (e.key === "Backspace") {
          e.preventDefault();
          const next = [...otp];
          if (next[index]) {
            next[index] = "";
            updateOtp(next);
            return;
          }
          if (index > 0) {
            next[index - 1] = "";
            focusInput(index - 1);
            updateOtp(next);
          }
          return;
        }

        if (e.key === "ArrowLeft" && index > 0) {
          e.preventDefault();
          focusInput(index - 1);
          return;
        }

        if (e.key === "ArrowRight" && index < length - 1) {
          e.preventDefault();
          focusInput(index + 1);
        }
      },
      [disabled, otp, focusInput, updateOtp, length]
    );

    const handlePaste = React.useCallback(
      (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
        if (disabled) return;
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
        if (!pasted) return;

        e.preventDefault();
        const next = [...otp];
        // If pasted a full OTP code (or more), fill starting from index 0 for robust UX
        const startIdx = pasted.length >= length ? 0 : index;
        const digits = pasted.slice(0, length - startIdx).split("");

        digits.forEach((digit, offset) => {
          next[startIdx + offset] = digit;
        });

        const focusIndex = Math.min(startIdx + digits.length, length - 1);
        focusInput(focusIndex);
        updateOtp(next);
      },
      [disabled, otp, length, focusInput, updateOtp]
    );

    return (
      <div
        ref={ref}
        role="group"
        aria-label={`${length}-digit verification code`}
        className={cn("flex items-center justify-center gap-1.5 xs:gap-2 sm:gap-2.5 md:gap-3 py-2 max-w-full", className)}
        {...props}
      >
        {otp.map((digit, index) => (
          <Input
            key={index}
            id={`otp-digit-${index + 1}`}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={(e) => handlePaste(index, e)}
            disabled={disabled}
            className={cn(
              "h-14 min-h-[56px] w-10.5 xs:w-11 sm:w-12 px-0 text-center font-mono text-xl sm:text-2xl font-bold rounded-xl bg-background hover:bg-muted/30 focus-visible:bg-background border-border/80 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15 transition-all shadow-xs flex-1 max-w-[50px] min-w-0",
              hasError && "border-destructive ring-4 ring-destructive/15 focus-visible:ring-destructive/20 focus-visible:border-destructive"
            )}
            inputMode="numeric"
            aria-label={`OTP digit ${index + 1}`}
            aria-invalid={hasError}
            autoComplete={index === 0 ? "one-time-code" : "off"}
          />
        ))}
      </div>
    );
  }
);
OtpInput.displayName = "OtpInput";
