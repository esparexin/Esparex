"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.catalogPromotionE2eTestCommand = void 0;
const catalogStatus_1 = require("@core/constants/enums/catalogStatus");
const userStatus_1 = require("@core/constants/enums/userStatus");
const commandUtils_1 = require("./commandUtils");
const db_1 = require("@core/config/db");
const CatalogPromotionListener_1 = require("../../../events/listeners/CatalogPromotionListener");
const TEST_TAG = '[E2E-TEST]';
const LISTENER_SETTLE_MS = 1500; // time to let the async listener complete
exports.catalogPromotionE2eTestCommand = {
    name: 'catalog-promotion-e2e-test',
    description: 'E2E test: creates a pending model + ad, fires listing.approved, asserts model promoted to ACTIVE, then cleans up.',
    blastRadius: 'low',
    run: async (context) => {
        const isDryRun = !context.flags.apply;
        if (isDryRun) {
            return {
                summary: {
                    mode: 'DRY_RUN',
                    message: 'Dry-run: no test data created. Re-run with --apply to execute the full E2E test against the development database.',
                    expectedActiveStatus: catalogStatus_1.CATALOG_STATUS.ACTIVE,
                },
                warnings: ['This command creates and immediately deletes test data. Only run against development.'],
                rollbackGuidance: [
                    'If the command is interrupted, manually delete documents with name starting with "[E2E-TEST]" in the models and ads collections.',
                ],
            };
        }
        // Connect to MongoDB (ops runner does not bootstrap a connection)
        await (0, commandUtils_1.connectOpsDb)();
        const [{ default: Category }, { default: Brand }, { default: Model }, { default: Ad }, { default: User }, { lifecycleEvents },] = await Promise.all([
            Promise.resolve().then(() => __importStar(require('@core/models/Category'))),
            Promise.resolve().then(() => __importStar(require('@core/models/Brand'))),
            Promise.resolve().then(() => __importStar(require('@core/models/Model'))),
            Promise.resolve().then(() => __importStar(require('@core/models/Ad'))),
            Promise.resolve().then(() => __importStar(require('@core/models/User'))),
            Promise.resolve().then(() => __importStar(require('../../../events'))),
        ]);
        // Register the listener in this process so it catches the event we are about to fire
        (0, CatalogPromotionListener_1.installCatalogPromotionListener)();
        const warnings = [];
        let testModelId = null;
        let testAdId = null;
        try {
            // 1. Find seed data
            const [category, brand, user] = await Promise.all([
                Category.findOne({ isActive: true }).lean(),
                Brand.findOne({ isActive: true, status: catalogStatus_1.CATALOG_STATUS.ACTIVE }).lean(),
                User.findOne({ role: 'user', status: userStatus_1.USER_STATUS.LIVE }).lean(),
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
                    status: catalogStatus_1.CATALOG_STATUS.PENDING,
                    isActive: false,
                    suggestedBy: user._id,
                }]);
            const testModel = testModelDoc[0];
            if (!testModel)
                throw new Error('Model.create returned empty array');
            testModelId = testModel._id;
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
            if (!testAd)
                throw new Error('Ad.create returned empty array');
            testAdId = testAd._id;
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
            const promotedStatus = promotedModel?.status;
            const wasPromoted = promotedStatus === catalogStatus_1.CATALOG_STATUS.ACTIVE && promotedModel?.isActive === true;
            context.emit('ops.command.catalog-promotion-e2e-test.result', {
                modelId: String(testModelId),
                expectedStatus: catalogStatus_1.CATALOG_STATUS.ACTIVE,
                actualStatus: promotedStatus ?? 'NOT_FOUND',
                passed: wasPromoted,
            });
            if (!wasPromoted) {
                warnings.push(`ASSERTION FAILED: Model ${String(testModelId)} status = '${promotedStatus}', expected '${catalogStatus_1.CATALOG_STATUS.ACTIVE}'. CatalogPromotionListener may not be firing.`);
            }
            return {
                summary: {
                    mode: 'APPLY',
                    result: wasPromoted ? '✅ PASSED' : '❌ FAILED',
                    testModelId: String(testModelId),
                    testAdId: String(testAdId),
                    promotedModelStatus: promotedStatus,
                    promotedModelIsActive: promotedModel?.isActive,
                    expectedStatus: catalogStatus_1.CATALOG_STATUS.ACTIVE,
                    listenerFired: wasPromoted,
                },
                warnings,
                rollbackGuidance: [
                    'Test data is cleaned up automatically.',
                    'If cleanup failed, delete documents where name starts with "[E2E-TEST]" in models and ads collections.',
                ],
            };
        }
        finally {
            // 7. Always clean up test data and disconnect
            const [{ default: Ad }, { default: Model }] = await Promise.all([
                Promise.resolve().then(() => __importStar(require('@core/models/Ad'))),
                Promise.resolve().then(() => __importStar(require('@core/models/Model'))),
            ]);
            const cleanupOps = [];
            if (testAdId) {
                cleanupOps.push(Ad.updateOne({ _id: testAdId }, {
                    $set: {
                        status: 'deactivated',
                        isDeleted: true,
                        deletedAt: new Date(),
                        isSpotlight: false,
                        isChatLocked: true,
                    },
                }));
            }
            if (testModelId)
                cleanupOps.push(Model.deleteOne({ _id: testModelId }));
            await Promise.allSettled(cleanupOps);
            await (0, db_1.closeDB)();
            context.emit('ops.command.catalog-promotion-e2e-test.step', {
                step: 'cleanup_complete',
                deletedAdId: testAdId ? String(testAdId) : null,
                deletedModelId: testModelId ? String(testModelId) : null,
            });
        }
    },
};
//# sourceMappingURL=catalogPromotionE2eTest.command.js.map