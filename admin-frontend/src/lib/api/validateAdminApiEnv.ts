import {
  ADMIN_API_V1_BASE_PATH,
  DEFAULT_LOCAL_API_ORIGIN,
} from "@/lib/api/routes";

let cachedAdminApiBase: string | null = null;

const LOCALHOST_URL_PATTERN = /^https?:\/\/(?:localhost|127(?:\.\d{1,3}){3})(?::\d+)?(?:\/|$)/i;

const normalizeBaseUrl = (value: string): string => value.trim().replace(/\/+$/, "");

const getDefaultAdminApiBase = (): string =>
  `${DEFAULT_LOCAL_API_ORIGIN}${ADMIN_API_V1_BASE_PATH}`;

export function resolveValidatedAdminApiBase(): string {
  if (cachedAdminApiBase) {
    return cachedAdminApiBase;
  }

  if (typeof process === "undefined") {
    cachedAdminApiBase = getDefaultAdminApiBase();
    return cachedAdminApiBase;
  }

  const nodeEnv = process.env.NODE_ENV;
  const appEnv = (process.env.NEXT_PUBLIC_APP_ENV || nodeEnv || "development").trim().toLowerCase();
  const riskOverride = process.env.PROD_RISK_OVERRIDE === "true";
  const configuredUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL?.trim();
  const isProduction = appEnv === "production";

  if (!configuredUrl) {
    if (isProduction) {
      throw new Error(
        "[ESPAREX CONFIG ERROR] NEXT_PUBLIC_ADMIN_API_URL is required in production."
      );
    }

    cachedAdminApiBase = getDefaultAdminApiBase();
    return cachedAdminApiBase;
  }

  if (!/^https?:\/\//.test(configuredUrl)) {
    throw new Error(
      `[ESPAREX CONFIG ERROR] NEXT_PUBLIC_ADMIN_API_URL must include protocol (http/https): ${configuredUrl}`
    );
  }

  const normalizedUrl = normalizeBaseUrl(configuredUrl);

  if (!normalizedUrl.includes(ADMIN_API_V1_BASE_PATH)) {
    throw new Error(
      `[ESPAREX CONFIG ERROR] NEXT_PUBLIC_ADMIN_API_URL must include ${ADMIN_API_V1_BASE_PATH} (example: https://api.exparex.in${ADMIN_API_V1_BASE_PATH}): ${configuredUrl}`
    );
  }

  if (isProduction && LOCALHOST_URL_PATTERN.test(normalizedUrl) && !riskOverride) {
    throw new Error(
      `[PRODUCTION BOOT BLOCKED] NEXT_PUBLIC_ADMIN_API_URL cannot use localhost in production: ${configuredUrl}`
    );
  }

  if (
    nodeEnv === "development" &&
    normalizedUrl.includes("api.exparex.in") &&
    !riskOverride
  ) {
    throw new Error(
      `[ESPAREX CONFIG ERROR] Development build is pointing to the production admin API: ${configuredUrl}`
    );
  }

  cachedAdminApiBase = normalizedUrl;
  return cachedAdminApiBase;
}
