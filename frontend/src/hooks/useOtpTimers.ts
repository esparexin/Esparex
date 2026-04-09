import { useCallback, useState } from "react";
import { useCountdown } from "./useCountdown";
import { OtpEntryStep, AuthStep, RateLimitScope, RateLimitState } from "./useOtpFlowTypes";

export function useOtpTimers(step: AuthStep, onLockReturnPhase: (step: OtpEntryStep) => void) {
    const [lockUntilMs, setLockUntilMs] = useState<number | null>(null);
    const [lockReturnStep, setLockReturnStep] = useState<OtpEntryStep>("enterOtp");
    const [resendAvailableAtMs, setResendAvailableAtMs] = useState<number | null>(null);
    const [rateLimit, setRateLimit] = useState<RateLimitState | null>(null);

    const clearRateLimit = useCallback((scope?: RateLimitScope) => {
        setRateLimit((prev: RateLimitState | null) => {
            if (!prev) return null;
            if (!scope || prev.scope === scope) return null;
            return prev;
        });
    }, []);

    const onLockCountdownComplete = useCallback(() => {
        if (step !== "locked") return;
        setLockUntilMs(null);
        onLockReturnPhase(lockReturnStep);
    }, [lockReturnStep, step, onLockReturnPhase]);

    // setResendAvailableAtMs and setRateLimit are React state setters — stable
    // across renders — so these callbacks are stable without needing extra refs.
    const onResendComplete = useCallback(() => { setResendAvailableAtMs(null); }, [setResendAvailableAtMs]);
    const onRateLimitComplete = useCallback(() => { setRateLimit(null); }, [setRateLimit]);

    const { remainingSeconds: lockRemainingSeconds } = useCountdown(
        step === "locked" ? lockUntilMs : null,
        { onComplete: onLockCountdownComplete }
    );
    const { remainingSeconds: resendRemainingSeconds } = useCountdown(
        resendAvailableAtMs,
        { onComplete: onResendComplete }
    );
    const { remainingSeconds: rateLimitRemainingSeconds } = useCountdown(
        rateLimit?.untilMs ?? null,
        { onComplete: onRateLimitComplete }
    );

    return {
        lockUntilMs, setLockUntilMs,
        lockReturnStep, setLockReturnStep,
        resendAvailableAtMs, setResendAvailableAtMs,
        rateLimit, setRateLimit,
        clearRateLimit,
        lockRemainingSeconds,
        resendRemainingSeconds,
        rateLimitRemainingSeconds,
    };
}
