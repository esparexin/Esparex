import logger from "@/lib/logger";
// src/lib/api/validateApiEnv.ts

let validated = false;

export function validateApiEnv() {
    // Prevent multiple executions (HMR / re-imports)
    if (validated) return;
    validated = true;

    // Runtime safety
    if (typeof process === "undefined") return;
    if (process.env.SKIP_ENV_VALIDATION === "true") return;

    const url = process.env.NEXT_PUBLIC_API_URL?.trim();
    const nodeEnv = process.env.NODE_ENV;
    const appEnv = process.env.NEXT_PUBLIC_APP_ENV || 'local';
    const riskOverride = process.env.PROD_RISK_OVERRIDE === 'true';

    if (!url) {
        if (process.env.NODE_ENV === 'production' || process.env.SKIP_ENV_VALIDATION === 'true') {
            logger.error("[ESPAREX CONFIG ERROR] NEXT_PUBLIC_API_URL is missing during build/export. Skipping hard throw.");
            return;
        }
        throw new Error(
            "[ESPAREX CONFIG ERROR] NEXT_PUBLIC_API_URL is missing"
        );
    }

    // Must include protocol
    if (!/^https?:\/\//.test(url)) {
        throw new Error(
            `[ESPAREX CONFIG ERROR] API URL must include protocol (http/https): ${url}`
        );
    }

    // Must include API base
    if (!url.includes("/api")) {
        throw new Error(
            `[ESPAREX CONFIG ERROR] NEXT_PUBLIC_API_URL must include /api (example: https://api.esparex.com/api/v1): ${url}`
        );
    }

    // 🛡️ ARCHITECTURAL BOOT GUARD — PRODUCTION GATING
    if (appEnv === 'production') {
        const hasRedRisks = url.includes("localhost") || url.includes("127.0.0.1");

        if (hasRedRisks && !riskOverride) {
            throw new Error(
                `❌ [PRODUCTION BOOT BLOCKED] Unresolved security governance risks detected.\n` +
                `The production environment cannot run while known RED risks exist (e.g. localhost API URL: ${url}).\n` +
                `If this is intentional, set PROD_RISK_OVERRIDE=true.`
            );
        }
    }

    // Development rules
    if (nodeEnv === "development") {
        if (
            url.includes("prod") ||
            (url.includes("vercel.app") && !url.includes("preview"))
        ) {
            throw new Error(
                `[ESPAREX CONFIG ERROR] Development build is pointing to PRODUCTION API: ${url}`
            );
        }
    }

    // Legacy standard check (Node-specific)
    if (nodeEnv === "production" && !url.includes("esparex.com") && !riskOverride) {
        // This serves as a secondary check if APP_ENV isn't set but we are in a production build
        if (url.includes("localhost") || url.includes("127.0.0.1")) {
            throw new Error(`[ESPAREX CONFIG ERROR] Production build cannot use localhost API: ${url}`);
        }
    }
}

