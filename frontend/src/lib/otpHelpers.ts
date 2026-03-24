import { mapErrorToMessage } from "@/lib/errorMapper";

export const OTP_LENGTH = 6;
export const RESEND_COOLDOWN_SECONDS = 30;
export const DEFAULT_RATE_LIMIT_RETRY_SECONDS = 30 * 60;
export const OTP_EXPIRED_CODE = "OTP_EXPIRED";
export const OTP_INVALID_CODE = "OTP_INVALID";

export const RATE_LIMIT_ERROR_CODES = new Set([
    "RATE_LIMITED",
    "OTP_SEND_IP_RATE_LIMIT",
    "OTP_SEND_MOBILE_RATE_LIMIT",
    "OTP_VERIFY_RATE_LIMIT",
    "RATE_LIMIT_EXCEEDED",
]);

export const BLOCKED_ERROR_CODES = new Set([
    "USER_BLOCKED",
    "USER_BANNED",
    "USER_SUSPENDED",
    "USER_DELETED",
    "ACCOUNT_DISABLED",
]);

export const formatSeconds = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

export const appendRateLimitCountdown = (
    message: string,
    isRateLimited: boolean,
    remainingSeconds: number
): string => {
    if (!isRateLimited) return message;
    return `${message} Try again in ${formatSeconds(remainingSeconds)}.`;
};

export const extractRawAuthMessage = (value: unknown): string | null => {
    if (!value || typeof value !== "object") {
        if (value instanceof Error && typeof value.message === "string") return value.message;
        if (typeof value === "string") return value;
        return null;
    }
    const record = value as Record<string, unknown>;
    const messageCandidates = [record.userMessage, record.message, record.error];
    for (const candidate of messageCandidates) {
        if (typeof candidate === "string" && candidate.trim()) return candidate;
    }
    return value instanceof Error ? value.message : null;
};

export const mapAuthError = (value: unknown, fallback: string): string => {
    const raw = extractRawAuthMessage(value)?.trim();
    const isGenericTransportMessage =
        typeof raw === "string" &&
        (/^request failed with status code \d{3}$/i.test(raw) ||
            /^network error$/i.test(raw) ||
            /^unexpected error$/i.test(raw));
    if (raw && !isGenericTransportMessage) return raw;
    return mapErrorToMessage(value, fallback);
};

export const extractAuthMeta = (value: unknown) => {
    if (!value || typeof value !== "object") return {};
    const asRecord = value as {
        attemptsLeft?: unknown; lockUntil?: unknown; error?: unknown;
        code?: unknown; status?: unknown; retryAfterSeconds?: unknown;
        retryAfter?: unknown; response?: { data?: unknown };
    };
    const direct = {
        attemptsLeft: typeof asRecord.attemptsLeft === "number" ? asRecord.attemptsLeft : undefined,
        lockUntil: (typeof asRecord.lockUntil === "string" || typeof asRecord.lockUntil === "number") ? asRecord.lockUntil : undefined,
        error: typeof asRecord.error === "string" ? asRecord.error : undefined,
        code: typeof asRecord.code === "string" ? asRecord.code : undefined,
        status: typeof asRecord.status === "number" ? asRecord.status : undefined,
        retryAfterSeconds:
            typeof asRecord.retryAfterSeconds === "number" ? asRecord.retryAfterSeconds :
                typeof asRecord.retryAfter === "number" ? asRecord.retryAfter : undefined,
    };
    const responseData =
        asRecord.response && typeof asRecord.response === "object"
            ? (asRecord.response.data as Record<string, unknown> | undefined)
            : undefined;
    return {
        attemptsLeft: direct.attemptsLeft ?? (typeof responseData?.attemptsLeft === "number" ? responseData.attemptsLeft : undefined),
        lockUntil: direct.lockUntil ?? ((typeof responseData?.lockUntil === "string" || typeof responseData?.lockUntil === "number") ? responseData.lockUntil : undefined),
        error: direct.error ?? (typeof responseData?.error === "string" ? responseData.error : undefined),
        code: direct.code ?? (typeof responseData?.code === "string" ? responseData.code : undefined),
        status: direct.status ?? (typeof responseData?.status === "number" ? responseData.status : undefined),
        retryAfterSeconds: direct.retryAfterSeconds ?? (typeof responseData?.retryAfterSeconds === "number" ? responseData.retryAfterSeconds : typeof responseData?.retryAfter === "number" ? responseData.retryAfter : undefined),
    };
};

export const parseEpochMs = (value: string | number | undefined): number | null => {
    if (value === undefined) return null;
    if (typeof value === "number" && Number.isFinite(value)) {
        return value < 1_000_000_000_000 ? value * 1000 : value;
    }
    if (typeof value === "string") {
        const numeric = Number(value);
        if (Number.isFinite(numeric)) return numeric < 1_000_000_000_000 ? numeric * 1000 : numeric;
        const parsed = Date.parse(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
};

export const isOtpExpiredError = (value: string | undefined): boolean =>
    typeof value === "string" && /\bexpired\b/i.test(value);

export const isRateLimitedError = (options: { status?: number; code?: string; message?: string }): boolean => {
    if (options.status === 429) return true;
    if (options.code && RATE_LIMIT_ERROR_CODES.has(options.code)) return true;
    return /too many otp requests|rate limit/i.test(options.message || "");
};

export const isOtpExpired = (code?: string, message?: string): boolean =>
    code === OTP_EXPIRED_CODE || isOtpExpiredError(message);
