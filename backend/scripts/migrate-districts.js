/**
 * MongoDB Migration Script: District Eradication
 * 
 * Objectives:
 * 1. Identify all documents in 'locations' collection containing a 'district' field.
 * 2. If 'city' is missing/empty and 'district' has a value, move 'district' to 'city'.
 * 3. Unset 'district' field from all documents.
 */

const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function migrate() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI not found in environment');
        process.exit(1);
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('Connected to MongoDB');
        const db = client.db();
        const collection = db.collection('locations');

        // 1. Move district to city where city is empty
        const toMove = await collection.find({
            district: { $exists: true, $ne: null },
            $or: [{ city: { $exists: false } }, { city: "" }, { city: null }]
        }).toArray();

        console.log(`Found ${toMove.length} locations to repair (moving district -> city)`);

        for (const loc of toMove) {
            await collection.updateOne(
                { _id: loc._id },
                {
                    $set: { city: loc.district },
                    $unset: { district: "" }
                }
            );
        }

        // 2. Bulk unset district for everyone else
        const result = await collection.updateMany(
            { district: { $exists: true } },
            { $unset: { district: "" } }
        );

        console.log(`Cleanup complete. Modified ${result.modifiedCount} additional documents.`);

        // 3. Verify
        const remaining = await collection.countDocuments({ district: { $exists: true } });
        if (remaining === 0) {
            console.log('Verification Success: 0 documents with "district" field remaining.');
        } else {
            console.warn(`Verification Failed: ${remaining} documents still have a "district" field.`);
        }

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.close();
    }
}

migrate();
