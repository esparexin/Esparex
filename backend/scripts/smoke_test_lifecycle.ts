import { updateAdStatus } from '../src/services/adStatusService';
import { connectDB } from '../src/config/db';
import Ad from '../src/models/Ad';
import { AD_STATUS } from '../../shared/enums/adStatus';
import mongoose from 'mongoose';

async function runSmokeTest() {
    console.log('--- Connecting to Databases ---');
    await connectDB();
    console.log('--- Starting Lifecycle Smoke Test (via adStatusService) ---');

    // 1. Find a sample Ad
    const sampleAd = await Ad.findOne({ isDeleted: false });
    if (!sampleAd) {
        console.log('No Ads found for testing.');
        process.exit(0);
    }

    const originalStatus = sampleAd.status;
    let targetStatus: any; 
    
    if (originalStatus === AD_STATUS.LIVE) {
        targetStatus = AD_STATUS.DEACTIVATED;
    } else if (originalStatus === AD_STATUS.PENDING) {
        targetStatus = AD_STATUS.LIVE;
    } else {
        sampleAd.status = AD_STATUS.PENDING as any;
        await sampleAd.save();
        targetStatus = AD_STATUS.LIVE;
    }

    console.log(`Testing transition: ${originalStatus} -> ${targetStatus} for Ad ${sampleAd._id}`);
    console.log(`Current timeline entries: ${sampleAd.timeline?.length || 0}`);
    if (sampleAd.timeline && sampleAd.timeline.length > 0) {
        console.log('Last timeline entry:', JSON.stringify(sampleAd.timeline[sampleAd.timeline.length - 1], null, 2));
    }

    try {
        const result = await updateAdStatus(
            sampleAd._id as any,
            targetStatus,
            {
                actorType: 'admin',
                actorId: new mongoose.Types.ObjectId().toString(),
                reason: 'Smoke test verification of Phase 5'
            }
        );

        if (result) {
            console.log('✅ Transition successful!');
            console.log(`New Status: ${result.status}`);
        } else {
            console.log('❌ Transition returned null result');
        }

        // Revert for cleanup
        await Ad.findByIdAndUpdate(sampleAd._id, { status: originalStatus });
        console.log('Reverted status for cleanup.');

    } catch (error: any) {
        console.error('❌ Transition FAILED:', error.message);
        process.exit(1);
    }

    console.log('--- Smoke Test Complete ---');
    process.exit(0);
}

runSmokeTest().catch(err => {
    console.error(err);
    process.exit(1);
});
