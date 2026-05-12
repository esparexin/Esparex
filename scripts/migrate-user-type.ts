import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI is not defined.");
    process.exit(1);
}

const migrateUserType = async () => {
    try {
        console.log(`🔌 Connecting to MongoDB...`);
        await mongoose.connect(MONGODB_URI);
        console.log(`✅ Connected successfully.`);

        const db = mongoose.connection.db;
        if (!db) {
            throw new Error('Database connection not established.');
        }

        const usersCollection = db.collection('users');

        console.log(`🔍 Counting missing userType fields...`);
        const missingUserTypeCount = await usersCollection.countDocuments({ userType: { $exists: false } });
        console.log(`Found ${missingUserTypeCount} users missing userType.`);

        if (missingUserTypeCount > 0) {
            console.log(`⏳ Migrating legacy admin accounts to userType 'admin'...`);
            const adminUpdateResult = await usersCollection.updateMany(
                { 
                    userType: { $exists: false },
                    role: { $in: ['admin', 'super_admin', 'superadmin', 'moderator', 'support', 'finance'] }
                },
                { $set: { userType: 'admin' } }
            );
            console.log(`✅ Migrated ${adminUpdateResult.modifiedCount} legacy admin accounts.`);

            console.log(`⏳ Migrating remaining accounts to userType 'marketplace'...`);
            const marketplaceUpdateResult = await usersCollection.updateMany(
                { userType: { $exists: false } },
                { $set: { userType: 'marketplace' } }
            );
            console.log(`✅ Migrated ${marketplaceUpdateResult.modifiedCount} marketplace accounts.`);
        }

        console.log(`✅ userType migration complete!`);

        // Create indexes as required
        console.log(`⏳ Creating required indexes...`);
        await usersCollection.createIndex({ userType: 1, role: 1, isDeleted: 1 }, { name: 'idx_user_type_role_deleted' });
        await usersCollection.createIndex({ userType: 1, createdAt: -1 }, { name: 'idx_user_type_createdAt' });
        console.log(`✅ Indexes created successfully.`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log(`🔌 Disconnected from MongoDB.`);
        process.exit(0);
    }
};

void migrateUserType();
