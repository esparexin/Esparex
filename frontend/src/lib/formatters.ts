// ...existing code...
export { formatPrice, formatDate } from '@shared/utils/formatters';

export const APP_LOCALE = "en-IN";
export const APP_TIME_ZONE = "Asia/Kolkata";

const toDate = (value: string | Date): Date => (typeof value === "string" ? new Date(value) : value);

/**
 * Formats a date in a deterministic way for SSR/client parity.
 * Uses a fixed locale + timezone to avoid server/client locale mismatches.
 */
export const formatStableDate = (
    date: string | Date,
    options?: Intl.DateTimeFormatOptions
): string => {
    const d = toDate(date);
    return new Intl.DateTimeFormat(APP_LOCALE, {
        timeZone: "UTC",
        day: "numeric",
        month: "short",
        year: "numeric",
        ...options,
    }).format(d);
};

export const formatStableTime = (
    date: string | Date,
    options?: Intl.DateTimeFormatOptions
): string => {
    const d = toDate(date);
    return new Intl.DateTimeFormat(APP_LOCALE, {
        timeZone: "UTC",
        hour: "2-digit",
        minute: "2-digit",
        ...options,
    }).format(d);
};

export const formatStableDateTime = (
    date: string | Date,
    options?: Intl.DateTimeFormatOptions
): string => {
    const d = toDate(date);
    return new Intl.DateTimeFormat(APP_LOCALE, {
        timeZone: "UTC",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        ...options,
    }).format(d);
};

export const formatAppDate = (
    date: string | Date,
    options?: Intl.DateTimeFormatOptions
): string => formatStableDate(date, { timeZone: APP_TIME_ZONE, ...options });

export const formatAppTime = (
    date: string | Date,
    options?: Intl.DateTimeFormatOptions
): string => formatStableTime(date, { timeZone: APP_TIME_ZONE, ...options });

export const formatAppDateTime = (
    date: string | Date,
    options?: Intl.DateTimeFormatOptions
): string => formatStableDateTime(date, { timeZone: APP_TIME_ZONE, ...options });

export const formatStableNumber = (
    value: number,
    options?: Intl.NumberFormatOptions
): string => new Intl.NumberFormat(APP_LOCALE, options).format(value);

export const formatShortRelativeTime = (
    value: string | Date,
    now = Date.now()
): string => {
    const date = toDate(value);
    const diffMs = now - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return `${Math.floor(diffHours / 24)}d ago`;
};
