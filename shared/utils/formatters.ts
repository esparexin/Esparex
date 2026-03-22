/**
 * Shared formatting utilities for Esparex.
 */

/**
 * Formats a number as Indian Rupee (INR) currency.
 * @param price - The numeric value to format.
 * @returns A formatted string e.g., "₹50,000"
 */
export const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(price);
};

/**
 * Formats a date string into a human-readable display.
 * @param date - ISO date string or Date object.
 * @returns Formatted date string.
 */
export const formatDate = (date: string | Date): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-IN", {
        timeZone: "UTC",
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(d);
};
