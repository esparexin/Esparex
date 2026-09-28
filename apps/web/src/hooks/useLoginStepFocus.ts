"use client";

import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { LoginFormValues } from "@esparex/contracts";
import { AuthStep } from "@/hooks/useOtpFlow";

/**
 * Manages auto-focus transitions between login form steps.
 * Extracted from LoginForm to keep the parent component within ratchet limits.
 */
export function useLoginStepFocus(step: AuthStep, form: UseFormReturn<LoginFormValues>) {
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
}
