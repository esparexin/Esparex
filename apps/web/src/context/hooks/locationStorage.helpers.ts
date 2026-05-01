import { appLocationSchema } from "@/schemas/location.schema";
import type { AppLocation } from "@/types/location";
import logger from "@/lib/logger";

const TTL_MANUAL_MS = 30 * 24 * 60 * 60 * 1000;
const TTL_AUTO_MS = 7 * 24 * 60 * 60 * 1000;

export function parseStoredAppLocation(
    raw: string | null,
    now = Date.now()
): AppLocation | null {
    if (!raw) return null;

    try {
        const parsedJson = JSON.parse(raw);
        const parsed = appLocationSchema.safeParse(parsedJson);
        if (!parsed.success) {
            logger.warn("Stale location data cleared from storage", { error: parsed.error.flatten() });
            return null;
        }

        const stored = parsed.data as AppLocation & { detectedAt?: number };
        const ttl = stored.source === "manual" ? TTL_MANUAL_MS : TTL_AUTO_MS;
        const age = now - (stored.detectedAt ?? 0);

        if (age > ttl) {
            return null;
        }

        return stored;
    } catch {
        return null;
    }
}
