import User from '../models/User';
import logger from '../utils/logger';
import { runWithDistributedJobLock } from '../utils/distributedJobLock';

const GEO_AUDIT_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24h
const GEO_AUDIT_STARTUP_DELAY_MS = 15_000;
const GEO_AUDIT_LOCK_TTL_MS = 10 * 60 * 1000;
const GEO_AUDIT_JOB_NAME = 'user_geo_audit';

type GeoAuditUserDoc = {
    _id: unknown;
    location?: {
        coordinates?: unknown;
    };
};

const isFiniteNumber = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value);

const hasValidLngLat = (lng: unknown, lat: unknown): lng is number =>
    isFiniteNumber(lng) &&
    isFiniteNumber(lat) &&
    lng >= -180 &&
    lng <= 180 &&
    lat >= -90 &&
    lat <= 90 &&
    !(lng === 0 && lat === 0);

const inspectUserCoordinates = (value: unknown): { valid: true } | { valid: false; reason: string } => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return { valid: false, reason: 'non_object_coordinates' };
    }

    const point = value as { type?: unknown; coordinates?: unknown };
    if (point.type !== 'Point') {
        return { valid: false, reason: 'non_point_type' };
    }

    if (!Array.isArray(point.coordinates)) {
        return { valid: false, reason: 'non_array_pair' };
    }

    if (point.coordinates.length !== 2) {
        return { valid: false, reason: 'invalid_length' };
    }

    const [lng, lat] = point.coordinates as unknown[];
    if (!hasValidLngLat(lng, lat)) {
        return { valid: false, reason: 'invalid_range_or_type' };
    }

    return { valid: true };
};

const runGeoAudit = async (): Promise<void> => {
    try {
        await runWithDistributedJobLock(
            GEO_AUDIT_JOB_NAME,
            { ttlMs: GEO_AUDIT_LOCK_TTL_MS, failOpen: false },
            async () => {
                const cursor = User.find({ 'location.coordinates': { $exists: true } })
                    .select('_id location.coordinates')
                    .lean()
                    .cursor();

                let scannedUsers = 0;
                const invalidUsers: Array<{ userId: string; reason: string }> = [];

                for await (const user of cursor as AsyncIterable<GeoAuditUserDoc>) {
                    scannedUsers += 1;
                    const result = inspectUserCoordinates(user.location?.coordinates);
                    if (!result.valid) {
                        invalidUsers.push({
                            userId: String(user._id),
                            reason: result.reason,
                        });
                    }
                }

                if (invalidUsers.length > 0) {
                    logger.warn('[GeoAudit] Invalid user coordinates detected', {
                        scannedUsers,
                        invalidCount: invalidUsers.length,
                        samples: invalidUsers.slice(0, 50),
                        sampleTruncated: invalidUsers.length > 50,
                    });
                    return;
                }

                logger.info('[GeoAudit] User coordinates are valid', { scannedUsers });
            }
        );
    } catch (error) {
        // No HTTP response: this is a cron job - errors are logged for monitoring
        logger.error('[GeoAudit] Audit job failed', {
            error: error instanceof Error ? error.message : String(error),
        });
        // TODO: Add telemetry/alerting if audit gaps emerge
    }
};

export const startGeoAuditCron = (): void => {
    setTimeout(() => {
        void runGeoAudit();
        setInterval(() => {
            void runGeoAudit();
        }, GEO_AUDIT_INTERVAL_MS);
    }, GEO_AUDIT_STARTUP_DELAY_MS);

    logger.info('[GeoAudit] Scheduled to run every 24 hours');
};

export default startGeoAuditCron;

