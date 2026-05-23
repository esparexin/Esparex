import type mongoose from 'mongoose';

export interface MutationContext {
    actor: 'USER' | 'ADMIN' | 'SYSTEM';
    userId?: string;
    adminId?: string;
}

export interface MutationConfig {
    /** 
     * Explicit list of fields that are allowed to be mutated by users.
     * Any field not in this list will be stripped from the payload.
     */
    mutableFields: string[];
    
    /**
     * Explicit list of fields that can NEVER be mutated through this pipeline,
     * even if they accidentally end up in mutableFields.
     */
    immutableFields?: string[];
    
    /**
     * Fields that, if changed, trigger the `onSensitiveChange` hook
     * (e.g. for triggering moderation or bumping review versions).
     */
    sensitiveFields?: string[];
    
    /**
     * If true, increments `reviewVersion` (or similar custom field) on sensitive change.
     */
    trackReviewVersion?: boolean;
}

export interface MutationHooks<T> {
    /**
     * Run before any mutations are applied.
     * Throw an AppError here to abort (e.g. ownership check failures).
     */
    validateOwnership?: (entity: T, context: MutationContext) => void;

    /**
     * Run before the entity is saved.
     * Allows custom normalization or prepopulation of complex nested fields.
     */
    beforeSave?: (entity: T, safePayload: Record<string, unknown>, session?: mongoose.ClientSession) => Promise<void>;

    /**
     * Run after the entity has been successfully saved to DB.
     * Ideal for cache invalidation, async notifications, or cleanup tasks.
     */
    afterSave?: (entity: T, previousState: T) => Promise<void>;

    /**
     * Invoked if the engine detects a delta on any field listed in `sensitiveFields`.
     * Useful for forcing status transitions (e.g. LIVE -> PENDING).
     */
    onSensitiveChange?: (entity: T, session?: mongoose.ClientSession) => Promise<void>;
}

export interface MutationOptions<T> {
    /** The mongoose model constructor */
    model: mongoose.Model<T>;
    /** ID of the entity to mutate */
    entityId: string;
    /** The actor performing the mutation */
    context: MutationContext;
    /** The raw incoming payload to be sanitized and applied */
    payload: Record<string, unknown>;
    
    config: MutationConfig;
    hooks?: MutationHooks<T>;
    
    /** Optional existing transaction session */
    session?: mongoose.ClientSession;
}
