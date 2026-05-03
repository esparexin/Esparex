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
import * as AdOrchestrator from '@core/services/AdOrchestrator';
import { ViewBufferingService } from '@core/services/ViewBufferingService';
import { LISTING_STATUS } from '@core/constants/enums/listingStatus';
import User from '@core/models/User';
import Ad from '@core/models/Ad';
import Location from '@core/models/Location';
import { connectDB } from '@core/config/db';
import redis from '@core/config/redis';
import logger from '@core/utils/logger';

// 🧪 MOCK: Override logger to capture smoke test output
const logs: string[] = [];
const originalInfo = logger.info;
logger.info = (message: string, ...meta: any[]) => {
    if (typeof message === 'string' && message.startsWith('[SMOKE_TEST]')) {
        logs.push(message);
        console.log('\x1b[36m%s\x1b[0m', message);
    }
    return originalInfo.call(logger, message, ...meta);
};

import Category from '@core/models/Category';
import { CATALOG_STATUS } from '@core/constants/enums/catalogStatus';

const DUMMY_LOCATION_COORDS = { type: 'Point' as const, coordinates: [77.5946, 12.9716] };

async function getVerifiedLocation() {
    const uniqueName = `Smoke Test City ${Date.now()}`;
    const loc = await Location.create({
        name: uniqueName,
        country: 'India',
        level: 'city',
        coordinates: DUMMY_LOCATION_COORDS,
        isActive: true,
        verificationStatus: 'verified'
    });
    return loc;
}

async function getValidCategory() {
    const uniqueName = `Smoke Test Category ${Date.now()}`;
    const cat = await Category.create({
        name: uniqueName,
        slug: `smoke-test-cat-${Date.now()}`,
        listingType: ['ad'],
        isActive: true,
        status: CATALOG_STATUS.ACTIVE
    });
    return cat;
}

async function runScenarioA(verifiedLocation: any, validCategory: any) {
    logger.info('[SMOKE_TEST] SCENARIO A: SAFE USER FLOW START');
    
    const userId = new mongoose.Types.ObjectId();
    const mobile = `9${Math.floor(Math.random() * 1000000000)}`;

    await User.create({
        _id: userId,
        mobile,
        name: 'Scenario A User',
        role: 'user',
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
            userId: userId.toString(),
            sellerId: userId.toString(),
            ip: '1.1.1.1'
        }
    );

    if (!ad || ad.status !== LISTING_STATUS.PENDING) {
        throw new Error(`Scenario A Failed: Expected PENDING, got ${ad?.status}`);
    }
    logger.info('[SMOKE_TEST] scenario=A status=PENDING (Verified)');

    // Simulate Moderation Approval
    const { mutateStatus } = await import('@core/services/StatusMutationService');
    const { computeActiveExpiry } = await import('@core/services/AdStatusService');
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

async function runScenarioB(verifiedLocation: any, validCategory: any) {
    logger.info('[SMOKE_TEST] SCENARIO B: HIGH RISK FLOW START');
    
    const userId = new mongoose.Types.ObjectId();
    const mobile = `8${Math.floor(Math.random() * 1000000000)}`;

    await User.create({
        _id: userId,
        mobile,
        name: 'Scenario B User',
        role: 'user',
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
            userId: userId.toString(),
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

async function runScenarioC(verifiedLocation: any, validCategory: any) {
    logger.info('[SMOKE_TEST] SCENARIO C: ADMIN FLOW START');
    
    const adminId = new mongoose.Types.ObjectId();
    const adminMobile = `7${Math.floor(Math.random() * 1000000000)}`;

    await User.create({
        _id: adminId,
        mobile: adminMobile,
        name: 'Admin User',
        role: 'admin',
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
            userId: adminId.toString(),
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
    await User.create({ _id: userId, mobile: fakeMobile, name: 'Fake Admin', role: 'user', status: 'live', isVerified: true });

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
                userId: userId.toString(),
                sellerId: userId.toString()
            }
        );
        throw new Error('Scenario C Negative Failed: Escalation succeeded!');
    } catch (err: any) {
        if (err.code === 'PRIVILEGE_ESCALATION_DETECTED') {
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
    
    const originalUpdate = Ad.updateOne;
    (Ad as any).updateOne = async () => { throw new Error('DB_FAILURE_SIMULATED'); };

    try {
        await ViewBufferingService.flush(adId.toString());
    } catch (err) {
        // Expected failure
    }

    const restoredCount = await redis.get(`views:buffer:${adId.toString()}`);
    if (restoredCount !== '1') throw new Error(`Recovery failed: count not restored to Redis. Got ${restoredCount}`);
    
    (Ad as any).updateOne = originalUpdate; // Restore
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

        try { await runScenarioA(verifiedLocation, validCategory); results.A = true; } catch (e) { console.error('SCENARIO A FAILED:', e); }
        try { await runScenarioB(verifiedLocation, validCategory); results.B = true; } catch (e) { console.error('SCENARIO B FAILED:', e); }
        try { await runScenarioC(verifiedLocation, validCategory); results.C = true; } catch (e) { console.error('SCENARIO C FAILED:', e); }
        try { await runScenarioD(); results.D = true; } catch (e) { console.error('SCENARIO D FAILED:', e); }

        console.log('\n\n========================================');
        console.log('       ESPAREX SMOKE TEST REPORT');
        console.log('========================================');
        console.log(`SCENARIO A: ${results.A ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`SCENARIO B: ${results.B ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`SCENARIO C: ${results.C ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`SCENARIO D: ${results.D ? '✅ PASS' : '❌ FAIL'}`);
        console.log('----------------------------------------');
        console.log(`INVARIANTS VERIFIED:`);
        console.log(`- SSOT: ${results.A && results.D ? 'YES' : 'NO'}`);
        console.log(`- Fraud Guardrails: ${results.B ? 'YES' : 'NO'}`);
        console.log(`- Atomic Aggregation: ${results.D ? 'YES' : 'NO'}`);
        console.log(`- Privilege Boundary: ${results.C ? 'YES' : 'NO'}`);
        console.log('----------------------------------------');
        console.log(`FINAL RESULT: ${Object.values(results).every(v => v) ? 'PASS' : 'FAIL'}`);
        console.log('========================================\n');

        process.exit(Object.values(results).every(v => v) ? 0 : 1);
    } catch (err) {
        console.error('Fatal Error during Smoke Test:', err);
        process.exit(1);
    }
}

main();
