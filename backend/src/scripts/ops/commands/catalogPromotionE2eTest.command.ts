/**
 * Ops Command: catalog-promotion-e2e-test
 *
 * End-to-end verification that the CatalogPromotionListener correctly promotes
 * a PENDING model to the ACTIVE (live) status when its linked Ad is approved.
 *
 * What this does (development only):
 *   1. Finds a real active Category, Brand, and User from the DB.
 *   2. Creates a PENDING Model (`[E2E-TEST] Model`).
 *   3. Creates a PENDING Ad linked to that model.
 *   4. Fires the `listing.approved` lifecycle event directly (bypassing HTTP).
 *   5. Waits 1.5 seconds for the async listener to complete.
 *   6. Asserts the Model status is now the ACTIVE catalog value.
 *   7. Cleans up: deletes test Ad, test Model.
 *
 * Usage (dry-run — read-only audit, no writes):
 *   npm run ops -- catalog-promotion-e2e-test
 *
 * Usage (actually run the test):
 *   npm run ops -- catalog-promotion-e2e-test --apply
 */

import mongoose from 'mongoose';
import { OpsCommand, OpsExecutionContext, OpsCommandResult } from '../types';
import { CATALOG_STATUS, CatalogStatusValue } from '@shared/enums/catalogStatus';
import { connectOpsDb } from './commandUtils';
import { closeDB } from '../../../config/db';
import { installCatalogPromotionListener } from '../../../events/listeners/CatalogPromotionListener';



const TEST_TAG = '[E2E-TEST]';
const LISTENER_SETTLE_MS = 1500; // time to let the async listener complete

export const catalogPromotionE2eTestCommand: OpsCommand = {
    name: 'catalog-promotion-e2e-test',
    description:
        'E2E test: creates a pending model + ad, fires listing.approved, asserts model promoted to ACTIVE, then cleans up.',
    blastRadius: 'low',

    run: async (context: OpsExecutionContext): Promise<OpsCommandResult> => {
        const isDryRun = !context.flags.apply;

        if (isDryRun) {
            return {
                summary: {
                    mode: 'DRY_RUN',
                    message:
                        'Dry-run: no test data created. Re-run with --apply to execute the full E2E test against the development database.',
                    expectedActiveStatus: CATALOG_STATUS.ACTIVE,
                },
                warnings: ['This command creates and immediately deletes test data. Only run against development.'],
                rollbackGuidance: [
                    'If the command is interrupted, manually delete documents with name starting with "[E2E-TEST]" in the models and ads collections.',
                ],
            };
        }

        // Connect to MongoDB (ops runner does not bootstrap a connection)
        await connectOpsDb();

        const [
            { default: Category },
            { default: Brand },
            { default: Model },
            { default: Ad },
            { default: User },
            { lifecycleEvents },
        ] = await Promise.all([
            import('../../../models/Category'),
            import('../../../models/Brand'),
            import('../../../models/Model'),
            import('../../../models/Ad'),
            import('../../../models/User'),
            import('../../../events'),
        ]);

        // Register the listener in this process so it catches the event we are about to fire
        installCatalogPromotionListener();

        const warnings: string[] = [];
        let testModelId: mongoose.Types.ObjectId | null = null;
        let testAdId: mongoose.Types.ObjectId | null = null;

        try {
            // 1. Find seed data
            const [category, brand, user] = await Promise.all([
                Category.findOne({ isActive: true }).lean(),
                Brand.findOne({ isActive: true, status: CATALOG_STATUS.ACTIVE }).lean(),
                User.findOne({ role: 'user', status: 'active' }).lean(),
            ]);

            if (!category || !brand || !user) {
                return {
                    summary: {
                        mode: 'APPLY',
                        result: 'SKIPPED',
                        reason: 'Missing seed data: need at least one active Category, Brand, and User in the DB.',
                        found: { category: !!category, brand: !!brand, user: !!user },
                    },
                    warnings: ['Seed data not found. Populate the DB first.'],
                    rollbackGuidance: [],
                };
            }

            context.emit('ops.command.catalog-promotion-e2e-test.step', {
                step: 'seed_found',
                categoryId: String(category._id),
                brandId: String(brand._id),
                userId: String(user._id),
            });

            // 2. Create PENDING test model
            // Use explicit type to avoid overload ambiguity
            const testModelDoc = await Model.create([{
                name: `${TEST_TAG} Auto-Promo Test Model ${Date.now()}`,
                brandId: brand._id,
                categoryIds: [category._id],
                status: CATALOG_STATUS.PENDING,
                isActive: false,
                suggestedBy: user._id,
            }]);
            const testModel = testModelDoc[0];
            if (!testModel) throw new Error('Model.create returned empty array');
            testModelId = testModel._id as mongoose.Types.ObjectId;

            context.emit('ops.command.catalog-promotion-e2e-test.step', {
                step: 'pending_model_created',
                modelId: String(testModelId),
                modelName: String(testModel.get('name')),
            });

            // 3. Create PENDING test Ad linked to that model
            const testAdDoc = await Ad.create([{
                title: `${TEST_TAG} E2E Promotion Test Ad`,
                description: 'Auto-generated by catalog-promotion-e2e-test ops command. Safe to delete.',
                status: 'pending',
                listingType: 'ad',
                sellerId: user._id,
                categoryId: category._id,
                brandId: brand._id,
                modelId: testModelId,
                price: 0,
                condition: 'used',
                images: [],
                location: {
                    coordinates: {
                        type: 'Point',
                        coordinates: [77.209, 28.613], // New Delhi default
                    },
                },
            }]);
            const testAd = testAdDoc[0];
            if (!testAd) throw new Error('Ad.create returned empty array');
            testAdId = testAd._id as mongoose.Types.ObjectId;

            context.emit('ops.command.catalog-promotion-e2e-test.step', {
                step: 'pending_ad_created',
                adId: String(testAdId),
            });

            // 4. Fire the lifecycle event directly (same payload shape as StatusMutationService)
            await lifecycleEvents.dispatch('listing.approved', {
                listingId: String(testAdId),
                listingType: 'ad',
                approvedAt: new Date().toISOString(),
                actorType: 'admin',
                actorId: String(user._id),
                source: 'catalog-promotion-e2e-test',
            });

            context.emit('ops.command.catalog-promotion-e2e-test.step', {
                step: 'listing_approved_event_fired',
            });

            // 5. Wait for async listener to complete
            await new Promise((resolve) => setTimeout(resolve, LISTENER_SETTLE_MS));

            // 6. Assert model is now ACTIVE
            const promotedModel = await Model.findById(testModelId).lean();
            const promotedStatus = promotedModel?.status as CatalogStatusValue | undefined;
            const wasPromoted =
                promotedStatus === CATALOG_STATUS.ACTIVE && promotedModel?.isActive === true;

            context.emit('ops.command.catalog-promotion-e2e-test.result', {
                modelId: String(testModelId),
                expectedStatus: CATALOG_STATUS.ACTIVE,
                actualStatus: promotedStatus ?? 'NOT_FOUND',
                passed: wasPromoted,
            });

            if (!wasPromoted) {
                warnings.push(
                    `ASSERTION FAILED: Model ${testModelId} status = '${promotedStatus}', expected '${CATALOG_STATUS.ACTIVE}'. CatalogPromotionListener may not be firing.`
                );
            }

            return {
                summary: {
                    mode: 'APPLY',
                    result: wasPromoted ? '✅ PASSED' : '❌ FAILED',
                    testModelId: String(testModelId),
                    testAdId: String(testAdId),
                    promotedModelStatus: promotedStatus,
                    promotedModelIsActive: promotedModel?.isActive,
                    expectedStatus: CATALOG_STATUS.ACTIVE,
                    listenerFired: wasPromoted,
                },
                warnings,
                rollbackGuidance: [
                    'Test data is cleaned up automatically.',
                    'If cleanup failed, delete documents where name starts with "[E2E-TEST]" in models and ads collections.',
                ],
            };
        } finally {
            // 7. Always clean up test data and disconnect
            const [{ default: Ad }, { default: Model }] = await Promise.all([
                import('../../../models/Ad'),
                import('../../../models/Model'),
            ]);

            const cleanupOps: Promise<unknown>[] = [];
            if (testAdId) {
                cleanupOps.push(
                    Ad.updateOne(
                        { _id: testAdId },
                        {
                            $set: {
                                status: 'deactivated',
                                isDeleted: true,
                                deletedAt: new Date(),
                                isSpotlight: false,
                                isChatLocked: true,
                            },
                        }
                    )
                );
            }
            if (testModelId) cleanupOps.push(Model.deleteOne({ _id: testModelId }));
            await Promise.allSettled(cleanupOps);

            await closeDB();

            context.emit('ops.command.catalog-promotion-e2e-test.step', {
                step: 'cleanup_complete',
                deletedAdId: testAdId ? String(testAdId) : null,
                deletedModelId: testModelId ? String(testModelId) : null,
            });
        }
    },
};
