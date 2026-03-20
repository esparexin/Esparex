import mongoose from 'mongoose';
import { connectDB } from '../src/config/db';
import AdModel from '../src/models/Ad';
import ConversationModel from '../src/models/Conversation';
import { AD_STATUS } from '../../shared/enums/adStatus';
import { CONVERSATION_STATUS } from '../../shared/enums/conversationStatus';

async function migrate() {
    console.log('--- Connecting to Databases ---');
    await connectDB();
    console.log('--- Starting Canonical Enum Migration ---');

    // 1. Ads Migration: active -> live
    const adsToMigrate = await (AdModel as any).countDocuments({ status: 'active' });
    if (adsToMigrate > 0) {
        console.log(`Migrating ${adsToMigrate} Ads from "active" to "live"...`);
        const result = await (AdModel as any).updateMany(
            { status: 'active' },
            { $set: { status: AD_STATUS.LIVE } }
        );
        console.log(`Successfully migrated ${result.modifiedCount} Ads.`);
    } else {
        console.log('No Ads with "active" status found.');
    }

    // 2. Ads Timeline Migration (optional but good for consistency)
    console.log('Checking Ads timeline for "active" status strings...');
    const timelineResult = await (AdModel as any).updateMany(
        { 'timeline.status': 'active' },
        { $set: { 'timeline.$[elem].status': AD_STATUS.LIVE } },
        { arrayFilters: [{ 'elem.status': 'active' }] }
    );
    if (timelineResult.modifiedCount > 0) {
        console.log(`Updated ${timelineResult.modifiedCount} Ads timeline entries.`);
    }

    // 3. Conversations Migration: Investigation
    // We saw 100 non-canonical but distinct sample was []. 
    // Let's force a migration to ensure "active" is strictly mapped if it exists as a string but distinct failed.
    const convCount = await (ConversationModel as any).countDocuments({ status: { $exists: false } });
    if (convCount > 0) {
        console.log(`Fixing ${convCount} Conversations missing a status field...`);
        await (ConversationModel as any).updateMany(
            { status: { $exists: false } },
            { $set: { status: CONVERSATION_STATUS.ACTIVE } }
        );
    }

    console.log('--- Migration Complete ---');
    process.exit(0);
}

migrate().catch(err => {
    console.error(err);
    process.exit(1);
});
