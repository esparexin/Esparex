import { useCallback, useRef, useState } from "react";
import type { ClipboardEvent, KeyboardEvent, MutableRefObject } from "react";

type UseOtpInputOptions = {
  length: number;
  disabled?: boolean;
  inputRefs?: MutableRefObject<(HTMLInputElement | null)[]>;
  onInteraction?: () => void;
  onComplete?: (otpValue: string) => void;
};

const createEmptyOtp = (length: number): string[] => Array(length).fill("");

export function useOtpInput(options: UseOtpInputOptions): {
  otp: string[];
  otpValue: string;
  isComplete: boolean;
  setOtp: (otp: string[]) => void;
  resetOtp: () => void;
  inputRefs: MutableRefObject<(HTMLInputElement | null)[]>;
  handleChange: (index: number, value: string) => void;
  handleKeyDown: (index: number, event: KeyboardEvent<HTMLInputElement>) => void;
  handlePaste: (index: number, event: ClipboardEvent<HTMLInputElement>) => void;
} {
  const { length, disabled = false, inputRefs: externalRefs, onInteraction, onComplete } = options;
  const internalRefs = useRef<(HTMLInputElement | null)[]>([]);
  const inputRefs = externalRefs ?? internalRefs;

  const [otp, setOtp] = useState<string[]>(createEmptyOtp(length));
  const otpValue = otp.join("");
  const isComplete = otp.every((digit) => digit.length === 1);

  const focusInput = useCallback(
    (index: number) => {
      inputRefs.current[index]?.focus();
    },
    [inputRefs]
  );

  const resetOtp = useCallback(() => {
    setOtp(createEmptyOtp(length));
  }, [length]);

  const handleChange = useCallback(
    (index: number, value: string) => {
      if (disabled) return;

      const digit = value.replace(/\D/g, "");
      if (digit.length > 1) return;

      onInteraction?.();

      setOtp((prev) => {
        const next = [...prev];
        next[index] = digit;

        if (digit && index < length - 1) {
          focusInput(index + 1);
        }

        const nextValue = next.join("");
        if (nextValue.length === length) {
          onComplete?.(nextValue);
        }

        return next;
      });
    },
    [disabled, focusInput, length, onComplete, onInteraction]
  );

  const handleKeyDown = useCallback(
    (index: number, event: KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return;

      if (event.key === "Backspace") {
        event.preventDefault();
        onInteraction?.();

        setOtp((prev) => {
          const next = [...prev];

          if (next[index]) {
            next[index] = "";
            return next;
          }

          if (index > 0) {
            next[index - 1] = "";
            focusInput(index - 1);
          }

          return next;
        });
        return;
      }

      if (event.key === "ArrowLeft" && index > 0) {
        event.preventDefault();
        focusInput(index - 1);
        return;
      }

      if (event.key === "ArrowRight" && index < length - 1) {
        event.preventDefault();
        focusInput(index + 1);
      }
    },
    [disabled, focusInput, length, onInteraction]
  );

  const handlePaste = useCallback(
    (index: number, event: ClipboardEvent<HTMLInputElement>) => {
      if (disabled) return;

      const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
      if (!pasted) return;

      event.preventDefault();
      onInteraction?.();

      setOtp((prev) => {
        const next = [...prev];
        const digits = pasted.slice(0, length - index).split("");

        digits.forEach((digit, offset) => {
          next[index + offset] = digit;
        });

        const focusIndex = Math.min(index + digits.length, length) - 1;
        focusInput(focusIndex);

        const nextValue = next.join("");
        if (nextValue.length === length) {
          onComplete?.(nextValue);
        }

        return next;
      });
    },
    [disabled, focusInput, length, onComplete, onInteraction]
  );

  return {
    otp,
    otpValue,
    isComplete,
    setOtp,
    resetOtp,
    inputRefs,
    handleChange,
    handleKeyDown,
    handlePaste,
  };
}
