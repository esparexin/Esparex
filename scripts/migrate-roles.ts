import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_MONGODB_URI = process.env.ADMIN_MONGODB_URI || MONGODB_URI;

if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI is not defined.");
    process.exit(1);
}

const migrateRoles = async () => {
    try {
        console.log(`🔌 Connecting to User Database...`);
        const userConn = await mongoose.createConnection(MONGODB_URI).asPromise();
        console.log(`✅ Connected to User DB.`);

        const usersCollection = userConn.db!.collection('users');

        // 1. Normalize Roles in Users collection
        console.log(`⏳ Normalizing roles in 'users' collection...`);

        // superadmin/super_admin -> superAdmin
        const superAdminResult = await usersCollection.updateMany(
            { role: { $in: ['superadmin', 'super_admin'] } },
            { $set: { role: 'superAdmin' } }
        );
        console.log(`   ✅ Normalized ${superAdminResult.modifiedCount} superAdmin roles.`);

        // individual/seller/buyer -> user
        const userResult = await usersCollection.updateMany(
            { role: { $in: ['individual', 'seller', 'buyer'] } },
            { $set: { role: 'user' } }
        );
        console.log(`   ✅ Normalized ${userResult.modifiedCount} user roles.`);

        // support/finance -> moderator
        const moderatorResult = await usersCollection.updateMany(
            { role: { $in: ['support', 'finance'] } },
            { $set: { role: 'moderator' } }
        );
        console.log(`   ✅ Normalized ${moderatorResult.modifiedCount} moderator roles.`);

        // 2. Normalize Roles in Admins collection (if separate)
        console.log(`🔌 Connecting to Admin Database...`);
        const adminConn = await mongoose.createConnection(ADMIN_MONGODB_URI).asPromise();
        console.log(`✅ Connected to Admin DB.`);

        const adminsCollection = adminConn.db!.collection('admins');
        
        console.log(`⏳ Normalizing roles in 'admins' collection...`);

        // super_admin -> superAdmin
        const adminSuperResult = await adminsCollection.updateMany(
            { role: { $in: ['superadmin', 'super_admin'] } },
            { $set: { role: 'superAdmin' } }
        );
        console.log(`   ✅ Normalized ${adminSuperResult.modifiedCount} admin superAdmin roles.`);

        // specialized roles -> moderator or admin
        const adminSpecializedResult = await adminsCollection.updateMany(
            { role: { $in: ['user_manager', 'finance_manager', 'content_moderator', 'editor', 'viewer'] } },
            { $set: { role: 'moderator' } }
        );
        console.log(`   ✅ Normalized ${adminSpecializedResult.modifiedCount} specialized admin roles to 'moderator'.`);

        console.log(`✅ Role migration complete!`);

        await userConn.close();
        await adminConn.close();
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        process.exit(0);
    }
};

void migrateRoles();
