const LOCAL_API_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function isLocalApiHost(hostname: string): boolean {
    return LOCAL_API_HOSTS.has(hostname);
}

/**
 * In local development, if the browser is opened via a LAN hostname/IP
 * (for example on a phone), requests to localhost/127.0.0.1 must be
 * rewritten to the current browser hostname so they still reach the dev box.
 */
export function resolveBrowserApiBaseUrl(rawBaseUrl: string): string {
    const normalizedBaseUrl = rawBaseUrl.replace(/\/$/, "");

    if (typeof window === "undefined" || process.env.NODE_ENV !== "development") {
        return normalizedBaseUrl;
    }

    const browserHostname = window.location.hostname;

    try {
        const nextUrl = new URL(normalizedBaseUrl);
        const apiHostname = nextUrl.hostname;

        if (!browserHostname || browserHostname === apiHostname) {
            return normalizedBaseUrl;
        }

        const apiUsesLocalHost = isLocalApiHost(apiHostname);
        if (!apiUsesLocalHost) {
            return normalizedBaseUrl;
        }

        // Keep protocol and port, swap only the host when the frontend is opened
        // through a different local/LAN hostname.
        nextUrl.hostname = browserHostname;
        return nextUrl.toString().replace(/\/$/, "");
    } catch {
        return normalizedBaseUrl;
    }
}
