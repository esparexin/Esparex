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
