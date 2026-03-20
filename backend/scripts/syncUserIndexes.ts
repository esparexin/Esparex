/**
 * One-time script to safely sync User collection indexes to match schema definitions.
 * Run ONCE manually after schema changes: ts-node backend/scripts/syncUserIndexes.ts
 * Safe to run multiple times — Mongoose syncIndexes() only creates missing indexes.
 */

import 'dotenv/config';
import mongoose from 'mongoose';

async function syncIndexes() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI is not set');
        process.exit(1);
    }

    await mongoose.connect(uri, { dbName: 'esparex_user' });
    console.log('Connected to MongoDB');

    // Dynamic import to avoid circular deps at module level
    const { default: User } = await import('../src/models/User');

    console.log('Syncing User indexes...');
    await User.syncIndexes();
    console.log('✅ User indexes synced successfully.');

    const indexes = await User.collection.getIndexes();
    console.log('Current indexes:');
    console.log(JSON.stringify(indexes, null, 2));

    await mongoose.disconnect();
    process.exit(0);
}

syncIndexes().catch((err) => {
    console.error('Index sync failed:', err);
    process.exit(1);
});
