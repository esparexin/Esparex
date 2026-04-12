import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import { normalizeLocationNameForSearch, buildLocationSlug } from '../../utils/locationInputNormalizer';

dotenv.config();

/**
 * normalizeLocationMetadata
 * 
 * Bulk populates normalizedName and slug for all locations using raw MongoDB.
 * Bypasses Mongoose env validation for S3/etc.
 */
async function normalizeLocationMetadata() {
    const isDryRun = process.env.DRY_RUN === 'true';
    const mongoUri = process.env.ADMIN_MONGODB_URI || process.env.MONGODB_URI;

    if (!mongoUri) {
        console.error('Missing MONGODB_URI/ADMIN_MONGODB_URI');
        process.exit(1);
    }

    const client = new MongoClient(mongoUri);
    
    try {
        await client.connect();
        const db = client.db();
        const collection = db.collection('locations');

        console.log(`Starting Location Metadata Normalization ${isDryRun ? '(DRY RUN)' : ''}...`);

        const cursor = collection.find({ 
            $or: [
                { normalizedName: { $exists: false } },
                { normalizedName: null },
                { slug: { $exists: false } },
                { slug: null }
            ]
        });

        let processed = 0;
        let modified = 0;
        const bulkOps = [];

        for await (const loc of cursor) {
            const name = loc.name;
            const country = loc.country || 'India';
            
            const normalizedName = normalizeLocationNameForSearch(name);
            const slug = buildLocationSlug(name, name, country);

            if (!isDryRun) {
                bulkOps.push({
                    updateOne: {
                        filter: { _id: loc._id },
                        update: { $set: { normalizedName, slug } }
                    }
                });
            }

            processed++;
            if (bulkOps.length >= 1000) {
                const result = await collection.bulkWrite(bulkOps);
                modified += (result.modifiedCount || 0);
                bulkOps.length = 0;
                console.log(`Processed ${processed}... (Modified: ${modified})`);
            }
        }

        if (bulkOps.length > 0) {
            const result = await collection.bulkWrite(bulkOps);
            modified += (result.modifiedCount || 0);
        }

        console.log(`Normalization Completed. Scanned: ${processed}, Modified: ${modified}`);

    } catch (error) {
        console.error('Normalization Script Failed:', error);
    } finally {
        await client.close();
    }
}

if (require.main === module) {
    normalizeLocationMetadata();
}

