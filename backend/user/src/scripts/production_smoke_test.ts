/**
 * 🛡️ ESPAREX PRODUCTION SMOKE TEST
 * 
 * deterministic, auditable validation of:
 * - SSOT (Ad collection status & views)
 * - Fraud Guardrails (SAFE_MODE & Risk Scoring)
 * - Admin Trust Boundaries (assertAdmin & Direct Live)
 * - Atomic Aggregation (Redis buffering & Mongo recovery)
 */
import mongoose from 'mongoose';
import * as AdOrchestrator from '@esparex/core/services/AdOrchestrator';
import { ViewBufferingService } from '@esparex/core/services/ViewBufferingService';
import { LISTING_STATUS } from '@esparex/core/constants/enums/listingStatus';
import User from '@esparex/core/models/User';
import Ad from '@esparex/core/models/Ad';
import Location from '@esparex/core/models/Location';
import { connectDB } from '@esparex/core/config/db';
import redis from '@esparex/core/config/redis';
import logger from '@esparex/core/utils/logger';
import { Role } from '@esparex/core/constants/enums/roles';

// 🧪 MOCK: Override logger to capture smoke test output
const logs: string[] = [];
const originalInfo = logger.info;
logger.info = (message: string, ...meta: unknown[]) => {
    if (typeof message === 'string' && message.startsWith('[SMOKE_TEST]')) {
        logs.push(message);
    }
    return originalInfo.call(logger, message, ...meta);
};

import Category from '@esparex/core/models/Category';
import { CATALOG_STATUS } from '@esparex/core/constants/enums/catalogStatus';

const DUMMY_LOCATION_COORDS = { type: 'Point' as const, coordinates: [77.5946, 12.9716] };
type SmokeEntityWithId = { _id: mongoose.Types.ObjectId };

async function getVerifiedLocation(): Promise<SmokeEntityWithId> {
    const uniqueName = `Smoke Test City ${Date.now()}`;
    const loc = await Location.create({
        name: uniqueName,
        country: 'India',
        level: 'city',
        coordinates: DUMMY_LOCATION_COORDS,
        isActive: true,
        verificationStatus: 'verified'
    });
    return loc as SmokeEntityWithId;
}

async function getValidCategory(): Promise<SmokeEntityWithId> {
    const uniqueName = `Smoke Test Category ${Date.now()}`;
    const cat = await Category.create({
        name: uniqueName,
        slug: `smoke-test-cat-${Date.now()}`,
        listingType: ['ad'],
        isActive: true,
        status: CATALOG_STATUS.ACTIVE
    });
    return cat as SmokeEntityWithId;
}

async function runScenarioA(verifiedLocation: SmokeEntityWithId, validCategory: SmokeEntityWithId) {
    logger.info('[SMOKE_TEST] SCENARIO A: SAFE USER FLOW START');
    
    const userId = new mongoose.Types.ObjectId();
    const mobile = `9${Math.floor(Math.random() * 1000000000)}`;

    await User.create({
        _id: userId,
        mobile,
        name: 'Scenario A User',
        role: Role.USER,
        status: 'live',
        isVerified: true,
        createdAt: new Date(Date.now() - 48 * 3600000) // 48h old to avoid low-age penalty
    });

    const ad = await AdOrchestrator.createAd(
        { 
            title: 'Safe Ad', 
            price: 100, 
            description: 'Safe description for the smoke test ad (20+ chars)',
            categoryId: validCategory._id.toString(),
            location: {
                id: verifiedLocation._id.toString(),
                coordinates: DUMMY_LOCATION_COORDS
            }
        },
        {
            actor: 'USER',
            authUserId: userId.toString(),
            sellerId: userId.toString(),
            ip: '1.1.1.1'
        }
    );

    if (!ad || ad.status !== LISTING_STATUS.PENDING) {
        throw new Error(`Scenario A Failed: Expected PENDING, got ${ad?.status}`);
    }
    logger.info('[SMOKE_TEST] scenario=A status=PENDING (Verified)');

    // Simulate Moderation Approval
    const { mutateStatus } = await import('@esparex/core/services/StatusMutationService');
    const { computeActiveExpiry } = await import('@esparex/core/services/AdStatusService');
    const expiresAt = await computeActiveExpiry('ad');

    await mutateStatus({
        domain: 'ad',
        entityId: ad._id.toString(),
        toStatus: LISTING_STATUS.LIVE,
        actor: { type: 'admin', id: 'admin_1' },
        reason: 'Approval',
        metadata: { action: 'moderation_approve' },
        patch: { 
            approvedAt: new Date(),
            expiresAt
        }
    });

    const updatedAd = await Ad.findById(ad._id);
    if (!updatedAd || updatedAd.status !== LISTING_STATUS.LIVE || !updatedAd.expiresAt) {
        throw new Error('Scenario A Failed: Transition to LIVE failed or expiresAt missing');
    }
    logger.info('[SMOKE_TEST] scenario=A status=LIVE expiresAt=SET (Verified)');
}

async function runScenarioB(verifiedLocation: SmokeEntityWithId, validCategory: SmokeEntityWithId) {
    logger.info('[SMOKE_TEST] SCENARIO B: HIGH RISK FLOW START');
    
    const userId = new mongoose.Types.ObjectId();
    const mobile = `8${Math.floor(Math.random() * 1000000000)}`;

    await User.create({
        _id: userId,
        mobile,
        name: 'Scenario B User',
        role: Role.USER,
        status: 'live',
        isVerified: true
    });

    // Trigger SAFE_MODE to guarantee moderation
    const ad = await AdOrchestrator.createAd(
        { 
            title: 'Risk Ad', 
            price: 100, 
            description: 'Risk description for the smoke test ad (20+ chars)',
            categoryId: validCategory._id.toString(),
            location: {
                id: verifiedLocation._id.toString(),
                coordinates: DUMMY_LOCATION_COORDS
            }
        },
        {
            actor: 'USER',
            authUserId: userId.toString(),
            sellerId: userId.toString(),
            riskState: 'SAFE_MODE'
        }
    );

    if (!ad || ad.moderationStatus !== 'held_for_review') {
        throw new Error(`Scenario B Failed: Expected held_for_review, got ${ad?.moderationStatus}`);
    }
    logger.info('[SMOKE_TEST] scenario=B moderationStatus=held_for_review (Verified)');
    logger.info('[SMOKE_TEST] scenario=B Fraud guardrail=ENFORCED');
}

async function runScenarioC(verifiedLocation: SmokeEntityWithId, validCategory: SmokeEntityWithId) {
    logger.info('[SMOKE_TEST] SCENARIO C: ADMIN FLOW START');
    
    const adminId = new mongoose.Types.ObjectId();
    const adminMobile = `7${Math.floor(Math.random() * 1000000000)}`;

    await User.create({
        _id: adminId,
        mobile: adminMobile,
        name: 'Admin User',
        role: Role.ADMIN,
        status: 'live',
        isVerified: true
    });

    // 1. Valid Admin Create
    const ad = await AdOrchestrator.createAd(
        { 
            title: 'Admin Ad', 
            price: 100,
            description: 'Admin description for the smoke test ad (20+ chars)',
            categoryId: validCategory._id.toString(),
            location: {
                id: verifiedLocation._id.toString(),
                coordinates: DUMMY_LOCATION_COORDS
            }
        },
        {
            actor: 'ADMIN',
            authUserId: adminId.toString(),
            sellerId: adminId.toString()
        }
    );

    if (!ad || ad.status !== LISTING_STATUS.LIVE) {
        throw new Error(`Scenario C Failed: Expected LIVE, got ${ad?.status}`);
    }
    logger.info('[SMOKE_TEST] scenario=C status=LIVE (Direct Approval Verified)');

    // 2. Negative Test: Privilege Escalation
    const userId = new mongoose.Types.ObjectId();
    const fakeMobile = `6${Math.floor(Math.random() * 1000000000)}`;
    await User.create({ _id: userId, mobile: fakeMobile, name: 'Fake Admin', role: Role.USER, status: 'live', isVerified: true });

    logger.info('[SMOKE_TEST] scenario=C Attempting privilege escalation...');
    try {
        await AdOrchestrator.createAd(
            { 
                title: 'Escalation Ad', 
                price: 100,
                description: 'Escalation description for the smoke test ad (20+ chars)',
                categoryId: validCategory._id.toString(),
                location: {
                    id: verifiedLocation._id.toString(),
                    coordinates: DUMMY_LOCATION_COORDS
                }
            },
            {
                actor: 'ADMIN',
                authUserId: userId.toString(),
                sellerId: userId.toString()
            }
        );
        throw new Error('Scenario C Negative Failed: Escalation succeeded!');
    } catch (err: unknown) {
        if (
            typeof err === 'object'
            && err !== null
            && 'code' in err
            && (err as { code?: unknown }).code === 'PRIVILEGE_ESCALATION_DETECTED'
        ) {
            logger.info('[SMOKE_TEST] scenario=C Privilege Boundary=ENFORCED (Verified)');
        } else {
            throw err;
        }
    }
}

async function runScenarioD() {
    logger.info('[SMOKE_TEST] SCENARIO D: VIEW SYSTEM START');
    
    const adId = new mongoose.Types.ObjectId();
    await Ad.create({
        _id: adId,
        title: 'View Test Ad',
        description: 'View Test description for the smoke test ad (20+ chars)',
        price: 100,
        categoryId: new mongoose.Types.ObjectId(),
        location: {
            coordinates: DUMMY_LOCATION_COORDS
        },
        sellerId: new mongoose.Types.ObjectId(),
        status: 'live',
        timeline: [{ status: 'live', timestamp: new Date(), reason: 'Initial' }]
    });

    // 1. Buffer Views
    logger.info('[SMOKE_TEST] scenario=D Buffering 50 views...');
    for (let i = 0; i < 50; i++) {
        await ViewBufferingService.recordView(adId);
    }
    
    const redisCount = await redis.get(`views:buffer:${adId.toString()}`);
    if (redisCount !== '50') throw new Error(`Redis count mismatch: ${redisCount}`);
    logger.info('[SMOKE_TEST] scenario=D redis count=50 (Verified)');

    // 2. Flush
    await ViewBufferingService.flush(adId.toString());
    const ad = await Ad.findById(adId);
    if (!ad || ad.views.total !== 50) throw new Error(`Mongo count mismatch: ${ad?.views.total}`);
    logger.info('[SMOKE_TEST] scenario=D mongo count=50 (Verified)');

    // 3. Crash Recovery (Mock Failure)
    logger.info('[SMOKE_TEST] scenario=D Testing Crash Recovery...');
    await ViewBufferingService.recordView(adId); // Add 1 to Redis
    
    const adModelMutable = Ad as unknown as { updateOne: typeof Ad.updateOne };
    const originalUpdate = adModelMutable.updateOne;
    adModelMutable.updateOne = (async () => {
        throw new Error('DB_FAILURE_SIMULATED');
    }) as unknown as typeof Ad.updateOne;

    try {
        await ViewBufferingService.flush(adId.toString());
    } catch {
        // Expected failure
    }

    const restoredCount = await redis.get(`views:buffer:${adId.toString()}`);
    if (restoredCount !== '1') throw new Error(`Recovery failed: count not restored to Redis. Got ${restoredCount}`);
    
    adModelMutable.updateOne = originalUpdate; // Restore
    logger.info('[SMOKE_TEST] scenario=D Atomic Aggregation=RESILIENT (Verified)');
}

async function main() {
    try {
        await connectDB();
        await redis.flushall();
        
        const verifiedLocation = await getVerifiedLocation();
        const validCategory = await getValidCategory();

        const results = {
            A: false,
            B: false,
            C: false,
            D: false
        };

        try { await runScenarioA(verifiedLocation, validCategory); results.A = true; } catch (e) { logger.error('SCENARIO A FAILED:', e); }
        try { await runScenarioB(verifiedLocation, validCategory); results.B = true; } catch (e) { logger.error('SCENARIO B FAILED:', e); }
        try { await runScenarioC(verifiedLocation, validCategory); results.C = true; } catch (e) { logger.error('SCENARIO C FAILED:', e); }
        try { await runScenarioD(); results.D = true; } catch (e) { logger.error('SCENARIO D FAILED:', e); }

        logger.info('\n\n========================================');
        logger.info('       ESPAREX SMOKE TEST REPORT');
        logger.info('========================================');
        logger.info(`SCENARIO A: ${results.A ? '✅ PASS' : '❌ FAIL'}`);
        logger.info(`SCENARIO B: ${results.B ? '✅ PASS' : '❌ FAIL'}`);
        logger.info(`SCENARIO C: ${results.C ? '✅ PASS' : '❌ FAIL'}`);
        logger.info(`SCENARIO D: ${results.D ? '✅ PASS' : '❌ FAIL'}`);
        logger.info('----------------------------------------');
        logger.info(`INVARIANTS VERIFIED:`);
        logger.info(`- SSOT: ${results.A && results.D ? 'YES' : 'NO'}`);
        logger.info(`- Fraud Guardrails: ${results.B ? 'YES' : 'NO'}`);
        logger.info(`- Atomic Aggregation: ${results.D ? 'YES' : 'NO'}`);
        logger.info(`- Privilege Boundary: ${results.C ? 'YES' : 'NO'}`);
        logger.info('----------------------------------------');
        logger.info(`FINAL RESULT: ${Object.values(results).every(v => v) ? 'PASS' : 'FAIL'}`);
        logger.info('========================================\n');

        process.exit(Object.values(results).every(v => v) ? 0 : 1);
    } catch (err) {
        logger.error('Fatal Error during Smoke Test:', err);
        process.exit(1);
    }
}

main();
