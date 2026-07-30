import { useCallback, useState } from "react";
import { useCountdown } from "./useCountdown";
import { AuthStep, RateLimitScope, RateLimitState, LockedMobilesState } from "./useOtpFlowTypes";

export function useOtpTimers(step: AuthStep, onLockReturnPhase: () => void) {
    const [lockUntilMs, setLockUntilMs] = useState<number | null>(null);
    const [activeLockedMobile, setActiveLockedMobile] = useState<string | null>(null);
    const [lockedMobiles, setLockedMobiles] = useState<LockedMobilesState>({});
    const [resendAvailableAtMs, setResendAvailableAtMs] = useState<number | null>(null);
    const [rateLimit, setRateLimit] = useState<RateLimitState | null>(null);

    const recordMobileLock = useCallback((mobileDigits: string, lockUntil: number, message: string) => {
        setLockedMobiles((prev) => ({
            ...prev,
            [mobileDigits]: { lockUntilMs: lockUntil, message }
        }));
        setActiveLockedMobile(mobileDigits);
        setLockUntilMs(lockUntil);
    }, []);

    const evictMobileLock = useCallback((mobileDigits: string) => {
        setLockedMobiles((prev) => {
            if (!prev[mobileDigits]) return prev;
            const next = { ...prev };
            delete next[mobileDigits];
            return next;
        });
    }, []);

    const getMobileLockInfo = useCallback((mobileDigits: string) => {
        if (!mobileDigits) return null;
        const info = lockedMobiles[mobileDigits];
        if (!info) return null;
        const now = Date.now();
        if (info.lockUntilMs <= now) {
            evictMobileLock(mobileDigits);
            return null;
        }
        const remainingSeconds = Math.max(0, Math.ceil((info.lockUntilMs - now) / 1000));
        return {
            lockUntilMs: info.lockUntilMs,
            message: info.message,
            remainingSeconds,
        };
    }, [evictMobileLock, lockedMobiles]);

    const clearRateLimit = useCallback((scope?: RateLimitScope) => {
        setRateLimit((prev: RateLimitState | null) => {
            if (!prev) return null;
            if (!scope || prev.scope === scope) return null;
            return prev;
        });
    }, []);

    const onLockCountdownComplete = useCallback(() => {
        if (step !== "locked") return;
        if (activeLockedMobile) {
            evictMobileLock(activeLockedMobile);
        }
        setLockUntilMs(null);
        setActiveLockedMobile(null);
        onLockReturnPhase();
    }, [activeLockedMobile, evictMobileLock, step, onLockReturnPhase]);

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
        activeLockedMobile, setActiveLockedMobile,
        lockedMobiles, recordMobileLock, evictMobileLock, getMobileLockInfo,
        resendAvailableAtMs, setResendAvailableAtMs,
        rateLimit, setRateLimit,
        clearRateLimit,
        lockRemainingSeconds,
        resendRemainingSeconds,
        rateLimitRemainingSeconds,
    };
}

