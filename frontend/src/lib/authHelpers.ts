/**
 * Normalize login callback URLs to app-internal paths only.
 * Rejects any external or non-root-relative URL.
 */
export const normalizeAuthCallbackUrl = (raw?: string | null): string => {
    if (!raw) return "/";

    const trimmed = raw.trim();
    if (!trimmed) return "/";

    // Decode once so encoded protocol-relative payloads like %2F%2Fevil.com
    // are handled by the same checks.
    let decoded = trimmed;
    try {
        decoded = decodeURIComponent(trimmed);
    } catch {
        decoded = trimmed;
    }

    if (!decoded.startsWith("/")) return "/";
    if (decoded.startsWith("//")) return "/";
    if (/[\r\n]/.test(decoded)) return "/";

    try {
        const url = new URL(decoded, "https://esparex.local");
        if (url.origin !== "https://esparex.local") return "/";

        const normalizedPath = url.pathname.replace(/\/{2,}/g, "/");
        return `${normalizedPath}${url.search}${url.hash}`;
    } catch {
        return "/";
    }
};

type SearchParamsLike =
    | string
    | URLSearchParams
    | { toString(): string }
    | null
    | undefined;

const toSearchParams = (input?: SearchParamsLike): URLSearchParams => {
    if (!input) {
        return new URLSearchParams();
    }

    if (typeof input === "string") {
        return new URLSearchParams(input.startsWith("?") ? input.slice(1) : input);
    }

    return new URLSearchParams(input.toString());
};

export const buildAuthCallbackUrl = (
    pathname: string,
    searchParams?: SearchParamsLike
): string => {
    const safePathname = pathname?.trim() || "/";
    const params = toSearchParams(searchParams);
    params.delete("callbackUrl");

    const query = params.toString();
    return normalizeAuthCallbackUrl(query ? `${safePathname}?${query}` : safePathname);
};

export const buildLoginUrl = (callbackUrl: string): string =>
    `/login?callbackUrl=${encodeURIComponent(normalizeAuthCallbackUrl(callbackUrl))}`;

const LOGOUT_REDIRECT_BYPASS_KEY = "esparex_logout_redirect_bypass";
const LOGOUT_REDIRECT_BYPASS_PREFIXES = [
    "/account",
    "/business/edit",
    "/edit-ad",
    "/edit-service",
    "/edit-spare-part",
    "/post-ad",
    "/post-service",
    "/post-spare-part-listing",
] as const;

export const shouldUseLogoutRedirectBypass = (pathname?: string | null): boolean => {
    if (!pathname) return false;
    return LOGOUT_REDIRECT_BYPASS_PREFIXES.some((prefix) =>
        pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
};

export const markLogoutRedirectBypass = () => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(LOGOUT_REDIRECT_BYPASS_KEY, "1");
};

export const consumeLogoutRedirectBypass = (): boolean => {
    if (typeof window === "undefined") return false;
    const shouldBypass = window.sessionStorage.getItem(LOGOUT_REDIRECT_BYPASS_KEY) === "1";
    if (shouldBypass) {
        window.sessionStorage.removeItem(LOGOUT_REDIRECT_BYPASS_KEY);
    }
    return shouldBypass;
};
