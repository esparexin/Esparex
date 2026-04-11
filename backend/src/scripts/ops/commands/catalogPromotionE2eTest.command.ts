/**
 * Ops Command: catalog-promotion-e2e-test
 *
 * End-to-end verification that the CatalogPromotionListener correctly promotes
 * a PENDING model to ACTIVE when its linked Ad is approved.
 *
 * What this does (development only):
 *   1. Finds a real active Category, Brand, and User from the DB.
 *   2. Creates a PENDING Model (`[E2E-TEST] Model`).
 *   3. Creates a PENDING Ad linked to that model.
 *   4. Fires the `listing.approved` lifecycle event directly (bypassing HTTP).
 *   5. Waits 1 second for the async listener to complete.
 *   6. Asserts the Model is now ACTIVE.
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
import { connectOpsDb } from './commandUtils';

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
                },
                warnings: ['This command creates and immediately deletes test data. Only run against development.'],
                rollbackGuidance: [
                    'If the command is interrupted, manually delete documents with name starting with "[E2E-TEST]" in the models and ads collections.',
                ],
            };
        }

        // ── Import live models (not available in a raw mongo driver context) ──
        // We deliberately use Mongoose models here because the listener also
        // uses them — this ensures the same connection / validation path.
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

        // Need DB connected for Mongoose models (connectOpsDb only for native driver)
        // The Mongoose connection is already up when this command runs via the app.
        // If running standalone, we rely on the app bootstrap.

        const warnings: string[] = [];
        let testModelId: mongoose.Types.ObjectId | null = null;
        let testAdId: mongoose.Types.ObjectId | null = null;

        try {
            // 1. Find seed data
            const [category, brand, user] = await Promise.all([
                Category.findOne({ isActive: true }).lean(),
                Brand.findOne({ isActive: true, status: 'active' }).lean(),
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
            const testModel = await Model.create({
                name: `${TEST_TAG} Auto-Promo Test Model ${Date.now()}`,
                brandId: brand._id,
                categoryId: category._id,
                categoryIds: [category._id],
                status: 'pending',
                isActive: false,
                suggestedBy: user._id,
            });
            testModelId = testModel._id as mongoose.Types.ObjectId;

            context.emit('ops.command.catalog-promotion-e2e-test.step', {
                step: 'pending_model_created',
                modelId: String(testModelId),
                modelName: testModel.name,
            });

            // 3. Create PENDING test Ad linked to that model
            const testAd = await Ad.create({
                title: `${TEST_TAG} E2E Promotion Test Ad`,
                description: 'Auto-generated by catalog-promotion-e2e-test ops command. Safe to delete.',
                status: 'pending',
                listingType: 'ad',
                userId: user._id,
                categoryId: category._id,
                brandId: brand._id,
                modelId: testModelId,
                price: 0,
                condition: 'good',
                images: [],
            });
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
            const wasPromoted =
                promotedModel?.status === 'active' && promotedModel?.isActive === true;

            context.emit('ops.command.catalog-promotion-e2e-test.result', {
                modelId: String(testModelId),
                expectedStatus: 'active',
                actualStatus: promotedModel?.status ?? 'NOT_FOUND',
                passed: wasPromoted,
            });

            if (!wasPromoted) {
                warnings.push(
                    `ASSERTION FAILED: Model ${testModelId} status = '${promotedModel?.status}', expected 'active'. CatalogPromotionListener may not be firing.`
                );
            }

            return {
                summary: {
                    mode: 'APPLY',
                    result: wasPromoted ? '✅ PASSED' : '❌ FAILED',
                    testModelId: String(testModelId),
                    testAdId: String(testAdId),
                    promotedModelStatus: promotedModel?.status,
                    promotedModelIsActive: promotedModel?.isActive,
                    listenerFired: wasPromoted,
                },
                warnings,
                rollbackGuidance: [
                    'Test data is cleaned up automatically.',
                    'If cleanup failed, delete documents where name starts with "[E2E-TEST]" in models and ads collections.',
                ],
            };
        } finally {
            // 7. Always clean up test data
            const cleanupOps: Promise<unknown>[] = [];
            if (testAdId) cleanupOps.push(Ad.deleteOne({ _id: testAdId }));
            if (testModelId) cleanupOps.push(Model.deleteOne({ _id: testModelId }));
            await Promise.allSettled(cleanupOps);

            context.emit('ops.command.catalog-promotion-e2e-test.step', {
                step: 'cleanup_complete',
                deletedAdId: testAdId ? String(testAdId) : null,
                deletedModelId: testModelId ? String(testModelId) : null,
            });
        }
    },
};
