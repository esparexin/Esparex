import mongoose from 'mongoose';
import { AppError } from '../../utils/AppError';
import { getUserConnection } from '../../infrastructure/db';
import type { MutationOptions } from './types';

export class UnifiedMutationEngine {
    /**
     * Executes a standardized entity mutation pipeline.
     */
    static async execute<T>(options: MutationOptions<T>): Promise<T> {
        const {
            model,
            entityId,
            context,
            payload,
            config,
            hooks,
            session: externalSession,
        } = options;

        if (!mongoose.Types.ObjectId.isValid(entityId)) {
            throw new AppError('Invalid entity ID format', 400, 'INVALID_ID');
        }

        const id = new mongoose.Types.ObjectId(entityId);
        const connection = getUserConnection();
        const session = externalSession || await connection.startSession();
        const isInternalSession = !externalSession;

        let updatedEntity: T | null = null;
        let previousState: T | null = null;

        try {
            const executeUpdate = async () => {
                // 1. Fetch Entity
                const entity = await model.findById(id).session(session) as mongoose.Document & T;
                if (!entity) {
                    throw new AppError('Entity not found', 404, 'NOT_FOUND');
                }
                previousState = (typeof entity.toObject === 'function' ? entity.toObject() : { ...entity }) as T;

                // 2. Ownership Check
                if (hooks?.validateOwnership) {
                    hooks.validateOwnership(entity, context);
                }

                // 3. Payload Sanitization
                const safePayload: Record<string, unknown> = {};
                config.mutableFields.forEach((field) => {
                    if (payload[field] !== undefined) {
                        safePayload[field] = payload[field];
                    }
                });

                if (config.immutableFields) {
                    config.immutableFields.forEach((field) => {
                        delete safePayload[field];
                    });
                }

                if (Object.keys(safePayload).length === 0) {
                    updatedEntity = entity as T;
                    return; // No changes to apply
                }

                // 4. Pre-Save Hook (for custom nested normalizations)
                if (hooks?.beforeSave) {
                    await hooks.beforeSave(entity, safePayload, session);
                }

                // 5. Delta Detection (Sensitive Fields)
                let hasSensitiveChange = false;
                if (config.sensitiveFields && config.sensitiveFields.length > 0 && context.actor === 'USER') {
                    for (const field of config.sensitiveFields) {
                        if (safePayload[field] !== undefined) {
                            const newValue = JSON.stringify(safePayload[field]);
                            const oldValue = JSON.stringify((entity as unknown as Record<string, unknown>)[field]);
                            if (newValue !== oldValue) {
                                hasSensitiveChange = true;
                                break;
                            }
                        }
                    }
                }

                // 6. Apply safe payload to entity
                Object.assign(entity, safePayload);

                // 7. Sensitive Change Triggers
                if (hasSensitiveChange) {
                    if (config.trackReviewVersion) {
                        const currentVersion = (entity as unknown as { reviewVersion?: number }).reviewVersion || 0;
                        (entity as unknown as { reviewVersion: number }).reviewVersion = currentVersion + 1;
                    }
                    if (hooks?.onSensitiveChange) {
                        await hooks.onSensitiveChange(entity, session);
                    }
                }

                // 8. Save
                await entity.save({ session });
                updatedEntity = entity as T;
            };

            if (isInternalSession) {
                await session.withTransaction(executeUpdate);
            } else {
                await executeUpdate();
            }

            if (!updatedEntity) {
                throw new AppError('Failed to update entity', 500, 'UPDATE_FAILED');
            }

            // 9. Post-Save Hook (Cache bust, async notifications)
            if (hooks?.afterSave && previousState) {
                // We do not await this to prevent blocking the HTTP response, unless absolutely necessary.
                // However, to keep it predictable, we'll await it. If async is needed, the caller should implement it in the hook.
                await hooks.afterSave(updatedEntity, previousState);
            }

            return updatedEntity;

        } finally {
            if (isInternalSession) {
                await session.endSession();
            }
        }
    }
}
