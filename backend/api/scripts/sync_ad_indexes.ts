import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables manually
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { connectDB } from '../src/config/db';

async function syncAndVerify() {
    try {
        console.log('Connecting to database...');
        await connectDB();
        console.log('Connected.\n');

        const Ad = (await import('../src/models/Ad')).default;

        console.log('🔄 Sychronizing Indexes for Ad collection...');
        await Ad.syncIndexes();
        console.log('✅ Synchronization Complete.');

        const db = mongoose.connection.useDb('esparex_user');
        const indexes = await db.collection('ads').indexes();

        console.log('\n📊 Current Ad Indexes:');
        indexes.forEach(idx => {
            console.log(`- ${idx.name}`);
            if (idx.partialFilterExpression) {
                console.log(`  [Partial]: ${JSON.stringify(idx.partialFilterExpression)}`);
            }
        });

        await mongoose.disconnect();
        console.log("\nDisconnected.");
        process.exit(0);
    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    }
}

syncAndVerify();
