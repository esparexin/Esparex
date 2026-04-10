import logger from "@/lib/logger";
import { API_V1_BASE_PATH, DEFAULT_LOCAL_API_ORIGIN } from "@/lib/api/routes";
import { resolveBrowserApiBaseUrl } from "@/lib/api/browserApiBase";
import { validateApiEnv } from "@/lib/api/validateApiEnv";

const getConfiguredApiBaseUrl = (): string =>
    process.env.NEXT_PUBLIC_API_URL || `${DEFAULT_LOCAL_API_ORIGIN}${API_V1_BASE_PATH}`;

export function resolveRuntimeApiBaseUrl(): string {
    validateApiEnv();

    const configuredBaseUrl = getConfiguredApiBaseUrl();
    const resolvedBaseUrl =
        typeof window === "undefined"
            ? configuredBaseUrl
            : resolveBrowserApiBaseUrl(configuredBaseUrl);

    if (typeof window !== "undefined" && resolvedBaseUrl !== configuredBaseUrl) {
        logger.warn(`[API Client] Aligning API host to browser hostname: ${resolvedBaseUrl}`);
    }

    return resolvedBaseUrl.replace(/\/+$/, "");
}

export function resolveRuntimeApiOrigin(): string {
    try {
        return new URL(resolveRuntimeApiBaseUrl()).origin;
    } catch {
        return DEFAULT_LOCAL_API_ORIGIN;
    }
}
