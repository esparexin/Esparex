"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mutateStatusesBulk = exports.mutateStatuses = exports.mutateStatus = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const db_1 = require("@core/config/db");
const LifecycleGuard_1 = require("./LifecycleGuard");
const LifecyclePolicyGuard_1 = require("./LifecyclePolicyGuard");
const StatusHistory_1 = __importDefault(require("@core/models/StatusHistory"));
const AdminMetrics_1 = __importDefault(require("@core/models/AdminMetrics"));
const logger_1 = __importDefault(require("@core/utils/logger"));
const actor_1 = require("@core/constants/enums/actor");
const adStatus_1 = require("@core/constants/enums/adStatus");
const events_1 = require("../events");
// Import domain models
const Ad_1 = __importDefault(require("@core/models/Ad"));
const User_1 = __importDefault(require("@core/models/User"));
const Business_1 = __importDefault(require("@core/models/Business"));
const toLower = (value) => typeof value === 'string' ? value.trim().toLowerCase() : '';
const isListingLifecycleDomain = (domain) => domain === 'ad' || domain === 'service' || domain === 'spare_part_listing';
const isModerationDeactivationAction = (metadata) => {
    const action = toLower(metadata?.action);
    return action === 'moderation_deactivate' || action === 'moderation_soft_delete';
};
const canBypassInvalidTransition = (params) => {
    const typedError = params.error;
    if (typedError.code !== 'INVALID_LIFECYCLE_TRANSITION')
        return false;
    if (params.actor.type !== actor_1.ACTOR_TYPE.ADMIN)
        return false;
    if (!isListingLifecycleDomain(params.resolvedDomain))
        return false;
    if (toLower(params.toStatus) !== adStatus_1.AD_STATUS.DEACTIVATED)
        return false;
    return isModerationDeactivationAction(params.metadata);
};
/**
 * 🛠️ Centralized Status Mutation Service
 *
 * Enforces transaction-safe lifecycle transitions across all domains.
 * Integrates with:
 * 1. LifecycleGuard (Validation)
 * 2. StatusHistory (Unified Audit Trail)
 * 3. Metrics Telemetry (Observability)
 */
const mutateStatus = async (request) => {
    const { domain, entityId, toStatus, actor, reason, patch, metadata, session: externalSession } = request;
    const connection = (0, db_1.getUserConnection)();
    // Session management: Use provided session or manage lifecycle of a new one
    let session = externalSession;
    let isInternalSession = false;
    if (!session) {
        session = await connection.startSession();
        isInternalSession = true;
    }
    const startTime = Date.now();
    let fromStatus = 'unknown';
    let resolvedListingType;
    try {
        let result = null;
        const executeOperations = async (activeSession) => {
            // 1. Resolve Model
            const Model = getModelForDomain(domain);
            const doc = await Model.findById(entityId).setOptions({ withDeleted: true }).session(activeSession);
            if (!doc) {
                throw Object.assign(new Error(`Entity ${String(entityId)} not found in domain ${domain}`), { statusCode: 404 });
            }
            fromStatus = doc.status;
            const listingType = doc.listingType;
            resolvedListingType = listingType;
            // 2. Lifecycle Validation (Type-aware for unified ad model)
            const resolvedDomain = (0, LifecycleGuard_1.resolveLifecycleDomain)(domain, listingType);
            try {
                (0, LifecycleGuard_1.validateTransition)(resolvedDomain, fromStatus, toStatus);
            }
            catch (error) {
                if (!canBypassInvalidTransition({
                    error,
                    actor,
                    toStatus,
                    resolvedDomain,
                    metadata,
                })) {
                    throw error;
                }
                logger_1.default.warn('Status Mutation BYPASS: allowing admin moderation deactivation outside strict transition map', {
                    domain,
                    resolvedDomain,
                    entityId: String(entityId),
                    fromStatus,
                    toStatus,
                    action: metadata?.action,
                    actorType: actor.type,
                    actorId: actor.id,
                });
            }
            (0, LifecyclePolicyGuard_1.enforceLifecycleMutationPolicy)({
                domain: resolvedDomain,
                fromStatus,
                toStatus,
                actor,
                patch,
                metadata,
            });
            // 4. Update Document
            doc.status = toStatus;
            doc.statusChangedAt = new Date();
            if (reason)
                doc.statusReason = reason;
            // 🛡️ DATA INTEGRITY: Coerce stale/legacy moderationStatus values that are
            // not in the current enum. These exist in documents written before the enum
            // was tightened (e.g. "approved" was an old value, now split into
            // "auto_approved" / "manual_approved"). Mongoose validates the entire
            // document on .save(), so a single stale field blocks ALL mutations.
            const VALID_MODERATION_STATUSES = new Set([
                'auto_approved', 'held_for_review', 'manual_approved', 'rejected', 'community_hidden'
            ]);
            const currentModerationStatus = doc.moderationStatus;
            if (currentModerationStatus && !VALID_MODERATION_STATUSES.has(currentModerationStatus)) {
                logger_1.default.warn('StatusMutationService: coercing stale moderationStatus', {
                    entityId: String(entityId),
                    domain,
                    staleValue: currentModerationStatus,
                    coercedTo: 'manual_approved',
                });
                doc.moderationStatus = 'manual_approved';
            }
            // Apply status-specific patch (e.g., soldAt, rejectionReason, $push: { timeline })
            if (patch) {
                for (const [key, value] of Object.entries(patch)) {
                    if (key === '$push' && typeof value === 'object' && value !== null) {
                        for (const [pKey, pVal] of Object.entries(value)) {
                            const field = doc[pKey];
                            if (Array.isArray(field)) {
                                field.push(pVal);
                            }
                        }
                    }
                    else {
                        doc[key] = value;
                    }
                }
            }
            await doc.save({ session: activeSession });
            // 5. Record Unified Status History
            await StatusHistory_1.default.create([{
                    domain,
                    entityId: (entityId instanceof mongoose_1.default.Types.ObjectId) ? entityId : new mongoose_1.default.Types.ObjectId(String(entityId)),
                    fromStatus,
                    toStatus,
                    actorType: actor.type,
                    actorId: (actor.id && mongoose_1.default.Types.ObjectId.isValid(actor.id)) ? new mongoose_1.default.Types.ObjectId(actor.id) : undefined,
                    reason,
                    metadata: {
                        ...metadata,
                        ip: actor.ip,
                        ua: actor.userAgent,
                        mutationService: 'v1'
                    }
                }], { session: activeSession });
            return (typeof doc.toObject === 'function' ? doc.toObject() : doc);
        };
        if (isInternalSession && session) {
            await session.withTransaction(async () => {
                result = await executeOperations(session);
            });
        }
        else if (session) {
            result = await executeOperations(session);
        }
        const duration = Date.now() - startTime;
        // 6. Record Real-time Telemetry (Success) - Always outside critical transaction
        setImmediate(() => {
            recordMutationMetric('success', domain, fromStatus, toStatus).catch(err => {
                logger_1.default.error('Telemetry Error (Success Path):', err);
            });
        });
        logger_1.default.info(`Status Mutation SUCCESS: ${domain} ${String(entityId)} (${fromStatus} -> ${toStatus})`, {
            durationMs: duration,
            actorType: actor.type,
            actorId: actor.id
        });
        // 7. Dispatch Global Lifecycle Event (Decoupled side-effects)
        if (domain === 'ad') {
            await events_1.lifecycleEvents.dispatch('ad.lifecycle.changed', {
                adId: entityId.toString(),
                fromStatus,
                toStatus,
                actorType: actor.type,
                actorId: actor.id,
                source: actor.type,
                reason
            });
            if (toStatus === 'rejected'
                && String(metadata?.action || '').trim().toLowerCase() === 'moderation_reject') {
                await events_1.lifecycleEvents.dispatch('listing.rejected', {
                    listingId: entityId.toString(),
                    listingType: resolvedListingType || 'ad',
                    rejectionReason: typeof (patch)?.rejectionReason === 'string'
                        ? String((patch).rejectionReason)
                        : undefined,
                    actorType: actor.type,
                    actorId: actor.id,
                });
            }
            if (toStatus === 'live'
                && String(metadata?.action || '').trim().toLowerCase() === 'moderation_approve') {
                const listingType = typeof metadata?.listingType === 'string'
                    ? String(metadata.listingType)
                    : (typeof (patch)?.listingType === 'string'
                        ? String((patch).listingType)
                        : undefined);
                await events_1.lifecycleEvents.dispatch('listing.approved', {
                    listingId: entityId.toString(),
                    listingType: listingType || 'ad',
                    approvedAt: ((patch)?.approvedAt instanceof Date
                        ? ((patch).approvedAt).toISOString()
                        : new Date().toISOString()),
                    actorType: actor.type,
                    actorId: actor.id,
                    source: String(metadata?.sourceRoute || metadata?.action || actor.type),
                });
            }
        }
        return result;
    }
    catch (error) {
        const duration = Date.now() - startTime;
        const err = error;
        // Record Real-time Telemetry (Rejection/Failure)
        const isValidationFailure = err.code === 'INVALID_LIFECYCLE_TRANSITION' || err.code === 'LIFECYCLE_LOCKED';
        const metricStatus = isValidationFailure ? 'rejection' : 'failure';
        setImmediate(() => {
            recordMutationMetric(metricStatus, domain, fromStatus, toStatus).catch(err => {
                logger_1.default.error('Telemetry Error (Error Path):', err);
            });
        });
        logger_1.default.error(`Status Mutation FAILED: ${domain} ${String(entityId)} -> ${toStatus}`, {
            error: err.message,
            code: err.code,
            durationMs: duration,
            actorType: actor.type
        });
        throw error;
    }
    finally {
        if (isInternalSession && session) {
            await session.endSession();
        }
    }
};
exports.mutateStatus = mutateStatus;
/**
 * 🛠️ Bulk Status Mutation Service
 * Processes multiple entity transitions.
 *
 * NOTE: For production safety and audit granularity, we process each mutation
 * individually to ensure full LifecycleGuard validation and unique audit trails.
 */
const mutateStatuses = async (requests) => {
    const results = [];
    for (const request of requests) {
        results.push(await (0, exports.mutateStatus)(request));
    }
    return results;
};
exports.mutateStatuses = mutateStatuses;
const mutateStatusesBulk = async (domain, entityIds, toStatus, actor, reason) => {
    if (!entityIds.length)
        return 0;
    const Model = getModelForDomain(domain);
    const docs = await Model.find({ _id: { $in: entityIds } })
        .select('_id status listingType')
        .lean();
    if (!docs.length)
        return 0;
    await (0, exports.mutateStatuses)(docs.map((doc) => ({
        domain,
        entityId: String(doc._id),
        toStatus,
        actor,
        reason,
        metadata: {
            action: 'bulk_mutation',
            sourceRoute: 'StatusMutationService.mutateStatusesBulk',
            listingType: doc.listingType,
        },
    })));
    if (domain === 'ad' && toStatus === adStatus_1.AD_STATUS.EXPIRED) {
        await events_1.lifecycleEvents.dispatch('ad.expired.bulk', { count: docs.length, source: 'cron_expireOutdatedAds' });
    }
    return docs.length;
};
exports.mutateStatusesBulk = mutateStatusesBulk;
/**
 * Domain-to-Model mapping SSOT
 */
function getModelForDomain(domain) {
    switch (domain) {
        case 'ad': return Ad_1.default;
        case 'user': return User_1.default;
        case 'business': return Business_1.default;
        case 'service': return Ad_1.default;
        case 'spare_part_listing': return Ad_1.default;
        case 'catalog_part': throw new Error('Domain \'catalog_part\' uses CatalogStatus — route through admin catalog service, not statusMutationService');
        default: throw new Error(`Unsupported domain: ${domain}`);
    }
}
/**
 * Record mutation metrics for observability
 */
async function recordMutationMetric(status, domain, from, to) {
    try {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        const update = {
            $inc: {
                [`payload.total`]: 1,
                [`payload.${status}`]: 1,
                [`payload.domains.${domain}`]: 1,
                [`payload.transitions.${from}_to_${to}`]: 1
            }
        };
        // AdminMetrics often resides on a separate restricted connection
        await AdminMetrics_1.default.findOneAndUpdate({ metricModule: 'status_mutations', aggregationDate: date }, update, { upsert: true });
    }
    catch (err) {
        // Telemetry failure should NEVER block the mutation transaction
        logger_1.default.error('Critical Telemetry Failure:', { error: String(err) });
    }
}
//# sourceMappingURL=StatusMutationService.js.map