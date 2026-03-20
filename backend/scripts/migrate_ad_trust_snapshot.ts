import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables manually
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/esparex';

async function runMigration() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        // Initialize models without app bootups
        const UserScheme = new mongoose.Schema({ trustScore: Number });
        const User = mongoose.model('User', UserScheme);

        const AdScheme = new mongoose.Schema({ sellerId: mongoose.Schema.Types.ObjectId, sellerTrustSnapshot: Number });
        const Ad = mongoose.model('Ad', AdScheme);

        const BATCH_SIZE = 500;
        let lastId: any = null;
        let processedUsers = 0;

        console.log(`Starting batched backfill (Batch Size: ${BATCH_SIZE})...`);

        while (true) {
            const query: any = lastId ? { _id: { $gt: lastId } } : {};

            const users: any[] = await User.find(query)
                .sort({ _id: 1 })
                .limit(BATCH_SIZE)
                .select("_id trustScore");

            if (users.length === 0) break;

            for (const user of users) {
                const trust = user.trustScore ?? 50;

                await Ad.updateMany(
                    { sellerId: user._id },
                    { $set: { sellerTrustSnapshot: trust } }
                );
            }

            processedUsers += users.length;
            lastId = users[users.length - 1]?._id;

            console.log(`Processed users: ${processedUsers}`);
        }

        console.log("Backfill complete.");
        await mongoose.disconnect();
        console.log("Disconnected.");
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
