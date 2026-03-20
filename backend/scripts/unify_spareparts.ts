import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

async function unifySpareParts() {
    try {
        const adminDbUri = process.env.ADMIN_MONGODB_URI;
        if (!adminDbUri) {
            console.error("No ADMIN_MONGODB_URI found in env");
            process.exit(1);
        }

        const conn = await mongoose.createConnection(adminDbUri).asPromise();
        console.log("Connected to Admin DB.");

        const db = conn.db;
        if (!db) {
            throw new Error("Could not get db instance");
        }

        // Unset the 'type' field from all documents in the 'spareparts' collection
        const result = await db.collection('spareparts').updateMany(
            {},
            { $unset: { type: "" } }
        );

        console.log(`\n--- SPARE PARTS UNIFICATION ---`);
        console.log(`Matched documents: ${result.matchedCount}`);
        console.log(`Modified documents: ${result.modifiedCount}`);
        console.log(`Successfully removed 'type' field (Primary/Secondary) from all spare parts.`);

        await conn.close();
        console.log("Done.");
        process.exit(0);

    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

unifySpareParts();
