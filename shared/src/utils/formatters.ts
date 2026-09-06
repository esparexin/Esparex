/**
 * Shared formatting utilities for Esparex.
 */

export const APP_LOCALE = "en-IN";
export const APP_TIME_ZONE = "Asia/Kolkata";

export const formatPrice = (price: number): string =>
    new Intl.NumberFormat(APP_LOCALE, {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(price);

export const formatStableNumber = (value: number, options?: Intl.NumberFormatOptions): string =>
    new Intl.NumberFormat(APP_LOCALE, options).format(value);

const toDate = (value: string | Date): Date => (typeof value === "string" ? new Date(value) : value);

export const formatStableDate = (date: string | Date, options?: Intl.DateTimeFormatOptions): string =>
    new Intl.DateTimeFormat(APP_LOCALE, { timeZone: "UTC", day: "numeric", month: "short", year: "numeric", ...options }).format(toDate(date));

export const formatDate = (date: string | Date): string => formatStableDate(date);

export const formatStableTime = (date: string | Date, options?: Intl.DateTimeFormatOptions): string =>
    new Intl.DateTimeFormat(APP_LOCALE, { timeZone: "UTC", hour: "2-digit", minute: "2-digit", ...options }).format(toDate(date));

export const formatStableDateTime = (date: string | Date, options?: Intl.DateTimeFormatOptions): string =>
    new Intl.DateTimeFormat(APP_LOCALE, { timeZone: "UTC", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", ...options }).format(toDate(date));

export const formatAppDate = (date: string | Date, options?: Intl.DateTimeFormatOptions): string =>
    formatStableDate(date, { timeZone: APP_TIME_ZONE, ...options });

export const formatAppTime = (date: string | Date, options?: Intl.DateTimeFormatOptions): string =>
    formatStableTime(date, { timeZone: APP_TIME_ZONE, ...options });

export const formatAppDateTime = (date: string | Date, options?: Intl.DateTimeFormatOptions): string =>
    formatStableDateTime(date, { timeZone: APP_TIME_ZONE, ...options });

export const formatShortRelativeTime = (value: string | Date, now = Date.now()): string => {
    const date = toDate(value);
    const diffMs = now - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "1 day ago";

    const dateYear = date.getUTCFullYear();
    const currentYear = new Date(now).getUTCFullYear();
    if (dateYear !== currentYear) {
        return formatStableDate(date, { day: "numeric", month: "short", year: "numeric" });
    }
    return formatStableDate(date, { day: "numeric", month: "short", year: undefined });
};

const HTML_ENTITIES: Record<string, string> = {
    "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&#x27;": "'", "&nbsp;": " ", "&amp;": "&"
};

export function decodeHtmlEntities(str: string): string {
    if (!str || typeof str !== "string") return "";
    return str.replace(/&(?:lt|gt|quot|#39|#x27|nbsp|amp);/g, (entity) => HTML_ENTITIES[entity] ?? entity);
}

export function isNetworkError(error: unknown): boolean {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        return message.includes('network') || message.includes('fetch') || message.includes('failed to fetch');
    }
    return false;
}

export const asOptionalString = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
};



