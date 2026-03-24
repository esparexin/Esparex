/**
 * Shared utility functions for header components
 */

/**
 * Generates user initials from name or mobile number
 * @param name User's full name
 * @param mobile User's mobile number (optional)
 * @returns Two letter string (e.g., "JD" or "KV")
 */
export function getUserInitials(name: string, mobile?: string): string {
    if (name) {
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }
    return mobile ? mobile.substring(0, 2) : 'U';
}
