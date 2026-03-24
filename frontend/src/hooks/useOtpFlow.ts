"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/context/AuthContext";
import { useOtpInput } from "@/hooks/useOtpInput";
import { haptics } from "@/lib/haptics";
import { formatPhoneForAPI, validateIndianMobile } from "@/lib/validation";
import { useStateMachine } from "@/state-machines/useStateMachine";
import { otpAuthMachine } from "@/state-machines/otpAuthMachine";

import { useOtpTimers } from "./useOtpTimers";
import type { AuthStep, OtpEntryStep, AuthError, RateLimitScope } from "./useOtpFlowTypes";
export type { AuthStep, OtpEntryStep, AuthError, RateLimitScope };

import {
    OTP_LENGTH,
    RESEND_COOLDOWN_SECONDS,
    DEFAULT_RATE_LIMIT_RETRY_SECONDS,
    OTP_INVALID_CODE,
    BLOCKED_ERROR_CODES,
    parseEpochMs,
    mapAuthError,
    extractAuthMeta,
    isOtpExpired,
    isRateLimitedError,
    appendRateLimitCountdown
} from "@/lib/otpHelpers";

// Re-export constants to avoid breaking consuming components
export { OTP_LENGTH, RESEND_COOLDOWN_SECONDS };

const resolveOtpReturnStep = (step: AuthStep): OtpEntryStep =>
    step === "enterNameAndOtp" ? "enterNameAndOtp" : "enterOtp";

export interface OtpFlowState {
    step: AuthStep;
    mobile: string;
    setMobile: (v: string) => void;
    newUserName: string;
    setNewUserName: (v: string) => void;
    existingUserName: string;
    isSendingOTP: boolean;
    isVerifying: boolean;
    mobileError: string;
    setMobileError: (v: string) => void;
    nameError: string;
    setNameError: (v: string) => void;
    authError: AuthError;
    clearAuthErrorOfTypes: (types: Array<NonNullable<AuthError>["type"]>) => void;
    mobileInputRef: React.RefObject<HTMLInputElement>;
    nameInputRef: React.RefObject<HTMLInputElement>;
    otpInputsRef: React.MutableRefObject<(HTMLInputElement | null)[]>;
    isOtpStep: boolean;
    requiresName: boolean;
    isValidMobile: boolean;
    isBlocked: boolean;
    isLocked: boolean;
    isSendRateLimited: boolean;
    isVerifyRateLimited: boolean;
    otpInputDisabled: boolean;
    canResend: boolean;
    mobileServerError: string;
    otpErrorMessage: string;
    otpRateLimitMessage: string;
    lockRemainingSeconds: number;
    resendRemainingSeconds: number;
    rateLimitRemainingSeconds: number;
    otp: string[];
    isOtpComplete: boolean;
    handleOtpChange: (index: number, value: string) => void;
    handleOtpKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
    handleOtpPaste: (index: number, e: React.ClipboardEvent<HTMLInputElement>) => void;
    otpValue: string;
    backendReady: boolean;
    handleMobileSubmit: (e: React.FormEvent) => void;
    handleResendOtp: () => void;
    resetToMobileStep: () => void;
    verifyOtpCode: (otpValue: string) => Promise<void>;
}

export function useOtpFlow(
    onLoginSuccess: (options?: { requiresProfileSetup?: boolean }) => void
): OtpFlowState {
    const { backendReady, updateUser } = useAuth();

    const [step, setStep] = useState<AuthStep>("enterMobile");
    const [mobile, setMobile] = useState("");
    const [newUserName, setNewUserName] = useState("");
    const [existingUserName, setExistingUserName] = useState("");

    const [mobileError, setMobileError] = useState("");
    const [nameError, setNameError] = useState("");
    const [authError, setAuthError] = useState<AuthError>(null);

    const { state: machineState, send: sendMachine } = useStateMachine(otpAuthMachine);
    const isSendingOTP = machineState === "sendingOtp";
    const isVerifying = machineState === "verifyingOtp";

    const mobileInputRef = useRef<HTMLInputElement>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);
    const verifyingRef = useRef(false);
    const verifyOtpCodeRef = useRef<(otpValue: string) => void>(() => undefined);

    const isOtpStep = step === "enterNameAndOtp" || step === "enterOtp" || step === "locked";
    const requiresName = step === "enterNameAndOtp";
    const isValidMobile = mobile.length === 10 && validateIndianMobile(mobile);
    const isBlocked = authError?.type === "blocked";
    const isLocked = step === "locked";

    // Consume timers via abstracted hook
    const handleLockReturn = useCallback((returnStep: OtpEntryStep) => {
        setAuthError(null);
        setStep(returnStep);
    }, []);

    const {
        setLockUntilMs, setLockReturnStep,
        setResendAvailableAtMs,
        rateLimit, setRateLimit, clearRateLimit,
        lockRemainingSeconds, resendRemainingSeconds, rateLimitRemainingSeconds
    } = useOtpTimers(step, handleLockReturn);

    const clearAuthErrorOfTypes = useCallback((types: Array<NonNullable<AuthError>["type"]>) => {
        setAuthError((prev) => prev && types.includes(prev.type) ? null : prev);
    }, []);

    const isSendRateLimited = rateLimit?.scope === "send" && rateLimitRemainingSeconds > 0;
    const isVerifyRateLimited = rateLimit?.scope === "verify" && rateLimitRemainingSeconds > 0;
    const otpInputDisabled = isBlocked || isLocked || (requiresName && !newUserName.trim());

    const formatRateLimitMessage = useCallback(
        (message: string) => appendRateLimitCountdown(message, rateLimitRemainingSeconds > 0, rateLimitRemainingSeconds),
        [rateLimitRemainingSeconds]
    );

    const mobileServerError = step === "enterMobile" && rateLimit?.scope === "send" ? formatRateLimitMessage(rateLimit.message) : "";
    const otpErrorMessage = authError?.type === "invalid"
        ? `Invalid OTP.${typeof authError.attemptsLeft === "number" ? ` ${authError.attemptsLeft} attempts remaining.` : ""}`
        : "";
    const otpRateLimitMessage = step !== "enterMobile" && rateLimit ? formatRateLimitMessage(rateLimit.message) : "";

    useEffect(() => {
        if (step !== "enterMobile") return;
        const id = window.setTimeout(() => mobileInputRef.current?.focus(), 0);
        return () => window.clearTimeout(id);
    }, [step]);

    useEffect(() => {
        if (step !== "enterNameAndOtp") return;
        const id = window.setTimeout(() => nameInputRef.current?.focus(), 0);
        return () => window.clearTimeout(id);
    }, [step]);

    const clearOtpAuthErrors = useCallback(() => {
        if (authError?.type === "invalid" || authError?.type === "generic") {
            clearAuthErrorOfTypes(["invalid", "generic"]);
        }
    }, [authError?.type, clearAuthErrorOfTypes]);

    const handleOtpAutoSubmit = useCallback((otpValue: string) => {
        if (requiresName && !newUserName.trim()) return;
        verifyOtpCodeRef.current(otpValue);
    }, [newUserName, requiresName]);

    const {
        otp, otpValue, isComplete: isOtpComplete, resetOtp,
        handleChange: handleOtpChange, handleKeyDown: handleOtpKeyDown, handlePaste: handleOtpPaste,
    } = useOtpInput({
        length: OTP_LENGTH, disabled: isVerifying || otpInputDisabled,
        inputRefs: otpInputsRef, onInteraction: clearOtpAuthErrors, onComplete: handleOtpAutoSubmit,
    });

    const resetOtpSession = useCallback(() => {
        resetOtp();
        setNameError("");
        setAuthError(null);
        setLockUntilMs(null);
        setResendAvailableAtMs(null);
        clearRateLimit();
    }, [clearRateLimit, resetOtp, setLockUntilMs, setResendAvailableAtMs]);

    const resetToMobileStep = useCallback(() => {
        if (isOtpStep && validateIndianMobile(mobile)) {
             authApi.cancelOtp(formatPhoneForAPI(mobile)).catch(() => undefined);
        }
        resetOtpSession();
        setStep("enterMobile");
        setExistingUserName("");
        setNewUserName("");
        sendMachine("RESET");
    }, [isOtpStep, mobile, resetOtpSession, sendMachine]);

    const transitionToOtpStep = useCallback(
        (options: { isNewUser: boolean; existingName?: string }) => {
            const targetStep: AuthStep = options.isNewUser ? "enterNameAndOtp" : "enterOtp";
            setStep(targetStep);
            setExistingUserName(options.existingName || "");
            resetOtp();
            setAuthError(null);
            clearRateLimit();
            setResendAvailableAtMs(Date.now() + RESEND_COOLDOWN_SECONDS * 1000);
            window.setTimeout(() => {
                if (targetStep === "enterNameAndOtp") nameInputRef.current?.focus();
                else otpInputsRef.current[0]?.focus();
            }, 100);
        },
        [clearRateLimit, resetOtp, setResendAvailableAtMs]
    );

    const applyLockedState = useCallback((lockUntil: string | number | undefined, returnStep: OtpEntryStep, fallbackMessage = "Too many failed attempts.") => {
        const lockMs = parseEpochMs(lockUntil);
        if (!lockMs) return false;
        clearRateLimit();
        setLockUntilMs(lockMs);
        setLockReturnStep(returnStep);
        setStep("locked");
        setAuthError({ type: "locked", message: fallbackMessage });
        return true;
    }, [clearRateLimit, setLockReturnStep, setLockUntilMs]);

    const applyRateLimitState = useCallback((message: string, scope: RateLimitScope, retryAfterSeconds?: number) => {
        setRateLimit({ scope, message, untilMs: Date.now() + (retryAfterSeconds ?? DEFAULT_RATE_LIMIT_RETRY_SECONDS) * 1000 });
        setAuthError(null);
    }, [setRateLimit]);

    const applyOtpExpiredState = useCallback((returnStep: OtpEntryStep) => {
        setStep(returnStep);
        setResendAvailableAtMs(Date.now());
        clearRateLimit("verify");
        setAuthError({ type: "generic", message: "OTP expired. Please resend OTP." });
    }, [clearRateLimit, setResendAvailableAtMs]);

    const requestOtp = useCallback(
        async (options: { lockReturnStep: OtpEntryStep; fallbackMessage: string }) => {
            sendMachine("SEND_OTP");
            setAuthError(null);
            let success = false;
            try {
                const result = await authApi.login(formatPhoneForAPI(mobile));
                if (!result.success) {
                    if (applyLockedState(result.lockUntil, options.lockReturnStep, result.error || "Too many failed attempts.")) return;
                    if (isRateLimitedError({ code: result.code, message: result.error })) {
                        applyRateLimitState(result.error || "Too many OTP requests", "send");
                        return;
                    }
                    throw new Error(result.error || options.fallbackMessage);
                }
                transitionToOtpStep({ isNewUser: Boolean(result.isNewUser), existingName: result.name });
                success = true;
            } catch (err: unknown) {
                const meta = extractAuthMeta(err);
                const message = mapAuthError(err, options.fallbackMessage);
                if (applyLockedState(meta.lockUntil, options.lockReturnStep, message)) return;
                if (isRateLimitedError({ status: meta.status, code: meta.code, message })) {
                    applyRateLimitState(message, "send", meta.retryAfterSeconds);
                    return;
                }
                if (meta.status === 403 || (meta.code && BLOCKED_ERROR_CODES.has(meta.code))) {
                    haptics.error();
                    setAuthError({ type: "blocked", message });
                    return;
                }
                setAuthError({ type: "generic", message });
            } finally {
                sendMachine(success ? "OTP_SENT" : "FAIL");
            }
        },
        [applyLockedState, applyRateLimitState, mobile, transitionToOtpStep, sendMachine]
    );

    const handleMobileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError(null);
        if (!validateIndianMobile(mobile)) {
            setMobileError("Please enter a valid 10-digit mobile number");
            mobileInputRef.current?.focus();
            return;
        }
        setMobileError("");
        setNameError("");
        await requestOtp({ lockReturnStep: "enterOtp", fallbackMessage: "Failed to send OTP. Please try again." });
    };

    const verifyOtpCode = useCallback(
        async (otpValue: string) => {
            if (verifyingRef.current || isBlocked || isLocked || isVerifyRateLimited) return;
            const authStepBeforeVerify = step;
            if (authStepBeforeVerify === "enterNameAndOtp" && !newUserName.trim()) {
                setNameError("Please enter your name to continue");
                nameInputRef.current?.focus();
                return;
            }
            if (otpValue.length !== OTP_LENGTH) {
                setAuthError({ type: "generic", message: "Please enter the 6-digit OTP code." });
                otpInputsRef.current[0]?.focus();
                return;
            }
            setNameError("");
            setAuthError(null);
            verifyingRef.current = true;
            sendMachine("VERIFY_OTP");
            const returnStep = resolveOtpReturnStep(authStepBeforeVerify);
            try {
                const result = await authApi.verify(
                    formatPhoneForAPI(mobile),
                    otpValue,
                    authStepBeforeVerify === "enterNameAndOtp" ? newUserName.trim() : undefined
                );
                if (!result.success) {
                    if (applyLockedState(result.lockUntil, returnStep, result.error || "Too many failed attempts.")) return;
                    if (isOtpExpired(result.code, result.error)) { applyOtpExpiredState(returnStep); return; }
                    throw result;
                }
                if (result.user) updateUser(result.user);
                // Yield one animation frame so AuthContext can propagate
                // "authenticated" status before the redirect fires in LoginFlow.
                await new Promise<void>((resolve) => { requestAnimationFrame(() => resolve()); });
                setResendAvailableAtMs(null);
                clearRateLimit();
                haptics.success();
                sendMachine("SUCCESS");
                onLoginSuccess({ requiresProfileSetup: authStepBeforeVerify === "enterNameAndOtp" || !result.user?.name });
            } catch (err: unknown) {
                const meta = extractAuthMeta(err);
                const message = mapAuthError(err, "Invalid OTP. Please try again.");
                if (applyLockedState(meta.lockUntil, returnStep, message)) return;
                if (isOtpExpired(meta.code, meta.error || message)) { applyOtpExpiredState(returnStep); return; }
                if (isRateLimitedError({ status: meta.status, code: meta.code, message })) {
                    applyRateLimitState(message, "verify", meta.retryAfterSeconds);
                    return;
                }
                if ((meta.code && BLOCKED_ERROR_CODES.has(meta.code)) || /permanently\s+(banned|blocked)|\bbanned\b|\bblocked\b/i.test(message)) {
                    haptics.error();
                    setAuthError({ type: "blocked", message });
                    return;
                }
                haptics.warning();
                if (meta.code === OTP_INVALID_CODE || /invalid otp/i.test(message) || typeof meta.attemptsLeft === "number") {
                    setAuthError({ type: "invalid", attemptsLeft: meta.attemptsLeft });
                } else {
                    setAuthError({ type: "generic", message });
                }
                sendMachine("FAIL");
            } finally {
                verifyingRef.current = false;
            }
        },
        [applyLockedState, applyOtpExpiredState, applyRateLimitState, clearRateLimit, isBlocked, isLocked, isVerifyRateLimited, mobile, newUserName, onLoginSuccess, step, updateUser, sendMachine, setResendAvailableAtMs]
    );

    useEffect(() => { verifyOtpCodeRef.current = (nextOtpValue: string) => { void verifyOtpCode(nextOtpValue); }; }, [verifyOtpCode]);

    const handleResendOtp = async () => {
        if (isSendingOTP || isBlocked || isLocked || isSendRateLimited) return;
        await requestOtp({ lockReturnStep: resolveOtpReturnStep(step), fallbackMessage: "Resend failed. Please try again." });
    };

    const canResend = useMemo(
        () => isOtpStep && resendRemainingSeconds === 0 && !isLocked && !isBlocked && !isSendRateLimited,
        [isBlocked, isLocked, isOtpStep, isSendRateLimited, resendRemainingSeconds]
    );

    return {
        backendReady, step, mobile, setMobile, newUserName, setNewUserName, existingUserName,
        isSendingOTP, isVerifying, mobileError, setMobileError, nameError, setNameError,
        authError, clearAuthErrorOfTypes, mobileInputRef, nameInputRef, otpInputsRef,
        isOtpStep, requiresName, isValidMobile, isBlocked, isLocked, isSendRateLimited,
        isVerifyRateLimited, otpInputDisabled, canResend, mobileServerError, otpErrorMessage,
        otpRateLimitMessage, lockRemainingSeconds, resendRemainingSeconds, rateLimitRemainingSeconds,
        otp, otpValue, isOtpComplete, handleOtpChange, handleOtpKeyDown, handleOtpPaste,
        handleMobileSubmit, handleResendOtp, resetToMobileStep, verifyOtpCode,
    };
}
