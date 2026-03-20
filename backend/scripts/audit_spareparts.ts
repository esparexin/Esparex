import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

async function auditSpareParts() {
    try {
        const adminDbUri = process.env.ADMIN_MONGODB_URI;
        if (!adminDbUri) {
            console.error("No ADMIN_MONGODB_URI found in env");
            process.exit(1);
        }

        const conn = await mongoose.createConnection(adminDbUri).asPromise();
        console.log("Connected to Admin DB.");

        const SparePartModel = conn.model('SparePart', new mongoose.Schema({
            name: String,
            type: String,
            isDeleted: Boolean
        }));

        const total = await SparePartModel.countDocuments();
        const primaryCount = await SparePartModel.countDocuments({ type: { $regex: /^primary$/i } });
        const secondaryCount = await SparePartModel.countDocuments({ type: { $regex: /^secondary$/i } });
        const noTypeCount = await SparePartModel.countDocuments({ type: { $exists: false } });
        const nullTypeCount = await SparePartModel.countDocuments({ type: null });
        const emptyTypeCount = await SparePartModel.countDocuments({ type: '' });
        const otherTypeCount = await SparePartModel.countDocuments({
            type: { $nin: ['PRIMARY', 'primary', 'SECONDARY', 'secondary', null, ''] }
        });

        console.log(`\n--- SPARE PARTS AUDIT ---`);
        console.log(`Total Spare Parts: ${total}`);
        console.log(`Primary: ${primaryCount}`);
        console.log(`Secondary: ${secondaryCount}`);
        console.log(`No Type Field: ${noTypeCount}`);
        console.log(`Null Type: ${nullTypeCount}`);
        console.log(`Empty Type: ${emptyTypeCount}`);
        console.log(`Other Type: ${otherTypeCount}`);

        if (otherTypeCount > 0) {
            const others = await SparePartModel.find({
                type: { $nin: ['PRIMARY', 'primary', 'SECONDARY', 'secondary', null, ''] }
            }).limit(10);
            console.log("Samples of 'Other Type':", others.map(o => ({ name: o.name, type: o.type })));
        }

        await conn.close();
        console.log("Done.");
        process.exit(0);

    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

auditSpareParts();
