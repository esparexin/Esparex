// ...existing code...
export { formatPrice, formatDate } from '@shared/utils/formatters';

/**
 * Formats a date in a deterministic way for SSR/client parity.
 * Uses a fixed locale + UTC timezone to avoid server/client locale mismatches.
 */
export const formatStableDate = (
    date: string | Date,
    options?: Intl.DateTimeFormatOptions
): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-IN", {
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
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-IN", {
        timeZone: "UTC",
        hour: "2-digit",
        minute: "2-digit",
        ...options,
    }).format(d);
};
