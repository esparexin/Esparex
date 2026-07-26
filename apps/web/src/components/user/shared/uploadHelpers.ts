/**
 * Single Source of Truth helper for accessible photo removal ARIA labels.
 * Standardizes positional context across all uploaders (e.g. "Remove photo 2 of 5").
 */
export function getRemovePhotoAriaLabel(index: number, total: number): string {
    return `Remove photo ${index + 1} of ${total}`;
}
