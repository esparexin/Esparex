/**
 * Normalize a `?next=` redirect URL to a safe, app-internal path.
 *
 * Rejects:
 *  - Empty / missing values → fallback to "/dashboard"
 *  - Protocol-relative paths like //evil.com → fallback
 *  - Paths with CR/LF (header-injection) → fallback
 *  - Any URL whose resolved origin differs from the dummy local origin → fallback
 */
export function normalizeAdminRedirectUrl(raw?: string | null): string {
    const fallback = "/dashboard";
    if (!raw) return fallback;

    const trimmed = raw.trim();
    if (!trimmed) return fallback;

    let decoded = trimmed;
    try {
        decoded = decodeURIComponent(trimmed);
    } catch {
        decoded = trimmed;
    }

    if (!decoded.startsWith("/")) return fallback;
    if (decoded.startsWith("//")) return fallback;
    if (/[\r\n]/.test(decoded)) return fallback;

    try {
        const url = new URL(decoded, "https://esparex-admin.local");
        if (url.origin !== "https://esparex-admin.local") return fallback;
        const normalizedPath = url.pathname.replace(/\/{2,}/g, "/");
        return `${normalizedPath}${url.search}${url.hash}`;
    } catch {
        return fallback;
    }
}
