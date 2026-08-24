import mongoose, { ClientSession } from 'mongoose';
import type { ListingUpdate } from '../../domains/listings/ports/ListingRepositoryPort';
import { 
    validateTransition as validateLifecycleTransition, 
    resolveLifecycleDomain,
    type ValidDomain 
} from './LifecycleGuard';
import { enforceLifecycleMutationPolicy } from './LifecyclePolicyGuard';
import logger from '../../utils/logger';
import { ActorMetadata, BusinessErrorCode } from '@esparex/contracts';
import { AppError } from '../../shared-kernel/errors/AppError';
import {
    canBypassInvalidTransition,
    createHistoryRecord,
} from './StatusMutationTelemetry';

import Ad from '../../models/Ad';
import User from '../../models/User';
import Business from '../../models/Business';

export interface IStatusable {
    status: string;
    statusChangedAt?: Date;
    statusReason?: string;
    moderationStatus?: string;
    listingType?: string;
    save: (options?: { session?: ClientSession }) => Promise<mongoose.Document>;
    toObject: () => Record<string, unknown>;
    [key: string]: unknown;
}

export function getModelForDomain(domain: ValidDomain) {
    switch (domain) {
        case 'ad': return Ad;
        case 'user': return User;
        case 'business': return Business;
        case 'service': return Ad;
        case 'spare_part_listing': return Ad;
        case 'catalog_part': throw new Error('Domain \'catalog_part\' uses CatalogStatus — route through admin catalog service, not statusMutationService');
        default: throw new Error(`Unsupported domain: ${domain as string}`);
    }
}

interface ExecuteGenericParams {
    domain: ValidDomain;
    entityId: string | mongoose.Types.ObjectId;
    toStatus: string;
    actor: ActorMetadata;
    reason?: string;
    patch?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    activeSession: any;
}

export async function executeGenericStatusMutation({
    domain,
    entityId,
    toStatus,
    actor,
    reason,
    patch,
    metadata,
    activeSession,
}: ExecuteGenericParams): Promise<{
    result: Record<string, unknown>;
    fromStatus: string;
    resolvedListingType?: string;
}> {
    const Model = getModelForDomain(domain);
    const doc = await (Model as mongoose.Model<any>).findById(entityId).setOptions({ withDeleted: true }).session(activeSession) as (mongoose.Document & IStatusable) | null;
    if (!doc) {
        throw new AppError(`Entity ${String(entityId)} not found in domain ${domain}`, 404, BusinessErrorCode.RESOURCE_NOT_FOUND);
    }

    const fromStatus = doc.status;
    const listingType = doc.listingType;
    const resolvedDomain = resolveLifecycleDomain(domain, listingType);

    try {
        validateLifecycleTransition(resolvedDomain, fromStatus, toStatus);
    } catch (error) {
        if (!canBypassInvalidTransition({ error, actor, toStatus, resolvedDomain, metadata })) {
            throw error;
        }

        logger.warn('Status Mutation BYPASS: allowing admin moderation deactivation outside strict transition map', {
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

    enforceLifecycleMutationPolicy({
        domain: resolvedDomain,
        fromStatus,
        toStatus,
        actor,
        patch,
        metadata,
    });

    doc.status = toStatus;
    doc.statusChangedAt = new Date();
    if (reason) doc.statusReason = reason;

    const VALID_MODERATION_STATUSES = new Set([
        'auto_approved', 'held_for_review', 'manual_approved', 'rejected', 'community_hidden'
    ]);
    const currentModerationStatus = doc.moderationStatus;
    if (currentModerationStatus && !VALID_MODERATION_STATUSES.has(currentModerationStatus)) {
        logger.warn('StatusMutationService: coercing stale moderationStatus', {
            entityId: String(entityId),
            domain,
            staleValue: currentModerationStatus,
            coercedTo: 'manual_approved',
        });
        doc.moderationStatus = 'manual_approved';
    }

    if (patch) {
        for (const [key, value] of Object.entries(patch)) {
            if (key === '$push' && typeof value === 'object' && value !== null) {
                for (const [pKey, pVal] of Object.entries(value as Record<string, unknown>)) {
                    const field = doc[pKey];
                    if (Array.isArray(field)) {
                        field.push(pVal);
                    }
                }
            } else {
                doc[key] = value;
            }
        }
    }
    
    await doc.save({ session: activeSession as ClientSession });
    await createHistoryRecord({ domain, entityId, fromStatus, toStatus, actor, reason, metadata, session: activeSession });

    const result = (typeof doc.toObject === 'function' ? doc.toObject() : doc) as Record<string, unknown>;
    return { result, fromStatus, resolvedListingType: listingType };
}

export async function executeListingStatusMutation({
    domain,
    entityId,
    toStatus,
    actor,
    reason,
    patch,
    metadata,
    activeSession,
}: ExecuteGenericParams): Promise<{
    result: Record<string, unknown>;
    fromStatus: string;
    resolvedListingType?: string;
}> {
    const { getListingRepository } = await import('../../composition/listings');
    const repo = getListingRepository();
    const listing = await repo.findOne({ ids: [entityId.toString()], isDeleted: { $in: [true, false] }, session: activeSession });
    
    if (!listing) {
        throw new AppError(`Entity ${String(entityId)} not found in domain ${domain}`, 404, BusinessErrorCode.RESOURCE_NOT_FOUND);
    }

    const fromStatus = listing.status as string;
    const resolvedListingType = listing.listingType as string;
    const resolvedDomain = resolveLifecycleDomain(domain, resolvedListingType);

    try {
        validateLifecycleTransition(resolvedDomain, fromStatus, toStatus);
    } catch (error) {
        if (!canBypassInvalidTransition({ error, actor, toStatus, resolvedDomain, metadata })) {
            throw error;
        }
    }

    enforceLifecycleMutationPolicy({ domain: resolvedDomain, fromStatus, toStatus, actor, patch, metadata });

    const updateDoc: Record<string, unknown> = {
        status: toStatus,
        statusChangedAt: new Date(),
    };
    if (reason) updateDoc.statusReason = reason;

    const VALID_MODERATION_STATUSES = new Set(['auto_approved', 'held_for_review', 'manual_approved', 'rejected', 'community_hidden']);
    const currentModerationStatus = listing.moderationStatus;
    if (currentModerationStatus && !VALID_MODERATION_STATUSES.has(currentModerationStatus)) {
        updateDoc.moderationStatus = 'manual_approved';
    }

    if (patch) {
        for (const [key, value] of Object.entries(patch)) {
            updateDoc[key] = value;
        }
    }

    const updated = await repo.updateOne(entityId.toString(), updateDoc as ListingUpdate, activeSession);
    await createHistoryRecord({ domain, entityId, fromStatus, toStatus, actor, reason, metadata, session: activeSession });

    return { result: updated as Record<string, unknown>, fromStatus, resolvedListingType };
}
