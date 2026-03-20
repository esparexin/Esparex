import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import Ad from '../src/models/Ad';
import Service from '../src/models/Service';
import BusinessPart from '../src/models/BusinessPart';

const BATCH_SIZE = 5000;
const THROTTLE_MS = 2000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function migrateCollection(model: mongoose.Model<any>, collectionName: string) {
    console.log(`\n🚀 Starting migration for ${collectionName}...`);
    let lastId: mongoose.Types.ObjectId | null = null;
    let processed = 0;

    while (true) {
        const query: any = { status: 'active' };
        if (lastId) query._id = { $gt: lastId };

        const batch = await model.find(query)
            .sort({ _id: 1 })
            .limit(BATCH_SIZE)
            .select('_id')
            .lean();

        if (batch.length === 0) break;

        const ids = batch.map(doc => doc._id);
        
        const startTime = Date.now();
        const result = await model.updateMany(
            { _id: { $in: ids } },
            { 
                $set: { status: 'approved' },
                $push: { 
                    timeline: { 
                        status: 'approved', 
                        timestamp: new Date(), 
                        reason: 'Phase-2 Bulk Status Migration' 
                    } 
                }
            }
        );
        const duration = Date.now() - startTime;

        processed += result.modifiedCount;
        lastId = ids[ids.length - 1];

        console.log(`✅ [${collectionName}] Migrated ${processed} records... (Batch took ${duration}ms)`);
        
        if (batch.length < BATCH_SIZE) break;
        
        await sleep(THROTTLE_MS);
    }
    console.log(`🏁 Finished migration for ${collectionName}. Total: ${processed}`);
}

async function run() {
    const uri = process.env.ADMIN_MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
        console.error('❌ Error: ADMIN_MONGODB_URI or MONGO_URI is not defined');
        process.exit(1);
    }

    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(uri);
        console.log('Connected.');

        // 1. Ads
        await migrateCollection(Ad, 'Ads');

        // 2. Services
        await migrateCollection(Service, 'Services');

        // 3. BusinessParts
        await migrateCollection(BusinessPart, 'BusinessParts');

        console.log('\n✨ ALL MIGRATIONS COMPLETE.');
        process.exit(0);
    } catch (err) {
        console.error('❌ FATAL MIGRATION ERROR:', err);
        process.exit(1);
    }
}

run();
